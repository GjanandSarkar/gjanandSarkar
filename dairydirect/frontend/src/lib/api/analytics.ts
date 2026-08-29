import { supabase } from '@/lib/supabase';

export type BIOrder = {
  id: string;
  created_at: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  user_id: string;
  order_items?: {
    product_id: string;
    quantity: number;
    price: number;
    products?: { name: string; category?: string };
  }[];
};

export type BIProfile = {
  id: string;
  created_at: string;
};

export type BISubscription = {
  id: string;
  created_at: string;
  status: 'active' | 'paused' | 'cancelled' | 'pending_review';
  plan: string;
  product_id: string;
  products?: { name: string };
};

export type BusinessIntelligenceData = {
  orders: BIOrder[];
  profiles: BIProfile[];
  subscriptions: BISubscription[];
};

export async function getBusinessIntelligence(): Promise<BusinessIntelligenceData> {
  try {
    const res = await fetch('/api/admin/analytics');
    if (res.ok) {
      const data = await res.json();
      return {
        orders: data.orders || [],
        profiles: data.profiles || [],
        subscriptions: data.subscriptions || [],
      };
    }
  } catch (err) {
    console.warn('[analytics.ts] /api/admin/analytics fetch failed, trying client fallback:', err);
  }

  // Fallback to client Supabase if API fails
  const [ordersRes, profilesRes, subsRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id, created_at, total_amount, status, user_id, order_items(product_id, quantity, price, products(name, category))')
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, created_at'),
    supabase
      .from('subscriptions')
      .select('id, status, created_at, plan, product_id, products(name)')
  ]);

  return {
    orders: (ordersRes.data as unknown as BIOrder[]) || [],
    profiles: (profilesRes.data as BIProfile[]) || [],
    subscriptions: (subsRes.data as unknown as BISubscription[]) || [],
  };
}
