import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

async function verifySession(token: string | null): Promise<string | null> {
  if (!token || token === 'new_user') return null;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');

    const authenticatedUserId = await verifySession(token);
    if (!authenticatedUserId || authenticatedUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('cart_items')
      .select('*, products(*), product_variants(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('getCart error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ cart: data });
  } catch (error) {
    console.error('Cart GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, userId, productId, variantId, quantity } = body;

    const authenticatedUserId = await verifySession(token);
    if (!authenticatedUserId || authenticatedUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: existing } = await supabaseAdmin
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('variant_id', variantId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabaseAdmin
        .from('cart_items')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    const { error } = await supabaseAdmin
      .from('cart_items')
      .insert({
        user_id: userId,
        product_id: productId,
        variant_id: variantId,
        quantity,
      });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cart POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, userId, productId, variantId, quantity } = body;

    const authenticatedUserId = await verifySession(token);
    if (!authenticatedUserId || authenticatedUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (quantity <= 0) {
      const { error } = await supabaseAdmin
        .from('cart_items')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId)
        .eq('variant_id', variantId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    const { error } = await supabaseAdmin
      .from('cart_items')
      .update({ quantity })
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('variant_id', variantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cart PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    const productId = searchParams.get('productId');
    const variantId = searchParams.get('variantId');

    const authenticatedUserId = await verifySession(token);
    if (!authenticatedUserId || authenticatedUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('variant_id', variantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cart DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}