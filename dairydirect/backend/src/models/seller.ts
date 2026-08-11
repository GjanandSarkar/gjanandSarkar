export type SellerPlan = 'starter' | 'growth' | 'enterprise';
export type SellerStatus = 'active' | 'pending' | 'suspended' | 'pending_kyc';
export type InquiryStatus = 'pending' | 'contacted' | 'approved' | 'rejected';

export interface Seller {
  id: string;
  user_id: string | null;
  store_name: string;
  slug: string;
  state: string;
  category: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  plan: SellerPlan;
  commission_rate: number;
  status: SellerStatus;
  gstin: string | null;
  pan: string | null;
  bank_account: string | null;
  ifsc_code: string | null;
  fssai_number: string | null;
  total_sales: number;
  created_at: string;
  updated_at: string;
}

export interface SellerInquiry {
  id: string;
  user_id: string | null;
  full_name: string;
  business_name: string;
  phone: string;
  email: string | null;
  city: string | null;
  state: string;
  category: string;
  product_range: string | null;
  monthly_volume: string | null;
  gstin: string | null;
  fssai_number: string | null;
  notes: string | null;
  status: InquiryStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}
