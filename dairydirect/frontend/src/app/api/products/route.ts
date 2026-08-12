/**
 * GET/POST/PUT/DELETE /api/products
 * Product management with dual AWS PostgreSQL + Supabase Fallback.
 * GET: Public (cached), POST/PUT/DELETE: Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction, isPgConfigured } from '@/lib/aws/rds';
import { getAuthUser, getClientIP } from '@/lib/api/auth-middleware';
import { getCachedProducts, cacheProducts, invalidateProductsCache } from '@/lib/aws/redis';
import { checkRateLimit } from '@/lib/aws/redis';
import { ProductSchema, VariantSchema, isValidUUID } from '@/lib/security/sanitize';
import { writeAuditLog } from '@/lib/security/audit';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// ─── GET /api/products ────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const activeOnly = searchParams.get('activeOnly') !== 'false';
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

    // Try cache first (60s TTL) unless forceRefresh is true
    const cacheKey = `${category || 'all'}_${activeOnly}`;
    if (!forceRefresh) {
      const cached = await getCachedProducts(cacheKey);
      if (cached) {
        return NextResponse.json(
          { products: cached },
          { headers: { 'X-Cache': 'HIT', 'Cache-Control': 'no-store' } }
        );
      }
    }

    // Build parameterized query
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (activeOnly) {
      conditions.push(`p.is_active = true`);
    }

    if (category && category !== 'All' && category !== 'All Categories') {
      const cleanCat = category.replace(/-/g, ' ').trim();
      conditions.push(`p.category ILIKE $${paramIdx++}`);
      params.push(`%${cleanCat}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let products: any[] = [];

    if (isPgConfigured) {
      try {
        const result = await query(
          `SELECT 
             p.id, p.name, p.category, p.description, p.image_url, p.s3_image_key,
             p.is_freshness_guarantee, p.is_active, p.tags, p.brand, p.state_origin,
             p.rating, p.reviews_count, p.created_at,
             json_agg(
               json_build_object(
                 'id', pv.id,
                 'product_id', pv.product_id,
                 'weight', pv.weight,
                 'price', pv.price,
                 'original_price', pv.original_price,
                 'cost_price', pv.cost_price,
                 'stock', pv.stock,
                 'created_at', pv.created_at
               ) ORDER BY pv.price ASC
             ) FILTER (WHERE pv.id IS NOT NULL) as product_variants
           FROM products p
           LEFT JOIN product_variants pv ON pv.product_id = p.id
           ${whereClause}
           GROUP BY p.id
           ORDER BY p.created_at DESC`,
          params
        );
        products = result.rows || [];
      } catch (dbErr: any) {
        console.warn('[Products GET] RDS failed, falling back to Supabase:', dbErr.message);
      }
    }

    if (products.length === 0) {
      try {
        const admin = getAdminSupabase();
        let sbQuery = admin
          .from('products')
          .select('*, product_variants(*)')
          .order('created_at', { ascending: false });

        if (activeOnly) {
          sbQuery = sbQuery.eq('is_active', true);
        }
        if (category && category !== 'All' && category !== 'All Categories') {
          const cleanCat = category.replace(/-/g, ' ').trim();
          sbQuery = sbQuery.ilike('category', `%${cleanCat}%`);
        }
        const { data, error } = await sbQuery;
        if (!error && data) {
          products = data;
        }
      } catch (sbErr: any) {
        console.warn('[Products GET] Supabase fallback error:', sbErr.message);
      }
    }

    // Cache products asynchronously (60s TTL)
    if (products.length > 0) {
      cacheProducts(cacheKey, products, 60).catch(() => {});
    }

    return NextResponse.json(
      { products },
      { headers: { 'X-Cache': 'MISS', 'Cache-Control': 'no-store' } }
    );
  } catch (error: any) {
    console.error('[Products GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch products', products: [] }, { status: 500 });
  }
}

// ─── POST /api/products (Admin Only) ─────────────────────────
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, category, description, image_url, is_freshness_guarantee, is_active, variants } = body;

    if (!name || !category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 });
    }

    if (isPgConfigured) {
      try {
        const newProduct = await withTransaction(async (client) => {
          const prodResult = await client.query<{ id: string }>(
            `INSERT INTO products (name, category, description, image_url, is_freshness_guarantee, is_active)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            [name, category, description || null, image_url || null, is_freshness_guarantee ?? false, is_active ?? true]
          );

          const productId = prodResult.rows[0].id;

          if (variants && Array.isArray(variants)) {
            for (const v of variants) {
              await client.query(
                `INSERT INTO product_variants (product_id, weight, price, cost_price, original_price, stock)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [productId, v.weight, v.price, v.cost_price || 0, v.original_price || null, v.stock || 100]
              );
            }
          }

          return productId;
        });

        await invalidateProductsCache();
        return NextResponse.json({ success: true, productId: newProduct }, { status: 201 });
      } catch (err: any) {
        console.warn('[Products POST] RDS failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();
    const { data: prodData, error: prodErr } = await sb
      .from('products')
      .insert({
        name,
        category,
        description: description || null,
        image_url: image_url || null,
        is_freshness_guarantee: is_freshness_guarantee ?? false,
        is_active: is_active ?? true,
      })
      .select('id')
      .single();

    if (prodErr || !prodData) {
      throw new Error(prodErr?.message || 'Failed to create product in Supabase');
    }

    if (variants && Array.isArray(variants)) {
      const vInserts = variants.map((v) => ({
        product_id: prodData.id,
        weight: v.weight,
        price: v.price,
        cost_price: v.cost_price || 0,
        original_price: v.original_price || null,
        stock: v.stock || 100,
      }));
      await sb.from('product_variants').insert(vInserts);
    }

    await invalidateProductsCache();
    return NextResponse.json({ success: true, productId: prodData.id }, { status: 201 });
  } catch (error: any) {
    console.error('[Products POST] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}