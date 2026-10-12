/**
 * GET/PUT /api/admin/inventory
 * Inventory management with dual AWS PostgreSQL + Supabase Fallback.
 * Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction, isPgConfigured } from '@/lib/aws/rds';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { invalidateProductsCache } from '@/lib/aws/redis';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { z } from 'zod';

// ─── GET /api/admin/inventory ─────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'low_stock' | 'out_of_stock' | 'all'

    if (isPgConfigured) {
      try {
        let whereClause = '';
        if (filter === 'low_stock') {
          whereClause = 'WHERE pv.stock <= 10 AND pv.stock > 0';
        } else if (filter === 'out_of_stock') {
          whereClause = 'WHERE pv.stock = 0';
        }

        const result = await query(
          `SELECT 
             pv.id as variant_id,
             pv.weight,
             pv.stock,
             pv.price,
             pv.cost_price,
             p.id as product_id,
             p.name as product_name,
             p.category,
             p.image_url,
             p.is_active as product_active,
             CASE 
               WHEN pv.stock = 0 THEN 'out_of_stock'
               WHEN pv.stock <= 10 THEN 'low_stock'
               ELSE 'in_stock'
             END as stock_status
           FROM product_variants pv
           JOIN products p ON p.id = pv.product_id
           ${whereClause}
           ORDER BY pv.stock ASC, p.name ASC`
        );

        return NextResponse.json({
          variants: result.rows,
          stats: {
            out_of_stock: result.rows.filter((r) => r.stock === 0).length,
            low_stock: result.rows.filter((r) => r.stock > 0 && r.stock <= 10).length,
            in_stock: result.rows.filter((r) => r.stock > 10).length,
          },
        });
      } catch (err: any) {
        console.warn('[Inventory GET] RDS failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();
    const { data: variants, error } = await sb
      .from('product_variants')
      .select('id, weight, stock, price, cost_price, product_id, products(id, name, category, image_url, is_active)')
      .order('stock', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = (variants || []).map((v: any) => ({
      variant_id: v.id,
      weight: v.weight,
      stock: v.stock,
      price: v.price,
      cost_price: v.cost_price,
      product_id: v.products?.id,
      product_name: v.products?.name,
      category: v.products?.category,
      image_url: v.products?.image_url,
      product_active: v.products?.is_active,
      stock_status: v.stock === 0 ? 'out_of_stock' : v.stock <= 10 ? 'low_stock' : 'in_stock',
    }));

    return NextResponse.json({
      variants: formatted,
      stats: {
        out_of_stock: formatted.filter((r: any) => r.stock === 0).length,
        low_stock: formatted.filter((r: any) => r.stock > 0 && r.stock <= 10).length,
        in_stock: formatted.filter((r: any) => r.stock > 10).length,
      },
    });
  } catch (error: any) {
    console.error('[Inventory GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

// ─── PUT /api/admin/inventory ─────────────────────────────────
const UpdateStockSchema = z.object({
  updates: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        stock: z.number().int().min(0),
      })
    )
    .min(1)
    .max(100),
});

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { updates } = UpdateStockSchema.parse(body);

    if (isPgConfigured) {
      try {
        await withTransaction(async (client) => {
          for (const u of updates) {
            await client.query('UPDATE product_variants SET stock = $1, updated_at = now() WHERE id = $2', [
              u.stock,
              u.variantId,
            ]);
          }
        });

        await invalidateProductsCache();
        return NextResponse.json({ success: true, updated: updates.length });
      } catch (err: any) {
        console.warn('[Inventory PUT] RDS failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();
    for (const u of updates) {
      await sb
        .from('product_variants')
        .update({ stock: u.stock, updated_at: new Date().toISOString() })
        .eq('id', u.variantId);
    }

    await invalidateProductsCache();
    return NextResponse.json({ success: true, updated: updates.length });
  } catch (error: any) {
    console.error('[Inventory PUT] Error:', error.message);
    return NextResponse.json({ error: 'Failed to update stock' }, { status: 500 });
  }
}
