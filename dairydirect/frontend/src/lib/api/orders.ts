import type { DBOrder, DBOrderItem } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────

export type OrderWithItems = Omit<DBOrder, 'order_items'> & {
  order_items: (DBOrderItem & {
    products?: { name: string; image_url: string | null };
    product_variants?: { weight: string };
    product_name?: string;
    product_image?: string | null;
    weight?: string;
  })[];
  user_addresses?: { 
    id: string;
    label: string;
    address: string;
    apartment?: string;
  };
  profiles?: {
    name?: string;
    phone?: string;
    email?: string;
  };
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

export async function getUserOrders(userId?: string): Promise<OrderWithItems[]> {
  try {
    const res = await fetch('/api/orders');
    const data = await res.json();
    return data.orders || [];
  } catch (error) {
    console.error('getUserOrders error:', error);
    return [];
  }
}

export async function getUserBuyAgainHistory(): Promise<string[]> {
  try {
    const res = await fetch('/api/orders?history=true');
    const data = await res.json();
    return data.productIds || [];
  } catch (error) {
    console.error('getUserBuyAgainHistory error:', error);
    return [];
  }
}

// ─── Get All Orders (Admin) ───────────────────────────────────
export async function getAllOrders(status?: string): Promise<OrderWithItems[]> {
  try {
    const url = status ? `/api/orders?status=${status}` : '/api/orders';
    const res = await fetch(url);
    const data = await res.json();
    return data.orders || [];
  } catch (error) {
    console.error('getAllOrders error:', error);
    return [];
  }
}

// ─── Get Single Order ─────────────────────────────────────────
export async function getOrderById(orderId: string): Promise<OrderWithItems | null> {
  try {
    const res = await fetch(`/api/orders?id=${orderId}`);
    const data = await res.json();
    return data.order || null;
  } catch (error) {
    console.error('getOrderById error:', error);
    return null;
  }
}

// ─── Place Order ──────────────────────────────────────────────
export async function placeOrder(
  input: PlaceOrderInput
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const res = await fetch('/api/orders/place', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderData: input })
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

// ─── Admin / User: Update / Cancel Order ───────────────────────
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update status');
    return { success: true };
  } catch (error: any) {
    console.error('updateOrderStatus error:', error);
    return { success: false, error: error.message };
  }
}
