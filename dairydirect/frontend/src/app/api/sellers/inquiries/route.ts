import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { query, isPgConfigured } from '@/lib/aws/rds';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const userId = searchParams.get('userId');

  try {
    const sb = getAdminSupabase();
    let query = sb.from('seller_inquiries').select('*').order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, inquiries: [] });
    }

    return NextResponse.json({ success: true, inquiries: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch inquiries' }, { status: 500 });
  }
}

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
      notes
    } = body;

    if (!fullName || !businessName || !phone || !email) {
      return NextResponse.json(
        { error: 'Please provide full name, business name, phone number, and email' },
        { status: 400 }
      );
    }

    const sb = getAdminSupabase();
    const newInquiry = {
      user_id: userId || null,
      full_name: fullName.trim(),
      business_name: businessName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      city: city ? city.trim() : '',
      state: state || 'Gujarat',
      category: category || 'A2 Dairy & Ghee',
      product_range: productRange || '',
      monthly_volume: monthlyVolume || '',
      gstin: gstin ? gstin.trim().toUpperCase() : null,
      fssai_number: fssaiNumber ? fssaiNumber.trim() : null,
      notes: notes || '',
      status: 'pending',
    };

    let insertedInquiry = null;

    if (isPgConfigured) {
      try {
        const result = await query(
          `INSERT INTO seller_inquiries (user_id, full_name, business_name, phone, email, city, state, category, product_range, monthly_volume, gstin, fssai_number, notes, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           RETURNING *`,
          [
            newInquiry.user_id, newInquiry.full_name, newInquiry.business_name, newInquiry.phone, newInquiry.email,
            newInquiry.city, newInquiry.state, newInquiry.category, newInquiry.product_range, newInquiry.monthly_volume,
            newInquiry.gstin, newInquiry.fssai_number, newInquiry.notes, newInquiry.status
          ]
        );
        insertedInquiry = result.rows[0];
      } catch (pgErr: any) {
        console.warn('[SellerInquiry POST] RDS failed, falling back to Supabase:', pgErr.message);
      }
    }

    if (!insertedInquiry) {
      try {
        const { data, error } = await sb.from('seller_inquiries').insert(newInquiry).select().single();
        if (error) {
          if (error.message && error.message.includes('fetch failed')) {
            console.error('[SellerInquiry POST] Supabase network failure:', error.message);
            return NextResponse.json(
              { error: 'Database service is temporarily unreachable. Please try again later.' },
              { status: 503 }
            );
          }
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        insertedInquiry = data;
      } catch (sbErr: any) {
        console.error('[SellerInquiry POST] Supabase network failure:', sbErr.message);
        return NextResponse.json(
          { error: 'Database service is temporarily unreachable. Please try again later.' },
          { status: 503 }
        );
      }
    }

    if (userId) {
      try {
        const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        await sb.from('sellers').upsert({
          user_id: userId,
          store_name: businessName,
          slug,
          state: state || 'Gujarat',
          category: category || 'General',
          description: notes || productRange || 'Seller inquiry submitted',
          plan: 'growth',
          commission_rate: 5.0,
          status: 'pending_inquiry',
          gstin: gstin || null,
        });
      } catch (sellerDbErr) {
        console.warn('sellers table insert notice:', sellerDbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Seller inquiry received successfully. Our onboarding team will contact you within 24-48 hours.',
      inquiry: insertedInquiry,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, adminNotes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Inquiry ID and new status are required' }, { status: 400 });
    }

    const sb = getAdminSupabase();
    const { data: updated, error } = await sb
      .from('seller_inquiries')
      .update({
        status,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const targetUserId = updated?.user_id || 
      (updated?.email ? (await sb.from('profiles').select('id').eq('email', updated.email).maybeSingle())?.data?.id : null);

    if (targetUserId) {
      try {
        if (status === 'approved') {
          // 1. Grant seller role & set seller active
          await sb
            .from('profiles')
            .update({ role: 'seller' })
            .eq('id', targetUserId);

          const slug = (updated.business_name || 'seller')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

          await sb
            .from('sellers')
            .upsert({
              user_id: targetUserId,
              store_name: updated.business_name,
              slug,
              state: updated.state || 'Gujarat',
              category: updated.category || 'A2 Dairy & Ghee',
              description: updated.notes || updated.product_range,
              plan: 'growth',
              commission_rate: 5.0,
              status: 'active',
              gstin: updated.gstin,
            });
        } else if (status === 'rejected') {
          // 2. Revoke seller role (unless admin) & set seller rejected
          const { data: userProf } = await sb.from('profiles').select('role').eq('id', targetUserId).maybeSingle();
          if (userProf?.role !== 'admin') {
            await sb
              .from('profiles')
              .update({ role: 'customer' })
              .eq('id', targetUserId);
          }

          await sb
            .from('sellers')
            .update({ status: 'rejected' })
            .eq('user_id', targetUserId);
        } else if (status === 'contacted' || status === 'pending') {
          // 3. Revert seller role (unless admin) & set seller pending_inquiry
          const { data: userProf } = await sb.from('profiles').select('role').eq('id', targetUserId).maybeSingle();
          if (userProf?.role !== 'admin') {
            await sb
              .from('profiles')
              .update({ role: 'customer' })
              .eq('id', targetUserId);
          }

          await sb
            .from('sellers')
            .update({ status: 'pending_inquiry' })
            .eq('user_id', targetUserId);
        }
      } catch (err) {
        console.warn('Auto provision / revoke seller on status update error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Inquiry status updated to ${status}`,
      inquiry: updated || { id, status, adminNotes },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update inquiry' }, { status: 500 });
  }
}
