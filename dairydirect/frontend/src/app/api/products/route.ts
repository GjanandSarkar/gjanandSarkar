/**
 * GET/POST/PUT/DELETE /api/products
 * Product management with dual AWS PostgreSQL + Supabase Fallback.
 * Supports filtering by sellerId to isolate seller-specific products.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction, isPgConfigured } from '@/lib/aws/rds';
import {
  getAuthUser,
  getSellerForUser,
  sellerCanWrite,
  type SellerContext,
} from '@/lib/api/auth-middleware';
import { writeAuditLog } from '@/lib/security/audit';
import { getCachedProducts, cacheProducts, invalidateProductsCache } from '@/lib/aws/redis';

import { getAdminSupabase } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// ─── GET /api/products ────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const sellerId = searchParams.get('sellerId');
    const q = searchParams.get('q');
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    // Try cache first (60s TTL) - bypass cache for seller dashboard specific queries
    const cacheKey = sellerId || q ? `seller_${sellerId}_q_${q}_${activeOnly}` : `${category || 'all'}_${activeOnly}`;
    if (!sellerId && !q) {
      const cached = await getCachedProducts(cacheKey);
      if (cached) {
        return NextResponse.json(
          { products: cached },
          { headers: { 'X-Cache': 'HIT', 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
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

    if (sellerId) {
      conditions.push(`(p.seller_id = $${paramIdx} OR p.created_by = $${paramIdx})`);
      params.push(sellerId);
      paramIdx++;
    }

    if (category && category !== 'All' && category !== 'All Categories') {
      const cleanCat = category.replace(/-/g, ' ').trim();
      conditions.push(`p.category ILIKE $${paramIdx++}`);
      params.push(`%${cleanCat}%`);
    }

    if (q) {
      conditions.push(`(p.name ILIKE $${paramIdx} OR p.description ILIKE $${paramIdx})`);
      params.push(`%${q}%`);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let products: any[] = [];

    if (isPgConfigured) {
      try {
        const result = await query(
          `SELECT 
             p.id, p.name, p.category, p.description, p.image_url, p.s3_image_key,
             p.is_freshness_guarantee, p.is_active, p.tags, p.brand, p.state_origin,
             p.seller_id, p.created_by, p.rating, p.reviews_count, p.created_at,
             COALESCE(
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
               ) FILTER (WHERE pv.id IS NOT NULL),
               '[]'::json
             ) as product_variants
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
        if (sellerId) {
          sbQuery = sbQuery.or(`seller_id.eq.${sellerId},created_by.eq.${sellerId}`);
        }
        if (category && category !== 'All' && category !== 'All Categories') {
          const cleanCat = category.replace(/-/g, ' ').trim();
          sbQuery = sbQuery.ilike('category', `%${cleanCat}%`);
        }
        if (q) {
          sbQuery = sbQuery.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
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
    if (products.length > 0 && !sellerId && !q) {
      cacheProducts(cacheKey, products, 60).catch(() => {});
    }

    return NextResponse.json(
      { products },
      { headers: { 'X-Cache': 'MISS', 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
    );
  } catch (error: any) {
    console.error('[Products GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch products', products: [] }, { status: 500 });
  }
}

// ─── POST /api/products (Admin & active contracted sellers only) ─────
export async function POST(request: NextRequest) {
  try {
    // ─────────────────────────────────────────────────────────────────────
    // AUTHORISATION
    //
    // This handler previously called getAuthUser() and then ignored the
    // result entirely: there was no admin check, no seller check, and no
    // login check at all. An unauthenticated request could publish a live
    // product — with arbitrary name, price, images and description — onto
    // the storefront. (PUT and DELETE on /api/products/[id] were already
    // gated on auth.isAdmin; only POST was open.)
    //
    // The rule enforced here mirrors the business model:
    //   - admins may create products in any category
    //   - a seller may create products ONLY if their seller record is
    //     'active', and ONLY inside the single category they are contracted
    //     for (one company per category)
    //   - everybody else is rejected
    // ─────────────────────────────────────────────────────────────────────
    const auth = await getAuthUser(request);

    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, category, description, image_url, is_freshness_guarantee, is_active, variants } = body;

    if (!name || !category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 });
    }

    // Seller identity is resolved from the authenticated user server-side.
    // The previous code read `sellerId` straight out of the request body,
    // so a caller could attribute a product to any seller they liked.
    let seller: SellerContext | null = null;

    if (!auth.isAdmin) {
      seller = await getSellerForUser(auth.userId);

      if (!seller) {
        return NextResponse.json(
          { error: 'Only approved sellers can add products' },
          { status: 403 }
        );
      }

      if (!sellerCanWrite(seller)) {
        return NextResponse.json(
          {
            error: `Your seller account is '${seller.status}'. Products can only be added while your account is active.`,
          },
          { status: 403 }
        );
      }

      // One company per category: a seller cannot list outside their contract.
      const requested = String(category).trim().toLowerCase();
      const contracted = seller.category.trim().toLowerCase();
      if (!contracted || requested !== contracted) {
        return NextResponse.json(
          {
            error: `You are contracted for the '${seller.category}' category and cannot list products under '${category}'.`,
          },
          { status: 403 }
        );
      }
    }

    const sellerId = seller?.sellerId ?? null;

    if (isPgConfigured) {
      try {
        // Runtime `ALTER TABLE ... ADD COLUMN` used to run here on every
        // product creation. DDL takes an ACCESS EXCLUSIVE lock, which stalls
        // every concurrent read of the products table. These columns are now
        // created by migration 20261006_product_ownership_columns.sql.
        const newProduct = await withTransaction(async (client) => {
          const prodResult = await client.query<{ id: string }>(
            `INSERT INTO products (name, category, description, image_url, is_freshness_guarantee, is_active, seller_id, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
             RETURNING id`,
            [name, category, description || null, image_url || null, is_freshness_guarantee ?? false, is_active ?? true, sellerId]
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

        if (auth?.userId) {
          await writeAuditLog({
            adminId: auth.userId,
            action: 'product.create' as any,
            resourceType: 'product',
            resourceId: newProduct,
            details: { name, category, sellerId },
            ipAddress: request.headers.get('x-forwarded-for') || ''
          });
        }

        return NextResponse.json({ success: true, productId: newProduct }, { status: 201 });
      } catch (err: any) {
        console.warn('[Products POST] RDS failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();
    let prodData: any = null;
    let prodErr: any = null;

    // Seller attribution is already verified above (getSellerForUser +
    // sellerCanWrite + category check). The previous implementation instead
    // took an unverified id from the request body and tried, in turn, to
    // match it against sellers.id, then sellers.user_id, then profiles.id —
    // three speculative lookups that would happily attribute a product to
    // somebody else's store.
    const validSellerUuid: string | null = seller?.sellerId ?? null;
    const validSellerUserId: string | null = seller?.userId ?? auth.userId;

    // 1. Insert into main products table
    const primaryPayload: any = {
      name,
      category,
      description: description || null,
      image_url: image_url || null,
      is_freshness_guarantee: is_freshness_guarantee ?? false,
      is_active: is_active ?? true,
      created_by: auth.userId,
    };

    // Auto-link category_id if available
    if (category) {
      try {
        const { data: catRecord } = await sb
          .from('categories')
          .select('id')
          .ilike('name', category.trim())
          .maybeSingle();
        if (catRecord?.id) {
          primaryPayload.category_id = catRecord.id;
        }
      } catch {}
    }

    if (validSellerUuid) {
      primaryPayload.seller_id = validSellerUuid;
    }

    const res1 = await sb
      .from('products')
      .insert(primaryPayload)
      .select('id')
      .single();

    if (!res1.error && res1.data) {
      prodData = res1.data;
    } else {
      delete primaryPayload.seller_id;
      const res2 = await sb
        .from('products')
        .insert(primaryPayload)
        .select('id')
        .single();

      if (res2.error) {
        prodErr = res2.error;
      } else {
        prodData = res2.data;
      }
    }

    if (prodErr || !prodData) {
      throw new Error(prodErr?.message || 'Failed to create product in Supabase');
    }

    // 2. Insert into product_variants table
    if (variants && Array.isArray(variants) && variants.length > 0) {
      const vInserts = variants.map((v: any) => {
        const stockNum = typeof v.stock === 'number' ? v.stock : (!isNaN(parseInt(v.stock, 10)) ? parseInt(v.stock, 10) : 100);
        const priceNum = typeof v.price === 'number' ? v.price : (parseFloat(v.price) || 0);
        const costPriceNum = typeof v.cost_price === 'number' ? v.cost_price : (!isNaN(parseFloat(v.cost_price)) ? parseFloat(v.cost_price) : 0);
        const originalPriceNum = v.original_price ? (parseFloat(v.original_price) || null) : null;

        return {
          product_id: prodData.id,
          weight: String(v.weight || 'Default').trim(),
          price: priceNum,
          cost_price: Math.max(0, costPriceNum),
          original_price: originalPriceNum,
          stock: Math.max(0, stockNum),
          available_quantity: Math.max(0, stockNum),
          reserved_quantity: 0,
          low_stock_threshold: v.low_stock_threshold || 10,
        };
      });

      const { error: vErr } = await sb.from('product_variants').insert(vInserts);
      if (vErr) {
        console.error('[Products POST] product_variants insert error:', vErr);
        throw new Error(`Failed to save product variants: ${vErr.message}`);
      }
    }

    // 3. Sync to seller_product table in Supabase
    if (prodData?.id) {
      const primaryV = (variants && variants[0]) || {};
      const primaryPrice = typeof primaryV.price === 'number' ? primaryV.price : (parseFloat(primaryV.price) || 0);
      const primaryCost = typeof primaryV.cost_price === 'number' ? primaryV.cost_price : (parseFloat(primaryV.cost_price) || 0);
      const primaryStock = typeof primaryV.stock === 'number' ? primaryV.stock : (!isNaN(parseInt(primaryV.stock, 10)) ? parseInt(primaryV.stock, 10) : 100);

      try {
        await sb.from('seller_product').insert({
          product_id: prodData.id,
          seller_id: validSellerUuid,
          seller_user_id: validSellerUserId,
          name,
          category,
          description: description || null,
          price: primaryPrice,
          original_price: primaryV.original_price ? parseFloat(primaryV.original_price) : null,
          cost_price: primaryCost,
          weight: primaryV.weight ? String(primaryV.weight).trim() : '500g',
          stock: primaryStock,
          image_url: image_url || null,
          status: is_active ?? true ? 'active' : 'inactive',
          is_approved: true,
        });
      } catch (spErr: any) {
        console.warn('[Products POST] seller_product insert warning:', spErr?.message || spErr);
      }
    }

    const pData = prodData;

    await invalidateProductsCache();

    if (auth?.userId) {
      await writeAuditLog({
        adminId: auth.userId,
        action: 'product.create' as any,
        resourceType: 'product',
        resourceId: pData.id,
        details: pData,
        ipAddress: request.headers.get('x-forwarded-for') || ''
      });
    }

    return NextResponse.json({ success: true, productId: pData.id }, { status: 201 });
  } catch (error: any) {
    console.error('[Products POST] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}