export type CouponType = 'percentage' | 'flat';

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  min_order_value: number;
  max_discount: number | null;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expiry_date: string | null;
  created_at: string;
}
