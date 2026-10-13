import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getAuthUser } from '@/lib/api/auth-middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const mine = searchParams.get('mine') === 'true';

  try {
    const auth = await getAuthUser(request);
    const sb = getAdminSupabase();

    // ─── 1. Admin Access: Can query all inquiries or filter by status/search ───
    if (auth?.isAdmin && !mine) {
      const userId = searchParams.get('userId');
      let adminQuery = sb.from('seller_inquiries').select('*').order('created_at', { ascending: false });

      if (status && status !== 'all') {
        adminQuery = adminQuery.eq('status', status);
      }
      if (userId) {
        adminQuery = adminQuery.eq('user_id', userId);
      }
      if (search && search.trim()) {
        const q = search.trim();
        adminQuery = adminQuery.or(
          `business_name.ilike.%${q}%,full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,id.ilike.%${q}%`
        );
      }

      const { data, error } = await adminQuery;
      if (error) {
        return NextResponse.json({ success: false, inquiries: [] });
      }
      return NextResponse.json({ success: true, inquiries: data || [] });
    }

    // ─── 2. Unauthenticated User: Return 401 if 'mine' requested ───────────────
    if (!auth?.userId) {
      if (mine) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
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
    if (!auth?.userId) {
      return NextResponse.json(
        { error: 'Please sign in to submit a seller registration application.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      fullName,
      businessName,
      phone,
      email,
      businessAddress,
      city,
      state,
      pincode,
      businessType,
      category,
      productRange,
      monthlyVolume,
      gstin,
      pan,
      fssaiNumber,
      businessDocuments,
      notes,
    } = body;

    // Field validations
    if (!fullName?.trim() || !businessName?.trim() || !phone?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: 'Full name, business name, phone number, and email address are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit Indian mobile number (e.g. 9825123456).' },
        { status: 400 }
      );
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (pan && pan.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(pan.trim())) {
      return NextResponse.json(
        { error: 'Invalid PAN format. Standard PAN is 10 characters (e.g. ABCDE1234F).' },
        { status: 400 }
      );
    }

    if (gstin && gstin.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(gstin.trim())) {
      return NextResponse.json(
        { error: 'Invalid GSTIN format. Standard GSTIN is 15 characters (e.g. 24AAAAA0000A1Z5).' },
        { status: 400 }
      );
    }

    const sb = getAdminSupabase();

    // ── Check for existing applications to prevent duplicates ───────────────
    const { data: existingByUser } = await sb
      .from('seller_inquiries')
      .select('*')
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false })
      .limit(1);

    const existingInquiry = existingByUser && existingByUser.length > 0 ? existingByUser[0] : null;

    if (existingInquiry) {
      // 1. If already approved
      if (existingInquiry.status === 'approved') {
        return NextResponse.json(
          {
            error: 'Your seller application has already been approved. You can access the seller dashboard.',
            inquiry: existingInquiry,
          },
          { status: 400 }
        );
      }

      // 2. Prevent duplicate application while pending or under review
      if (existingInquiry.status === 'pending' || existingInquiry.status === 'contacted') {
        return NextResponse.json(
          {
            error: 'Your seller application is already submitted and currently under review. Duplicate applications are not allowed.',
            inquiry: existingInquiry,
          },
          { status: 400 }
        );
      }

      // 3. If rejected or suspended, allow resubmission / correction
      if (existingInquiry.status === 'rejected' || existingInquiry.status === 'suspended') {
        const updatePayload: any = {
          full_name: fullName.trim(),
          business_name: businessName.trim(),
          phone: cleanPhone,
          email: cleanEmail,
          business_address: businessAddress?.trim() || null,
          city: city?.trim() || null,
          state: state || 'Gujarat',
          pincode: pincode?.trim() || null,
          business_type: businessType || 'individual',
          category: category || 'A2 Organic Dairy',
          product_range: productRange?.trim() || null,
          monthly_volume: monthlyVolume || null,
          gstin: gstin ? gstin.trim().toUpperCase() : null,
          pan: pan ? pan.trim().toUpperCase() : null,
          fssai_number: fssaiNumber?.trim() || null,
          business_documents: Array.isArray(businessDocuments) ? businessDocuments : [],
          notes: notes?.trim() || null,
          status: 'pending',
          admin_notes: null, // Clear rejection reason on resubmission
          reviewed_by: null,
          reviewed_at: null,
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

        // Update seller store status to pending
        const { data: sellerStore } = await sb
          .from('sellers')
          .select('id')
          .eq('user_id', auth.userId)
          .maybeSingle();

        if (sellerStore?.id) {
          await sb
            .from('sellers')
            .update({
              store_name: businessName.trim(),
              phone: cleanPhone,
              status: 'pending',
              category: category || 'General',
              gstin: gstin ? gstin.trim().toUpperCase() : null,
              pan: pan ? pan.trim().toUpperCase() : null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', sellerStore.id);

          await sb.from('seller_status_history').insert({
            seller_id: sellerStore.id,
            previous_status: existingInquiry.status,
            new_status: 'pending',
            action: 'application_resubmitted',
            reason: 'Seller corrected and resubmitted application',
            notes: notes || 'Updated business details provided',
            changed_by: auth.userId,
          });
        }

        // Sync seller phone to user profile
        try {
          await sb
            .from('profiles')
            .update({
              phone: cleanPhone,
              updated_at: new Date().toISOString(),
            })
            .eq('id', auth.userId);
        } catch {}

        // Send in-app notification to admins
        try {
          await sb.from('notifications').insert({
            role_target: 'admin',
            title: 'Seller Application Resubmitted',
            message: `${fullName} has resubmitted their seller application for "${businessName}".`,
            type: 'system',
            related_id: updated.id,
          });
        } catch {}

        return NextResponse.json({
          success: true,
          message: 'Your seller application has been updated and resubmitted successfully and is awaiting admin approval.',
          inquiry: updated,
        });
      }
    }

    // ── Create brand-new seller inquiry ──────────────────────────────────
    const newInquiry: any = {
      user_id: auth.userId,
      full_name: fullName.trim(),
      business_name: businessName.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      business_address: businessAddress?.trim() || null,
      city: city?.trim() || null,
      state: state || 'Gujarat',
      pincode: pincode?.trim() || null,
      business_type: businessType || 'individual',
      category: category || 'A2 Organic Dairy',
      product_range: productRange?.trim() || null,
      monthly_volume: monthlyVolume || null,
      gstin: gstin ? gstin.trim().toUpperCase() : null,
      pan: pan ? pan.trim().toUpperCase() : null,
      fssai_number: fssaiNumber?.trim() || null,
      business_documents: Array.isArray(businessDocuments) ? businessDocuments : [],
      notes: notes?.trim() || null,
      status: 'pending',
    };

    const { data: insertedInquiry, error: insertErr } = await sb
      .from('seller_inquiries')
      .insert(newInquiry)
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Create seller record in sellers table with status 'pending'
    const slug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const { data: store, error: storeErr } = await sb
      .from('sellers')
      .upsert(
        {
          user_id: auth.userId,
          store_name: businessName.trim(),
          phone: cleanPhone,
          slug: `${slug}-${Date.now().toString(36).slice(-4)}`,
          state: state || 'Gujarat',
          category: category || 'General',
          description: notes || productRange || 'Seller registration submitted',
          plan: 'growth',
          commission_rate: 5.0,
          status: 'pending',
          gstin: gstin ? gstin.trim().toUpperCase() : null,
          pan: pan ? pan.trim().toUpperCase() : null,
          fssai_number: fssaiNumber?.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    // Sync phone number to profiles table
    try {
      await sb
        .from('profiles')
        .update({
          phone: cleanPhone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', auth.userId);
    } catch {}

    if (store?.id) {
      try {
        await sb.from('seller_status_history').insert({
          seller_id: store.id,
          previous_status: null,
          new_status: 'pending',
          action: 'application_submitted',
          reason: 'Initial seller registration application submitted',
          notes: `Store '${businessName}' application registered`,
          changed_by: auth.userId,
        });
      } catch (histErr) {
        console.warn('Status history notice:', histErr);
      }
    }

    // Create notification for admins
    try {
      await sb.from('notifications').insert({
        role_target: 'admin',
        title: 'New Seller Registration Request',
        message: `${fullName} has submitted a new seller application for "${businessName}".`,
        type: 'system',
        related_id: insertedInquiry.id,
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Your seller application has been submitted successfully and is awaiting admin approval.',
      inquiry: insertedInquiry,
    });
  } catch (err: any) {
    console.error('[SellerInquiry POST] Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthUser(request);
    // Enforce admin authorization — only admins can approve/reject/suspend
    if (!auth?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, adminNotes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Application ID and new status are required' }, { status: 400 });
    }

    if (status === 'rejected' && (!adminNotes || !adminNotes.trim())) {
      return NextResponse.json({ error: 'Please provide a rejection reason for the applicant.' }, { status: 400 });
    }

    const sb = getAdminSupabase();

    // Fetch existing inquiry
    const { data: existingInquiry, error: fetchErr } = await sb
      .from('seller_inquiries')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existingInquiry) {
      return NextResponse.json({ error: 'Seller application not found' }, { status: 404 });
    }

    // Update seller_inquiries
    const { data: updated, error: updateErr } = await sb
      .from('seller_inquiries')
      .update({
        status,
        admin_notes: adminNotes ?? existingInquiry.admin_notes,
        reviewed_by: auth.userId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    let targetUserId = updated.user_id;
    if (!targetUserId && updated.email) {
      const { data: uByEmail } = await sb.from('profiles').select('id').eq('email', updated.email).maybeSingle();
      if (uByEmail?.id) targetUserId = uByEmail.id;
    }

    if (targetUserId) {
      if (status === 'approved') {
        // 1. Grant seller role to profile and sync contact phone
        await sb
          .from('profiles')
          .update({
            role: 'seller',
            phone: updated.phone || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetUserId);

        // 2. Set seller store to active
        const slug = (updated.business_name || 'seller')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        const { data: store } = await sb
          .from('sellers')
          .upsert(
            {
              user_id: targetUserId,
              store_name: updated.business_name,
              phone: updated.phone || undefined,
              slug: `${slug}-${targetUserId.slice(0, 4)}`,
              state: updated.state || 'Gujarat',
              category: updated.category || 'General',
              description: updated.notes || updated.product_range,
              plan: 'growth',
              commission_rate: 5.0,
              status: 'active',
              gstin: updated.gstin,
              pan: updated.pan,
              fssai_number: updated.fssai_number,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )
          .select()
          .single();

        if (store?.id) {
          await sb.from('seller_status_history').insert({
            seller_id: store.id,
            previous_status: existingInquiry.status,
            new_status: 'active',
            action: 'application_approved',
            reason: 'Seller onboarding application approved by admin',
            notes: adminNotes || 'Seller store activated with dashboard access',
            changed_by: auth.userId,
          });
        }

        // Notify the seller
        try {
          await sb.from('notifications').insert({
            user_id: targetUserId,
            role_target: 'seller',
            title: 'Seller Application Approved!',
            message: `Congratulations! Your seller application for "${updated.business_name}" has been approved. You now have full access to your seller dashboard to add products and manage sales.`,
            type: 'system',
            related_id: id,
          });
        } catch {}

      } else if (status === 'rejected') {
        // Revoke seller role (unless admin)
        const { data: userProf } = await sb.from('profiles').select('role').eq('id', targetUserId).maybeSingle();
        if (userProf?.role !== 'admin') {
          await sb.from('profiles').update({ role: 'customer' }).eq('id', targetUserId);
        }

        const { data: store } = await sb
          .from('sellers')
          .update({
            status: 'rejected',
            deactivation_reason: adminNotes,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', targetUserId)
          .select()
          .maybeSingle();

        if (store?.id) {
          await sb.from('seller_status_history').insert({
            seller_id: store.id,
            previous_status: existingInquiry.status,
            new_status: 'rejected',
            action: 'application_rejected',
            reason: adminNotes,
            notes: 'Application rejected during review',
            changed_by: auth.userId,
          });
        }

        // Notify the applicant
        try {
          await sb.from('notifications').insert({
            user_id: targetUserId,
            role_target: 'customer',
            title: 'Seller Application Status Update',
            message: `Your seller application for "${updated.business_name}" was not approved. Reason: ${adminNotes}. You may update and resubmit your details.`,
            type: 'alert',
            related_id: id,
          });
        } catch {}

      } else if (status === 'suspended') {
        // Suspend seller account
        const { data: store } = await sb
          .from('sellers')
          .update({
            status: 'suspended',
            deactivation_reason: adminNotes || 'Suspended by admin',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', targetUserId)
          .select()
          .maybeSingle();

        if (store?.id) {
          await sb.from('seller_status_history').insert({
            seller_id: store.id,
            previous_status: existingInquiry.status,
            new_status: 'suspended',
            action: 'seller_suspended',
            reason: adminNotes,
            notes: 'Seller suspended by admin',
            changed_by: auth.userId,
          });
        }

        // Notify the seller
        try {
          await sb.from('notifications').insert({
            user_id: targetUserId,
            role_target: 'seller',
            title: 'Seller Account Suspended',
            message: `Your seller store "${updated.business_name}" has been suspended. Reason: ${adminNotes || 'Contact support for more details.'}`,
            type: 'alert',
            related_id: id,
          });
        } catch {}
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seller application status updated to ${status}`,
      inquiry: updated,
    });
  } catch (err: any) {
    console.error('[SellerInquiry PATCH] Exception:', err);
    return NextResponse.json({ error: err.message || 'Failed to update inquiry' }, { status: 500 });
  }
}
