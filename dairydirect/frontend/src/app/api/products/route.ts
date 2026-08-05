import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { getAuthUser } from '@/lib/api/auth-middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    let query = supabaseAdmin
      .from('products')
      .select('*, product_variants(*)')
      .order('created_at', { ascending: false });

    if (category && category !== 'All' && category !== 'All Categories') {
      // Clean category slug if any (e.g. home-kitchen -> home kitchen)
      const cleanCat = category.replace(/-/g, ' ').trim();
      if (cleanCat.toLowerCase() === 'dairy & essentials' || cleanCat.toLowerCase() === 'dairy') {
        query = query.or('category.ilike.%Milk%,category.ilike.%Ghee%,category.ilike.%Paneer%,category.ilike.%Curd%,category.ilike.%Lassi%,category.ilike.%Dairy%');
      } else {
        query = query.ilike('category', `%${cleanCat}%`);
      }
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('getProducts error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { products: data },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
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
        const cost = Number(v.cost_price) || 0;
        const selling = Number(v.price) || 0;
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
            price: Number(v.price),
            cost_price: Number(v.cost_price) || 0,
            original_price: v.original_price ? Number(v.original_price) : null,
            stock: Number(v.stock) || 0,
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

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!auth.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, category, description, image_url, is_freshness_guarantee, is_active, variants } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const { data: settings } = await supabaseAdmin
      .from('business_settings')
      .select('min_profit_margin_percent')
      .single();

    const minMargin = settings?.min_profit_margin_percent || 20;

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
            {
              error: `Selling price for "${v.weight}" must be at least ₹${minSelling.toFixed(2)} (Minimum ${minMargin}% margin)`,
            },
            { status: 400 }
          );
        }
      }
    }

    const productUpdatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) productUpdatePayload.name = name;
    if (category !== undefined) productUpdatePayload.category = category;
    if (description !== undefined) productUpdatePayload.description = description;
    if (image_url !== undefined) productUpdatePayload.image_url = image_url;
    if (is_freshness_guarantee !== undefined) productUpdatePayload.is_freshness_guarantee = is_freshness_guarantee;
    if (is_active !== undefined) productUpdatePayload.is_active = is_active;

    const { error: productError } = await supabaseAdmin
      .from('products')
      .update(productUpdatePayload)
      .eq('id', id);

    if (productError) {
      return NextResponse.json({ error: productError.message }, { status: 500 });
    }

    if (variants && Array.isArray(variants)) {
      const { data: existingVariants } = await supabaseAdmin
        .from('product_variants')
        .select('id')
        .eq('product_id', id);

      const existingIds = (existingVariants || []).map((ev) => ev.id);
      const incomingIds = variants.filter((v: any) => v.id).map((v: any) => v.id);
      const toDeleteIds = existingIds.filter((evId) => !incomingIds.includes(evId));

      for (const delId of toDeleteIds) {
        const { data: orderRefs } = await supabaseAdmin
          .from('order_items')
          .select('id')
          .eq('variant_id', delId)
          .limit(1);

        const { data: subRefs } = await supabaseAdmin
          .from('subscriptions')
          .select('id')
          .eq('variant_id', delId)
          .limit(1);

        if ((orderRefs && orderRefs.length > 0) || (subRefs && subRefs.length > 0)) {
          await supabaseAdmin
            .from('product_variants')
            .update({ stock: 0 })
            .eq('id', delId);
        } else {
          await supabaseAdmin.from('cart_items').delete().eq('variant_id', delId);
          await supabaseAdmin.from('product_variants').delete().eq('id', delId);
        }
      }

      for (const v of variants) {
        if (v.id && existingIds.includes(v.id)) {
          await supabaseAdmin
            .from('product_variants')
            .update({
              weight: v.weight,
              price: Number(v.price),
              cost_price: Number(v.cost_price),
              original_price: v.original_price ? Number(v.original_price) : null,
              stock: v.stock !== undefined ? parseInt(v.stock, 10) || 0 : 0,
            })
            .eq('id', v.id);
        } else {
          await supabaseAdmin.from('product_variants').insert({
            product_id: id,
            weight: v.weight,
            price: Number(v.price),
            cost_price: Number(v.cost_price),
            original_price: v.original_price ? Number(v.original_price) : null,
            stock: v.stock !== undefined ? parseInt(v.stock, 10) || 0 : 0,
          });
        }
      }
    }

    const { data: updatedProduct } = await supabaseAdmin
      .from('products')
      .select('*, product_variants(*)')
      .eq('id', id)
      .single();

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error: any) {
    console.error('Products PUT error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!auth.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const permanent = searchParams.get('permanent') === 'true';

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const { data: orderRefs } = await supabaseAdmin
      .from('order_items')
      .select('id')
      .eq('product_id', id)
      .limit(1);

    const { data: subRefs } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('product_id', id)
      .limit(1);

    const isReferenced = (orderRefs && orderRefs.length > 0) || (subRefs && subRefs.length > 0);

    if (permanent && !isReferenced) {
      await supabaseAdmin.from('cart_items').delete().eq('product_id', id);
      await supabaseAdmin.from('product_variants').delete().eq('product_id', id);
      const { error: deleteError } = await supabaseAdmin.from('products').delete().eq('id', id);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        permanent: true,
        message: 'Product permanently removed from catalogue.',
      });
    }

    const { error: updateError } = await supabaseAdmin
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    await supabaseAdmin.from('cart_items').delete().eq('product_id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      softDeleted: true,
      message: isReferenced
        ? 'Product was archived and deactivated because it has existing order/subscription history.'
        : 'Product deactivated and removed from storefront.',
    });
  } catch (error: any) {
    console.error('Products DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}