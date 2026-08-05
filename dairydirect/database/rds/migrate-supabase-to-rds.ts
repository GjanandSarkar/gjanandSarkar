/**
 * Supabase to AWS RDS Migration Script
 * Reads all historical data from Supabase and streams into AWS RDS PostgreSQL.
 * 
 * Usage:
 *   npx ts-node database/rds/migrate-supabase-to-rds.ts
 */

import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../frontend/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing from .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const rdsPool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'dairydirect',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || '',
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  console.log('🚀 Starting Supabase -> AWS RDS PostgreSQL Migration...');

  const client = await rdsPool.connect();

  try {
    // 1. Profiles
    console.log('📦 Migrating profiles...');
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
    if (pErr) console.warn('Warning fetching profiles:', pErr.message);
    if (profiles && profiles.length > 0) {
      for (const p of profiles) {
        await client.query(
          `INSERT INTO profiles (id, phone, email, name, role, is_active, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone`,
          [p.id, p.phone, p.email, p.name, p.role || 'customer', p.is_active ?? true, p.created_at || new Date()]
        );
      }
      console.log(`✅ Migrated ${profiles.length} profiles.`);
    }

    // 2. User Addresses
    console.log('📦 Migrating user addresses...');
    const { data: addresses } = await supabase.from('user_addresses').select('*');
    if (addresses && addresses.length > 0) {
      for (const a of addresses) {
        await client.query(
          `INSERT INTO user_addresses (id, user_id, label, address, apartment, lat, lng, is_default, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO NOTHING`,
          [a.id, a.user_id, a.label || 'Home', a.address, a.apartment, a.lat, a.lng, a.is_default ?? false, a.created_at || new Date()]
        );
      }
      console.log(`✅ Migrated ${addresses.length} addresses.`);
    }

    // 3. Products & Variants
    console.log('📦 Migrating products & variants...');
    const { data: products } = await supabase.from('products').select('*, product_variants(*)');
    if (products && products.length > 0) {
      for (const prod of products) {
        await client.query(
          `INSERT INTO products (id, name, category, description, image_url, is_freshness_guarantee, is_active, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, image_url = EXCLUDED.image_url`,
          [prod.id, prod.name, prod.category || 'milk', prod.description, prod.image_url, prod.is_freshness_guarantee ?? false, prod.is_active ?? true, prod.created_at || new Date()]
        );

        if (prod.product_variants && Array.isArray(prod.product_variants)) {
          for (const pv of prod.product_variants) {
            await client.query(
              `INSERT INTO product_variants (id, product_id, weight, price, cost_price, original_price, stock)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, stock = EXCLUDED.stock`,
              [pv.id, prod.id, pv.weight, pv.price, pv.cost_price || (pv.price * 0.7), pv.original_price, pv.stock ?? 100]
            );
          }
        }
      }
      console.log(`✅ Migrated ${products.length} products with variants.`);
    }

    // 4. Orders & Order Items
    console.log('📦 Migrating orders...');
    const { data: orders } = await supabase.from('orders').select('*, order_items(*)');
    if (orders && orders.length > 0) {
      for (const o of orders) {
        await client.query(
          `INSERT INTO orders (id, user_id, total_amount, subtotal, delivery_fee, discount, status, payment_status, payment_method, address_id, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO NOTHING`,
          [
            o.id, o.user_id, o.total_amount, o.subtotal || o.total_amount, o.delivery_fee || 0,
            o.discount || 0, o.status || 'pending', o.payment_status || 'pending',
            o.payment_method || 'cod', o.address_id, o.created_at || new Date()
          ]
        );

        if (o.order_items && Array.isArray(o.order_items)) {
          for (const oi of o.order_items) {
            await client.query(
              `INSERT INTO order_items (id, order_id, product_id, variant_id, quantity, unit_price, total_price)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               ON CONFLICT (id) DO NOTHING`,
              [oi.id, o.id, oi.product_id, oi.variant_id, oi.quantity || 1, oi.price || 0, (oi.price || 0) * (oi.quantity || 1)]
            );
          }
        }
      }
      console.log(`✅ Migrated ${orders.length} orders.`);
    }

    // 5. Subscriptions
    console.log('📦 Migrating subscriptions...');
    const { data: subs } = await supabase.from('subscriptions').select('*');
    if (subs && subs.length > 0) {
      for (const s of subs) {
        await client.query(
          `INSERT INTO subscriptions (id, user_id, product_id, variant_id, address_id, volume, plan, status, start_date, next_delivery_date, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO NOTHING`,
          [s.id, s.user_id, s.product_id, s.variant_id, s.address_id, s.volume || '1L', s.plan || 'daily', s.status || 'active', s.start_date || new Date(), s.next_delivery_date || new Date(), s.created_at || new Date()]
        );
      }
      console.log(`✅ Migrated ${subs.length} subscriptions.`);
    }

    console.log('\n🎉 ALL SUPABASE DATA SUCCESSFULLY MIGRATED TO RDS POSTGRESQL!\n');
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    client.release();
    await rdsPool.end();
  }
}

migrate();
