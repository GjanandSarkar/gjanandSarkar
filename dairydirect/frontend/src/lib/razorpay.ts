import Razorpay from 'razorpay';
import crypto from 'crypto';

/**
 * Get a singleton Razorpay client instance.
 * Validates that environment credentials are configured.
 */
export function getRazorpayClient(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error('Razorpay credentials not configured in environment variables');
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
}

/**
 * Cryptographically verifies Razorpay payment signature using HMAC-SHA256.
 * Uses timingSafeEqual to protect against timing attacks.
 * 
 * @param orderId Razorpay Order ID (e.g. order_NZx123...)
 * @param paymentId Razorpay Payment ID (e.g. pay_NZx456...)
 * @param signature Razorpay Signature provided in client response
 * @returns boolean indicating if signature is authentic
 */
export function verifyRazorpayPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error('RAZORPAY_KEY_SECRET is not configured');
  }

  if (!orderId || !paymentId || !signature) {
    return false;
  }

  try {
    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex');

    const expectedBuffer = Buffer.from(generatedSignature, 'hex');
    const receivedBuffer = Buffer.from(signature, 'hex');

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch (error) {
    console.error('[Razorpay] Signature verification error:', error);
    return false;
  }
}
