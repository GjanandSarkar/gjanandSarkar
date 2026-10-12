/**
 * Input Sanitization & Validation
 * Uses Zod for schema validation + custom sanitizers
 */

import { z } from 'zod';

// ─── Common Schemas ───────────────────────────────────────────

// Permissive UUID validator: accepts any 8-4-4-4-12 hex ID.
// Zod's z.string().uuid() enforces strict RFC 4122 (version bits [1-8] only),
// which rejects seeded test IDs like 'aaaa0006-0000-0000-0000-000000000006'.
const uuidLike = z
  .string()
  .regex(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    'Invalid ID format'
  );


import { PHONE_REGEX, validatePhoneNumber } from '@/lib/utils/phone';

export const PhoneSchema = z
  .string()
  .trim()
  .regex(PHONE_REGEX, 'Enter a valid Indian mobile number');

export const OTPSchema = z
  .string()
  .length(6, 'OTP must be 6 digits')
  .regex(/^\d{6}$/, 'OTP must contain only digits');

export const UPISchema = z
  .string()
  .trim()
  .regex(/^[\w.\-]+@[\w]+$/, 'Invalid UPI ID format (e.g. name@okhdfc)');

export const EmailSchema = z
  .string()
  .email('Invalid email address')
  .max(254);

export const NameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Name too long')
  .regex(/^[a-zA-Z\s\u0900-\u097F]+$/, 'Name can only contain letters');

export const AddressTypeSchema = z.enum(['house', 'apartment', 'business', 'other']);

export const AddressSchema = z.object({
  address_type: AddressTypeSchema.default('house'),
  country: z.string().trim().min(1, 'Country is required').default('India'),
  full_name: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100, 'Full name is too long'),
  mobile_number: z
    .string()
    .trim()
    .regex(/^(\+91[\-\s]?)?[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
  flat_house_building: z
    .string()
    .trim()
    .min(1, 'Flat, house no., or building is required')
    .max(200, 'Building info is too long'),
  area_street_sector_village: z
    .string()
    .trim()
    .min(1, 'Area, street, sector, or village is required')
    .max(300, 'Area/street info is too long'),
  landmark: z.string().trim().max(200, 'Landmark is too long').optional().nullable(),
  town_city: z.string().trim().min(1, 'Town/City is required').max(100, 'Town/City is too long'),
  state: z.string().trim().min(1, 'State is required').max(100, 'State is too long'),
  saturday_delivery: z.boolean().default(true),
  sunday_delivery: z.boolean().default(true),
  delivery_instructions: z.string().trim().max(500, 'Instructions too long (max 500 characters)').optional().nullable(),
  is_default: z.boolean().default(false),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),

  // Legacy/alias fields for backward compatibility
  label: z.string().trim().max(50).optional(),
  address: z.string().trim().max(500).optional(),
  building: z.string().trim().max(200).optional().nullable(),
  street: z.string().trim().max(300).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  instructions: z.string().trim().max(500).optional().nullable(),
  photo_url: z.string().trim().max(500).optional().nullable(),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  isDefault: z.boolean().optional(),
});

export const PlaceOrderSchema = z.object({
  items: z.array(z.object({
    productId: uuidLike,
    variantId: uuidLike,
    quantity: z.coerce.number().int().min(1).max(100),
    price: z.coerce.number().optional(),
  })).min(1).max(50),
  addressId: uuidLike,
  paymentMethod: z.enum(['cod', 'upi', 'razorpay', 'card']),
  // paymentStatus is intentionally excluded — always derived server-side
  couponCode: z.string().trim().max(30).optional(),
  upiId: z.string().optional(),
  deliverySlot: z.string().max(50).optional(),
  // Razorpay payment IDs — required when paymentMethod is 'razorpay'
  razorpayOrderId: z.string().min(1).optional(),
  razorpayPaymentId: z.string().min(1).optional(),
  razorpaySignature: z.string().min(1).optional(),
  reservationId: z.string().optional(),
});

export const ProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(100),
  description: z.string().trim().max(2000).optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  is_freshness_guarantee: z.boolean().optional(),
});

export const VariantSchema = z.object({
  id: z.string().uuid().optional(),
  weight: z.string().trim().min(1).max(50),
  price: z.number().positive(),
  original_price: z.number().positive().optional().nullable(),
  cost_price: z.number().positive(),
  stock: z.number().int().min(0).optional().default(0),
  low_stock_threshold: z.number().int().min(0).optional().default(5),
  expiry_date: z.string().optional().nullable(),
  batch_number: z.string().max(50).optional().nullable(),
});

export const CouponSchema = z.object({
  code: z.string().trim().toUpperCase().min(3).max(30).regex(/^[A-Z0-9_]+$/),
  type: z.enum(['flat', 'percentage']),
  value: z.number().positive(),
  min_order_value: z.number().min(0).default(0),
  max_discount: z.number().positive().optional(),
  expiry_date: z.string().datetime().optional(),
  max_uses: z.number().int().positive().optional(),
});

// ─── String Sanitizers ────────────────────────────────────────

/**
 * Remove HTML tags and dangerous characters to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')           // Remove HTML tags
    .replace(/javascript:/gi, '')       // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '')         // Remove event handlers
    .trim();
}

/**
 * Sanitize for SQL string input (belt-and-suspenders — parameterized queries are primary defense)
 */
export function sanitizeForSQL(input: string): string {
  return input.replace(/['";\\]/g, '').trim();
}

/**
 * Validate and sanitize phone number
 */
export function sanitizePhone(phone: string): string | null {
  if (!phone) return null;
  const res = validatePhoneNumber(phone);
  return res.isValid ? res.formatted : null;
}

/**
 * Parse and validate UUID
 */
export function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Validate that a number is a positive decimal (for prices)
 */
export function isValidPrice(value: any): boolean {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0 && num < 1000000;
}
