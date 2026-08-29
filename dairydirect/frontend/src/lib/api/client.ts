const API_BASE = '';

async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
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

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: 'include',
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? 'API error');
  }

  return data;
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
    get: (params?: { category?: string; activeOnly?: boolean }) => {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.set('category', params.category);
      if (params?.activeOnly !== undefined) searchParams.set('activeOnly', String(params.activeOnly));
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

  customers: {
    get: (search?: string) =>
      fetchApi<{ customers: any[]; total: number }>(`/api/admin/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  },

  categories: {
    get: () => fetchApi<{ categories: any[] }>('/api/categories'),
    create: (_data: any) =>
      fetchApi<{ success: boolean; category: any }>('/api/categories', {
        method: 'POST',
        body: JSON.stringify(_data),
      }),
    update: (id: string, _data: any) =>
      fetchApi<{ success: boolean; category: any }>(`/api/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(_data),
      }),
    delete: (id: string) =>
      fetchApi<{ success: boolean }>(`/api/categories/${id}`, {
        method: 'DELETE',
      }),
  },

  wishlist: {
    get: (_userId?: string) =>
      fetchApi<{ wishlist: string[] }>(`/api/wishlist${_userId ? `?userId=${_userId}` : ''}`),

    toggle: (_userId: string, _productId: string) =>
      fetchApi<{ success: boolean; added: boolean }>('/api/wishlist', {
        method: 'POST',
        body: JSON.stringify({ userId: _userId, productId: _productId }),
      }),

    remove: (_userId: string, _productId: string) =>
      fetchApi<{ success: boolean }>(`/api/wishlist?userId=${_userId}&productId=${_productId}`, {
        method: 'DELETE',
      }),
  },
};