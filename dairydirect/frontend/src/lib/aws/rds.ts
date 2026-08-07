/**
 * Unified PostgreSQL Connection Pool (Supabase Pro & PostgreSQL)
 * Supports connection string (DATABASE_URL / POSTGRES_URL) or individual host/port parameters.
 * Handles ACID transactions, row-level locks, and connection reuse.
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// ─── Singleton Connection Pool ───────────────────────────────
const globalForPg = globalThis as unknown as { _pgPool: Pool | undefined };

export const isPgConfigured = Boolean(
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.AWS_RDS_HOST ||
  process.env.SUPABASE_DB_HOST
);

function createPool(): Pool | null {
  if (!isPgConfigured) {
    return null;
  }

  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.SUPABASE_DB_URL;

  let poolConfig: any;

  if (connectionString) {
    poolConfig = {
      connectionString,
      ssl: { rejectUnauthorized: false }, // Required for Supabase connection pooler
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
  } else {
    const host =
      process.env.SUPABASE_DB_HOST ||
      process.env.AWS_RDS_HOST ||
      'localhost';
    const port = parseInt(
      process.env.SUPABASE_DB_PORT ||
      process.env.AWS_RDS_PORT ||
      '5432'
    );
    const database =
      process.env.SUPABASE_DB_NAME ||
      process.env.AWS_RDS_DATABASE ||
      'postgres';
    const user =
      process.env.SUPABASE_DB_USER ||
      process.env.AWS_RDS_USERNAME ||
      'postgres';
    const password =
      process.env.SUPABASE_DB_PASSWORD ||
      process.env.AWS_RDS_PASSWORD ||
      '';

    const isCloudHost = host.includes('supabase') || host.includes('rds.amazonaws.com');

    poolConfig = {
      host,
      port,
      database,
      user,
      password,
      ssl: isCloudHost || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
  }

  const pool = new Pool(poolConfig);

  pool.on('error', (err) => {
    console.error('[PostgreSQL Pool] Unexpected pool error:', err.message);
  });

  return pool;
}

export const pool: Pool | null = globalForPg._pgPool ?? createPool();
if (process.env.NODE_ENV !== 'production' && pool) globalForPg._pgPool = pool;

// ─── Query Helper ─────────────────────────────────────────────

/**
 * Execute a parameterized query (prevents SQL injection)
 * Usage: db.query('SELECT * FROM users WHERE id = $1', [userId])
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  if (!pool) {
    throw new Error('PostgreSQL database not configured in environment variables');
  }

  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production' && duration > 500) {
      console.warn(`[Database] Slow query (${duration}ms):`, text.slice(0, 100));
    }
    return result;
  } catch (error: any) {
    console.error('[Database] Query error:', error.message, '\nQuery:', text.slice(0, 200));
    throw error;
  }
}

/**
 * Get a client from the pool for multi-statement transactions
 * ALWAYS release the client in a finally block
 */
export async function getClient(): Promise<PoolClient> {
  if (!pool) {
    throw new Error('PostgreSQL database not configured in environment variables');
  }
  return pool.connect();
}

/**
 * Runs a function inside a PostgreSQL transaction.
 * Automatically commits on success, rolls back on error.
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  if (!pool) {
    throw new Error('PostgreSQL database not configured in environment variables');
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Health check — call from /api/health
 */
export async function checkDbConnection(): Promise<boolean> {
  if (!pool) return false;
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
