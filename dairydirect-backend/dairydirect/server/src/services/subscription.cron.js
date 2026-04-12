// src/services/subscription.cron.js — Auto Order Generation Cron Job
// Runs at 4:00 AM IST every day

import cron from 'node-cron';
import { supabase } from '../utils/supabase.js';
import { logger } from '../utils/logger.js';

const isDeliveryDay = (subscription, today) => {
  const { frequency, start_date } = subscription;
  const start = new Date(start_date);

  switch (frequency) {
    case 'DAILY':
      return true;
    case 'WEEKLY':
      return today.getDay() === start.getDay();
    case 'MONTHLY': {
      const startDay = start.getDate();
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const targetDay = Math.min(startDay, lastDayOfMonth);
      return today.getDate() === targetDay;
    }
    default:
      return false;
  }
};

export const generateSubscriptionOrders = async (targetDate = new Date()) => {
  const today = new Date(targetDate);
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  logger.info(`[CRON] Generating subscription orders for: ${today.toDateString()}`);

  // Fetch all active subscriptions whose date window covers today
  const { data: activeSubscriptions, error: subErr } = await supabase
    .from('subscriptions')
    .select(`
      id, user_id, variant_id, quantity, frequency, start_date, end_date,
      users!user_id(
        id,
        addresses(id, is_default)
      ),
      product_variants!variant_id(
        id, price, product_id,
        products!product_id(id, name)
      )
    `)
    .eq('status', 'ACTIVE')
    .lte('start_date', today.toISOString())
    .or(`end_date.is.null,end_date.gte.${today.toISOString()}`);

  if (subErr) {
    logger.error('[CRON] Failed to fetch subscriptions:', subErr.message);
    return { error: subErr.message };
  }

  logger.info(`[CRON] Found ${activeSubscriptions?.length || 0} active subscriptions`);

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const sub of activeSubscriptions || []) {
    try {
      if (!isDeliveryDay(sub, today)) { skipped++; continue; }

      // Skip if an order already exists today for this subscription
      const { data: existing } = await supabase
        .from('orders')
        .select('id')
        .eq('subscription_id', sub.id)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .maybeSingle();

      if (existing) { skipped++; continue; }

      // Get default address
      const defaultAddress = sub.users?.addresses?.find((a) => a.is_default);
      if (!defaultAddress) {
        logger.warn(`[CRON] Skipping sub ${sub.id} — user ${sub.user_id} has no default address`);
        skipped++;
        continue;
      }

      const variant = sub.product_variants;
      const unitPrice = parseFloat(variant.price);
      const total = unitPrice * sub.quantity;

      // Create subscription order
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          user_id: sub.user_id,
          address_id: defaultAddress.id,
          subscription_id: sub.id,
          type: 'SUBSCRIPTION',
          status: 'CONFIRMED',
          total_amount: total,
          payment_mode: 'SUBSCRIPTION',
          payment_status: 'PAID',
        })
        .select('id')
        .single();

      if (orderErr) throw orderErr;

      await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: variant.product_id,
        variant_id: sub.variant_id,
        quantity: sub.quantity,
        unit_price: unitPrice,
        subtotal: total,
      });

      generated++;
    } catch (err) {
      logger.error(`[CRON] Failed to generate order for subscription ${sub.id}:`, err);
      failed++;
    }
  }

  const summary = {
    date: today.toISOString(),
    total: activeSubscriptions?.length || 0,
    generated,
    skipped,
    failed,
  };

  logger.info('[CRON] Subscription order generation complete:', summary);
  return summary;
};

// '30 22 * * *' = 22:30 UTC = 04:00 IST
export const startSubscriptionCron = () => {
  cron.schedule(
    '30 22 * * *',
    async () => {
      try {
        await generateSubscriptionOrders();
      } catch (err) {
        logger.error('[CRON] Cron job failed:', err);
      }
    },
    { timezone: 'UTC' }
  );

  logger.info('[CRON] Subscription order cron registered (04:00 AM IST daily)');
};
