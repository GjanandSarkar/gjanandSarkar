import { api } from './client';

export type UserAddress = {
  id: string;
  user_id: string;
  label: string;
  address: string;
  building?: string | null;
  street?: string | null;
  landmark?: string | null;
  instructions?: string | null;
  photo_url?: string | null;
  lat: number | null;
  lng: number | null;
  is_default: boolean;
  is_deleted?: boolean;
  created_at: string;
};

/**
 * Get all addresses for a user via /api/addresses
 */
export async function getUserAddresses(userId: string): Promise<UserAddress[]> {
  try {
    const res = await api.addresses.get(userId);
    const rawList = (res.addresses || []).filter((item: any) => !item.is_deleted) as UserAddress[];
    if (rawList.length === 0) return [];

    // Ensure only one default address
    const defaultIndices: number[] = [];
    rawList.forEach((addr, idx) => {
      if (addr.is_default) defaultIndices.push(idx);
    });

    if (defaultIndices.length > 1) {
      const trueDefaultIndex = defaultIndices[0];
      return rawList
        .map((addr, idx) => ({ ...addr, is_default: idx === trueDefaultIndex }))
        .sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
    }

    return rawList.sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
  } catch (err) {
    console.error('Failed to fetch addresses:', err);
    return [];
  }
}

/**
 * Save a new user address via /api/addresses
 */
export async function saveAddressAPI(addressData: {
  userId: string;
  label: string;
  address: string;
  building?: string;
  street?: string;
  landmark?: string;
  instructions?: string;
  photo_url?: string;
  lat?: number;
  lng?: number;
  isDefault?: boolean;
}): Promise<{ success: boolean; error?: string; code?: string; data?: UserAddress }> {
  try {
    const res = await fetch('/api/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addressData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save address');
    return { success: true, data: data.address as UserAddress };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save address' };
  }
}

/**
 * Update an existing address via /api/addresses
 */
export async function updateAddressAPI(
  userId: string,
  addressId: string,
  addressData: {
    label: string;
    address: string;
    building?: string;
    street?: string;
    landmark?: string;
    instructions?: string;
    photo_url?: string;
    lat?: number;
    lng?: number;
    isDefault?: boolean;
  }
): Promise<{ success: boolean; error?: string; data?: UserAddress }> {
  try {
    const res = await fetch('/api/addresses', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        addressId,
        userId,
        ...addressData,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update address');
    return { success: true, data: data.address as UserAddress };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update address' };
  }
}

/**
 * Set an address as default via /api/addresses
 */
export async function setDefaultAddressAPI(userId: string, addressId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/addresses', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addressId, userId, makeDefaultOnly: true }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to set default address');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to set default address' };
  }
}

/**
 * Delete an address via /api/addresses
 */
export async function deleteAddress(userId: string, addressId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/addresses?id=${encodeURIComponent(addressId)}&userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete address');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete address' };
  }
}
