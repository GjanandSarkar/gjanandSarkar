const API_BASE = '';

async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? 'API error');
  }

  return data;
}

export const api = {
  auth: {
    sendOtp: (phone: string) =>
      fetchApi<{ success: boolean; demoOtp?: string }>('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      }),

    verifyOtp: (phone: string, otp: string) =>
      fetchApi<{
        success: boolean;
        token: string;
        userId: string;
        profile: any;
        isNewUser: boolean;
      }>('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, otp }),
      }),

    session: (token: string) =>
      fetchApi<{ success: boolean; user: any }>('/api/auth/session', {
        method: 'POST',
        body: JSON.stringify({ token }),
      }),
  },

  products: {
    get: (params?: { category?: string; activeOnly?: boolean; token?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.set('category', params.category);
      if (params?.activeOnly !== undefined) searchParams.set('activeOnly', String(params.activeOnly));
      if (params?.token) searchParams.set('token', params.token);
      const query = searchParams.toString();
      return fetchApi<{ products: any[] }>(`/api/products${query ? `?${query}` : ''}`);
    },

    create: (data: any, token: string) =>
      fetchApi<{ success: boolean; id: string }>(`/api/products?token=${token}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  orders: {
    get: (token: string, orderId?: string) => {
      const params = new URLSearchParams({ token });
      if (orderId) params.set('id', orderId);
      return fetchApi<{ orders: any[] }>(`/api/orders?${params}`);
    },

    place: (token: string, orderData: any) =>
      fetchApi<{ success: boolean; orderId: string }>('/api/orders/place', {
        method: 'POST',
        body: JSON.stringify({ token, orderData }),
      }),
  },

  cart: {
    get: (userId: string, token: string) =>
      fetchApi<{ cart: any[] }>(`/api/cart?userId=${userId}&token=${token}`),

    add: (userId: string, token: string, productId: string, variantId: string, quantity: number) =>
      fetchApi<{ success: boolean }>('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ userId, token, productId, variantId, quantity }),
      }),

    update: (userId: string, token: string, productId: string, variantId: string, quantity: number) =>
      fetchApi<{ success: boolean }>('/api/cart', {
        method: 'PUT',
        body: JSON.stringify({ userId, token, productId, variantId, quantity }),
      }),

    remove: (userId: string, token: string, productId: string, variantId: string) =>
      fetchApi<{ success: boolean }>(
        `/api/cart?userId=${userId}&token=${token}&productId=${productId}&variantId=${variantId}`,
        { method: 'DELETE' }
      ),

    clear: (userId: string, token: string) =>
      fetchApi<{ success: boolean }>('/api/cart/clear', {
        method: 'POST',
        body: JSON.stringify({ userId, token }),
      }),
  },

  subscriptions: {
    get: (token: string) =>
      fetchApi<{ subscriptions: any[] }>(`/api/subscriptions?token=${token}`),

    create: (token: string, data: { userId: string; productId: string; volume: number; plan: string }) =>
      fetchApi<{ success: boolean; id: string }>('/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify({ token, ...data }),
      }),

    update: (
      token: string,
      data: { subId: string; action: string; newVolume?: number; newPlan?: string }
    ) =>
      fetchApi<{ success: boolean }>('/api/subscriptions', {
        method: 'PUT',
        body: JSON.stringify({ token, ...data }),
      }),
  },

  notifications: {
    get: (token: string) =>
      fetchApi<{ notifications: any[] }>(`/api/notifications?token=${token}`),

    markRead: (token: string, notificationId?: string, all?: boolean) =>
      fetchApi<{ success: boolean }>('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({ token, notificationId, all }),
      }),
  },

  addresses: {
    get: (userId: string, token: string) =>
      fetchApi<{ addresses: any[] }>(`/api/addresses?userId=${userId}&token=${token}`),

    save: (
      token: string,
      data: { userId: string; label: string; address: string; lat?: number; lng?: number; isDefault?: boolean }
    ) =>
      fetchApi<{ success: boolean }>('/api/addresses', {
        method: 'POST',
        body: JSON.stringify({ token, ...data }),
      }),
  },
};