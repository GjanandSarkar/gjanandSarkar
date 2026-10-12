/**
 * Phone Validation & Formatting Utility
 * Enforces Indian mobile number standard: +91XXXXXXXXXX
 * Pattern: ^\+91[6-9][0-9]{9}$
 */

export const PHONE_REGEX = /^\+91[6-9][0-9]{9}$/;

export interface PhoneValidationResult {
  isValid: boolean;
  formatted: string;
  error?: string;
}

/**
 * Validates a complete phone number against ^\+91[6-9][0-9]{9}$
 */
export function validatePhoneNumber(phone: string): PhoneValidationResult {
  if (!phone || !phone.trim()) {
    return {
      isValid: false,
      formatted: '',
      error: 'Enter a valid Indian mobile number',
    };
  }

  let cleaned = phone.trim();

  // If user passed number without +91 prefix
  if (!cleaned.startsWith('+91')) {
    const digitsOnly = cleaned.replace(/\D/g, '');
    if (digitsOnly.length === 10) {
      cleaned = `+91${digitsOnly}`;
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      cleaned = `+${digitsOnly}`;
    } else {
      cleaned = `+91${digitsOnly}`;
    }
  }

  if (!PHONE_REGEX.test(cleaned)) {
    return {
      isValid: false,
      formatted: cleaned,
      error: 'Enter a valid Indian mobile number',
    };
  }

  return {
    isValid: true,
    formatted: cleaned,
  };
}

/**
 * Sanitizes and formats phone input during typing
 * Ensures +91 prefix, accepts only digits after +91, and limits to 10 digits after +91.
 */
export function formatPhoneInput(value: string): string {
  if (!value) return '+91';

  let raw = value.trim();

  if (raw.startsWith('+91')) {
    const digitsAfter = raw.slice(3).replace(/\D/g, '').slice(0, 10);
    return `+91${digitsAfter}`;
  }

  if (raw.startsWith('+')) {
    const digitsOnly = raw.slice(1).replace(/\D/g, '');
    if (digitsOnly.startsWith('91')) {
      return `+91${digitsOnly.slice(2).slice(0, 10)}`;
    }
    return `+91${digitsOnly.slice(0, 10)}`;
  }

  const digitsOnly = raw.replace(/\D/g, '');
  if (digitsOnly.startsWith('91') && digitsOnly.length > 10) {
    return `+91${digitsOnly.slice(2).slice(0, 10)}`;
  }
  return `+91${digitsOnly.slice(0, 10)}`;
}
