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
  variantId?: string;
  volume: number;
  plan: 'daily' | 'alternate' | 'weekly' | 'custom' | string;
  startDate: string;
  addressId?: string;
  deliverySlot?: string;
};

// ─── Generate IDs ─────────────────────────────────────────────
function genSubId(): string {
  return `SUB-${Math.floor(100 + Math.random() * 900)}`;
}

function genRepId(): string {
  return `REP-${Math.floor(1000 + Math.random() * 9000)}`;
}

// ─── Get User Subscriptions ───────────────────────────────────
export async function getUserSubscriptions(_userId?: string): Promise<SubscriptionWithProduct[]> {
  // Read through the authenticated API rather than the browser Supabase
  // client. The client has no Supabase session (auth is a custom JWT cookie),
  // so it acts as `anon` — which the Nov 2026 RLS hardening revoked from
  // personal tables. The route scopes rows to the caller's JWT either way.
  try {
    const result = await api.subscriptions.get();
    return (result.subscriptions ?? []) as SubscriptionWithProduct[];
  } catch (err) {
    console.error('getUserSubscriptions error:', err);
    return [];
  }
}

// ─── Get All Subscriptions (Admin) ───────────────────────────
export async function getAllSubscriptions(): Promise<
  (SubscriptionWithProduct & { profiles?: { name: string; phone: string } })[]
> {
  try {
    const result = await api.subscriptions.get();
    return (result.subscriptions ?? []) as (SubscriptionWithProduct & {
      profiles?: { name: string; phone: string };
    })[];
  } catch (err) {
    console.error('getAllSubscriptions error:', err);
    return [];
  }
}

// ─── Create Subscription ──────────────────────────────────────
export async function createSubscription(
  input: NewSubscriptionInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const result = await api.subscriptions.create({
      userId: input.userId,
      productId: input.productId,
      variantId: input.variantId,
      volume: input.volume,
      plan: input.plan,
      startDate: input.startDate,
      addressId: input.addressId,
      deliverySlot: input.deliverySlot,
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
  try {
    await api.subscriptions.update({ subId, action: currentStatus === 'paused' ? 'resume' : 'pause' });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── Cancel Subscription ──────────────────────────────────────
export async function cancelSubscription(
  subId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await api.subscriptions.update({ subId, action: 'cancel' });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
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
