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

async function fetchProductDetails(id: string): Promise<any> {
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
        return result.rows[0];
      }
    } catch (err: any) {
      console.warn('[fetchProductDetails] RDS failed, fallback to Supabase:', err.message);
    }
  }

  const sb = getAdminSupabase();
  const { data: prodData, error } = await sb
    .from('products')
    .select('*, product_variants(*)')
    .eq('id', id)
    .maybeSingle();

  if (error || !prodData) {
    return null;
  }

  return prodData;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const product = await fetchProductDetails(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
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
            [
              name !== undefined ? name : null,
              category !== undefined ? category : null,
              description !== undefined ? description : null,
              image_url !== undefined ? image_url : null,
              is_freshness_guarantee !== undefined ? is_freshness_guarantee : null,
              is_active !== undefined ? is_active : null,
              id
            ]
          );

          if (variants && Array.isArray(variants)) {
            // Delete variants that were removed in the edit modal
            const incomingIds = variants.map(v => v.id).filter((vid): vid is string => !!vid && isValidUUID(vid));
            if (incomingIds.length > 0) {
              await client.query(
                `DELETE FROM product_variants WHERE product_id = $1 AND id NOT IN (${incomingIds.map((_, i) => `$${i + 2}`).join(',')})`,
                [id, ...incomingIds]
              );
            } else {
              await client.query(`DELETE FROM product_variants WHERE product_id = $1`, [id]);
            }

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
        const updatedProduct = await fetchProductDetails(id);
        return NextResponse.json({ success: true, product: updatedProduct });
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
      // Delete variants that were removed in the edit modal
      const incomingIds = variants.map(v => v.id).filter((vid): vid is string => !!vid && isValidUUID(vid));
      if (incomingIds.length > 0) {
        await sb.from('product_variants').delete().eq('product_id', id).not('id', 'in', `(${incomingIds.join(',')})`);
      } else {
        await sb.from('product_variants').delete().eq('product_id', id);
      }

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

    // Sync updates to seller_product table in Supabase
    const spPayload: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) spPayload.name = name;
    if (category !== undefined) spPayload.category = category;
    if (description !== undefined) spPayload.description = description;
    if (image_url !== undefined) spPayload.image_url = image_url;
    if (is_active !== undefined) spPayload.status = is_active ? 'active' : 'inactive';
    if (variants && variants[0]) {
      if (variants[0].price !== undefined) spPayload.price = variants[0].price;
      if (variants[0].stock !== undefined) spPayload.stock = variants[0].stock;
    }
    try {
      await sb.from('seller_product').update(spPayload).eq('product_id', id);
    } catch (spErr: any) {
      console.warn('[Product PUT] seller_product update warning:', spErr?.message || spErr);
    }

    await invalidateProductsCache();
    const updatedProduct = await fetchProductDetails(id);
    return NextResponse.json({ success: true, product: updatedProduct });
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

    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    if (isPgConfigured) {
      try {
        if (permanent) {
          await withTransaction(async (client) => {
            await client.query('DELETE FROM seller_product WHERE product_id = $1', [id]).catch(() => {});
            await client.query('DELETE FROM product_variants WHERE product_id = $1', [id]);
            await client.query('DELETE FROM products WHERE id = $1', [id]);
          });
          await invalidateProductsCache();
          return NextResponse.json({ success: true, permanent: true, message: 'Product deleted permanently' });
        } else {
          await query('UPDATE products SET is_active = false, updated_at = now() WHERE id = $1', [id]);
          await query("UPDATE seller_product SET status = 'inactive', updated_at = now() WHERE product_id = $1", [id]).catch(() => {});
          await invalidateProductsCache();
          return NextResponse.json({ success: true, softDeleted: true, message: 'Product archived' });
        }
      } catch (err: any) {
        console.warn('[Product DELETE] RDS failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();
    if (permanent) {
      // Delete from seller_product, variants, and products
      try {
        await sb.from('seller_product').delete().eq('product_id', id);
      } catch (spErr: any) {
        console.warn('[Product DELETE] seller_product delete warning:', spErr?.message || spErr);
      }
      await sb.from('product_variants').delete().eq('product_id', id);
      await sb.from('products').delete().eq('id', id);
      await invalidateProductsCache();
      return NextResponse.json({ success: true, permanent: true, message: 'Product deleted permanently' });
    } else {
      await sb.from('products').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', id);
      try {
        await sb.from('seller_product').update({ status: 'inactive', updated_at: new Date().toISOString() }).eq('product_id', id);
      } catch (spErr: any) {
        console.warn('[Product DELETE] seller_product update warning:', spErr?.message || spErr);
      }
      await invalidateProductsCache();
      return NextResponse.json({ success: true, softDeleted: true, message: 'Product archived' });
    }
  } catch (error: any) {
    console.error('[Product DELETE] Error:', error.message);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
