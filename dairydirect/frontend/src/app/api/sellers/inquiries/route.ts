import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { query, isPgConfigured } from '@/lib/aws/rds';
import { getAuthUser } from '@/lib/api/auth-middleware';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  try {
    const auth = await getAuthUser(request);
    const sb = getAdminSupabase();

    const mine = searchParams.get('mine') === 'true';

    // ─── 1. Admin Access: Can query all inquiries or filter by status/userId (unless checking own inquiry) ───
    if (auth?.isAdmin && !mine) {
      const userId = searchParams.get('userId');
      let adminQuery = sb.from('seller_inquiries').select('*').order('created_at', { ascending: false });

      if (status && status !== 'all') {
        adminQuery = adminQuery.eq('status', status);
      }
      if (userId) {
        adminQuery = adminQuery.eq('user_id', userId);
      }

      const { data, error } = await adminQuery;
      if (error) {
        return NextResponse.json({ success: false, inquiries: [] });
      }
      return NextResponse.json({ success: true, inquiries: data || [] });
    }

    // ─── 2. Unauthenticated User: Return empty list ───────────────────────────
    if (!auth?.userId) {
      return NextResponse.json({ success: true, inquiries: [] });
    }

    // ─── 3. Authenticated Customer/Seller: Return ONLY their own application ──
    const { data: userInquiries, error: userInqErr } = await sb
      .from('seller_inquiries')
      .select('*')
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false });

    if (!userInqErr && userInquiries && userInquiries.length > 0) {
      return NextResponse.json({ success: true, inquiries: userInquiries });
    }

    // Fallback: If not yet linked by user_id, check by verified email or phone
    const fallbackFilters: string[] = [];
    if (auth.email) {
      fallbackFilters.push(`email.eq.${auth.email.trim().toLowerCase()}`);
    }
    if (auth.phone) {
      const cleanPhone = auth.phone.replace(/\D/g, '').slice(-10);
      if (cleanPhone) fallbackFilters.push(`phone.ilike.%${cleanPhone}`);
    }

    if (fallbackFilters.length > 0) {
      const { data: matchedInquiries } = await sb
        .from('seller_inquiries')
        .select('*')
        .or(fallbackFilters.join(','))
        .order('created_at', { ascending: false })
        .limit(1);

      if (matchedInquiries && matchedInquiries.length > 0) {
        // Link the existing inquiry to this authenticated user_id
        await sb
          .from('seller_inquiries')
          .update({ user_id: auth.userId })
          .eq('id', matchedInquiries[0].id);

        return NextResponse.json({ success: true, inquiries: matchedInquiries });
      }
    }

    return NextResponse.json({ success: true, inquiries: [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch inquiries' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthUser(request);
    const body = await request.json();
    const {
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

    const targetUserId = auth?.userId || body.userId || null;

    if (!fullName || !businessName || !phone || !email) {
      return NextResponse.json(
        { error: 'Please provide full name, business name, phone number, and email' },
        { status: 400 }
      );
    }

    const sb = getAdminSupabase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    // ── Check for existing inquiry to prevent duplicates ───────────────
    let existingInquiry: any = null;
    if (targetUserId) {
      const { data: existingByUser } = await sb
        .from('seller_inquiries')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(1);
      if (existingByUser && existingByUser.length > 0) {
        existingInquiry = existingByUser[0];
      }
    }

    if (!existingInquiry && (cleanEmail || cleanPhone)) {
      const filters: string[] = [];
      if (cleanEmail) filters.push(`email.eq.${cleanEmail}`);
      if (cleanPhone) {
        const digits = cleanPhone.replace(/\D/g, '').slice(-10);
        if (digits) filters.push(`phone.ilike.%${digits}`);
      }
      if (filters.length > 0) {
        const { data: existingByContact } = await sb
          .from('seller_inquiries')
          .select('*')
          .or(filters.join(','))
          .order('created_at', { ascending: false })
          .limit(1);
        if (existingByContact && existingByContact.length > 0) {
          existingInquiry = existingByContact[0];
        }
      }
    }

    if (existingInquiry) {
      // 1. If already approved, do not create duplicate
      if (existingInquiry.status === 'approved') {
        return NextResponse.json({
          success: true,
          message: 'Your seller application has already been approved.',
          inquiry: existingInquiry,
        });
      }

      // 2. If already pending or contacted, return existing record
      if (existingInquiry.status === 'pending' || existingInquiry.status === 'contacted') {
        return NextResponse.json({
          success: true,
          message: 'Your seller application is already submitted and currently under review.',
          inquiry: existingInquiry,
        });
      }

      // 3. If rejected, update the existing record to re-apply
      if (existingInquiry.status === 'rejected') {
        const updatePayload = {
          user_id: targetUserId || existingInquiry.user_id,
          full_name: fullName.trim(),
          business_name: businessName.trim(),
          phone: cleanPhone,
          email: cleanEmail,
          city: city ? city.trim() : '',
          state: state || 'Gujarat',
          category: category || 'A2 Dairy & Ghee',
          product_range: productRange || '',
          monthly_volume: monthlyVolume || '',
          gstin: gstin ? gstin.trim().toUpperCase() : null,
          fssai_number: fssaiNumber ? fssaiNumber.trim() : null,
          notes: notes || '',
          status: 'pending',
          admin_notes: null, // Clear rejection note on re-application
          updated_at: new Date().toISOString(),
        };

        const { data: updated, error: updateErr } = await sb
          .from('seller_inquiries')
          .update(updatePayload)
          .eq('id', existingInquiry.id)
          .select()
          .single();

        if (updateErr) {
          return NextResponse.json({ error: updateErr.message }, { status: 500 });
        }

        if (targetUserId) {
          try {
            await sb.from('sellers').update({
              store_name: businessName.trim(),
              status: 'pending_inquiry',
              updated_at: new Date().toISOString(),
            }).eq('user_id', targetUserId);
          } catch {}
        }

        return NextResponse.json({
          success: true,
          message: 'Your seller application has been updated and re-submitted successfully.',
          inquiry: updated,
        });
      }
    }

    // ── No existing inquiry: Create new inquiry ────────────────────────
    const newInquiry = {
      user_id: targetUserId,
      full_name: fullName.trim(),
      business_name: businessName.trim(),
      phone: cleanPhone,
      email: cleanEmail,
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
      const { data, error } = await sb.from('seller_inquiries').insert(newInquiry).select().single();
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      insertedInquiry = data;
    }

    if (targetUserId) {
      try {
        const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        await sb.from('sellers').upsert({
          user_id: targetUserId,
          store_name: businessName,
          slug,
          state: state || 'Gujarat',
          category: category || 'General',
          description: notes || productRange || 'Seller inquiry submitted',
          plan: 'growth',
          commission_rate: 5.0,
          status: 'pending_inquiry',
          gstin: gstin || null,
        }, { onConflict: 'user_id' });
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
    const auth = await getAuthUser(request);
    // Enforce admin authorization — only admins can approve/reject/modify inquiry status
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

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
        admin_notes: adminNotes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let targetUserId = updated?.user_id;
    if (!targetUserId && updated?.email) {
      const { data: userByEmail } = await sb.from('profiles').select('id').eq('email', updated.email).maybeSingle();
      if (userByEmail?.id) targetUserId = userByEmail.id;
    }

    if (targetUserId) {
      try {
        if (status === 'approved') {
          // 1. Grant seller role & set seller store active
          await sb
            .from('profiles')
            .update({ role: 'seller' })
            .eq('id', targetUserId);

          const slug = (updated.business_name || 'seller')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

          const { data: activatedStore } = await sb
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
              fssai_number: updated.fssai_number,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' })
            .select()
            .single();

          if (activatedStore?.id) {
            await sb.from('seller_status_history').insert({
              seller_id: activatedStore.id,
              previous_status: 'pending_inquiry',
              new_status: 'active',
              action: 'inquiry_approved',
              reason: 'Onboarding application approved by admin',
              notes: adminNotes || 'Seller store activated',
              changed_by: auth?.userId || null,
            });
          }
        } else if (status === 'rejected') {
          // 2. Revoke seller role (unless admin) & set seller rejected
          const { data: userProf } = await sb.from('profiles').select('role').eq('id', targetUserId).maybeSingle();
          if (userProf?.role !== 'admin') {
            await sb
              .from('profiles')
              .update({ role: 'customer' })
              .eq('id', targetUserId);
          }

          const { data: rejectedStore } = await sb
            .from('sellers')
            .update({ status: 'rejected', updated_at: new Date().toISOString() })
            .eq('user_id', targetUserId)
            .select()
            .maybeSingle();

          if (rejectedStore?.id) {
            await sb.from('seller_status_history').insert({
              seller_id: rejectedStore.id,
              previous_status: rejectedStore.status,
              new_status: 'rejected',
              action: 'inquiry_rejected',
              reason: 'Onboarding application rejected by admin',
              notes: adminNotes || 'Seller application rejected',
              changed_by: auth?.userId || null,
            });
          }
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
            .update({ status: 'pending_inquiry', updated_at: new Date().toISOString() })
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
