import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import crypto from 'crypto';

function getTokenHash(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function verifySession(token: string | null): Promise<string | null> {
  if (!token || token === 'new_user') return null;
  
  const tokenHash = getTokenHash(token);
  const { data: session } = await supabaseAdmin
    .from('sessions')
    .select('user_id, expires_at')
    .eq('token_hash', tokenHash)
    .single();

  if (!session) return null;
  
  const expiresAt = new Date(session.expires_at);
  if (new Date() > expiresAt) return null;
  
  return session.user_id;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const activeOnly = searchParams.get('activeOnly') !== 'false';
    const token = searchParams.get('token');

    const userId = await verifySession(token);
    const isAdmin = userId ? await checkAdmin(userId) : false;

    let query = supabaseAdmin
      .from('products')
      .select('*, product_variants(*)')
      .order('created_at', { ascending: true });

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('getProducts error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ products: data });
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function checkAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role === 'admin';
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const userId = await verifySession(token);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdminUser = await checkAdmin(userId);
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { name, category, description, image_url, is_freshness_guarantee, variants } = body;

    const { data: productData, error: productError } = await supabaseAdmin
      .from('products')
      .insert({
        name,
        category,
        description,
        image_url,
        is_freshness_guarantee: is_freshness_guarantee ?? false,
        is_active: true,
      })
      .select('id')
      .single();

    if (productError) {
      return NextResponse.json({ error: productError.message }, { status: 500 });
    }

    const productId = productData.id;

    if (variants && variants.length > 0) {
      const { error: variantError } = await supabaseAdmin
        .from('product_variants')
        .insert(
          variants.map((v: any) => ({
            product_id: productId,
            weight: v.weight,
            price: v.price,
            original_price: v.original_price ?? null,
            stock: v.stock ?? 0,
          }))
        );

      if (variantError) {
        console.error('Variant insert error:', variantError);
      }
    }

    return NextResponse.json({ success: true, id: productId });
  } catch (error) {
    console.error('Products POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}