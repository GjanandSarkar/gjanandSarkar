const API_BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');

async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    // 1. Direct JWT stored in localStorage
    const localToken = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('gs_access_token');
    if (localToken) return localToken;

    // 2. Cookie extraction
    const match = document.cookie.match(/gs_access_token=([^;]+)/);
    if (match && match[1]) return decodeURIComponent(match[1]);

    // 3. Zustand persistent store
    const storeRaw = localStorage.getItem('gjanand-sarkar-storage');
    if (storeRaw) {
      try {
        const parsed = JSON.parse(storeRaw);
        if (parsed?.state?.user?.token) return parsed.state.user.token;
      } catch {
        // ignore parse error
      }
    }

    // 4. Supabase Auth session
    const { supabase } = await import('@/lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  // Extract client-side store role & user details for fallback headers
  const authHeaders: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    try {
      const storeRaw = localStorage.getItem('gjanand-sarkar-storage');
      if (storeRaw) {
        const parsed = JSON.parse(storeRaw);
        const u = parsed?.state?.user;
        if (u) {
          if (u.role === 'admin') {
            authHeaders['x-admin-role'] = 'true';
          }
          if (u.id) {
            authHeaders['x-user-id'] = u.id;
          }
          if (u.email) {
            authHeaders['x-user-email'] = u.email;
          }
          if (u.phone) {
            authHeaders['x-user-phone'] = u.phone;
          }
        }
      }
    } catch {}
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...authHeaders,
      ...options.headers,
    },
    credentials: 'include',
  });

  const data = await res.json();

  if (!res.ok) {
    let errMsg = data.error?.message || data.error || data.message || 'API error';
    
    // Format Zod validation details nicely for the UI
    if (data.error?.code === 'VALIDATION_ERROR' && Array.isArray(data.error.details)) {
      const detailsStr = data.error.details.map((d: any) => `${d.field}: ${d.message}`).join(' | ');
      errMsg = `Validation Error: ${detailsStr}`;
    }
    
    throw new Error(errMsg);
  }

  // Handle standard { success: true, data: {...} } envelope or direct payload
  return (data.data !== undefined && data.success !== undefined ? { ...data.data, success: data.success } : data) as T;
}

export const api = {
  auth: {
    sendOtp: (_phone: string) =>
      fetchApi<{ success: boolean; demoOtp?: string }>('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone: _phone }),
      }),

    verifyOtp: (_phone: string, _otp: string) =>
      fetchApi<{
        success: boolean;
        token: string;
        userId: string;
        profile: any;
        isNewUser: boolean;
      }>('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone: _phone, otp: _otp }),
      }),

    session: (_token: string) =>
      fetchApi<{ success: boolean; user: any }>('/api/auth/session', {
        method: 'POST',
        body: JSON.stringify({ token: _token }),
      }),
  },

  products: {
    get: (params?: { category?: string; activeOnly?: boolean; forceRefresh?: boolean }) => {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.set('category', params.category);
      if (params?.activeOnly !== undefined) searchParams.set('activeOnly', String(params.activeOnly));
      if (params?.forceRefresh) {
        searchParams.set('forceRefresh', 'true');
        searchParams.set('t', String(Date.now()));
      }
      const query = searchParams.toString();
      return fetchApi<{ products: any[] }>(`/api/products${query ? `?${query}` : ''}`);
    },

    getById: (id: string) =>
      fetchApi<{ product: any }>(`/api/products/${id}`),

    create: (_data: any) =>
      fetchApi<{ success: boolean; id: string }>(`/api/products`, {
        method: 'POST',
        body: JSON.stringify(_data),
      }),

    update: (id: string, _data: any) =>
      fetchApi<{ success: boolean; product: any }>(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(_data),
      }),

    delete: (id: string, permanent: boolean = false) =>
      fetchApi<{ success: boolean; softDeleted?: boolean; permanent?: boolean; message?: string }>(
        `/api/products/${id}?permanent=${permanent}`,
        {
          method: 'DELETE',
        }
      ),
  },

  orders: {
    get: (_orderId?: string) => {
      const params = new URLSearchParams();
      if (_orderId) params.set('id', _orderId);
      return fetchApi<{ orders: any[] }>(`/api/orders?${params}`);
    },

    place: (_orderData: any) =>
      fetchApi<{ success: boolean; orderId: string }>('/api/orders/place', {
        method: 'POST',
        body: JSON.stringify({ orderData: _orderData }),
      }),
  },

  cart: {
    get: (_userId: string) =>
      fetchApi<{ cart: any[] }>(`/api/cart?userId=${_userId}`),

    add: (_userId: string, _productId: string, _variantId: string, _quantity: number) =>
      fetchApi<{ success: boolean }>('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ userId: _userId, productId: _productId, variantId: _variantId, quantity: _quantity }),
      }),

    update: (_userId: string, _productId: string, _variantId: string, _quantity: number) =>
      fetchApi<{ success: boolean }>('/api/cart', {
        method: 'PUT',
        body: JSON.stringify({ userId: _userId, productId: _productId, variantId: _variantId, quantity: _quantity }),
      }),

    remove: (_userId: string, _productId: string, _variantId: string) =>
      fetchApi<{ success: boolean }>(
        `/api/cart?userId=${_userId}&productId=${_productId}&variantId=${_variantId}`,
        { method: 'DELETE' }
      ),

    clear: (_userId: string) =>
      fetchApi<{ success: boolean }>('/api/cart/clear', {
        method: 'POST',
        body: JSON.stringify({ userId: _userId }),
      }),
  },

  subscriptions: {
    get: () =>
      fetchApi<{ subscriptions: any[] }>(`/api/subscriptions`),

    create: (_data: { userId: string; productId: string; volume: number; plan: string; startDate: string }) =>
      fetchApi<{ success: boolean; id: string }>('/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify(_data),
      }),

    update: (
      _data: { subId: string; action: string; newVolume?: number; newPlan?: string }
    ) =>
      fetchApi<{ success: boolean }>('/api/subscriptions', {
        method: 'PUT',
        body: JSON.stringify(_data),
      }),
  },

  notifications: {
    get: () =>
      fetchApi<{ notifications: any[] }>(`/api/notifications`),

    markRead: (_notificationId?: string, _all?: boolean) =>
      fetchApi<{ success: boolean }>('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({ notificationId: _notificationId, all: _all }),
      }),
  },

  addresses: {
    get: (_userId: string) =>
      fetchApi<{ addresses: any[] }>(`/api/addresses?userId=${_userId}`),

    save: (
      _data: { userId: string; label: string; address: string; lat?: number; lng?: number; isDefault?: boolean }
    ) =>
      fetchApi<{ success: boolean }>('/api/addresses', {
        method: 'POST',
        body: JSON.stringify(_data),
      }),
  },
};