import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

// Fallback in-memory cache for resilient inquiry management
let memoryInquiries: any[] = [
  {
    id: 'INQ-2026-8801',
    user_id: 'user-demo-1',
    full_name: 'Bhavesh Bhai Patel',
    business_name: 'Gir Amrutam Organic Farm',
    phone: '9825123456',
    email: 'bhavesh@giramrutam.com',
    city: 'Junagadh',
    state: 'Gujarat',
    category: 'A2 Dairy & Ghee',
    product_range: 'Gir Cow Vedic Bilona Ghee, A2 Cultured Butter',
    monthly_volume: '500-1000 Liters/Kg',
    gstin: '24AAAAA0000A1Z5',
    fssai_number: '10722001000123',
    notes: 'We own 80+ pure Gir cows in Junagadh, Gujarat. Producing traditional bilona ghee.',
    status: 'pending',
    admin_notes: '',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'INQ-2026-8802',
    user_id: 'user-demo-2',
    full_name: 'Sunita Devi Sharma',
    business_name: 'Kashmir Saffron & Honey Collective',
    phone: '9419123456',
    email: 'sunita@kashmirherbs.in',
    city: 'Pampore',
    state: 'Kashmir',
    category: 'Heritage Spices & Tea',
    product_range: 'GI Tagged Mongra Saffron, Wild Forest Honey',
    monthly_volume: '200-500 Units',
    gstin: '01BBBBB1111B1Z2',
    fssai_number: '11021002000456',
    notes: 'Direct farm produce from growers in Pampore valley.',
    status: 'contacted',
    admin_notes: 'Spoke with Sunita on WhatsApp. Lab test certificate for Saffron requested.',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const userId = searchParams.get('userId');

  try {
    // Try querying Supabase seller_inquiries table
    let query = supabaseAdmin.from('seller_inquiries').select('*').order('created_at', { ascending: false });
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      return NextResponse.json({ success: true, inquiries: data });
    }

    // Also check sellers table for pending inquiries
    const { data: pendingSellers } = await supabaseAdmin
      .from('sellers')
      .select('*')
      .eq('status', 'pending_inquiry');

    let combined = [...memoryInquiries];
    if (pendingSellers && pendingSellers.length > 0) {
      const mapped = pendingSellers.map(s => ({
        id: s.id,
        user_id: s.user_id,
        full_name: s.store_name,
        business_name: s.store_name,
        phone: s.pan || 'N/A',
        email: 'seller@' + (s.slug || 'gjanandsarkar.com'),
        city: s.state,
        state: s.state,
        category: s.category,
        product_range: s.description,
        monthly_volume: 'Pending Verification',
        gstin: s.gstin,
        fssai_number: 'Under Review',
        notes: s.description,
        status: s.status === 'pending_inquiry' ? 'pending' : s.status,
        admin_notes: '',
        created_at: s.created_at,
        updated_at: s.updated_at
      }));
      combined = [...mapped, ...combined];
    }

    let filtered = combined;
    if (status && status !== 'all') {
      filtered = filtered.filter(i => i.status === status);
    }
    if (userId) {
      filtered = filtered.filter(i => i.user_id === userId);
    }

    return NextResponse.json({ success: true, inquiries: filtered });
  } catch (err: any) {
    let filtered = memoryInquiries;
    if (status && status !== 'all') {
      filtered = filtered.filter(i => i.status === status);
    }
    if (userId) {
      filtered = filtered.filter(i => i.user_id === userId);
    }
    return NextResponse.json({ success: true, inquiries: filtered });
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

    const inquiryId = `INQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newInquiry = {
      id: inquiryId,
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
      admin_notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save to memory storage
    memoryInquiries.unshift(newInquiry);

    // Attempt insert into Supabase seller_inquiries table
    try {
      await supabaseAdmin.from('seller_inquiries').insert([newInquiry]);
    } catch (dbErr) {
      console.warn('seller_inquiries Supabase insert skipped (using resilient store):', dbErr);
    }

    // Also insert into sellers table as pending_inquiry so store structure is reserved
    if (userId) {
      try {
        const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        await supabaseAdmin.from('sellers').upsert({
          user_id: userId,
          store_name: businessName,
          slug,
          state: state || 'Gujarat',
          category: category || 'General',
          description: notes || productRange || 'Seller inquiry submitted - Pending manual review',
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
      inquiry: newInquiry
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

    // Update memory
    const existingIndex = memoryInquiries.findIndex(i => i.id === id);
    if (existingIndex !== -1) {
      memoryInquiries[existingIndex] = {
        ...memoryInquiries[existingIndex],
        status,
        admin_notes: adminNotes !== undefined ? adminNotes : memoryInquiries[existingIndex].admin_notes,
        updated_at: new Date().toISOString()
      };
    }

    // Update Supabase seller_inquiries
    try {
      await supabaseAdmin
        .from('seller_inquiries')
        .update({
          status,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
    } catch (e) {
      // Ignored
    }

    // If status is 'approved', activate seller and elevate user role
    const inquiry = existingIndex !== -1 ? memoryInquiries[existingIndex] : null;
    if (status === 'approved' && inquiry?.user_id) {
      try {
        await supabaseAdmin
          .from('profiles')
          .update({ role: 'seller' })
          .eq('id', inquiry.user_id);

        const slug = inquiry.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        await supabaseAdmin
          .from('sellers')
          .upsert({
            user_id: inquiry.user_id,
            store_name: inquiry.business_name,
            slug,
            state: inquiry.state || 'Gujarat',
            category: inquiry.category || 'A2 Dairy & Ghee',
            description: inquiry.notes || inquiry.product_range,
            plan: 'growth',
            commission_rate: 5.0,
            status: 'active',
            gstin: inquiry.gstin,
          });
      } catch (err) {
        console.warn('Auto provision seller on approve error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Inquiry status updated to ${status}`,
      inquiry: inquiry || { id, status, adminNotes }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update inquiry' }, { status: 500 });
  }
}
