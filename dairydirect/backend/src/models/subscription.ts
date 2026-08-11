export type SubscriptionPlan = 'daily' | 'alternate' | 'weekly' | 'custom';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'pending_review';

export interface Subscription {
  id: string;
  user_id: string;
  product_id: string;
  variant_id: string;
  volume: number;
  plan: SubscriptionPlan;
  delivery_slot: string | null;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string | null;
  next_delivery_date: string;
  pause_until: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  product_name?: string;
  product_image?: string;
  variant_weight?: string;
  price?: number;
  user_name?: string;
  user_phone?: string;
}

export interface ModificationReport {
  id: string;
  subscription_id: string;
  user_id: string;
  action: 'pause' | 'resume' | 'change_volume' | 'change_plan' | 'cancel';
  new_volume: number | null;
  new_plan: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  admin_notes: string | null;
  created_at: string;
}
