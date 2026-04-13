import { api } from './client';
import type { User } from '@/store/useStore';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export async function sendOtp(phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await api.auth.sendOtp(phone);
    return { success: result.success };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function verifyOtpAndSignIn(
  phone: string,
  otp: string
): Promise<{
  success: boolean;
  error?: string;
  profile?: User;
  isAdmin?: boolean;
}> {
  try {
    const result = await api.auth.verifyOtp(phone, otp);

    if (result.success) {
      setAuthToken(result.token);
      
      if (!result.isNewUser) {
        localStorage.setItem('auth_token', result.token);
      }
    }

    return {
      success: result.success,
      profile: result.profile ? {
        id: result.userId,
        name: result.profile.name ?? '',
        phone: result.profile.phone ?? '',
        role: result.profile.role ?? 'customer',
      } : undefined,
      isAdmin: result.profile?.role === 'admin',
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSession(): Promise<{ token: string; user: User } | null> {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;

  try {
    const result = await api.auth.session(token);
    if (result.success) {
      setAuthToken(token);
      return {
        token,
        user: {
          id: result.user.id,
          name: result.user.name ?? '',
          phone: result.user.phone ?? '',
          role: result.user.role ?? 'customer',
        },
      };
    }
  } catch (error) {
    console.error('Session error:', error);
  }
  
  localStorage.removeItem('auth_token');
  return null;
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  return session?.user ?? null;
}

export async function logout(): Promise<void> {
  setAuthToken(null);
  localStorage.removeItem('auth_token');
}

export async function updateProfile(
  userId: string,
  updates: Partial<User>
): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function updateProfileName(
  userId: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}