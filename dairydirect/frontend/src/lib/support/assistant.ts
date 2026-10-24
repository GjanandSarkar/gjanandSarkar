/**
 * Conversation logic for the support assistant.
 *
 * Kept free of React so the decision-making can be tested directly.
 *
 * Design rule: every sentence about a SPECIFIC order is derived from the
 * order record itself, never from a template that guesses. In particular the
 * refund explanation branches on the real `payment_method` and
 * `payment_status`, because telling a Cash on Delivery customer to "expect
 * their refund in 5-7 days" when no money was ever taken would be a
 * fabrication that generates an angry support call.
 */

import type { OrderWithItems } from '@/lib/api/orders';

export type Sender = 'bot' | 'user';

export interface QuickReply {
  label: string;
  /** Action id handled by the widget. */
  action: string;
  payload?: string;
}

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  /** Optional structured follow-ups rendered as buttons. */
  quickReplies?: QuickReply[];
  /** Renders the message as a non-chatty informational card. */
  tone?: 'default' | 'warning' | 'success';
}

export const ORDER_STATUS_TEXT: Record<string, string> = {
  pending: 'is being confirmed',
  confirmed: 'is confirmed and being prepared',
  out_for_delivery: 'is out for delivery',
  delivered: 'has been delivered',
  cancelled: 'was cancelled',
};

/** True when the customer actually parted with money for this order. */
export function wasPaidOnline(order: Pick<OrderWithItems, 'payment_method' | 'payment_status'>): boolean {
  const method = (order.payment_method || '').toUpperCase();
  if (method === 'COD') return false;
  return order.payment_status === 'paid' || order.payment_status === 'refunded';
}

export function formatOrderLine(order: OrderWithItems): string {
  const when = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const status = ORDER_STATUS_TEXT[order.status] ?? `is ${order.status}`;
  return `${order.order_number} (${when}, ₹${order.total_amount}) ${status}.`;
}

/**
 * The refund explanation for one order, derived from its real payment state.
 */
export function explainRefund(order: OrderWithItems): { text: string; tone: ChatMessage['tone'] } {
  const paidOnline = wasPaidOnline(order);
  const isCod = (order.payment_method || '').toUpperCase() === 'COD';

  if (order.status !== 'cancelled' && order.status !== 'delivered') {
    return {
      text: `${order.order_number} ${ORDER_STATUS_TEXT[order.status] ?? 'is in progress'}, so there is no refund due on it yet. If you want to stop this order you can still cancel it from My Orders.`,
      tone: 'default',
    };
  }

  if (isCod && order.status === 'cancelled') {
    return {
      text: `${order.order_number} was a Cash on Delivery order, and with Cash on Delivery you only pay when the order is handed to you. It was cancelled before delivery, so no money ever left your account and there is nothing to refund. You have not been charged.`,
      tone: 'success',
    };
  }

  if (order.payment_status === 'refunded') {
    return {
      text: `The refund for ${order.order_number} has already been issued back to the payment method you used. Banks usually take 5 to 7 working days to display it. If it has been longer than that, tell me and I will pass it to the team with your order number.`,
      tone: 'success',
    };
  }

  if (paidOnline && order.status === 'cancelled') {
    return {
      text: `${order.order_number} was paid online, so a refund of ₹${order.total_amount} is due back to the method you paid with. Refunds go back along the original payment route and banks typically take 5 to 7 working days to show them. If you would like me to raise this with the team, choose Talk to a human below.`,
      tone: 'default',
    };
  }

  if (isCod && order.status === 'delivered') {
    return {
      text: `${order.order_number} was Cash on Delivery and has been delivered, so the cash was collected at your door. If you are returning an item from it, the money comes back to your UPI or bank account once the return is approved and the item is collected. Request the return from the order in My Orders.`,
      tone: 'default',
    };
  }

  return {
    text: `${order.order_number} has been delivered. If something is wrong with it, request a return from the order in My Orders and we will sort out a replacement or a refund.`,
    tone: 'default',
  };
}

/** The root menu, also used as the fallback when the assistant is unsure. */
export function rootQuickReplies(isSignedIn: boolean): QuickReply[] {
  const replies: QuickReply[] = [];
  if (isSignedIn) {
    replies.push({ label: 'Track an order', action: 'my-orders' });
    replies.push({ label: 'Refund or cancellation', action: 'refund-menu' });
  }
  replies.push({ label: 'Delivery', action: 'topic', payload: 'delivery' });
  replies.push({ label: 'Payments', action: 'topic', payload: 'payments' });
  replies.push({ label: 'Returns', action: 'topic', payload: 'returns' });
  replies.push({ label: 'Talk to a human', action: 'handoff' });
  return replies;
}

export function greeting(isSignedIn: boolean, firstName?: string | null): ChatMessage {
  const who = firstName ? `, ${firstName}` : '';
  return {
    id: 'greet',
    sender: 'bot',
    text: isSignedIn
      ? `Hello${who}. I can check your orders, explain refunds and answer questions about delivery, payments and returns. What do you need?`
      : 'Hello. I can answer questions about delivery, payments, returns and selling with us. Sign in and I can also look up your orders. What do you need?',
    quickReplies: rootQuickReplies(isSignedIn),
  };
}

let counter = 0;
export function newId(prefix = 'm'): string {
  counter += 1;
  return `${prefix}-${counter}-${Date.now().toString(36)}`;
}
