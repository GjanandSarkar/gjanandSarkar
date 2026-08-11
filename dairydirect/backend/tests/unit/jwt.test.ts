import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from '../../src/utils/jwt';

export async function runJwtTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: Sign and verify access token
  try {
    const payload = {
      userId: '11111111-1111-1111-1111-111111111111',
      role: 'customer' as const,
      phone: '+919876543210',
    };

    const token = signAccessToken(payload);
    if (!token || typeof token !== 'string') {
      throw new Error('Failed to generate token');
    }

    const decoded = verifyAccessToken(token);
    if (decoded.userId !== payload.userId || decoded.role !== 'customer') {
      throw new Error('Decoded token payload mismatch');
    }

    results.push({ name: 'JWT: Sign and verify valid access token', passed: true });
  } catch (err: any) {
    results.push({ name: 'JWT: Sign and verify valid access token', passed: false, error: err.message });
  }

  // Test 2: Invalidate tampered token
  try {
    const token = signAccessToken({
      userId: '22222222-2222-2222-2222-222222222222',
      role: 'admin' as const,
    });

    const tampered = token.slice(0, -5) + 'abcde';
    let failedAsExpected = false;

    try {
      verifyAccessToken(tampered);
    } catch {
      failedAsExpected = true;
    }

    if (!failedAsExpected) {
      throw new Error('Tampered token should have failed verification');
    }

    results.push({ name: 'JWT: Rejects tampered token signature', passed: true });
  } catch (err: any) {
    results.push({ name: 'JWT: Rejects tampered token signature', passed: false, error: err.message });
  }

  // Test 3: Sign and verify refresh token
  try {
    const refreshToken = signRefreshToken({ userId: '33333333-3333-3333-3333-333333333333' });
    const decoded = verifyRefreshToken(refreshToken);

    if (decoded.userId !== '33333333-3333-3333-3333-333333333333') {
      throw new Error('Refresh token payload mismatch');
    }

    results.push({ name: 'JWT: Sign and verify refresh token', passed: true });
  } catch (err: any) {
    results.push({ name: 'JWT: Sign and verify refresh token', passed: false, error: err.message });
  }

  return results;
}
