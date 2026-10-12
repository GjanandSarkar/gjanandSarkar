/**
 * GET / POST / PUT / DELETE /api/sellers/products
 * Dedicated seller product management API using seller_product_approval staging table.
 * 
 * Workflow:
 * 1. Seller submits new product -> saved in `seller_product_approval` with status 'pending'.
 *    NOT inserted into `products` or `seller_product`.
 * 2. Admin approves product -> atomic function `approve_seller_product` inserts into `products` + `seller_product`.
 * 3. Admin rejects product -> atomic function `reject_seller_product` stores into `seller_product_rejected`.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { revalidateInventory } from '@/lib/inventory/cache-invalidation';

export const dynamic = 'force-dynamic';

// ─── GET /api/sellers/products ──────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedSellerId = searchParams.get('sellerId');
    const category = searchParams.get('category');
    const status = searchParams.get('status'); // 'all' | 'pending' | 'approved' | 'rejected'

    const sb = getAdminSupabase();

    // Determine target seller
    let sellerId: string | null = null;
    let sellerStore: any = null;

    if (auth.isAdmin && requestedSellerId) {
      const { data: store } = await sb
        .from('sellers')
        .select('*')
        .or(`id.eq.${requestedSellerId},user_id.eq.${requestedSellerId}`)
        .maybeSingle();
      sellerId = store?.id || requestedSellerId;
      sellerStore = store;
    } else {
      let { data: store } = await sb
        .from('sellers')
        .select('*')
        .eq('user_id', auth.userId)
        .maybeSingle();

      if (!store && (auth.email || auth.phone)) {
        const { data: inquiry } = await sb
          .from('seller_inquiries')
          .select('*, sellers(*)')
          .or(`user_id.eq.${auth.userId},email.eq.${auth.email || ''},phone.eq.${auth.phone || ''}`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (inquiry?.sellers) {
          store = Array.isArray(inquiry.sellers) ? inquiry.sellers[0] : inquiry.sellers;
        }
      }

      sellerId = store?.id || null;
      sellerStore = store;
    }

    // 1. Fetch pending & rejected submissions from seller_product_approval
    let approvalQuery = sb
      .from('seller_product_approval')
      .select('*')
      .order('created_at', { ascending: false });

    if (sellerId) {
      approvalQuery = approvalQuery.or(`seller_id.eq.${sellerId},seller_user_id.eq.${auth.userId}`);
    } else {
      approvalQuery = approvalQuery.eq('seller_user_id', auth.userId);
    }

    const { data: approvalRequests, error: appErr } = await approvalQuery;
    if (appErr) {
      console.warn('[SellerProducts GET] Approval table query warning:', appErr.message);
    }

    // 2. Fetch live approved products from products table
    let prodQuery = sb
      .from('products')
      .select('*, product_variants(*)')
      .order('created_at', { ascending: false });

    if (sellerId) {
      prodQuery = prodQuery.or(`seller_id.eq.${sellerId},created_by.eq.${auth.userId}`);
    } else {
      prodQuery = prodQuery.eq('created_by', auth.userId);
    }

    if (category && category !== 'All' && category !== 'All Categories') {
      prodQuery = prodQuery.ilike('category', `%${category}%`);
    }

    const { data: liveProducts, error: prodErr } = await prodQuery;
    if (prodErr) {
      console.error('[SellerProducts GET] Products query error:', prodErr.message);
    }

    // 3. Map approval requests into product format for Seller Dashboard
    const formattedSubmissions = (approvalRequests || [])
      .filter((r: any) => r.status === 'pending' || r.status === 'rejected')
      .map((r: any) => ({
        id: r.id,
        approval_id: r.id,
        name: r.name,
        category: r.category,
        subcategory: r.subcategory,
        description: r.description,
        brand: r.brand,
        sku: r.sku,
        image_url: r.image_url,
        gallery_images: r.gallery_images || [],
        approval_status: r.status, // 'pending' | 'rejected'
        is_approved: Boolean(r.is_approved),
        is_rejected: Boolean(r.is_rejected),
        rejection_reason: r.rejection_reason || r.admin_notes || null,
        is_active: false,
        created_at: r.created_at,
        updated_at: r.updated_at,
        reviewed_at: r.reviewed_at,
        tax_rate: r.tax_rate,
        shipping_details: r.shipping_details,
        return_policy: r.return_policy,
        attributes: r.attributes,
        compliance_documents: r.compliance_documents,
        product_variants: [
          {
            id: 'v-' + r.id,
            weight: r.weight || 'Standard',
            price: r.price,
            original_price: r.original_price,
            compare_at_price: r.original_price,
            stock: r.stock,
          },
        ],
      }));

    // 4. Format live products
    const formattedLive = (liveProducts || []).map((p: any) => ({
      ...p,
      approval_status: 'approved',
      is_active: p.is_active ?? true,
    }));

    // Merge: unapproved submissions + live products
    let allProducts = [...formattedSubmissions, ...formattedLive];

    if (status && status !== 'all') {
      allProducts = allProducts.filter((p: any) => p.approval_status === status);
    }

    return NextResponse.json({
      sellerProducts: allProducts,
      products: allProducts,
      store: sellerStore,
    });
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
      return NextResponse.json({ error: 'Unauthorized: Please log in' }, { status: 401 });
    }

    const sb = getAdminSupabase();

    // 1. Verify seller is active
    let sellerStore: any = null;
    if (auth.isAdmin) {
      const { data: adminStore } = await sb
        .from('sellers')
        .select('*')
        .limit(1)
        .maybeSingle();
      sellerStore = adminStore;
    } else {
      let { data: store } = await sb
        .from('sellers')
        .select('*')
        .eq('user_id', auth.userId)
        .maybeSingle();

      // Fallback 1: If not in sellers table, check if seller inquiry was approved
      if (!store) {
        const { data: approvedInquiry } = await sb
          .from('seller_inquiries')
          .select('*')
          .eq('user_id', auth.userId)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (approvedInquiry) {
          const autoSlug = (approvedInquiry.business_name || 'seller')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-') + '-' + auth.userId.slice(0, 4);

          const { data: newStore } = await sb
            .from('sellers')
            .insert({
              user_id: auth.userId,
              store_name: approvedInquiry.business_name || 'Seller Store',
              slug: autoSlug,
              state: approvedInquiry.state || 'Gujarat',
              category: approvedInquiry.category || 'Dairy',
              status: 'active',
            })
            .select('*')
            .maybeSingle();

          if (newStore) store = newStore;
        }
      }

      // Fallback 2: Check by phone or email if user_id changed
      if (!store && (auth.phone || auth.email)) {
        const { data: storeByInquiry } = await sb
          .from('seller_inquiries')
          .select('*, sellers(*)')
          .or(`email.eq.${auth.email || ''},phone.eq.${auth.phone || ''}`)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (storeByInquiry?.sellers) {
          store = Array.isArray(storeByInquiry.sellers) ? storeByInquiry.sellers[0] : storeByInquiry.sellers;
        }
      }

      // Fallback 3: If user profile role is 'seller', auto-provision store if missing
      if (!store && auth.role === 'seller') {
        const { data: profile } = await sb
          .from('profiles')
          .select('full_name, email, phone')
          .eq('id', auth.userId)
          .maybeSingle();

        const storeName = profile?.full_name ? `${profile.full_name}'s Store` : 'Gjanand Seller Store';
        const autoSlug = `store-${auth.userId.slice(0, 8)}`;

        const { data: autoStore } = await sb
          .from('sellers')
          .insert({
            user_id: auth.userId,
            store_name: storeName,
            slug: autoSlug,
            state: 'Gujarat',
            category: 'Dairy',
            status: 'active',
          })
          .select('*')
          .maybeSingle();

        if (autoStore) store = autoStore;
      }

      if (!store) {
        return NextResponse.json(
          { error: 'You do not have an active seller account. Please submit a seller application first.' },
          { status: 403 }
        );
      }

      // If store is not active but user has seller role, auto-activate it
      if (store.status !== 'active') {
        if (auth.role === 'seller') {
          await sb.from('sellers').update({ status: 'active' }).eq('id', store.id);
          store.status = 'active';
        } else {
          return NextResponse.json(
            {
              error: `Your seller account is currently '${store.status}'. Only approved and active sellers can submit new products.`,
            },
            { status: 403 }
          );
        }
      }
      sellerStore = store;
    }

    const body = await request.json();
    const {
      name,
      category,
      subcategory,
      description,
      brand,
      price,
      originalPrice,
      costPrice,
      weight,
      stock,
      imageUrl,
      galleryImages,
      sku,
      taxRate,
      shippingDetails,
      returnPolicy,
      attributes,
      complianceDocuments,
    } = body;

    if (!name?.trim() || !category?.trim()) {
      return NextResponse.json({ error: 'Product name and category are required.' }, { status: 400 });
    }

    const numPrice = Number(price) || 0;
    if (numPrice <= 0) {
      return NextResponse.json({ error: 'Please enter a valid selling price greater than zero.' }, { status: 400 });
    }

    const autoSku = sku?.trim() || `SKU-${category.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    // 2. Save into seller_product_approval table with status 'pending'
    // DO NOT insert into `products` or `seller_product`
    const approvalPayload = {
      seller_id: sellerStore?.id || null,
      seller_user_id: auth.userId,
      name: name.trim(),
      category: category.trim(),
      subcategory: subcategory?.trim() || null,
      description: description?.trim() || null,
      brand: brand?.trim() || sellerStore?.store_name || 'Gjanand Farm Organics',
      sku: autoSku,
      price: numPrice,
      original_price: originalPrice ? Number(originalPrice) : null,
      cost_price: costPrice ? Number(costPrice) : 0,
      stock: Math.max(0, Number(stock) || 0),
      weight: weight?.trim() || 'Standard',
      image_url: imageUrl || null,
      gallery_images: Array.isArray(galleryImages) ? galleryImages : [],
      tax_rate: taxRate !== undefined ? Number(taxRate) : 0.0,
      shipping_details: shippingDetails?.trim() || null,
      return_policy: returnPolicy?.trim() || null,
      attributes: typeof attributes === 'object' && attributes !== null ? attributes : {},
      compliance_documents: Array.isArray(complianceDocuments) ? complianceDocuments : [],
      status: 'pending',
      is_approved: false,
      is_rejected: false,
      rejection_reason: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdRequest, error: insertErr } = await sb
      .from('seller_product_approval')
      .insert(approvalPayload)
      .select('*')
      .single();

    if (insertErr || !createdRequest) {
      console.error('[SellerProducts POST] seller_product_approval insert error:', insertErr?.message);
      return NextResponse.json({ error: insertErr?.message || 'Failed to submit product approval request' }, { status: 500 });
    }

    // 3. Notify Admins about the new product approval request
    try {
      const { data: admins } = await sb.from('profiles').select('id').eq('role', 'admin');
      if (admins && admins.length > 0) {
        const notifs = admins.map((a: { id: string }) => ({
          user_id: a.id,
          role_target: 'admin',
          title: 'New Product Awaiting Review',
          message: `Seller "${sellerStore?.store_name}" submitted product "${name.trim()}" for review.`,
          type: 'system',
          related_id: createdRequest.id,
        }));
        await sb.from('notifications').insert(notifs);
      }
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Product submitted successfully and is awaiting admin approval.',
      approvalRequest: createdRequest,
      product: {
        id: createdRequest.id,
        ...createdRequest,
        approval_status: 'pending',
        is_active: false,
        product_variants: [
          {
            id: 'v-' + createdRequest.id,
            weight: createdRequest.weight,
            price: createdRequest.price,
            stock: createdRequest.stock,
          },
        ],
      },
    });
  } catch (error: any) {
    console.error('[SellerProducts POST] Error:', error.message);
    return NextResponse.json({ error: 'Failed to submit product' }, { status: 500 });
  }
}

// ─── PUT /api/sellers/products ──────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Unauthorized: Please log in' }, { status: 401 });
    }

    const sb = getAdminSupabase();
    const body = await request.json();
    const { id, price, stock, name, category, description, imageUrl, galleryImages, ...rest } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Check if ID is in seller_product_approval (resubmitting a rejected submission)
    const { data: existingApproval } = await sb
      .from('seller_product_approval')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (existingApproval) {
      // Seller is updating/resubmitting their approval request
      const updatePayload: any = {
        updated_at: new Date().toISOString(),
        status: 'pending', // reset to pending for review
        is_approved: false,
        is_rejected: false,
        rejection_reason: null,
        admin_notes: null,
        reviewed_by: null,
        reviewed_at: null,
      };

      if (name) updatePayload.name = name.trim();
      if (category) updatePayload.category = category.trim();
      if (description !== undefined) updatePayload.description = description?.trim();
      if (price !== undefined) updatePayload.price = Number(price);
      if (stock !== undefined) updatePayload.stock = Number(stock);
      if (imageUrl) updatePayload.image_url = imageUrl;
      if (galleryImages) updatePayload.gallery_images = galleryImages;

      const { data: updatedApproval, error: updateErr } = await sb
        .from('seller_product_approval')
        .update(updatePayload)
        .eq('id', id)
        .select('*')
        .single();

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Product submission updated and resubmitted for admin review.',
        product: updatedApproval,
      });
    }

    // Otherwise, check if ID is an approved live product in products table
    const { data: existingProd, error: fetchErr } = await sb
      .from('products')
      .select('*, sellers:seller_id(*)')
      .eq('id', id)
      .single();

    if (fetchErr || !existingProd) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verify ownership
    const isOwner =
      auth.isAdmin ||
      existingProd.created_by === auth.userId ||
      (existingProd.sellers as any)?.user_id === auth.userId;

    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden: You do not own this product' }, { status: 403 });
    }

    // Permitted updates on approved products: price and stock
    if (price !== undefined || stock !== undefined) {
      const updateData: any = {};
      if (price !== undefined) updateData.price = Number(price);
      if (stock !== undefined) updateData.stock = Number(stock);

      // Update product_variants
      await sb
        .from('product_variants')
        .update(updateData)
        .eq('product_id', id);

      // Update seller_product
      await sb
        .from('seller_product')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('product_id', id);

      await revalidateInventory({ productId: id });
    }

    // Significant changes (name, category, description) on live products
    // require re-approval -> submit to seller_product_approval
    if (name && name !== existingProd.name) {
      await sb.from('seller_product_approval').insert({
        seller_id: existingProd.seller_id,
        seller_user_id: auth.userId,
        product_id: existingProd.id,
        name: name.trim(),
        category: category?.trim() || existingProd.category,
        description: description || existingProd.description,
        price: price !== undefined ? Number(price) : 0,
        stock: stock !== undefined ? Number(stock) : 0,
        image_url: imageUrl || existingProd.image_url,
        status: 'pending',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully.',
    });
  } catch (error: any) {
    console.error('[SellerProducts PUT] Error:', error.message);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}
