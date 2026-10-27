import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getAuthUser } from '@/lib/api/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const sellerId = searchParams.get('sellerId');
    const status = searchParams.get('status');
    const adminMode = searchParams.get('admin') === 'true';

    const auth = await getAuthUser(request);
    const admin = getAdminSupabase();

    let query = admin
      .from('quality_reports')
      .select(`
        *,
        product:products(id, name, image_url, category)
      `)
      .order('created_at', { ascending: false });

    if (adminMode) {
      if (!auth?.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
      }
      if (status) {
        query = query.eq('status', status);
      }
    } else if (sellerId) {
      if (!auth || (auth.userId !== sellerId && !auth.isAdmin)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      query = query.eq('seller_id', sellerId);
      if (status) query = query.eq('status', status);
    } else if (productId) {
      // Public / customer view: only approved reports unless caller is the seller or admin
      if (auth?.isAdmin) {
        // Admin sees all
      } else if (auth) {
        // Seller can see own reports on this product, or public approved
        query = query.or(`status.eq.approved,seller_id.eq.${auth.userId}`);
      } else {
        query = query.eq('status', 'approved');
      }
      query = query.eq('product_id', productId);
    } else {
      // General customer browse view: all approved reports
      query = query.eq('status', 'approved');
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching quality reports:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reports: data || [] });
  } catch (err: any) {
    console.error('Quality reports GET error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      productId,
      title,
      batchNumber,
      laboratoryName,
      testDate,
      fileUrl,
      fileName,
    } = body;

    if (!productId || !title || !laboratoryName || !testDate || !fileUrl) {
      return NextResponse.json(
        { error: 'Missing required fields (productId, title, laboratoryName, testDate, fileUrl)' },
        { status: 400 }
      );
    }

    const admin = getAdminSupabase();

    // Verify product exists
    const { data: product, error: prodErr } = await admin
      .from('products')
      .select('id, seller_id, name')
      .eq('id', productId)
      .single();

    if (prodErr || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Role check: Admin can upload approved directly. Seller can only upload for their own products.
    let status: 'pending' | 'approved' = 'pending';
    let sellerId = auth.userId;

    if (auth.isAdmin) {
      status = 'approved';
      sellerId = product.seller_id || auth.userId;
    } else {
      // Verify seller owns this product or is authorized
      if (product.seller_id && product.seller_id !== auth.userId) {
        return NextResponse.json(
          { error: 'Forbidden: You do not own this product' },
          { status: 403 }
        );
      }
    }

    const { data, error } = await admin
      .from('quality_reports')
      .insert({
        product_id: productId,
        seller_id: sellerId,
        title: title.trim(),
        batch_number: batchNumber ? batchNumber.trim() : null,
        laboratory_name: laboratoryName.trim(),
        test_date: testDate,
        file_url: fileUrl,
        file_name: fileName || 'Quality-Test-Report.pdf',
        status,
      })
      .select(`
        *,
        product:products(id, name, image_url, category)
      `)
      .single();

    if (error) {
      console.error('Error inserting quality report:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      report: data,
      message:
        status === 'approved'
          ? 'Quality report published successfully.'
          : 'Quality report submitted for admin approval.',
    });
  } catch (err: any) {
    console.error('Quality report POST error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
