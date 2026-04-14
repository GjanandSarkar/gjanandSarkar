import { supabase } from '@/lib/supabase';
import type { DBOrder, DBOrderItem } from '@/lib/supabase';
import { createNotification } from './notifications';

// ─── Types ────────────────────────────────────────────────────

export type OrderWithItems = DBOrder & {
  order_items: DBOrderItem[];
};

export type PlaceOrderInput = {
  userId: string;
  customerName: string;
  customerPhone: string;
  items: {
    productId: string;
    variantId: string;
    productName: string;
    variantWeight: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  addressId: string;
  paymentMethod: string;
  paymentStatus: string;
  couponCode?: string;
  upiId?: string;
};

export type OrderStatus = DBOrder['status'];

// ─── Generate Order ID ────────────────────────────────────────
function generateOrderId(): string {
  return `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
}

// ─── Get User Orders ─────────────────────────────────────────
export async function getUserOrders(userId: string): Promise<OrderWithItems[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getUserOrders error:', error);
    return [];
  }

  return (data as OrderWithItems[]) ?? [];
}

// ─── Get Buy Again History ───────────────────────────────────
export async function getUserBuyAgainHistory(): Promise<string[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];
  
  const res = await fetch(`/api/orders?token=${session.access_token}&history=true`);
  const data = await res.json();
  return data.productIds || [];
}

// ─── Get All Orders (Admin) ───────────────────────────────────
export async function getAllOrders(): Promise<OrderWithItems[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getAllOrders error:', error);
    return [];
  }

  return (data as OrderWithItems[]) ?? [];
}

// ─── Get Single Order ─────────────────────────────────────────
export async function getOrderById(orderId: string): Promise<OrderWithItems | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('getOrderById error:', error);
    return null;
  }

  return data as OrderWithItems;
}

// ─── Place Order ──────────────────────────────────────────────
export async function placeOrder(
  input: PlaceOrderInput
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('User not authenticated');
    const token = session.access_token;

    const res = await fetch('/api/orders/place', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        orderData: input
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to place order');

    return { success: true, orderId: data.orderId };
  } catch (error: any) {
    console.error('placeOrder error:', error);
    return { success: false, error: error.message };
  }
}

// ─── Validate Coupon ──────────────────────────────────────────
export async function validateCoupon(
  items: { variantId: string; quantity: number }[],
  couponCode: string
): Promise<{ 
  valid: boolean; 
  discount: number; 
  total: number; 
  subtotal: number;
  deliveryFee: number;
  nextTierAmount?: number;
  message?: string;
}> {
  try {
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, couponCode })
    });
    return await res.json();
  } catch (error) {
    console.error('validateCoupon error:', error);
    return { valid: false, discount: 0, total: 0, subtotal: 0, deliveryFee: 0, message: 'Connection error' };
  }
}

// ─── Admin: Update Order Status ───────────────────────────────
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) return { success: false, error: error.message };

  // Notify the customer whose order was updated
  if (userId) {
    await createNotification({
      userId,
      roleTarget: 'customer',
      title: `Order ${orderId} Update`,
      body: `Your order is now: ${status}.`,
      type: 'order',
      relatedId: orderId,
    });
  }

  return { success: true };
}
