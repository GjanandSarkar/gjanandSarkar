// src/services/subscription.service.js — Subscription Business Logic

import { supabase, cc, dbError } from '../utils/supabase.js';
import { ApiError } from '../utils/ApiError.js';

const SUBSCRIPTION_SELECT = `
  id, quantity, frequency, start_date, end_date, status, created_at,
  product_variants!variant_id(
    id, label, price,
    products!product_id(id, name, category, image_url)
  )
`;

/**
 * Create a milk subscription
 */
export const createSubscription = async (userId, data) => {
  const { variantId, quantity, frequency, startDate, endDate } = data;

  // Verify variant exists and is MILK
  const { data: variant, error: varErr } = await supabase
    .from('product_variants')
    .select('id, is_active, products!product_id(category)')
    .eq('id', variantId)
    .eq('is_active', true)
    .single();

  if (varErr || !variant) throw new ApiError(404, 'Product variant not found or not available');

  if (variant.products.category !== 'MILK') {
    throw new ApiError(
      400,
      'Subscriptions are only available for Milk products. For Paneer, Ghee, and Buttermilk, please place a one-time order.'
    );
  }

  // Check for duplicate active subscription
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('variant_id', variantId)
    .eq('status', 'ACTIVE')
    .maybeSingle();

  if (existing) {
    throw new ApiError(
      409,
      'You already have an active subscription for this product variant. Cancel it first to create a new one.'
    );
  }

  const { data: sub, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      variant_id: variantId,
      quantity,
      frequency,
      start_date: new Date(startDate).toISOString(),
      end_date: endDate ? new Date(endDate).toISOString() : null,
    })
    .select(SUBSCRIPTION_SELECT)
    .single();

  dbError(error, 'Failed to create subscription');
  return cc(sub);
};

/**
 * Get authenticated user's subscriptions
 */
export const getMySubscriptions = async (userId, status) => {
  let query = supabase
    .from('subscriptions')
    .select(SUBSCRIPTION_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  dbError(error, 'Failed to fetch subscriptions');
  return cc(data || []);
};

/**
 * Cancel a subscription (ownership verified)
 */
export const cancelSubscription = async (userId, subscriptionId) => {
  const { data: sub, error: findErr } = await supabase
    .from('subscriptions')
    .select('id, status')
    .eq('id', subscriptionId)
    .eq('user_id', userId)
    .single();

  if (findErr || !sub) throw new ApiError(404, 'Subscription not found');
  if (sub.status === 'CANCELLED') throw new ApiError(400, 'This subscription is already cancelled');
  if (sub.status === 'EXPIRED') throw new ApiError(400, 'This subscription has already expired');

  const { data: updated, error } = await supabase
    .from('subscriptions')
    .update({ status: 'CANCELLED' })
    .eq('id', subscriptionId)
    .select('id, status, updated_at')
    .single();

  dbError(error, 'Failed to cancel subscription');
  return cc(updated);
};

/**
 * Pause a subscription
 */
export const pauseSubscription = async (userId, subscriptionId) => {
  const { data: sub, error: findErr } = await supabase
    .from('subscriptions')
    .select('id, status')
    .eq('id', subscriptionId)
    .eq('user_id', userId)
    .single();

  if (findErr || !sub) throw new ApiError(404, 'Subscription not found');
  if (sub.status !== 'ACTIVE') {
    throw new ApiError(400, `Cannot pause subscription with status: ${sub.status}`);
  }

  const { data: updated, error } = await supabase
    .from('subscriptions')
    .update({ status: 'PAUSED' })
    .eq('id', subscriptionId)
    .select('id, status, updated_at')
    .single();

  dbError(error, 'Failed to pause subscription');
  return cc(updated);
};

/**
 * Resume a paused subscription
 */
export const resumeSubscription = async (userId, subscriptionId) => {
  const { data: sub, error: findErr } = await supabase
    .from('subscriptions')
    .select('id, status')
    .eq('id', subscriptionId)
    .eq('user_id', userId)
    .single();

  if (findErr || !sub) throw new ApiError(404, 'Subscription not found');
  if (sub.status !== 'PAUSED') {
    throw new ApiError(400, `Can only resume PAUSED subscriptions. Current status: ${sub.status}`);
  }

  const { data: updated, error } = await supabase
    .from('subscriptions')
    .update({ status: 'ACTIVE' })
    .eq('id', subscriptionId)
    .select('id, status, updated_at')
    .single();

  dbError(error, 'Failed to resume subscription');
  return cc(updated);
};
