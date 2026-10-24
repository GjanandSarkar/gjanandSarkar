import { supabaseAdmin } from '@/lib/supabase/admin';

const COPY: Record<string, [string, string]> = {
  order_cancelled: ['Order cancelled', 'Your order has been cancelled. Any payment will be refunded.'],
  order_confirmed: ['Order confirmed', 'Your order has been confirmed and is being processed.'],
  order_processing: ['Order packed', 'Your order has been packed and is ready for dispatch.'],
  order_out_for_delivery: ['Out for delivery', 'Your order is on the way.'],
  order_delivered: ['Delivered', 'Your order was delivered. You can return or replace items within the policy window.'],
  return_initiated: ['Return started', 'Your return request was created.'],
  replacement_initiated: ['Replacement started', 'Your replacement request was created.'],
  return_picked_up: ['Return picked up', 'We collected your item.'],
  return_received: ['Return received', 'We received your item. Your refund is starting.'],
  replacement_picked_up: ['Item picked up', 'Your item is on the way back to the seller.'],
  replacement_received: ['Item received', 'The seller received your item.'],
  replacement_completed: ['Replacement dispatched', 'Your replacement has been sent.'],
  refund_failed: ['Refund failed', 'A refund transaction encountered an issue and is awaiting review.'],
  refund_completed: ['Refund processed', 'Your refund has been sent to your bank. It can take 5 to 7 working days to show in your account.'],
};

export async function notify(
  roles: ('customer' | 'seller' | 'admin')[],
  type: string,
  relatedId: string,
  customerId?: string,
  sellerId?: string
) {
  try {
    const [title, message] = COPY[type] ?? [type, type];
    let sellerUserId: string | null = null;

    if (roles.includes('seller') && sellerId) {
      const { data: seller } = await supabaseAdmin
        .from('sellers')
        .select('user_id')
        .eq('id', sellerId)
        .maybeSingle();
      sellerUserId = seller?.user_id ?? null;
    }

    const rows = roles.map((role) => {
      let targetUserId: string | null = null;
      if (role === 'customer') {
        targetUserId = customerId ?? null;
      } else if (role === 'seller') {
        targetUserId = sellerUserId;
      }
      return {
        role_target: role,
        type,
        related_id: String(relatedId),
        title,
        message,
        user_id: targetUserId,
      };
    });

    if (rows.length > 0) {
      await supabaseAdmin.from('notifications').insert(rows);
    }
  } catch (err) {
    console.error('[Notification] Failed to dispatch notifications:', err);
  }
}
