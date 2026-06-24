import { supabase } from '@/lib/supabase';
import type { DBSubscription, DBModificationReport } from '@/lib/supabase';
import { createNotification } from './notifications';

// ─── Types ────────────────────────────────────────────────────

export type SubscriptionWithProduct = DBSubscription & {
  products: NonNullable<DBSubscription['products']>;
};

export type NewSubscriptionInput = {
  userId: string;
  productId: string;
  volume: number;
  plan: 'weekly' | 'monthly';
};

// ─── Generate IDs ─────────────────────────────────────────────
function genSubId(): string {
  return `SUB-${Math.floor(100 + Math.random() * 900)}`;
}

function genRepId(): string {
  return `REP-${Math.floor(1000 + Math.random() * 9000)}`;
}

// ─── Get User Subscriptions ───────────────────────────────────
export async function getUserSubscriptions(userId: string): Promise<SubscriptionWithProduct[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, products(*)')
    .eq('user_id', userId)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getUserSubscriptions error:', error);
    return [];
  }

  return (data as SubscriptionWithProduct[]) ?? [];
}

// ─── Get All Subscriptions (Admin) ───────────────────────────
export async function getAllSubscriptions(): Promise<
  (SubscriptionWithProduct & { profiles?: { name: string; phone: string } })[]
> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, products(*), profiles:user_id(name, phone)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getAllSubscriptions error:', error);
    return [];
  }

  return data as any[];
}

// ─── Create Subscription ──────────────────────────────────────
export async function createSubscription(
  input: NewSubscriptionInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  const nextDeliveryDate = new Date(Date.now() + 86400000).toISOString().split('T')[0]; // tomorrow

  const { error } = await supabase.from('subscriptions').insert({
    user_id: input.userId,
    product_id: input.productId,
    volume: input.volume,
    plan: input.plan,
    status: 'active',
    next_delivery_date: nextDeliveryDate,
  });

  if (error) return { success: false, error: error.message };

  // Notify customer
  await createNotification({
    userId: input.userId,
    roleTarget: 'customer',
    title: 'Subscription Active! 🥛',
    body: `Your daily milk subscription starts tomorrow, 7–9 AM.`,
    type: 'subscription',
    relatedId: '',
  });

  return { success: true };
}

// ─── Pause / Resume Subscription ─────────────────────────────
export async function pauseSubscription(
  subId: string,
  currentStatus: string
): Promise<{ success: boolean; error?: string }> {
  const newStatus = currentStatus === 'paused' ? 'active' : 'paused';
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: newStatus })
    .eq('id', subId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── Cancel Subscription ──────────────────────────────────────
export async function cancelSubscription(
  subId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('id', subId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── Submit Modification Report ───────────────────────────────
export async function submitModificationReport(input: {
  subscriptionId: string;
  userId: string;
  newVolume: number;
  newPlan: 'weekly' | 'monthly';
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const { error: reportError } = await supabase.from('modification_reports').insert({
    subscription_id: input.subscriptionId,
    user_id: input.userId,
    new_volume: input.newVolume,
    new_plan: input.newPlan,
    status: 'pending',
  });

  if (reportError) return { success: false, error: reportError.message };

  await supabase
    .from('subscriptions')
    .update({ status: 'pending_review' })
    .eq('id', input.subscriptionId);

  await createNotification({
    userId: null,
    roleTarget: 'admin',
    title: 'Modification Request',
    body: `A customer requested to modify subscription ${input.subscriptionId}.`,
    type: 'subscription',
    relatedId: input.subscriptionId,
  });

  return { success: true };
}

// ─── Admin: Get Pending Modification Reports ──────────────────
export async function getPendingReports(): Promise<
  (DBModificationReport & {
    subscriptions?: { id: string; volume: number; plan: string };
    profiles?: { name: string; phone: string };
  })[]
> {
  const { data, error } = await supabase
    .from('modification_reports')
    .select('*, subscriptions(id, volume, plan, product_id), profiles:user_id(name, phone)')
    .eq('status', 'Pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getPendingReports error:', error);
    return [];
  }

  return data as any[];
}

// ─── Admin: Accept Modification Report ────────────────────────
export async function acceptModificationReport(
  reportId: string,
  report: { subscription_id: string; new_volume: number; new_plan: string; user_id: string }
): Promise<{ success: boolean; error?: string }> {
  const { error: rErr } = await supabase
    .from('modification_reports')
    .update({ status: 'accepted' })
    .eq('id', reportId);

  if (rErr) return { success: false, error: rErr.message };

  const { error: sErr } = await supabase
    .from('subscriptions')
    .update({
      volume: report.new_volume,
      plan: report.new_plan,
      status: 'active',
    })
    .eq('id', report.subscription_id);

  if (sErr) return { success: false, error: sErr.message };

  await createNotification({
    userId: report.user_id,
    roleTarget: 'customer',
    title: 'Modification Accepted ✅',
    body: `Your subscription ${report.subscription_id} has been updated.`,
    type: 'subscription',
    relatedId: report.subscription_id,
  });

  return { success: true };
}

// ─── Admin: Reject Modification Report ────────────────────────
export async function rejectModificationReport(
  reportId: string,
  report: { subscription_id: string; user_id: string }
): Promise<{ success: boolean; error?: string }> {
  const { error: rErr } = await supabase
    .from('modification_reports')
    .update({ status: 'rejected' })
    .eq('id', reportId);

  if (rErr) return { success: false, error: rErr.message };

  await supabase
    .from('subscriptions')
    .update({ status: 'active' })
    .eq('id', report.subscription_id);

  await createNotification({
    userId: report.user_id,
    roleTarget: 'customer',
    title: 'Modification Rejected ❌',
    body: `Your modification request for ${report.subscription_id} was not approved.`,
    type: 'subscription',
    relatedId: report.subscription_id,
  });

  return { success: true };
}
