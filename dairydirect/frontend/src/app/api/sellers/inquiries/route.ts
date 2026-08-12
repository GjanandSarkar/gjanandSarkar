import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

/**
 * GET /api/sellers/inquiries
 * Fetches real seller inquiries from Supabase seller_inquiries table.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const userId = searchParams.get('userId');

  try {
    let query = supabaseAdmin
      .from('seller_inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching seller inquiries from Supabase:', error.message);
      return NextResponse.json({ success: false, error: error.message, inquiries: [] }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      inquiries: data || [],
    });
  } catch (err: any) {
    console.error('Unexpected error in GET /api/sellers/inquiries:', err);
    return NextResponse.json({ success: false, error: err.message, inquiries: [] }, { status: 500 });
  }
}

/**
 * POST /api/sellers/inquiries
 * Submits a real seller onboarding inquiry directly into Supabase.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      fullName,
      businessName,
      phone,
      email,
      city,
      state,
      category,
      productRange,
      monthlyVolume,
      gstin,
      fssaiNumber,
      notes,
    } = body;

    if (!fullName?.trim() || !businessName?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { error: 'Please provide full name, business name, and phone number' },
        { status: 400 }
      );
    }

    const inquiryRecord = {
      user_id: userId || null,
      full_name: fullName.trim(),
      business_name: businessName.trim(),
      phone: phone.trim(),
      email: email ? email.trim().toLowerCase() : null,
      city: city ? city.trim() : null,
      state: state || 'Gujarat',
      category: category || 'A2 Dairy & Vedic Ghee',
      product_range: productRange ? productRange.trim() : null,
      monthly_volume: monthlyVolume ? monthlyVolume.trim() : null,
      gstin: gstin ? gstin.trim().toUpperCase() : null,
      fssai_number: fssaiNumber ? fssaiNumber.trim() : null,
      notes: notes ? notes.trim() : null,
      status: 'pending',
      admin_notes: null,
      updated_at: new Date().toISOString(),
    };

    // Insert into Supabase seller_inquiries table
    const { data, error } = await supabaseAdmin
      .from('seller_inquiries')
      .insert([inquiryRecord])
      .select()
      .single();

    if (error) {
      console.error('Supabase seller_inquiries insert error:', error.message);
      return NextResponse.json(
        { error: `Database insert failed: ${error.message}` },
        { status: 500 }
      );
    }

    // Attempt to create an admin notification in notifications table (if table exists)
    try {
      await supabaseAdmin.from('notifications').insert([
        {
          role_target: 'admin',
          title: 'New Seller Inquiry',
          message: `${businessName.trim()} (${fullName.trim()}) from ${state || 'Gujarat'} applied to become a seller.`,
          type: 'alert',
          related_id: data.id,
          is_read: false,
        },
      ]);
    } catch (notifErr) {
      // Non-critical, ignore notification error
      console.warn('Admin notification for seller inquiry skipped:', notifErr);
    }

    // Also reserve store in sellers table if userId is present
    if (userId) {
      try {
        const slug = businessName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        await supabaseAdmin.from('sellers').upsert({
          user_id: userId,
          store_name: businessName.trim(),
          slug: `${slug}-${Math.floor(1000 + Math.random() * 9000)}`,
          state: state || 'Gujarat',
          category: category || 'General',
          description: notes || productRange || 'Seller inquiry submitted - Pending manual review',
          plan: 'growth',
          commission_rate: 5.0,
          status: 'pending_inquiry',
          gstin: gstin ? gstin.trim().toUpperCase() : null,
          fssai_number: fssaiNumber ? fssaiNumber.trim() : null,
        });
      } catch (sellerErr) {
        console.warn('Sellers table pending reservation notice:', sellerErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Seller inquiry received successfully. Our onboarding team will contact you within 24-48 hours.',
      inquiry: data,
    });
  } catch (err: any) {
    console.error('Unexpected error in POST /api/sellers/inquiries:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/sellers/inquiries
 * Updates the verification status or internal admin notes of a seller inquiry in Supabase.
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, adminNotes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Inquiry ID and new status are required' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (adminNotes !== undefined) {
      updatePayload.admin_notes = adminNotes;
    }

    const { data: updatedInquiry, error } = await supabaseAdmin
      .from('seller_inquiries')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update seller inquiry in Supabase:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If status is 'approved', elevate user role to 'seller' and activate store
    if (status === 'approved' && updatedInquiry?.user_id) {
      try {
        await supabaseAdmin
          .from('profiles')
          .update({ role: 'seller' })
          .eq('id', updatedInquiry.user_id);

        const slug = updatedInquiry.business_name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        await supabaseAdmin.from('sellers').upsert({
          user_id: updatedInquiry.user_id,
          store_name: updatedInquiry.business_name,
          slug,
          state: updatedInquiry.state || 'Gujarat',
          category: updatedInquiry.category || 'A2 Dairy & Vedic Ghee',
          description: updatedInquiry.notes || updatedInquiry.product_range || '',
          plan: 'growth',
          commission_rate: 5.0,
          status: 'active',
          gstin: updatedInquiry.gstin || null,
          fssai_number: updatedInquiry.fssai_number || null,
        });

        // Notify user of approval
        await supabaseAdmin.from('notifications').insert([
          {
            user_id: updatedInquiry.user_id,
            role_target: 'seller',
            title: 'Seller Application Approved!',
            message: `Congratulations! Your inquiry for ${updatedInquiry.business_name} has been approved. You can now access your Seller Dashboard.`,
            type: 'system',
            related_id: updatedInquiry.id,
            is_read: false,
          },
        ]);
      } catch (provisionErr) {
        console.warn('Auto provision seller on approval warning:', provisionErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Inquiry status updated to ${status}`,
      inquiry: updatedInquiry,
    });
  } catch (err: any) {
    console.error('Unexpected error in PATCH /api/sellers/inquiries:', err);
    return NextResponse.json({ error: err.message || 'Failed to update inquiry' }, { status: 500 });
  }
}

/**
 * DELETE /api/sellers/inquiries
 * Deletes a seller inquiry directly from Supabase.
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json({ error: 'Inquiry ID is required to delete' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('seller_inquiries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting inquiry from Supabase:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Inquiry deleted successfully',
      id,
    });
  } catch (err: any) {
    console.error('Unexpected error in DELETE /api/sellers/inquiries:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete inquiry' }, { status: 500 });
  }
}

