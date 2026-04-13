import { createBrowserClient } from '@supabase/ssr';

// Singleton pattern — reuse across the app
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      // In dev without env, return a dummy client that fails gracefully
      console.warn(
        '[DairyDirect] Supabase env vars not set. ' +
        'Copy .env.local.example → .env.local and fill in your values.'
      );
    }

    supabaseInstance = createBrowserClient(url ?? '', key ?? '');
  }
  return supabaseInstance;
}

export const supabase = getSupabaseClient();

// ─── Types (mirrors DB schema) ───────────────────────────────

export type DBProfile = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  address: string | null;
  role: 'customer' | 'admin';
  created_at: string;
};

export type DBProduct = {
  id: string;
  name: string;
  category: 'Milk' | 'Paneer' | 'Ghee' | 'Buttermilk' | 'Curd' | 'Lassi';
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
  stock: number;
  created_at: string;
};

export type DBOrder = {
  id: string;
  user_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  total: number;
  status: 'Pending' | 'Confirmed' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  delivery_date: string | null;
  created_at: string;
  order_items?: DBOrderItem[];
};

export type DBOrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string | null;
  variant_weight: string | null;
  quantity: number;
  price: number;
};

export type DBSubscription = {
  id: string;
  user_id: string;
  product_id: string;
  volume: number;
  plan: 'weekly' | 'monthly';
  status: 'Active' | 'Paused' | 'Pending Review' | 'Cancelled';
  start_date: string;
  next_delivery_date: string | null;
  created_at: string;
  products?: DBProduct;
};

export type DBModificationReport = {
  id: string;
  subscription_id: string;
  user_id: string;
  new_volume: number | null;
  new_plan: string | null;
  status: 'Pending' | 'Accepted' | 'Rejected';
  created_at: string;
};

export type DBNotification = {
  id: string;
  user_id: string | null;
  role_target: string;
  title: string;
  body: string;
  type: 'order' | 'subscription' | 'system' | 'delivery' | null;
  is_read: boolean;
  related_id: string | null;
  created_at: string;
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
