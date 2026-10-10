import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lnjdlpfbglrczcmiwlfg.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuamRscGZiZ2xyY3pjbWl3bGZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTM4MTIyMywiZXhwIjoyMTA2OTU3MjIzfQ.uJQCDcg1fC4MxwbQDTf9quDVh5pMjXC52XyKJ2F3uzg';

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

async function run() {
  console.log('Testing Seller Product Submission Flow...');

  // 1. Fetch active seller
  const { data: seller, error: sErr } = await sb
    .from('sellers')
    .select('*')
    .eq('status', 'active')
    .limit(1)
    .single();

  if (sErr || !seller) {
    console.error('No active seller found:', sErr);
    process.exit(1);
  }

  console.log(`Using Active Seller: ${seller.store_name} (${seller.id}), user_id: ${seller.user_id}`);

  // 2. Simulate inserting into seller_product_approval
  const productPayload = {
    seller_id: seller.id,
    seller_user_id: seller.user_id,
    name: 'Vedic A2 Gir Cow Bilona Ghee',
    category: 'Dairy',
    subcategory: 'Pure Desi Ghee',
    description: 'Hand-churned traditional Bilona method A2 cow ghee made from grass-fed Gir cows.',
    brand: seller.store_name || 'Gjanand Farm Organics',
    sku: `SKU-GHEE-${Date.now().toString(36).toUpperCase()}`,
    price: 1450,
    original_price: 1650,
    cost_price: 1100,
    stock: 45,
    weight: '1 Liter',
    tax_rate: 12,
    image_url: 'https://images.unsplash.com/photo-1589927986086-3d10fbdd105d?auto=format&fit=crop&q=80&w=600',
    gallery_images: ['https://images.unsplash.com/photo-1589927986086-3d10fbdd105d?auto=format&fit=crop&q=80&w=600'],
    shipping_details: 'Standard delivery within 24-48 hours. Safe protective bubble box.',
    return_policy: '24-hour replacement guarantee for damaged seal or broken jar.',
    attributes: {
      fat_content: '99.7%',
      shelf_life: '12 Months',
      storage_temp: 'Cool and dry place away from direct sunlight',
      packaging_type: 'Food-grade glass jar',
      organic_a2_cert: 'Yes (A2 Certified)',
    },
    compliance_documents: [
      { name: 'FSSAI License / Number', url: '10022021000184', type: 'fssai' },
      { name: 'Quality Lab Test Certificate', url: 'https://drive.google.com/file/d/sample-lab-report', type: 'lab_report' }
    ],
    status: 'pending',
    is_approved: false,
    is_rejected: false,
    rejection_reason: null,
  };

  const { data: inserted, error: inErr } = await sb
    .from('seller_product_approval')
    .insert(productPayload)
    .select('*')
    .single();

  if (inErr) {
    console.error('Insert into seller_product_approval failed:', inErr);
    process.exit(1);
  }

  console.log(`✓ Product successfully added to seller_product_approval! ID: ${inserted.id}`);

  // 3. Check what Admin Panel query fetches
  const { data: adminFetch, error: afErr } = await sb
    .from('seller_product_approval')
    .select(`
      *,
      sellers:seller_id(id, store_name, status, category, user_id)
    `)
    .eq('status', 'pending');

  if (afErr) {
    console.error('Admin query failed:', afErr);
    process.exit(1);
  }

  console.log(`✓ Admin query returned ${adminFetch.length} pending approval request(s)!`);
  const found = adminFetch.find(r => r.id === inserted.id);
  if (found) {
    console.log(`✓ Admin side can see product: "${found.name}" submitted by "${found.sellers?.store_name}"`);
  } else {
    console.error('Product not found in admin query!');
  }
}

run().catch(console.error);
