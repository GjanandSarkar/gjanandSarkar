// lib/authApi.ts - Auth API Helper Functions
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

export interface AuthToken {
  token: string;
  user: {
    id: string;
    phone: string;
    name: string;
    role: string;
  };
}

/**
 * Request OTP for phone number
 */
export async function requestOTP(phone: string): Promise<{
  message: string;
  phone: string;
  expiresIn: string;
  isDemoMode?: boolean;
}> {
  const response = await fetch(`${API_BASE_URL}/auth/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to request OTP");
  }

  return response.json();
}

/**
 * Verify OTP and login user
 */
export async function verifyOTPAndLogin(
  phone: string,
  otp: string,
  name?: string,
): Promise<AuthToken> {
  const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp, name }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "OTP verification failed");
  }

  return response.json();
}

/**
 * Resend OTP
 */
export async function resendOTP(phone: string): Promise<{
  message: string;
  phone: string;
  expiresIn: string;
}> {
  const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to resend OTP");
  }

  return response.json();
}

/**
 * Store auth token and user
 */
export function storeAuth(authData: AuthToken): void {
  localStorage.setItem("authToken", authData.token);
  localStorage.setItem("user", JSON.stringify(authData.user));
}

/**
 * Get auth token
 */
export function getAuthToken(): string | null {
  return typeof window !== "undefined"
    ? localStorage.getItem("authToken")
    : null;
}

/**
 * Get user from localStorage
 */
export function getStoredUser(): AuthToken["user"] | null {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

/**
 * Clear auth data
 */
export function clearAuth(): void {
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
  sessionStorage.removeItem("tempPhone");
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}
