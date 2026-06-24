import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getAuthUser } from '@/lib/api/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const auth = await getAuthUser(request);
    const isAdmin = auth?.isAdmin ?? false;

    let query = supabaseAdmin
      .from('products')
      .select('*, product_variants(*)')
      .order('created_at', { ascending: false });

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

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!auth.isAdmin) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { name, category, description, image_url, is_freshness_guarantee, variants } = body;

    const { data: settings } = await supabaseAdmin
      .from('business_settings')
      .select('min_profit_margin_percent')
      .single();
    
    const minMargin = settings?.min_profit_margin_percent || 20;

    if (variants && variants.length > 0) {
      for (const v of variants) {
        const cost = v.cost_price || 0;
        const selling = v.price || 0;
        if (cost <= 0) {
          return NextResponse.json({ error: `Cost price must be greater than 0 for variant ${v.weight}` }, { status: 400 });
        }
        const minSelling = cost * (1 + minMargin / 100);
        if (selling < minSelling) {
          return NextResponse.json({ 
            error: `Selling price for ${v.weight} must be at least ₹${minSelling.toFixed(2)} (Min ${minMargin}% margin)` 
          }, { status: 400 });
        }
      }
    }

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
            cost_price: v.cost_price,
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