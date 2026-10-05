import { supabase } from '@/lib/supabase';

export interface SellerInquiryPayload {
  userId?: string;
  fullName: string;
  businessName: string;
  phone: string;
  email: string;
  city?: string;
  state: string;
  category: string;
  productRange?: string;
  monthlyVolume?: string;
  gstin?: string;
  fssaiNumber?: string;
  notes?: string;
}

export interface SellerInquiry {
  id: string;
  user_id?: string;
  full_name: string;
  business_name: string;
  phone: string;
  email: string;
  city?: string;
  state: string;
  category: string;
  product_range?: string;
  monthly_volume?: string;
  gstin?: string;
  fssai_number?: string;
  notes?: string;
  status: 'pending' | 'contacted' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SellerRegistrationPayload {
  userId: string;
  storeName: string;
  state: string;
  category: string;
  description?: string;
  plan: 'starter' | 'growth' | 'enterprise';
  gstin?: string;
  pan?: string;
  bankAccount?: string;
  ifscCode?: string;
}

export interface SellerDashboardData {
  store: {
    id: string;
    storeName: string;
    state: string;
    plan: string;
    commissionRate: number;
    status: string;
    totalSales: number;
  } | null;
  inquiry?: SellerInquiry | null;
  metrics: {
    grossRevenue: number;
    platformCommission: number;
    netPayout: number;
    totalOrders: number;
    totalProducts: number;
    pendingDeliveries: number;
  };
  recentOrders: Array<{
    id: string;
    customerName: string;
    itemsCount: number;
    amount: number;
    status: string;
    date: string;
  }>;
  payoutHistory: Array<{
    id: string;
    amount: number;
    fee: number;
    net: number;
    status: string;
    date: string;
  }>;
}

/**
 * Submit seller onboarding inquiry for manual verification
 */
export async function submitSellerInquiry(payload: SellerInquiryPayload): Promise<{ success: boolean; inquiry: SellerInquiry; message: string }> {
  const res = await fetch('/api/sellers/inquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to submit seller inquiry');
  }

  return await res.json();
}

/**
 * Fetch all seller inquiries (for Admin)
 */
export async function getSellerInquiries(status?: string): Promise<SellerInquiry[]> {
  try {
    const url = status && status !== 'all' 
      ? `/api/sellers/inquiries?status=${encodeURIComponent(status)}`
      : '/api/sellers/inquiries';
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch inquiries');
    const data = await res.json();
    return data.inquiries || [];
  } catch (err) {
    console.error('getSellerInquiries error:', err);
    return [];
  }
}

/**
 * Update seller inquiry status & internal notes (for Admin)
 */
export async function updateSellerInquiryStatus(id: string, status: string, adminNotes?: string) {
  const res = await fetch('/api/sellers/inquiries', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status, adminNotes }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to update inquiry status');
  }

  return await res.json();
}

/**
 * Legacy direct register helper (defaults to inquiry submission)
 */
export async function registerSeller(payload: SellerRegistrationPayload) {
  return await submitSellerInquiry({
    userId: payload.userId,
    fullName: payload.storeName,
    businessName: payload.storeName,
    phone: '9825123456',
    email: 'vendor@' + payload.storeName.toLowerCase().replace(/\s+/g, '') + '.com',
    state: payload.state,
    category: payload.category,
    gstin: payload.gstin,
    notes: payload.description,
  });
}

/**
 * Fetch seller dashboard data including inquiry approval state
 */
export async function getSellerDashboard(userId: string): Promise<SellerDashboardData> {
  try {
    // Check inquiry status first
    const inqRes = await fetch(`/api/sellers/inquiries?userId=${encodeURIComponent(userId)}`);
    let userInquiry: SellerInquiry | null = null;
    if (inqRes.ok) {
      const inqData = await inqRes.json();
      if (inqData.inquiries && inqData.inquiries.length > 0) {
        userInquiry = inqData.inquiries[0];
      }
    }

    const res = await fetch(`/api/sellers?userId=${encodeURIComponent(userId)}`);
    if (res.ok) {
      const data = await res.json();
      
      // Default metrics from the sellers API live calculation
      let metrics = data.metrics || {
        grossRevenue: 0,
        platformCommission: 0,
        netPayout: 0,
        totalOrders: 0,
        totalProducts: 0,
        pendingDeliveries: 0,
      };
      
      try {
        const analyticsRes = await fetch(`/api/sellers/analytics`);
        if (analyticsRes.ok) {
           const analyticsData = await analyticsRes.json();
           if (analyticsData.metrics && (analyticsData.metrics.grossRevenue > 0 || analyticsData.metrics.totalOrders > 0)) {
               metrics = analyticsData.metrics;
           }
        }
      } catch (e) {}

      return {
        store: data.store || null,
        inquiry: userInquiry,
        metrics,
        recentOrders: Array.isArray(data.recentOrders) ? data.recentOrders : [],
        payoutHistory: Array.isArray(data.payoutHistory) ? data.payoutHistory : [],
      };
    }
  } catch (e) {
    console.error('getSellerDashboard error:', e);
  }

  return {
    store: null,
    inquiry: null,
    metrics: {
      grossRevenue: 0,
      platformCommission: 0,
      netPayout: 0,
      totalOrders: 0,
      totalProducts: 0,
      pendingDeliveries: 0,
    },
    recentOrders: [],
    payoutHistory: [],
  };
}

export interface SellerProductItem {
  id: string;
  seller_id?: string;
  seller_user_id?: string;
  product_id?: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  original_price?: number;
  cost_price?: number;
  weight?: string;
  stock?: number;
  image_url?: string;
  status: string;
  is_approved?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetch seller product catalog from Supabase seller_products table
 */
export async function getSellerProducts(options: { sellerId?: string; sellerUserId?: string; category?: string; status?: string } = {}): Promise<SellerProductItem[]> {
  try {
    const params = new URLSearchParams();
    if (options.sellerId) params.set('sellerId', options.sellerId);
    if (options.sellerUserId) params.set('sellerUserId', options.sellerUserId);
    if (options.category) params.set('category', options.category);
    if (options.status) params.set('status', options.status);

    const res = await fetch(`/api/sellers/products?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch seller products');
    const data = await res.json();
    return data.sellerProducts || [];
  } catch (err) {
    console.error('getSellerProducts error:', err);
    return [];
  }
}

/**
 * Add a new product to Supabase seller_products table
 */
export async function addSellerProduct(payload: {
  sellerId?: string;
  sellerUserId?: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  originalPrice?: number;
  costPrice?: number;
  weight?: string;
  stock?: number;
  imageUrl?: string;
  status?: string;
}): Promise<{ success: boolean; sellerProduct: SellerProductItem }> {
  const res = await fetch('/api/sellers/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to add seller product');
  }

  return await res.json();
}

// ─── Seller Lifecycle Types & Helpers ─────────────────────────

export interface SellerStatusHistoryItem {
  id: string;
  seller_id: string;
  previous_status: string | null;
  new_status: string | null;
  action: string;
  reason: string | null;
  notes: string | null;
  review_started_at: string | null;
  review_expires_at: string | null;
  changed_by: string | null;
  changed_at: string;
  profiles?: {
    name?: string;
    email?: string;
  } | null;
}

export interface SellerLifecycleRecord {
  id: string;
  user_id: string;
  store_name: string;
  slug: string;
  state: string;
  category: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  plan: string;
  commission_rate: number;
  status: string;
  total_sales: number;
  review_started_at?: string | null;
  review_expires_at?: string | null;
  review_reason?: string | null;
  deactivation_reason?: string | null;
  reactivation_reason?: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    name?: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
  } | null;
}

export interface SellerLifecycleActionPayload {
  sellerId: string;
  action:
    | 'put_under_review'
    | 'keep_active'
    | 'start_temporary_review'
    | 'extend_review'
    | 'end_review'
    | 'deactivate'
    | 'permanently_deactivate'
    | 'approve_reactivation'
    | 'reject_reactivation';
  reason?: string;
  notes?: string;
  duration?: string;
  customStartDate?: string;
  customEndDate?: string;
}

/**
 * Fetch all sellers with lifecycle status filter (for Admin)
 */
export async function getAdminSellersList(status?: string): Promise<SellerLifecycleRecord[]> {
  try {
    const url = status && status !== 'all'
      ? `/api/sellers/lifecycle?action=list&status=${encodeURIComponent(status)}`
      : '/api/sellers/lifecycle?action=list';

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch sellers list');
    const data = await res.json();
    return data.sellers || [];
  } catch (err) {
    console.error('getAdminSellersList error:', err);
    return [];
  }
}

/**
 * Fetch seller details including history and active review (for Admin)
 */
export async function getSellerLifecycleDetails(sellerId: string): Promise<{
  seller: SellerLifecycleRecord;
  activeReview: SellerStatusHistoryItem | null;
  history: SellerStatusHistoryItem[];
}> {
  const res = await fetch(`/api/sellers/lifecycle?sellerId=${encodeURIComponent(sellerId)}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch seller details');
  }
  return await res.json();
}

/**
 * Execute admin seller lifecycle transition
 */
export async function executeSellerLifecycleAction(payload: SellerLifecycleActionPayload) {
  const res = await fetch('/api/sellers/lifecycle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update seller lifecycle status');
  }
  return data;
}

/**
 * Request reactivation (seller-facing)
 */
export async function requestSellerReactivation(payload: { reason: string; notes?: string }) {
  const res = await fetch('/api/sellers/reactivation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to submit reactivation request');
  }
  return data;
}

/**
 * Get lifecycle metadata (predefined reasons, transitions)
 */
export async function getSellerLifecycleMetadata(): Promise<{
  reviewReasons: string[];
  deactivationReasons: string[];
  validTransitions: Record<string, string[]>;
}> {
  try {
    const res = await fetch('/api/sellers/lifecycle?action=metadata');
    if (!res.ok) throw new Error('Failed to fetch lifecycle metadata');
    return await res.json();
  } catch (err) {
    return {
      reviewReasons: ['Customer complaints', 'Quality concerns', 'Policy violation investigation', 'Other'],
      deactivationReasons: ['Repeated policy violations', 'Fraudulent activity', 'Customer safety concerns', 'Other'],
      validTransitions: {},
    };
  }
}

// ─── Seller Payouts Interface & Helpers ─────────────────────

export interface SellerPayout {
  id: string;
  seller_id: string;
  amount: number;
  fee_deducted: number;
  net_amount: number;
  status: 'completed' | 'pending' | 'processing' | 'failed';
  payout_date: string;
  reference_no?: string;
  created_at: string;
  sellers?: {
    id: string;
    store_name: string;
    slug: string;
    user_id?: string;
  };
}

export async function getSellerPayouts(options: {
  sellerId?: string;
  status?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ payouts: SellerPayout[]; summary: { totalAmount: number; totalFees: number; totalNet: number; count: number } }> {
  try {
    const params = new URLSearchParams();
    if (options.sellerId) params.set('sellerId', options.sellerId);
    if (options.status) params.set('status', options.status);
    if (options.limit) params.set('limit', String(options.limit));
    if (options.offset) params.set('offset', String(options.offset));

    const res = await fetch(`/api/sellers/payouts?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch payouts');
    const data = await res.json();
    return {
      payouts: data.payouts || [],
      summary: data.summary || { totalAmount: 0, totalFees: 0, totalNet: 0, count: 0 },
    };
  } catch (err) {
    console.error('getSellerPayouts error:', err);
    return { payouts: [], summary: { totalAmount: 0, totalFees: 0, totalNet: 0, count: 0 } };
  }
}

export async function createSellerPayout(payload: {
  sellerId: string;
  amount: number;
  feeDeducted?: number;
  netAmount?: number;
  status?: string;
  payoutDate?: string;
  referenceNo?: string;
}): Promise<{ success: boolean; payout: SellerPayout; message: string }> {
  const res = await fetch('/api/sellers/payouts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to record payout');
  }
  return data;
}

// ─── General Sellers & Store Helpers ─────────────────────────

export async function getAllSellers(options: {
  status?: string;
  category?: string;
  state?: string;
  search?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ sellers: SellerLifecycleRecord[]; total: number }> {
  try {
    const params = new URLSearchParams();
    if (options.status) params.set('status', options.status);
    if (options.category) params.set('category', options.category);
    if (options.state) params.set('state', options.state);
    if (options.search) params.set('search', options.search);
    if (options.limit) params.set('limit', String(options.limit));
    if (options.offset) params.set('offset', String(options.offset));

    const res = await fetch(`/api/sellers?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch sellers');
    const data = await res.json();
    return {
      sellers: data.sellers || [],
      total: data.total || (data.sellers || []).length,
    };
  } catch (err) {
    console.error('getAllSellers error:', err);
    return { sellers: [], total: 0 };
  }
}

export async function getSellerById(id: string): Promise<SellerLifecycleRecord | null> {
  try {
    const res = await fetch(`/api/sellers/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.seller || null;
  } catch (err) {
    console.error('getSellerById error:', err);
    return null;
  }
}

export async function updateSellerStore(
  storeId: string,
  updates: Record<string, any>
): Promise<{ success: boolean; seller: SellerLifecycleRecord }> {
  const res = await fetch(`/api/sellers/${encodeURIComponent(storeId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update store settings');
  }
  return data;
}

export async function getSellerStatusHistory(sellerId: string): Promise<SellerStatusHistoryItem[]> {
  try {
    const res = await fetch(`/api/sellers/lifecycle?action=history&sellerId=${encodeURIComponent(sellerId)}`);
    if (!res.ok) throw new Error('Failed to fetch status history');
    const data = await res.json();
    return data.history || [];
  } catch (err) {
    console.error('getSellerStatusHistory error:', err);
    return [];
  }
}



