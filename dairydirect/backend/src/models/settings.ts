export interface BusinessSettings {
  id: string;
  min_order_value: number;
  standard_delivery_fee: number;
  delivery_cost: number;
  free_delivery_threshold: number;
  min_profit_margin_percent: number;
  max_discount_percent: number;
  freshness_guarantee_hours: number;
  is_store_open: boolean;
  store_closure_reason: string | null;
  support_phone: string;
  support_email: string;
  razorpay_enabled: boolean;
  cod_enabled: boolean;
  gst_rate_percent: number;
  updated_at: string;
}
