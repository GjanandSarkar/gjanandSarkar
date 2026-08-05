/**
 * AWS RDS PostgreSQL Connection Pool
 * Replaces all Supabase database operations
 * 
 * Setup: Create RDS PostgreSQL in ap-south-1 (Mumbai)
 * Env vars required:
 *   AWS_RDS_HOST, AWS_RDS_PORT, AWS_RDS_DATABASE
 *   AWS_RDS_USERNAME, AWS_RDS_PASSWORD
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// ─── Singleton Connection Pool ───────────────────────────────
const globalForPg = globalThis as unknown as { _pgPool: Pool | undefined };

function createPool(): Pool {
  const pool = new Pool({
    host: process.env.AWS_RDS_HOST,
    port: parseInt(process.env.AWS_RDS_PORT || '5432'),
    database: process.env.AWS_RDS_DATABASE || 'dairydirect',
    user: process.env.AWS_RDS_USERNAME,
    password: process.env.AWS_RDS_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
    max: 20,                  // max connections in pool
    idleTimeoutMillis: 30000, // close idle clients after 30s
    connectionTimeoutMillis: 5000, // return error if cannot connect within 5s
  });

  pool.on('error', (err) => {
    console.error('[RDS] Unexpected pool error:', err.message);
  });

  return pool;
}

export const pool: Pool = globalForPg._pgPool ?? createPool();
if (process.env.NODE_ENV !== 'production') globalForPg._pgPool = pool;

// ─── Query Helper ─────────────────────────────────────────────

/**
 * Execute a parameterized query (prevents SQL injection)
 * Usage: db.query('SELECT * FROM users WHERE id = $1', [userId])
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production' && duration > 500) {
      console.warn(`[RDS] Slow query (${duration}ms):`, text.slice(0, 100));
    }
    return result;
  } catch (error: any) {
    console.error('[RDS] Query error:', error.message, '\nQuery:', text.slice(0, 200));
    throw error;
  }
}

/**
 * Get a client from the pool for multi-statement transactions
 * ALWAYS release the client in a finally block
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

/**
 * Runs a function inside a PostgreSQL transaction.
 * Automatically commits on success, rolls back on error.
 * 
 * Usage:
 *   const result = await withTransaction(async (client) => {
 *     await client.query('INSERT INTO orders...')
 *     await client.query('UPDATE product_variants SET stock...')
 *     return orderId;
 *   })
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
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
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

// ─── Type Helpers ─────────────────────────────────────────────

export type DBProfile = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  role: 'customer' | 'admin';
  default_upi_id: string | null;
  loyalty_points: number;
  referral_code: string;
  created_at: string;
  updated_at: string;
};

export type DBProduct = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  image_url: string | null;
  is_freshness_guarantee: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DBProductVariant = {
  id: string;
  product_id: string;
  weight: string;
  price: number;
  original_price: number | null;
  cost_price: number;
  stock: number;
  low_stock_threshold: number;
  expiry_date: string | null;
  batch_number: string | null;
  created_at: string;
};

export type DBOrder = {
  id: string;
  user_id: string;
  address_id: string | null;
  status: 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  total_amount: number;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_id: string | null;
  razorpay_order_id: string | null;
  coupon_code: string | null;
  delivery_slot: string | null;
  notes: string | null;
  delivery_date: string | null;
  created_at: string;
  updated_at: string;
};

export type DBOrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
};

export type DBSubscription = {
  id: string;
  user_id: string;
  product_id: string;
  variant_id: string;
  volume: number;
  plan: string;
  status: 'active' | 'paused' | 'cancelled' | 'pending_review';
  start_date: string;
  next_delivery_date: string | null;
  delivery_slot: string | null;
  address_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DBNotification = {
  id: string;
  user_id: string | null;
  role_target: string;
  title: string;
  message: string;
  type: string;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
};

export type DBReturnRequest = {
  id: string;
  order_id: string;
  user_id: string;
  reason: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
  refund_amount: number | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};
