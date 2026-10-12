/**
 * GET/POST/DELETE /api/wishlist
 * Wishlist management with AWS PostgreSQL + Supabase Fallback.
 * Flow: Frontend -> API -> Backend -> Database
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, isPgConfigured } from '@/lib/aws/rds';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { isValidUUID } from '@/lib/security/sanitize';
import { getAdminSupabase } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const auth = await getAuthUser(request);
    const userId = searchParams.get('userId') || auth?.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth && !auth.isAdmin && auth.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (isPgConfigured) {
      try {
        const result = await query<{ product_id: string }>(
          `SELECT product_id FROM wishlists WHERE user_id = $1 ORDER BY created_at DESC`,
          [userId]
        );
        return NextResponse.json({ wishlist: result.rows.map((r) => r.product_id) });
      } catch (err: any) {
        console.warn('[Wishlist GET] RDS query failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();
    const { data, error } = await sb
      .from('wishlists')
      .select('product_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ wishlist: [] });
    }

    const productIds = (data || []).map((item: any) => item.product_id).filter(Boolean);
    return NextResponse.json({ wishlist: productIds });
  } catch (error: any) {
    console.error('[Wishlist GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch wishlist', wishlist: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, productId } = body;

    const targetUserId = userId || auth.userId;
    if (!auth.isAdmin && auth.userId !== targetUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!productId || !isValidUUID(productId)) {
      return NextResponse.json({ error: 'Valid product ID required' }, { status: 400 });
    }

    if (isPgConfigured) {
      try {
        const existing = await query(
          `SELECT id FROM wishlists WHERE user_id = $1 AND product_id = $2`,
          [targetUserId, productId]
        );

        if (existing.rows.length > 0) {
          await query(`DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2`, [targetUserId, productId]);
          return NextResponse.json({ success: true, added: false });
        } else {
          await query(`INSERT INTO wishlists (user_id, product_id) VALUES ($1, $2)`, [targetUserId, productId]);
          return NextResponse.json({ success: true, added: true });
        }
      } catch (err: any) {
        console.warn('[Wishlist POST] RDS query failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();
    const { data: existing } = await sb
      .from('wishlists')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('product_id', productId)
      .maybeSingle();

    if (existing) {
      await sb.from('wishlists').delete().eq('user_id', targetUserId).eq('product_id', productId);
      return NextResponse.json({ success: true, added: false });
    } else {
      await sb.from('wishlists').insert({ user_id: targetUserId, product_id: productId });
      return NextResponse.json({ success: true, added: true });
    }
  } catch (error: any) {
    console.error('[Wishlist POST] Error:', error.message);
    return NextResponse.json({ error: 'Failed to update wishlist' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || auth.userId;
    const productId = searchParams.get('productId');

    if (!auth.isAdmin && auth.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!productId || !isValidUUID(productId)) {
      return NextResponse.json({ error: 'Valid product ID required' }, { status: 400 });
    }

    if (isPgConfigured) {
      try {
        await query(`DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2`, [userId, productId]);
        return NextResponse.json({ success: true });
      } catch (err: any) {
        console.warn('[Wishlist DELETE] RDS query failed, fallback to Supabase:', err.message);
      }
    }

    const sb = getAdminSupabase();
    await sb.from('wishlists').delete().eq('user_id', userId).eq('product_id', productId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Wishlist DELETE] Error:', error.message);
    return NextResponse.json({ error: 'Failed to delete from wishlist' }, { status: 500 });
  }
}
