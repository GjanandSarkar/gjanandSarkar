/**
 * Shared, India-aware field validators.
 *
 * Every validator returns `null` when the value is acceptable and a
 * human-readable message when it is not, so a form can do:
 *
 *   const err = validatePincode(pincode);
 *   if (err) errors.pincode = err;
 *
 * These are CLIENT-SIDE guards that catch mistakes early and explain them.
 * They are not a security boundary: the API routes still validate and
 * sanitise everything they receive, because anything sent from a browser can
 * be forged.
 */

export type ValidationError = string | null;

/** Trimmed length, treating null/undefined as empty. */
const len = (v: string | null | undefined) => (v ?? '').trim().length;

export function validateRequired(value: string | null | undefined, label: string): ValidationError {
  return len(value) === 0 ? `${label} is required` : null;
}

export function validateName(value: string | null | undefined, label = 'Name'): ValidationError {
  const v = (value ?? '').trim();
  if (!v) return `${label} is required`;
  if (v.length < 2) return `${label} must be at least 2 characters`;
  if (v.length > 80) return `${label} must be under 80 characters`;
  // Indian names legitimately contain spaces, apostrophes, dots and hyphens.
  if (!/^[\p{L}\s'.-]+$/u.test(v)) return `${label} can only contain letters, spaces, apostrophes, dots and hyphens`;
  return null;
}

/**
 * Indian mobile: ten digits starting 6-9. Accepts and ignores a leading +91,
 * 91 or 0, and any spaces or dashes the user pasted in.
 */
export function validateIndianMobile(value: string | null | undefined): ValidationError {
  const raw = (value ?? '').replace(/[\s-()]/g, '');
  if (!raw) return 'Mobile number is required';
  const digits = raw.replace(/^(\+?91|0)/, '');
  if (!/^\d+$/.test(digits)) return 'Mobile number can only contain digits';
  if (digits.length !== 10) return 'Enter a 10-digit mobile number';
  if (!/^[6-9]/.test(digits)) return 'Indian mobile numbers start with 6, 7, 8 or 9';
  return null;
}

/** Indian PIN code: exactly six digits, and the first cannot be 0. */
export function validatePincode(value: string | null | undefined): ValidationError {
  const v = (value ?? '').trim();
  if (!v) return 'Pincode is required';
  if (!/^\d+$/.test(v)) return 'Pincode can only contain digits';
  if (v.length !== 6) return 'Pincode must be exactly 6 digits';
  if (v.startsWith('0')) return 'An Indian pincode does not start with 0';
  return null;
}

export function validateEmail(value: string | null | undefined, required = true): ValidationError {
  const v = (value ?? '').trim();
  if (!v) return required ? 'Email is required' : null;
  // Deliberately permissive: the only authoritative test is sending a mail.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Enter a valid email address, like name@example.com';
  if (v.length > 254) return 'Email address is too long';
  return null;
}

export function validateAddressLine(value: string | null | undefined, label: string): ValidationError {
  const v = (value ?? '').trim();
  if (!v) return `${label} is required`;
  if (v.length < 3) return `${label} looks too short`;
  if (v.length > 200) return `${label} must be under 200 characters`;
  return null;
}

/** A price or amount in rupees. */
export function validateAmount(
  value: string | number | null | undefined,
  label = 'Amount',
  { min = 0, max = 10_000_000, allowZero = false }: { min?: number; max?: number; allowZero?: boolean } = {}
): ValidationError {
  const v = typeof value === 'number' ? value : parseFloat((value ?? '').toString().trim());
  if (value === '' || value === null || value === undefined || Number.isNaN(v)) return `${label} is required`;
  if (!Number.isFinite(v)) return `${label} must be a number`;
  if (v < 0) return `${label} cannot be negative`;
  if (!allowZero && v === 0) return `${label} must be greater than zero`;
  if (v < min) return `${label} must be at least ₹${min}`;
  if (v > max) return `${label} looks too large`;
  // Rupees have at most two decimal places.
  if (!/^\d*(\.\d{1,2})?$/.test(v.toString())) return `${label} can have at most 2 decimal places`;
  return null;
}

/** A whole-number quantity such as stock. */
export function validateQuantity(
  value: string | number | null | undefined,
  label = 'Quantity',
  { min = 0, max = 1_000_000 }: { min?: number; max?: number } = {}
): ValidationError {
  const raw = (value ?? '').toString().trim();
  if (!raw) return `${label} is required`;
  if (!/^\d+$/.test(raw)) return `${label} must be a whole number`;
  const v = parseInt(raw, 10);
  if (v < min) return `${label} must be at least ${min}`;
  if (v > max) return `${label} looks too large`;
  return null;
}

export function validateMaxLength(value: string | null | undefined, max: number, label: string): ValidationError {
  return len(value) > max ? `${label} must be under ${max} characters` : null;
}

/** Run a map of field -> error and return only the failures. */
export function collectErrors(
  checks: Record<string, ValidationError>
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [field, error] of Object.entries(checks)) {
    if (error) errors[field] = error;
  }
  return errors;
}
