/**
 * GET / POST / PUT / DELETE /api/sellers/products
 * Dedicated seller product listing API interacting directly with Supabase `seller_products` (and `seller_product` view).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { revalidateInventory } from '@/lib/inventory/cache-invalidation';

export const dynamic = 'force-dynamic';

// ─── GET /api/sellers/products ──────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');
    const sellerUserId = searchParams.get('sellerUserId');
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    const sb = getAdminSupabase();
    let query = sb
      .from('seller_product')
      .select('*')
      .order('created_at', { ascending: false });

    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    }
    if (sellerUserId) {
      query = query.eq('seller_user_id', sellerUserId);
    }
    if (category && category !== 'All' && category !== 'All Categories') {
      query = query.ilike('category', `%${category}%`);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: sellerProducts, error } = await query;

    if (error) {
      console.error('[SellerProducts GET] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sellerProducts: sellerProducts || [] });
  } catch (error: any) {
    console.error('[SellerProducts GET] Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch seller products' }, { status: 500 });
  }
}

// ─── POST /api/sellers/products ─────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();

    const {
      sellerId,
      sellerUserId,
      name,
      category,
      description,
      price,
      originalPrice,
      costPrice,
      weight,
      stock,
      imageUrl,
      status,
    } = body;

    if (!name || !category) {
      return NextResponse.json({ error: 'Product name and category are required' }, { status: 400 });
    }

    const sb = getAdminSupabase();

    const isValidUuid = (id: string | null | undefined) => 
      id ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) : false;

    const rawSellerId = sellerId || sellerUserId || auth?.userId || null;
    let validSellerUuid: string | null = null;
    let validSellerUserId: string | null = null;

    if (rawSellerId && isValidUuid(rawSellerId)) {
      const { data: s1 } = await sb.from('sellers').select('id, user_id').eq('id', rawSellerId).maybeSingle();
      if (s1?.id) {
        validSellerUuid = s1.id;
        validSellerUserId = s1.user_id && isValidUuid(s1.user_id) ? s1.user_id : null;
      } else {
        const { data: s2 } = await sb.from('sellers').select('id, user_id').eq('user_id', rawSellerId).maybeSingle();
        if (s2?.id) {
          validSellerUuid = s2.id;
          validSellerUserId = s2.user_id && isValidUuid(s2.user_id) ? s2.user_id : null;
        } else {
          const { data: p1 } = await sb.from('profiles').select('id').eq('id', rawSellerId).maybeSingle();
          if (p1?.id) validSellerUserId = p1.id;
        }
      }
    }

    if (auth?.userId && isValidUuid(auth.userId) && !validSellerUserId) {
      const { data: p2 } = await sb.from('profiles').select('id').eq('id', auth.userId).maybeSingle();
      if (p2?.id) validSellerUserId = p2.id;
    }

    // 1. Create main product in `products` table with seller_id
    const prodPayload: any = {
      name,
      category,
      description: description || null,
      image_url: imageUrl || null,
      is_active: status !== 'inactive',
      created_by: auth?.userId || rawSellerId || null,
    };
    if (validSellerUuid) {
      prodPayload.seller_id = validSellerUuid;
    }

    let prodData: any = null;
    const resProd1 = await sb.from('products').insert(prodPayload).select('id').single();
    if (!resProd1.error && resProd1.data) {
      prodData = resProd1.data;
    } else {
      delete prodPayload.seller_id;
      const resProd2 = await sb.from('products').insert(prodPayload).select('id').single();
      if (resProd2.data) prodData = resProd2.data;
    }

    const productId = prodData?.id || null;

    // 2. Insert into `product_variants`
    if (productId) {
      await sb.from('product_variants').insert({
        product_id: productId,
        weight: weight || '500g',
        price: Number(price) || 0,
        original_price: originalPrice ? Number(originalPrice) : null,
        cost_price: costPrice ? Number(costPrice) : 0,
        stock: Number(stock) || 50,
      });
    }

    // 3. Insert into `seller_product` table
    const sellerProductPayload = {
      seller_id: validSellerUuid,
      seller_user_id: validSellerUserId,
      product_id: productId,
      name,
      category,
      description: description || null,
      price: Number(price) || 0,
      original_price: originalPrice ? Number(originalPrice) : null,
      cost_price: costPrice ? Number(costPrice) : 0,
      weight: weight || '500g',
      stock: Number(stock) || 50,
      image_url: imageUrl || null,
      status: status || 'active',
      is_approved: true,
    };

    const { data: sellerProd, error: sellerProdErr } = await sb
      .from('seller_product')
      .insert(sellerProductPayload)
      .select('*')
      .single();

    if (sellerProdErr) {
      console.error('[SellerProducts POST] Error:', sellerProdErr.message);
      return NextResponse.json({ error: sellerProdErr.message }, { status: 500 });
    }

    if (productId) {
      await revalidateInventory({ productId });
    }

    return NextResponse.json(
      { success: true, sellerProduct: sellerProd, productId },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[SellerProducts POST] Exception:', error.message);
    return NextResponse.json({ error: 'Failed to create seller product' }, { status: 500 });
  }
}

// ─── PUT /api/sellers/products ──────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, category, description, price, originalPrice, costPrice, weight, stock, imageUrl, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const sb = getAdminSupabase();

    // Verify ownership & fetch associated product_id
    const { data: existingProduct } = await sb
      .from('seller_product')
      .select('id, seller_user_id, product_id, stock')
      .eq('id', id)
      .maybeSingle();

    if (!existingProduct) {
      return NextResponse.json({ error: 'Seller product not found' }, { status: 404 });
    }

    if (existingProduct.seller_user_id !== auth.userId && !auth.isAdmin) {
      return NextResponse.json({ error: 'Forbidden: You do not own this product' }, { status: 403 });
    }

    // 1. If stock is updated, update authoritative product_variants row
    if (stock !== undefined && existingProduct.product_id) {
      const newStockNum = Math.max(0, parseInt(String(stock), 10) || 0);

      // Fetch primary variant for this product
      const { data: vList } = await sb
        .from('product_variants')
        .select('id, stock, reserved_quantity, available_quantity')
        .eq('product_id', existingProduct.product_id)
        .order('created_at', { ascending: true })
        .limit(1);

      if (vList && vList.length > 0) {
        const variantId = vList[0].id;
        // Call atomic stock adjustment with audit logging
        const { data: adjRes, error: adjErr } = await sb.rpc('adjust_seller_stock_atomic', {
          p_product_id: existingProduct.product_id,
          p_variant_id: variantId,
          p_new_stock: newStockNum,
          p_actor_id: auth.userId,
          p_reason: 'Seller panel stock adjustment'
        });

        if (adjErr) {
          console.warn('[SellerProducts PUT] adjust_seller_stock_atomic warning:', adjErr.message);
          // Fallback direct update on product_variants
          await sb
            .from('product_variants')
            .update({ stock: newStockNum, updated_at: new Date().toISOString() })
            .eq('id', variantId);
        }
      }
    }

    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) updatePayload.name = name;
    if (category !== undefined) updatePayload.category = category;
    if (description !== undefined) updatePayload.description = description;
    if (price !== undefined) updatePayload.price = Number(price);
    if (originalPrice !== undefined) updatePayload.original_price = originalPrice ? Number(originalPrice) : null;
    if (costPrice !== undefined) updatePayload.cost_price = Number(costPrice);
    if (weight !== undefined) updatePayload.weight = weight;
    if (stock !== undefined) updatePayload.stock = Number(stock);
    if (imageUrl !== undefined) updatePayload.image_url = imageUrl;
    if (status !== undefined) updatePayload.status = status;

    const { data: updated, error } = await sb
      .from('seller_product')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Revalidate customer-facing pages so new stock is immediately visible
    if (existingProduct.product_id) {
      await revalidateInventory({ productId: existingProduct.product_id });
    }

    return NextResponse.json({ success: true, sellerProduct: updated });
  } catch (error: any) {
    console.error('[SellerProducts PUT] Error:', error.message);
    return NextResponse.json({ error: 'Failed to update seller product' }, { status: 500 });
  }
}

// ─── DELETE /api/sellers/products ───────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const sb = getAdminSupabase();

    // Verify ownership
    const { data: existingProduct } = await sb
      .from('seller_product')
      .select('seller_user_id, product_id')
      .eq('id', id)
      .maybeSingle();

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (existingProduct?.seller_user_id !== auth.userId && !auth.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await sb.from('seller_product').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (existingProduct.product_id) {
      await revalidateInventory({ productId: existingProduct.product_id });
    }

    return NextResponse.json({ success: true, message: 'Seller product deleted' });
  } catch (error: any) {
    console.error('[SellerProducts DELETE] Error:', error.message);
    return NextResponse.json({ error: 'Failed to delete seller product' }, { status: 500 });
  }
}
