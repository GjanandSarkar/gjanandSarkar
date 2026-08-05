/**
 * GET/PUT/DELETE /api/products/[id]
 * Single product management — AWS PostgreSQL version.
 * Supports profit margin checks, variant upserts, soft delete, and Redis cache invalidation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/aws/rds';
import { getAuthUser, getClientIP } from '@/lib/api/auth-middleware';
import { invalidateProductsCache } from '@/lib/aws/redis';
import { isValidUUID, ProductSchema, VariantSchema } from '@/lib/security/sanitize';
import { writeAuditLog } from '@/lib/security/audit';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const result = await query(
      `SELECT 
         p.id, p.name, p.category, p.description, p.image_url, p.s3_image_key,
         p.is_freshness_guarantee, p.is_active, p.sort_order, p.tags, p.created_at, p.updated_at,
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
             'batch_number', pv.batch_number
           ) ORDER BY pv.price ASC
         ) FILTER (WHERE pv.id IS NOT NULL) as product_variants
       FROM products p
       LEFT JOIN product_variants pv ON pv.product_id = p.id
       WHERE p.id = $1
       GROUP BY p.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product: result.rows[0] });
  } catch (error: any) {
    console.error('[Product GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, category, description, image_url, is_freshness_guarantee, is_active, variants } = body;

    // Fetch minimum profit margin
    const settingsRes = await query<{ min_profit_margin_percent: number }>(
      'SELECT min_profit_margin_percent FROM business_settings LIMIT 1'
    );
    const minMargin = parseFloat((settingsRes.rows[0]?.min_profit_margin_percent ?? 20).toString());

    // Validate variants if provided
    if (variants && Array.isArray(variants) && variants.length > 0) {
      for (const v of variants) {
        const cost = Number(v.cost_price) || 0;
        const selling = Number(v.price) || 0;
        if (cost <= 0) {
          return NextResponse.json(
            { error: `Cost price must be greater than 0 for variant "${v.weight || 'unknown'}"` },
            { status: 400 }
          );
        }
        const minSelling = cost * (1 + minMargin / 100);
        if (selling < minSelling) {
          return NextResponse.json(
            { error: `Selling price for "${v.weight}" must be at least ₹${minSelling.toFixed(2)} (${minMargin}% margin)` },
            { status: 400 }
          );
        }
      }
    }

    await withTransaction(async (client) => {
      // 1. Update product fields
      const setParts: string[] = ['updated_at = now()'];
      const values: any[] = [id];
      let pIdx = 2;

      if (name !== undefined) { setParts.push(`name = $${pIdx++}`); values.push(name); }
      if (category !== undefined) { setParts.push(`category = $${pIdx++}`); values.push(category); }
      if (description !== undefined) { setParts.push(`description = $${pIdx++}`); values.push(description); }
      if (image_url !== undefined) { setParts.push(`image_url = $${pIdx++}`); values.push(image_url); }
      if (is_freshness_guarantee !== undefined) { setParts.push(`is_freshness_guarantee = $${pIdx++}`); values.push(is_freshness_guarantee); }
      if (is_active !== undefined) { setParts.push(`is_active = $${pIdx++}`); values.push(is_active); }

      await client.query(`UPDATE products SET ${setParts.join(', ')} WHERE id = $1`, values);

      // 2. Sync variants if provided
      if (variants && Array.isArray(variants)) {
        const existingResult = await client.query<{ id: string }>(
          'SELECT id FROM product_variants WHERE product_id = $1',
          [id]
        );
        const existingIds = existingResult.rows.map(r => r.id);
        const incomingIds = variants.filter((v: any) => v.id).map((v: any) => v.id);

        // Delete removed variants that aren't referenced in orders
        const toDelete = existingIds.filter(eId => !incomingIds.includes(eId));
        for (const delId of toDelete) {
          const orderRef = await client.query('SELECT id FROM order_items WHERE variant_id = $1 LIMIT 1', [delId]);
          const subRef = await client.query('SELECT id FROM subscriptions WHERE variant_id = $1 LIMIT 1', [delId]);

          if (orderRef.rows.length > 0 || subRef.rows.length > 0) {
            // Keep variant record for historical orders, zero out stock and make unavailable
            await client.query('UPDATE product_variants SET stock = 0, is_available = false WHERE id = $1', [delId]);
          } else {
            await client.query('DELETE FROM cart_items WHERE variant_id = $1', [delId]);
            await client.query('DELETE FROM product_variants WHERE id = $1', [delId]);
          }
        }

        // Upsert incoming variants
        for (const v of variants) {
          const stock = parseInt(v.stock, 10) || 0;
          if (v.id && existingIds.includes(v.id)) {
            await client.query(
              `UPDATE product_variants 
               SET weight = $1, price = $2, cost_price = $3, original_price = $4, stock = $5, 
                   is_available = ($5 > 0), low_stock_threshold = COALESCE($6, low_stock_threshold),
                   updated_at = now()
               WHERE id = $7`,
              [v.weight, Number(v.price), Number(v.cost_price), v.original_price ? Number(v.original_price) : null, stock, v.low_stock_threshold || null, v.id]
            );
          } else {
            await client.query(
              `INSERT INTO product_variants (product_id, weight, price, cost_price, original_price, stock, is_available, low_stock_threshold)
               VALUES ($1, $2, $3, $4, $5, $6, ($6 > 0), COALESCE($7, 5))`,
              [id, v.weight, Number(v.price), Number(v.cost_price), v.original_price ? Number(v.original_price) : null, stock, v.low_stock_threshold || 5]
            );
          }
        }
      }
    });

    await writeAuditLog({
      adminId: auth.userId,
      action: 'product.update',
      resourceType: 'product',
      resourceId: id,
      details: { name, category },
      ipAddress: getClientIP(request),
    });

    await invalidateProductsCache();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Product PUT] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

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
      return NextResponse.json({ success: true, permanent: true, message: 'Product permanently removed.' });
    }

    // Soft delete
    await query('UPDATE products SET is_active = false, updated_at = now() WHERE id = $1', [id]);
    await query('DELETE FROM cart_items WHERE product_id = $1', [id]);

    await writeAuditLog({ adminId: auth.userId, action: 'product.deactivate', resourceType: 'product', resourceId: id, ipAddress: getClientIP(request) });
    await invalidateProductsCache();

    return NextResponse.json({
      success: true,
      softDeleted: true,
      message: isReferenced ? 'Product archived (has order history).' : 'Product deactivated.',
    });
  } catch (error: any) {
    console.error('[Product DELETE] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Failed to delete product' }, { status: 500 });
  }
}
