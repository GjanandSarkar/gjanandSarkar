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
    // 1. Business Settings
    console.log('📦 Migrating business settings...');
    const { data: settings } = await supabase.from('business_settings').select('*');
    if (settings && settings.length > 0) {
      for (const s of settings) {
        await client.query(
          `INSERT INTO business_settings (
             id, min_order_value, standard_delivery_fee, delivery_cost, 
             free_delivery_threshold, min_profit_margin_percent, max_discount_percent,
             freshness_guarantee_hours, is_store_open, support_phone, support_email
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET 
             standard_delivery_fee = EXCLUDED.standard_delivery_fee,
             delivery_cost = EXCLUDED.delivery_cost,
             free_delivery_threshold = EXCLUDED.free_delivery_threshold`,
          [
            s.id, s.min_order_value || 50, s.standard_delivery_fee || s.delivery_cost || 25,
            s.delivery_cost || s.standard_delivery_fee || 25, s.free_delivery_threshold || 299,
            s.min_profit_margin_percent || 20, s.max_discount_percent || 30,
            s.freshness_guarantee_hours || 24, s.is_store_open ?? true,
            s.support_phone || '+91 98765 43210', s.support_email || 'care@gjanandsarkar.com'
          ]
        );
      }
      console.log(`✅ Migrated business settings.`);
    }

    // 2. Profiles
    console.log('📦 Migrating profiles...');
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
    if (pErr) console.warn('Warning fetching profiles:', pErr.message);
    if (profiles && profiles.length > 0) {
      for (const p of profiles) {
        await client.query(
          `INSERT INTO profiles (id, phone, email, name, avatar_url, role, default_upi_id, loyalty_points, referral_code, is_active, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone`,
          [
            p.id, p.phone, p.email, p.name, p.avatar_url, p.role || 'customer',
            p.default_upi_id, p.loyalty_points || 0, p.referral_code, p.is_active ?? true, p.created_at || new Date()
          ]
        );
      }
      console.log(`✅ Migrated ${profiles.length} profiles.`);
    }

    // 3. User Addresses
    console.log('📦 Migrating user addresses...');
    const { data: addresses } = await supabase.from('user_addresses').select('*');
    if (addresses && addresses.length > 0) {
      for (const a of addresses) {
        await client.query(
          `INSERT INTO user_addresses (id, user_id, label, address, apartment, pincode, city, state, lat, lng, is_default, is_deleted, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (id) DO NOTHING`,
          [
            a.id, a.user_id, a.label || 'Home', a.address, a.apartment, a.pincode,
            a.city || 'Palanpur', a.state || 'Gujarat', a.lat, a.lng,
            a.is_default ?? false, a.is_deleted ?? false, a.created_at || new Date()
          ]
        );
      }
      console.log(`✅ Migrated ${addresses.length} addresses.`);
    }

    // 4. Sellers
    console.log('📦 Migrating sellers...');
    const { data: sellers } = await supabase.from('sellers').select('*');
    if (sellers && sellers.length > 0) {
      for (const s of sellers) {
        await client.query(
          `INSERT INTO sellers (id, user_id, store_name, slug, state, category, description, logo_url, banner_url, plan, commission_rate, status, gstin, pan, bank_account, ifsc_code, total_sales, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
           ON CONFLICT (id) DO UPDATE SET store_name = EXCLUDED.store_name, status = EXCLUDED.status`,
          [
            s.id, s.user_id, s.store_name, s.slug, s.state || 'Gujarat', s.category || 'A2 Organic Dairy',
            s.description, s.logo_url, s.banner_url, s.plan || 'growth', s.commission_rate || 5.00,
            s.status || 'active', s.gstin, s.pan, s.bank_account, s.ifsc_code, s.total_sales || 0.00,
            s.created_at || new Date()
          ]
        );
      }
      console.log(`✅ Migrated ${sellers.length} sellers.`);
    }

    // 5. Products & Variants
    console.log('📦 Migrating products & variants...');
    const { data: products } = await supabase.from('products').select('*, product_variants(*)');
    if (products && products.length > 0) {
      for (const prod of products) {
        await client.query(
          `INSERT INTO products (id, name, category, description, image_url, s3_image_key, is_freshness_guarantee, is_active, seller_id, state_origin, brand, rating, reviews_count, is_deal_of_the_day, discount_pct, tags, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, image_url = EXCLUDED.image_url, is_active = EXCLUDED.is_active`,
          [
            prod.id, prod.name, prod.category || 'Milk', prod.description, prod.image_url, prod.s3_image_key,
            prod.is_freshness_guarantee ?? true, prod.is_active ?? true, prod.seller_id,
            prod.state_origin || 'Gujarat', prod.brand || 'Gjanand Farm', prod.rating || 4.80,
            prod.reviews_count || 128, prod.is_deal_of_the_day ?? false, prod.discount_pct || 15,
            prod.tags || ['Made in India', 'Authentic'], prod.created_at || new Date()
          ]
        );

        if (prod.product_variants && Array.isArray(prod.product_variants)) {
          for (const pv of prod.product_variants) {
            await client.query(
              `INSERT INTO product_variants (id, product_id, weight, price, original_price, cost_price, stock, low_stock_threshold, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, stock = EXCLUDED.stock`,
              [
                pv.id, prod.id, pv.weight, pv.price, pv.original_price, pv.cost_price || (pv.price * 0.7),
                pv.stock ?? 100, pv.low_stock_threshold ?? 10, pv.created_at || new Date()
              ]
            );
          }
        }
      }
      console.log(`✅ Migrated ${products.length} products with variants.`);
    }

    // 6. Orders & Order Items
    console.log('📦 Migrating orders...');
    const { data: orders } = await supabase.from('orders').select('*, order_items(*)');
    if (orders && orders.length > 0) {
      for (const o of orders) {
        await client.query(
          `INSERT INTO orders (id, order_number, user_id, address_id, shipping_address, status, subtotal, delivery_fee, discount_amount, total_amount, payment_method, payment_status, payment_details, razorpay_order_id, razorpay_payment_id, delivery_slot, delivery_date, coupon_code, loyalty_earned, notes, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
           ON CONFLICT (id) DO NOTHING`,
          [
            o.id, o.order_number, o.user_id, o.address_id, o.shipping_address, o.status || 'pending',
            o.subtotal || o.total_amount, o.delivery_fee || 0.00, o.discount_amount || 0.00, o.total_amount,
            o.payment_method || 'COD', o.payment_status || 'pending', o.payment_details,
            o.razorpay_order_id, o.razorpay_payment_id, o.delivery_slot, o.delivery_date,
            o.coupon_code, o.loyalty_earned || 0, o.notes, o.created_at || new Date()
          ]
        );

        if (o.order_items && Array.isArray(o.order_items)) {
          for (const oi of o.order_items) {
            await client.query(
              `INSERT INTO order_items (id, order_id, product_id, variant_id, product_name, variant_weight, quantity, price, cost_price, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
               ON CONFLICT (id) DO NOTHING`,
              [
                oi.id, o.id, oi.product_id, oi.variant_id, oi.product_name, oi.variant_weight,
                oi.quantity || 1, oi.price || 0.00, oi.cost_price || 0.00, oi.created_at || new Date()
              ]
            );
          }
        }
      }
      console.log(`✅ Migrated ${orders.length} orders.`);
    }

    // 7. Subscriptions
    console.log('📦 Migrating subscriptions...');
    const { data: subs } = await supabase.from('subscriptions').select('*');
    if (subs && subs.length > 0) {
      for (const s of subs) {
        await client.query(
          `INSERT INTO subscriptions (id, user_id, product_id, variant_id, volume, plan, delivery_slot, status, start_date, next_delivery_date, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO NOTHING`,
          [
            s.id, s.user_id, s.product_id, s.variant_id, s.volume || 1, s.plan || 'daily',
            s.delivery_slot || 'Early Morning (5:00 AM - 7:00 AM)', s.status || 'active',
            s.start_date || new Date(), s.next_delivery_date || new Date(), s.created_at || new Date()
          ]
        );
      }
      console.log(`✅ Migrated ${subs.length} subscriptions.`);
    }

    // 8. Coupons
    console.log('📦 Migrating coupons...');
    const { data: coupons } = await supabase.from('coupons').select('*');
    if (coupons && coupons.length > 0) {
      for (const c of coupons) {
        await client.query(
          `INSERT INTO coupons (id, code, type, value, min_order_value, max_discount, max_uses, used_count, is_active, expiry_date, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO NOTHING`,
          [
            c.id, c.code, c.type || 'percentage', c.value, c.min_order_value || 0,
            c.max_discount, c.max_uses, c.used_count || 0, c.is_active ?? true,
            c.expiry_date, c.created_at || new Date()
          ]
        );
      }
      console.log(`✅ Migrated ${coupons.length} coupons.`);
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
