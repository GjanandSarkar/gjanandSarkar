import crypto from 'crypto';
import { generateOtp, verifyRazorpaySignature, generateCode } from '../../src/utils/crypto';

export async function runCryptoTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: Generate 6-digit numeric OTP
  try {
    const otp = generateOtp();
    if (!/^\d{6}$/.test(otp)) {
      throw new Error(`Generated OTP "${otp}" is not a valid 6-digit number`);
    }
    results.push({ name: 'Crypto: Generates secure 6-digit OTP', passed: true });
  } catch (err: any) {
    results.push({ name: 'Crypto: Generates secure 6-digit OTP', passed: false, error: err.message });
  }

  // Test 2: Razorpay signature verification
  try {
    const orderId = 'order_test_123';
    const paymentId = 'pay_test_456';
    const secret = 'super_secret_key_789';

    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const isValid = verifyRazorpaySignature(orderId, paymentId, validSignature, secret);
    if (!isValid) {
      throw new Error('Expected signature to be verified as valid');
    }

    const isInvalid = verifyRazorpaySignature(orderId, paymentId, 'invalid_sig', secret);
    if (isInvalid) {
      throw new Error('Expected forged signature to fail verification');
    }

    results.push({ name: 'Crypto: Timing-safe Razorpay HMAC verification', passed: true });
  } catch (err: any) {
    results.push({ name: 'Crypto: Timing-safe Razorpay HMAC verification', passed: false, error: err.message });
  }

  // Test 3: Generate order number
  try {
    const code = generateCode('ORD', 8);
    if (!code.startsWith('ORD-') || code.length < 8) {
      throw new Error(`Invalid generated code format: ${code}`);
    }
    results.push({ name: 'Crypto: Generates formatted unique codes', passed: true });
  } catch (err: any) {
    results.push({ name: 'Crypto: Generates formatted unique codes', passed: false, error: err.message });
  }

  return results;
}
