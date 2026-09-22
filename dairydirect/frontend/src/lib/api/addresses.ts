import { api } from './client';

export type AddressType = 'house' | 'apartment' | 'business' | 'other';

export interface UserAddress {
  id: string;
  user_id: string;
  address_type: AddressType;
  country: string;
  full_name: string;
  mobile_number: string;
  pincode: string;
  flat_house_building: string;
  area_street_sector_village: string;
  landmark?: string | null;
  town_city: string;
  state: string;
  saturday_delivery: boolean;
  sunday_delivery: boolean;
  delivery_instructions?: string | null;
  is_default: boolean;
  latitude?: number | null;
  longitude?: number | null;
  is_deleted?: boolean;
  created_at: string;
  updated_at?: string;

  // Legacy columns preserved for backward compatibility
  label: string;
  address: string;
  apartment?: string | null;
  building?: string | null;
  street?: string | null;
  city?: string | null;
  instructions?: string | null;
  photo_url?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export type CreateAddressInput = {
  userId?: string; // Optional: server strictly derives user_id from auth token
  address_type: AddressType;
  country?: string;
  full_name: string;
  mobile_number: string;
  pincode: string;
  flat_house_building: string;
  area_street_sector_village: string;
  landmark?: string | null;
  town_city: string;
  state: string;
  saturday_delivery?: boolean;
  sunday_delivery?: boolean;
  delivery_instructions?: string | null;
  is_default?: boolean;
  latitude?: number | null;
  longitude?: number | null;

  // Legacy compatibility fields (optional)
  label?: string;
  address?: string;
  building?: string | null;
  street?: string | null;
  instructions?: string | null;
  lat?: number | null;
  lng?: number | null;
  isDefault?: boolean;
};

export type UpdateAddressInput = Partial<CreateAddressInput> & {
  makeDefaultOnly?: boolean;
};

/**
 * Generates a clean, deterministic legacy formatted address string from structured fields.
 */
export function formatFullAddress(addr: Partial<UserAddress> | Partial<CreateAddressInput>): string {
  const parts = [
    addr.flat_house_building || addr.building || (addr as any).apartment,
    addr.area_street_sector_village || addr.street,
    addr.landmark ? `Near ${addr.landmark}` : null,
    addr.town_city || (addr as any).city,
    addr.state ? `${addr.state}${addr.pincode ? ` - ${addr.pincode}` : ''}` : addr.pincode,
    addr.country || 'India',
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(', ');
  }
  return addr.address || '';
}

/**
 * Normalizes an address object received from DB or API, ensuring both new and legacy fields exist.
 */
export function normalizeUserAddress(raw: any): UserAddress {
  const addressType: AddressType = ['house', 'apartment', 'business', 'other'].includes(raw.address_type)
    ? raw.address_type
    : raw.label?.toLowerCase() === 'office'
    ? 'business'
    : raw.label?.toLowerCase() === 'apartment'
    ? 'apartment'
    : 'house';

  const flatBuilding = raw.flat_house_building || raw.building || raw.apartment || '';
  const areaStreet = raw.area_street_sector_village || raw.street || raw.address || '';
  const townCity = raw.town_city || raw.city || '';
  const state = raw.state || 'Gujarat';
  const pincode = raw.pincode || '';
  const country = raw.country || 'India';

  const deterministicAddress = formatFullAddress({
    flat_house_building: flatBuilding,
    area_street_sector_village: areaStreet,
    landmark: raw.landmark,
    town_city: townCity,
    state,
    pincode,
    country,
    address: raw.address,
  });

  return {
    id: raw.id,
    user_id: raw.user_id,
    address_type: addressType,
    country,
    full_name: raw.full_name || '',
    mobile_number: raw.mobile_number || '',
    pincode,
    flat_house_building: flatBuilding,
    area_street_sector_village: areaStreet,
    landmark: raw.landmark || null,
    town_city: townCity,
    state,
    saturday_delivery: raw.saturday_delivery ?? true,
    sunday_delivery: raw.sunday_delivery ?? true,
    delivery_instructions: raw.delivery_instructions || raw.instructions || null,
    is_default: Boolean(raw.is_default),
    latitude: raw.latitude ?? raw.lat ?? null,
    longitude: raw.longitude ?? raw.lng ?? null,
    is_deleted: Boolean(raw.is_deleted),
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || raw.created_at || new Date().toISOString(),

    // Legacy fields preserved
    label: raw.label || (addressType === 'house' ? 'Home' : addressType === 'business' ? 'Office' : 'Other'),
    address: deterministicAddress || raw.address || '',
    apartment: raw.apartment || null,
    building: flatBuilding || null,
    street: areaStreet || null,
    city: townCity || null,
    instructions: raw.delivery_instructions || raw.instructions || null,
    photo_url: raw.photo_url || null,
    lat: raw.latitude ?? raw.lat ?? null,
    lng: raw.longitude ?? raw.lng ?? null,
  };
}

/**
 * Get all addresses for a user via /api/addresses
 */
export async function getUserAddresses(userId?: string): Promise<UserAddress[]> {
  try {
    const url = userId ? `/api/addresses?userId=${encodeURIComponent(userId)}` : '/api/addresses';
    const res = await fetch(url);
    if (!res.ok) {
      console.warn('Failed to fetch addresses, status:', res.status);
      return [];
    }
    const data = await res.json();
    const rawList = (data.addresses || []).filter((item: any) => !item.is_deleted);
    const normalized: UserAddress[] = rawList.map(normalizeUserAddress);

    // Ensure strictly one default address displayed if multiples exist
    const defaultIndices: number[] = [];
    normalized.forEach((addr: UserAddress, idx: number) => {
      if (addr.is_default) defaultIndices.push(idx);
    });

    if (defaultIndices.length > 1) {
      const trueDefaultIndex = defaultIndices[0];
      return normalized
        .map((addr: UserAddress, idx: number) => ({ ...addr, is_default: idx === trueDefaultIndex }))
        .sort((a: UserAddress, b: UserAddress) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
    }

    return normalized.sort((a: UserAddress, b: UserAddress) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
  } catch (err) {
    console.error('Failed to fetch addresses:', err);
    return [];
  }
}

/**
 * Get single address by ID via /api/addresses?id=... or /api/addresses/[id]
 */
export async function getAddressByIdAPI(addressId: string): Promise<UserAddress | null> {
  try {
    const res = await fetch(`/api/addresses/${encodeURIComponent(addressId)}`);
    if (!res.ok) {
      // Fallback to query param if needed
      const fallback = await fetch(`/api/addresses?id=${encodeURIComponent(addressId)}`);
      if (!fallback.ok) return null;
      const data = await fallback.json();
      return data.address ? normalizeUserAddress(data.address) : null;
    }
    const data = await res.json();
    return data.address ? normalizeUserAddress(data.address) : null;
  } catch (err) {
    console.error('Failed to fetch address by id:', err);
    return null;
  }
}

/**
 * Save a new user address via /api/addresses
 */
export async function saveAddressAPI(
  addressData: CreateAddressInput
): Promise<{ success: boolean; error?: string; code?: string; data?: UserAddress }> {
  try {
    const res = await fetch('/api/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addressData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save address');
    return { success: true, data: normalizeUserAddress(data.address) };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save address' };
  }
}

/**
 * Update an existing address via /api/addresses/[id] or /api/addresses
 */
export async function updateAddressAPI(
  userId: string,
  addressId: string,
  addressData: UpdateAddressInput
): Promise<{ success: boolean; error?: string; data?: UserAddress }> {
  try {
    // Try PUT /api/addresses/[id] first
    const res = await fetch(`/api/addresses/${encodeURIComponent(addressId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...addressData }),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, data: normalizeUserAddress(data.address) };
    }

    // Fallback to existing PUT /api/addresses
    const fallbackRes = await fetch('/api/addresses', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addressId, userId, ...addressData }),
    });
    const data = await fallbackRes.json();
    if (!fallbackRes.ok) throw new Error(data.error || 'Failed to update address');
    return { success: true, data: normalizeUserAddress(data.address) };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update address' };
  }
}

/**
 * Set an address as default via /api/addresses
 */
export async function setDefaultAddressAPI(
  userId: string,
  addressId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/addresses/${encodeURIComponent(addressId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_default: true, makeDefaultOnly: true }),
    });

    if (res.ok) return { success: true };

    // Fallback to PUT /api/addresses with makeDefaultOnly
    const fallback = await fetch('/api/addresses', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addressId, userId, makeDefaultOnly: true, is_default: true }),
    });
    const data = await fallback.json();
    if (!fallback.ok) throw new Error(data.error || 'Failed to set default address');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to set default address' };
  }
}

/**
 * Delete an address via /api/addresses
 */
export async function deleteAddress(
  userId: string,
  addressId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Try DELETE /api/addresses/[id]
    const res = await fetch(`/api/addresses/${encodeURIComponent(addressId)}`, {
      method: 'DELETE',
    });

    if (res.ok) return { success: true };

    // Fallback to DELETE /api/addresses?id=...
    const fallback = await fetch(
      `/api/addresses?id=${encodeURIComponent(addressId)}&userId=${encodeURIComponent(userId)}`,
      { method: 'DELETE' }
    );
    const data = await fallback.json();
    if (!fallback.ok) throw new Error(data.error || 'Failed to delete address');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete address' };
  }
}
