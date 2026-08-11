import { couponRepository } from '../repositories/couponRepository';
import { Coupon } from '../models/coupon';
import { NotFoundError, ValidationError } from '../errors/AppError';

export const couponService = {
  async validateCoupon(code: string, subtotal: number): Promise<{
    valid: boolean;
    coupon: Coupon;
    discount: number;
    subtotal: number;
    finalTotal: number;
  }> {
    const cleanCode = code.trim();
    const coupon = await couponRepository.findByCode(cleanCode);

    if (!coupon) {
      throw new ValidationError(`Coupon '${cleanCode}' is invalid or expired`);
    }

    if (subtotal < coupon.min_order_value) {
      throw new ValidationError(
        `Minimum order value of ₹${coupon.min_order_value} required for coupon '${coupon.code}'`
      );
    }

    let discount = 0;
    if (coupon.type === 'flat') {
      discount = coupon.value;
    } else {
      discount = Math.round((subtotal * coupon.value) / 100 * 100) / 100;
      if (coupon.max_discount) {
        discount = Math.min(discount, coupon.max_discount);
      }
    }

    const finalTotal = Math.max(0, subtotal - discount);

    return {
      valid: true,
      coupon,
      discount,
      subtotal,
      finalTotal,
    };
  },

  async listCoupons(): Promise<Coupon[]> {
    return couponRepository.findAll();
  },

  async createCoupon(data: {
    code: string;
    type: 'percentage' | 'flat';
    value: number;
    min_order_value?: number;
    max_discount?: number;
    max_uses?: number;
    expiry_date?: string;
  }): Promise<Coupon> {
    const existing = await couponRepository.findByCode(data.code);
    if (existing) {
      throw new ValidationError(`Coupon with code '${data.code}' already exists`);
    }
    return couponRepository.create(data);
  },

  async updateCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon> {
    const updated = await couponRepository.update(id, updates);
    if (!updated) {
      throw new NotFoundError('Coupon not found');
    }
    return updated;
  },

  async deleteCoupon(id: string): Promise<void> {
    const deleted = await couponRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError('Coupon not found');
    }
  },
};
