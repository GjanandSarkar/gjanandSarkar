import { supabase } from '@/lib/supabase';
import type { DBSubscription, DBModificationReport } from '@/lib/supabase';
import { createNotification } from './notifications';
import { api } from './client';

// ─── Types ────────────────────────────────────────────────────

export type SubscriptionWithProduct = DBSubscription & {
  products: NonNullable<DBSubscription['products']>;
};

export type NewSubscriptionInput = {
  userId: string;
  productId: string;
  volume: number;
  plan: 'weekly' | 'monthly';
  startDate: string;
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
  try {
    const result = await api.subscriptions.create({
      userId: input.userId,
      productId: input.productId,
      volume: input.volume,
      plan: input.plan,
      startDate: input.startDate,
    });
    return { success: result.success, id: result.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
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
  try {
    const result = await api.subscriptions.update({
      subId: input.subscriptionId,
      action: 'modify',
      newVolume: input.newVolume,
      newPlan: input.newPlan,
    });
    return { success: result.success };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
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
