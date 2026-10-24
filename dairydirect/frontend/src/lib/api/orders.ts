import type { DBOrder, DBOrderItem } from '@/lib/supabase';
import { api } from './client';

// ─── Types ────────────────────────────────────────────────────

export type OrderWithItems = Omit<DBOrder, 'order_items'> & {
  order_items: (DBOrderItem & {
    products?: { 
      name: string; 
      image_url: string | null;
      seller_id?: string | null;
      sellers?: {
        id: string;
        store_name: string;
        slug: string;
      } | null;
    };
    product_variants?: { weight: string; price?: number };
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
  reservationId?: string;
  // Razorpay-specific fields (required when paymentMethod is 'razorpay')
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
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
export async function getAllOrders(
  options?: string | { status?: string; type?: 'admin' | 'seller'; sellerId?: string }
): Promise<OrderWithItems[]> {
  try {
    let url = '/api/orders';
    const params = new URLSearchParams();

    if (typeof options === 'string') {
      if (options && options !== 'all') params.set('status', options);
    } else if (options && typeof options === 'object') {
      if (options.status && options.status !== 'all') params.set('status', options.status);
      if (options.type) params.set('type', options.type);
      if (options.sellerId && options.sellerId !== 'all') params.set('sellerId', options.sellerId);
    }

    const queryStr = params.toString();
    if (queryStr) {
      url += `?${queryStr}`;
    }

    const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
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
    // Coerce Supabase numeric fields (PostgreSQL `numeric` columns come as strings)
    const sanitizedInput = {
      ...input,
      items: input.items.map(item => ({
        ...item,
        price: typeof item.price === 'string' ? parseFloat(item.price as any) : Number(item.price ?? 0),
        quantity: Number(item.quantity),
      })),
    };

    // Use authenticated fetchApi wrapper (sends Supabase Bearer token automatically)
    const data = await api.orders.place(sanitizedInput);
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

// ─── Get Seller Orders ────────────────────────────────────────
export async function getSellerOrders(status?: string): Promise<OrderWithItems[]> {
  try {
    const url = status && status !== 'all' ? `/api/orders?status=${status}` : '/api/orders';
    const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
    const data = await res.json();
    return data.orders || [];
  } catch (error) {
    console.error('getSellerOrders error:', error);
    return [];
  }
}

export type { DBReturnRequest } from '@/lib/supabase';

// ─── Admin / User / Seller: Update / Cancel Order ─────────────
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  userId?: string,
  notes?: string,
  orderItemId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ orderId, status, notes, orderItemId })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update status');
    return { success: true };
  } catch (error: any) {
    console.error('updateOrderStatus error:', error);
    return { success: false, error: error.message };
  }
}

// ─── Customer: Submit Order Item Request (Cancellation or Return) ─
export async function submitOrderRequest(input: {
  orderId: string;
  orderItemId: string;
  requestType: 'cancellation' | 'return';
  reason: string;
  description?: string;
  images?: string[];
}): Promise<{ success: boolean; requestId?: string; error?: string; message?: string }> {
  try {
    const res = await fetch('/api/admin/returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit request');
    return { success: true, requestId: data.requestId || data.returnId, message: data.message };
  } catch (error: any) {
    console.error('submitOrderRequest error:', error);
    return { success: false, error: error.message };
  }
}

// ─── Seller / Admin: Process Request (Approve / Reject / Operational) ─
export async function processOrderRequest(input: {
  requestId: string;
  action: 'approve' | 'reject' | 'override' | 'return_in_progress' | 'item_received' | 'inspection_completed' | 'refund_pending' | 'refunded';
  reason?: string;
  notes?: string;
  refundAmount?: number;
}): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const res = await fetch('/api/admin/returns', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to process request');
    return { success: true, message: data.message };
  } catch (error: any) {
    console.error('processOrderRequest error:', error);
    return { success: false, error: error.message };
  }
}
