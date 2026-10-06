import { getSupabaseBrowserClient } from './supabase/client';
import { getAdminSupabase } from './supabase/admin';

export { getSupabaseBrowserClient, getAdminSupabase };
export const supabase = getSupabaseBrowserClient();
export const adminSupabase = typeof window === 'undefined' ? getAdminSupabase() : null;

// ─── Shared Database Types ─────────────────────────────────────

export type DBProfile = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  address: string | null;
  role: 'customer' | 'admin';
  loyalty_points: number;
  referral_code?: string | null;
  default_upi_id?: string | null;
  created_at: string;
};

export type DBProduct = {
  id: string;
  name: string;
  // Was a closed union of six dairy values, which the UI had already
  // outgrown (it offers Electronics, Fashion, Books...). Categories are data,
  // defined in src/lib/constants/categories.ts, not a compile-time constant.
  category: string;
  description: string | null;
  image_url: string | null;
  is_freshness_guarantee: boolean;
  is_active: boolean;
  created_at: string;
  product_variants?: DBProductVariant[];
};

export type DBProductVariant = {
  id: string;
  product_id: string;
  weight: string;
  price: number;
  original_price: number | null;
  cost_price: number;
  stock: number;
  reserved_quantity: number;
  available_quantity: number;
  low_stock_threshold: number;
  batch_number?: string | null;
  expiry_date?: string | null;
  version?: number;
  created_at: string;
};

export type DBOrder = {
  id: string;
  order_number: string;
  user_id: string | null;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: string;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  delivery_date: string | null;
  delivery_slot?: string | null;
  shipping_address?: string | null;
  notes?: string | null;
  created_at: string;
  profiles?: { name: string | null; phone: string | null; email?: string | null };
  order_items?: DBOrderItem[];
};

export type DBOrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  quantity: number;
  price: number;
  cost_price?: number;
  product_name?: string;
  variant_weight?: string;
};

export type DBSubscription = {
  id: string;
  user_id: string;
  product_id: string;
  variant_id: string;
  volume: number;
  plan: 'daily' | 'alternate' | 'custom';
  status: 'active' | 'paused' | 'cancelled' | 'pending_review';
  delivery_slot?: string | null;
  start_date: string;
  next_delivery_date: string | null;
  created_at: string;
  products?: DBProduct;
  product_variants?: DBProductVariant;
};

export type DBReturnRequest = {
  id: string;
  order_id: string;
  user_id: string;
  reason: string;
  description?: string | null;
  images?: string[];
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
  refund_amount: number;
  admin_notes?: string | null;
  created_at: string;
  resolved_at?: string | null;
  orders?: DBOrder;
  profiles?: DBProfile;
};

export type DBDeliverySlot = {
  id: string;
  slot_name: string;
  start_time: string;
  end_time: string;
  max_orders_capacity: number;
  is_active: boolean;
};

export type DBBusinessSettings = {
  id: string;
  min_order_value: number;
  standard_delivery_fee: number;
  free_delivery_threshold: number;
  min_profit_margin_percent: number;
  freshness_guarantee_hours: number;
  is_store_open: boolean;
  store_closure_reason?: string | null;
  support_phone: string;
  support_email: string;
};

export type DBCoupon = {
  id: string;
  code: string;
  discount_type: 'flat' | 'percentage';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number | null;
  is_active: boolean;
  expires_at?: string | null;
};

export type DBCartItem = {
  id: string;
  user_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  created_at: string;
  products?: DBProduct;
  product_variants?: DBProductVariant;
};

export type DBNotification = {
  id: string;
  user_id: string | null;
  role_target: 'customer' | 'admin' | 'all' | 'seller';
  title: string;
  message: string;
  type: 'order' | 'subscription' | 'alert' | 'promo' | 'system' | 'return';
  related_id?: string | null;
  is_read: boolean;
  created_at: string;
};

export type DBModificationReport = {
  id: string;
  subscription_id: string;
  user_id: string;
  new_volume: number;
  new_plan: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
};


