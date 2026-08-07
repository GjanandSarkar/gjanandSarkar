/**
 * GET/PUT/DELETE /api/products/[id]
 * Single product management with dual AWS PostgreSQL + Supabase Fallback.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction, isPgConfigured } from '@/lib/aws/rds';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { invalidateProductsCache } from '@/lib/aws/redis';
import { isValidUUID } from '@/lib/security/sanitize';
import { getAdminSupabase } from '@/lib/supabase/admin';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    if (isPgConfigured) {
      try {
        const result = await query(
          `SELECT 
             p.id, p.name, p.category, p.description, p.image_url, p.s3_image_key,
             p.is_freshness_guarantee, p.is_active, p.tags, p.brand, p.state_origin,
             p.rating, p.reviews_count, p.created_at, p.updated_at,
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
           WHERE p.id = $1
           GROUP BY p.id`,
          [id]
        );

        if (result.rows.length > 0) {
          return NextResponse.json({ product: result.rows[0] });
        }
      } catch (err: any) {
        console.warn('[Product GET] RDS failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();
    const { data: prodData, error } = await sb
      .from('products')
      .select('*, product_variants(*)')
      .eq('id', id)
      .maybeSingle();

    if (error || !prodData) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product: prodData });
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

    if (isPgConfigured) {
      try {
        await withTransaction(async (client) => {
          await client.query(
            `UPDATE products
             SET name = COALESCE($1, name),
                 category = COALESCE($2, category),
                 description = COALESCE($3, description),
                 image_url = COALESCE($4, image_url),
                 is_freshness_guarantee = COALESCE($5, is_freshness_guarantee),
                 is_active = COALESCE($6, is_active),
                 updated_at = now()
             WHERE id = $7`,
            [name, category, description, image_url, is_freshness_guarantee, is_active, id]
          );

          if (variants && Array.isArray(variants)) {
            for (const v of variants) {
              if (v.id && isValidUUID(v.id)) {
                await client.query(
                  `UPDATE product_variants
                   SET weight = $1, price = $2, cost_price = $3, original_price = $4, stock = $5, updated_at = now()
                   WHERE id = $6 AND product_id = $7`,
                  [v.weight, v.price, v.cost_price || 0, v.original_price || null, v.stock || 100, v.id, id]
                );
              } else {
                await client.query(
                  `INSERT INTO product_variants (product_id, weight, price, cost_price, original_price, stock)
                   VALUES ($1, $2, $3, $4, $5, $6)`,
                  [id, v.weight, v.price, v.cost_price || 0, v.original_price || null, v.stock || 100]
                );
              }
            }
          }
        });

        await invalidateProductsCache();
        return NextResponse.json({ success: true });
      } catch (err: any) {
        console.warn('[Product PUT] RDS failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();
    await sb
      .from('products')
      .update({
        name,
        category,
        description,
        image_url,
        is_freshness_guarantee,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (variants && Array.isArray(variants)) {
      for (const v of variants) {
        if (v.id) {
          await sb
            .from('product_variants')
            .update({
              weight: v.weight,
              price: v.price,
              cost_price: v.cost_price || 0,
              original_price: v.original_price || null,
              stock: v.stock || 100,
              updated_at: new Date().toISOString(),
            })
            .eq('id', v.id);
        } else {
          await sb.from('product_variants').insert({
            product_id: id,
            weight: v.weight,
            price: v.price,
            cost_price: v.cost_price || 0,
            original_price: v.original_price || null,
            stock: v.stock || 100,
          });
        }
      }
    }

    await invalidateProductsCache();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Product PUT] Error:', error.message);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
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

    if (isPgConfigured) {
      try {
        await query('UPDATE products SET is_active = false, updated_at = now() WHERE id = $1', [id]);
        await invalidateProductsCache();
        return NextResponse.json({ success: true, message: 'Product archived' });
      } catch (err: any) {
        console.warn('[Product DELETE] RDS failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();
    await sb.from('products').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id);
    await invalidateProductsCache();
    return NextResponse.json({ success: true, message: 'Product archived' });
  } catch (error: any) {
    console.error('[Product DELETE] Error:', error.message);
    return NextResponse.json({ error: 'Failed to archive product' }, { status: 500 });
  }
}
