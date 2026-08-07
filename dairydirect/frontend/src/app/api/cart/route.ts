/**
 * GET/POST/PUT/DELETE /api/cart
 * Cart management with AWS PostgreSQL + Supabase Fallback.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, isPgConfigured } from '@/lib/aws/rds';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { isValidUUID } from '@/lib/security/sanitize';
import { getAdminSupabase } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const auth = await getAuthUser(request);
    if (!auth || auth.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isPgConfigured) {
      try {
        const result = await query(
          `SELECT 
             ci.id, ci.user_id, ci.product_id, ci.variant_id, ci.quantity, ci.created_at,
             json_build_object(
               'id', p.id, 'name', p.name, 'category', p.category,
               'image_url', p.image_url, 'is_active', p.is_active
             ) as products,
             json_build_object(
               'id', pv.id, 'weight', pv.weight, 'price', pv.price,
               'original_price', pv.original_price, 'stock', pv.stock,
               'is_available', (pv.stock > 0)
             ) as product_variants
           FROM cart_items ci
           JOIN products p ON p.id = ci.product_id
           JOIN product_variants pv ON pv.id = ci.variant_id
           WHERE ci.user_id = $1
           ORDER BY ci.created_at ASC`,
          [userId]
        );

        return NextResponse.json({ cart: result.rows });
      } catch (err: any) {
        console.warn('[Cart GET] RDS failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();
    const { data, error } = await sb
      .from('cart_items')
      .select('*, products(*), product_variants(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ cart: [] });
    }

    return NextResponse.json({ cart: data || [] });
  } catch (error: any) {
    console.error('[Cart GET] Error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { userId, productId, variantId, quantity } = body;

    if (auth.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (!isValidUUID(productId) || !isValidUUID(variantId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const qty = Math.max(1, Math.min(100, parseInt(quantity) || 1));

    if (isPgConfigured) {
      try {
        await query(
          `INSERT INTO cart_items (user_id, product_id, variant_id, quantity)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, product_id, variant_id) 
           DO UPDATE SET quantity = cart_items.quantity + $4, updated_at = now()`,
          [userId, productId, variantId, qty]
        );

        return NextResponse.json({ success: true });
      } catch (err: any) {
        console.warn('[Cart POST] RDS failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();
    const { data: existing } = await sb
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('variant_id', variantId)
      .maybeSingle();

    if (existing) {
      await sb
        .from('cart_items')
        .update({ quantity: existing.quantity + qty, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await sb.from('cart_items').insert({
        user_id: userId,
        product_id: productId,
        variant_id: variantId,
        quantity: qty,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Cart POST] Error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { userId, productId, variantId, quantity } = body;

    if (auth.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (isPgConfigured) {
      try {
        if (quantity <= 0) {
          await query(
            'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2 AND variant_id = $3',
            [userId, productId, variantId]
          );
        } else {
          const qty = Math.min(100, parseInt(quantity) || 1);
          await query(
            'UPDATE cart_items SET quantity = $1, updated_at = now() WHERE user_id = $2 AND product_id = $3 AND variant_id = $4',
            [qty, userId, productId, variantId]
          );
        }
        return NextResponse.json({ success: true });
      } catch (err: any) {
        console.warn('[Cart PUT] RDS failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();
    if (quantity <= 0) {
      await sb.from('cart_items').delete().eq('user_id', userId).eq('product_id', productId).eq('variant_id', variantId);
    } else {
      const qty = Math.min(100, parseInt(quantity) || 1);
      await sb
        .from('cart_items')
        .update({ quantity: qty, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('product_id', productId)
        .eq('variant_id', variantId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Cart PUT] Error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const productId = searchParams.get('productId');
    const variantId = searchParams.get('variantId');
    const clearAll = searchParams.get('clearAll') === 'true';

    if (auth.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (isPgConfigured) {
      try {
        if (clearAll) {
          await query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
        } else if (productId && variantId) {
          await query(
            'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2 AND variant_id = $3',
            [userId, productId, variantId]
          );
        }
        return NextResponse.json({ success: true });
      } catch (err: any) {
        console.warn('[Cart DELETE] RDS failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();
    if (clearAll) {
      await sb.from('cart_items').delete().eq('user_id', userId);
    } else if (productId && variantId) {
      await sb.from('cart_items').delete().eq('user_id', userId).eq('product_id', productId).eq('variant_id', variantId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Cart DELETE] Error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}