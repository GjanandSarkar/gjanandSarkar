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
        '[Gjanand Sarkar] Supabase env vars not set. ' +
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
  default_upi_id?: string | null;
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
  cost_price: number;
  stock: number;
  created_at: string;
};

export type DBOrder = {
  id: string;
  user_id: string | null;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  delivery_date: string | null;
  created_at: string;
  profiles?: { name: string | null; phone: string | null };
  order_items?: DBOrderItem[];
};

export type DBOrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  quantity: number;
  price: number;
};

export type DBSubscription = {
  id: string;
  user_id: string;
  product_id: string;
  variant_id: string;
  volume: number;
  plan: string;
  status: 'active' | 'paused' | 'cancelled' | 'pending_review';
  start_date: string;
  next_delivery_date: string | null;
  created_at: string;
  products?: any;
};

export type DBModificationReport = {
  id: string;
  subscription_id: string;
  user_id: string;
  action: string;
  new_volume: number | null;
  new_plan: string | null;
  created_at: string;
};

export type DBNotification = {
  id: string;
  user_id: string | null;
  role_target: string;
  title: string;
  message: string;
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
