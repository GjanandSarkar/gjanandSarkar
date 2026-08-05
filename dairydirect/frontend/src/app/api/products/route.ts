/**
 * GET/POST/PUT/DELETE /api/products
 * Product management — AWS PostgreSQL version.
 * GET: Public (cached), POST/PUT/DELETE: Admin only with audit logging.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/aws/rds';
import { getAuthUser, getClientIP } from '@/lib/api/auth-middleware';
import { getCachedProducts, cacheProducts, invalidateProductsCache } from '@/lib/aws/redis';
import { checkRateLimit } from '@/lib/aws/redis';
import { ProductSchema, VariantSchema, isValidUUID } from '@/lib/security/sanitize';
import { writeAuditLog } from '@/lib/security/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// ─── GET /api/products ────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    // Try cache first (60s TTL)
    const cacheKey = `${category || 'all'}_${activeOnly}`;
    const cached = await getCachedProducts(cacheKey);
    if (cached) {
      return NextResponse.json(
        { products: cached },
        { headers: { 'X-Cache': 'HIT', 'Cache-Control': 'no-store' } }
      );
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

    const result = await query(
      `SELECT 
         p.id, p.name, p.category, p.description, p.image_url, p.s3_image_key,
         p.is_freshness_guarantee, p.is_active, p.sort_order, p.tags, p.created_at,
         json_agg(
           json_build_object(
             'id', pv.id,
             'product_id', pv.product_id,
             'weight', pv.weight,
             'price', pv.price,
             'original_price', pv.original_price,
             'cost_price', pv.cost_price,
             'stock', pv.stock,
             'low_stock_threshold', pv.low_stock_threshold,
             'is_available', pv.is_available,
             'expiry_date', pv.expiry_date,
             'batch_number', pv.batch_number,
             'created_at', pv.created_at
           ) ORDER BY pv.price ASC
         ) FILTER (WHERE pv.id IS NOT NULL) as product_variants
       FROM products p
       LEFT JOIN product_variants pv ON pv.product_id = p.id
       ${whereClause}
       GROUP BY p.id
       ORDER BY p.sort_order ASC, p.created_at DESC`,
      params
    );

    const products = result.rows;

    // Cache for 60 seconds
    await cacheProducts(cacheKey, products, 60);

    return NextResponse.json(
      { products },
      { headers: { 'X-Cache': 'MISS', 'Cache-Control': 'no-store' } }
    );
  } catch (error: any) {
    console.error('[Products GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// ─── POST /api/products ───────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();

    // Validate product data
    const productParse = ProductSchema.safeParse(body);
    if (!productParse.success) {
      return NextResponse.json({ error: productParse.error.issues[0].message }, { status: 400 });
    }

    const variants: any[] = body.variants || [];

    // Validate variants
    const VariantsArraySchema = z.array(VariantSchema).min(1, 'At least one variant required');
    const variantParse = VariantsArraySchema.safeParse(variants);
    if (!variantParse.success) {
      return NextResponse.json({ error: variantParse.error.issues[0].message }, { status: 400 });
    }

    // Fetch min margin setting
    const settingsResult = await query<{ min_profit_margin_percent: number }>(
      'SELECT min_profit_margin_percent FROM business_settings LIMIT 1'
    );
    const minMargin = parseFloat((settingsResult.rows[0]?.min_profit_margin_percent ?? 20).toString());

    // Validate profit margins
    for (const v of variantParse.data) {
      const minSelling = v.cost_price * (1 + minMargin / 100);
      if (v.price < minSelling) {
        return NextResponse.json({
          error: `Selling price for "${v.weight}" must be at least ₹${minSelling.toFixed(2)} (${minMargin}% margin on ₹${v.cost_price} cost)`,
        }, { status: 400 });
      }
    }

    const productData = productParse.data;

    // Create product + variants in transaction
    const result = await withTransaction(async (client) => {
      const productResult = await client.query<{ id: string }>(
        `INSERT INTO products (name, category, description, image_url, is_freshness_guarantee, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING id`,
        [productData.name, productData.category, productData.description || null, productData.image_url || null, productData.is_freshness_guarantee ?? false]
      );

      const productId = productResult.rows[0].id;

      for (const v of variantParse.data) {
        await client.query(
          `INSERT INTO product_variants (product_id, weight, price, original_price, cost_price, stock, low_stock_threshold, expiry_date, batch_number)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [productId, v.weight, v.price, v.original_price || null, v.cost_price, v.stock ?? 0, v.low_stock_threshold ?? 5, v.expiry_date || null, v.batch_number || null]
        );
      }

      return productId;
    });

    // Audit log
    await writeAuditLog({
      adminId: auth.userId,
      action: 'product.create',
      resourceType: 'product',
      resourceId: result,
      details: { name: productData.name, category: productData.category, variantCount: variants.length },
      ipAddress: getClientIP(request),
    });

    // Invalidate cache
    await invalidateProductsCache();

    return NextResponse.json({ success: true, id: result });
  } catch (error: any) {
    console.error('[Products POST] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}

// ─── DELETE /api/products ─────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const permanent = searchParams.get('permanent') === 'true';

    if (!id || !isValidUUID(id)) {
      return NextResponse.json({ error: 'Valid product ID is required' }, { status: 400 });
    }

    // Check if product is referenced
    const orderRefs = await query('SELECT id FROM order_items WHERE product_id = $1 LIMIT 1', [id]);
    const subRefs = await query('SELECT id FROM subscriptions WHERE product_id = $1 LIMIT 1', [id]);
    const isReferenced = orderRefs.rows.length > 0 || subRefs.rows.length > 0;

    if (permanent && !isReferenced) {
      await withTransaction(async (client) => {
        await client.query('DELETE FROM cart_items WHERE product_id = $1', [id]);
        await client.query('DELETE FROM product_variants WHERE product_id = $1', [id]);
        await client.query('DELETE FROM products WHERE id = $1', [id]);
      });

      await writeAuditLog({ adminId: auth.userId, action: 'product.delete', resourceType: 'product', resourceId: id, ipAddress: getClientIP(request) });
      await invalidateProductsCache();
      return NextResponse.json({ success: true, permanent: true, message: 'Product permanently deleted.' });
    }

    // Soft delete
    await query(`UPDATE products SET is_active = false, updated_at = now() WHERE id = $1`, [id]);
    await query('DELETE FROM cart_items WHERE product_id = $1', [id]);

    await writeAuditLog({ adminId: auth.userId, action: 'product.deactivate', resourceType: 'product', resourceId: id, ipAddress: getClientIP(request) });
    await invalidateProductsCache();

    return NextResponse.json({
      success: true,
      softDeleted: true,
      message: isReferenced ? 'Product archived (has order history).' : 'Product deactivated and removed from storefront.',
    });
  } catch (error: any) {
    console.error('[Products DELETE] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Failed to delete product' }, { status: 500 });
  }
}