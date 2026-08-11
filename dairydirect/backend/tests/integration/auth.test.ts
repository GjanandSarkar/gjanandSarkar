import { authService } from '../../src/services/authService';

export async function runAuthIntegrationTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: Send OTP
  try {
    const res = await authService.sendOtp('9876543210');
    if (!res.success) {
      throw new Error('sendOtp returned success = false');
    }
    results.push({ name: 'Auth Integration: Send OTP response', passed: true });
  } catch (err: any) {
    results.push({ name: 'Auth Integration: Send OTP response', passed: false, error: err.message });
  }

  // Test 2: Verify OTP
  try {
    const res = await authService.verifyOtp('9876543210', '123456');
    if (!res.token || !res.userId || !res.profile) {
      throw new Error('verifyOtp response missing token, userId, or profile');
    }
    results.push({ name: 'Auth Integration: Verify OTP & issue JWT session', passed: true });
  } catch (err: any) {
    results.push({ name: 'Auth Integration: Verify OTP & issue JWT session', passed: false, error: err.message });
  }

  // Test 3: OAuth Sync
  try {
    const oauthRes = await authService.syncOAuthUser({
      id: 'a0000000-0000-0000-0000-000000000001',
      email: 'customer.test@gjanandsarkar.com',
      name: 'Test Customer',
    });

    if (!oauthRes.token || oauthRes.profile.email !== 'customer.test@gjanandsarkar.com') {
      throw new Error('OAuth sync failed to generate profile/token');
    }
    results.push({ name: 'Auth Integration: Google OAuth Profile Sync', passed: true });
  } catch (err: any) {
    results.push({ name: 'Auth Integration: Google OAuth Profile Sync', passed: false, error: err.message });
  }

  return results;
}
