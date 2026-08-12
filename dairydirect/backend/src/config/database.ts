import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './env';

// ─── Mock Query Handler (For isolated Unit & Integration Tests) ─
type QueryHandler = <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
) => Promise<QueryResult<T>>;

let mockQueryHandler: QueryHandler | null = null;

export function setMockQueryHandler(handler: QueryHandler | null): void {
  mockQueryHandler = handler;
}

// ─── PostgreSQL Connection Pool ───────────────────────────────
let poolInstance: Pool | null = null;

export function getPool(): Pool {
  if (poolInstance) return poolInstance;

  let poolConfig: any;

  if (config.databaseUrl) {
    poolConfig = {
      connectionString: config.databaseUrl,
      ssl: config.dbSsl ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
  } else {
    poolConfig = {
      host: config.dbHost,
      port: config.dbPort,
      database: config.dbName,
      user: config.dbUser,
      password: config.dbPassword,
      ssl: config.dbSsl ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
  }

  poolInstance = new Pool(poolConfig);

  poolInstance.on('error', (err) => {
    console.error('[PostgreSQL Pool Error]:', err.message);
  });

  return poolInstance;
}

/**
 * Execute parameterized query (Prevents SQL injection)
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  if (mockQueryHandler) {
    return mockQueryHandler<T>(text, params);
  }

  const pool = getPool();
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (!config.isProduction && duration > 500) {
      console.warn(`[Slow Query] (${duration}ms):`, text.slice(0, 100));
    }
    return result;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Get Client for Transaction
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  return pool.connect();
}

/**
 * Execute within an ACID transaction
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  if (mockQueryHandler) {
    const mockClient = {
      query: (text: string, params?: any[]) => mockQueryHandler!(text, params),
      release: () => {},
    } as unknown as PoolClient;
    return callback(mockClient);
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ─── Supabase Client Instance (Optional Fallback / Admin) ──────
let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) return null;

  supabaseInstance = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseInstance;
}
