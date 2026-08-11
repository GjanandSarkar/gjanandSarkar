export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod =
  | 'COD'
  | 'Razorpay'
  | 'UPI'
  | 'Card'
  | 'NetBanking'
  | 'Wallet';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string | null;
  variant_weight: string | null;
  quantity: number;
  price: number;
  cost_price: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  address_id: string | null;
  shipping_address: string | null;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_details: any;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  delivery_slot: string | null;
  delivery_date: string | null;
  coupon_code: string | null;
  loyalty_earned: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  user_name?: string;
  user_phone?: string;
  user_email?: string;
}
