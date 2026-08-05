import { supabase } from '@/lib/supabase';

export type UserAddress = {
  id: string;
  user_id: string;
  label: string;
  address: string;
  lat: number | null;
  lng: number | null;
  is_default: boolean;
  is_deleted?: boolean;
  created_at: string;
};

/**
 * Save a new user address
 * If isDefault is true, unsets is_default on all existing addresses for this user.
 */
export async function saveAddressAPI(addressData: {
  userId: string;
  label: string;
  address: string;
  lat?: number;
  lng?: number;
  isDefault?: boolean;
}): Promise<{ success: boolean; error?: string; code?: string; data?: UserAddress }> {
  try {
    const isDefault = Boolean(addressData.isDefault);

    // If marked as default, unset existing default addresses for this user
    if (isDefault) {
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', addressData.userId);
    }

    const { data, error } = await supabase
      .from('user_addresses')
      .insert({
        user_id: addressData.userId,
        label: addressData.label,
        address: addressData.address,
        lat: addressData.lat ?? null,
        lng: addressData.lng ?? null,
        is_default: isDefault,
      })
      .select()
      .single();

    if (error) {
      console.warn('Direct supabase address insert error, attempting /api/addresses:', error.message);
      try {
        const resp = await fetch('/api/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: addressData.userId,
            label: addressData.label,
            address: addressData.address,
            lat: addressData.lat,
            lng: addressData.lng,
            isDefault: isDefault,
          }),
        });
        const resJson = await resp.json();
        if (resp.ok && resJson.success && resJson.address) {
          return { success: true, data: resJson.address as UserAddress };
        }
      } catch (fErr) {
        console.error('/api/addresses POST failed', fErr);
      }
      return { success: false, error: error.message, code: error.code };
    }

    return { success: true, data: data as UserAddress };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save address' };
  }
}

/**
 * Update an existing address
 */
export async function updateAddressAPI(
  userId: string,
  addressId: string,
  addressData: {
    label: string;
    address: string;
    lat?: number;
    lng?: number;
    isDefault?: boolean;
  }
): Promise<{ success: boolean; error?: string; data?: UserAddress }> {
  try {
    const isDefault = Boolean(addressData.isDefault);

    if (isDefault) {
      // Unset all others first
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { data, error } = await supabase
      .from('user_addresses')
      .update({
        label: addressData.label,
        address: addressData.address,
        lat: addressData.lat ?? null,
        lng: addressData.lng ?? null,
        is_default: isDefault,
      })
      .eq('id', addressId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.warn('Direct update failed, trying /api/addresses:', error.message);
      try {
        const resp = await fetch('/api/addresses', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            addressId,
            userId,
            label: addressData.label,
            address: addressData.address,
            lat: addressData.lat,
            lng: addressData.lng,
            isDefault,
          }),
        });
        const resJson = await resp.json();
        if (resp.ok && resJson.success && resJson.address) {
          return { success: true, data: resJson.address as UserAddress };
        }
      } catch (fErr) {}
      return { success: false, error: error.message };
    }

    return { success: true, data: data as UserAddress };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update address' };
  }
}

/**
 * Set an address as default, unsetting all other addresses for this user
 */
export async function setDefaultAddressAPI(userId: string, addressId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Unset all
    await supabase
      .from('user_addresses')
      .update({ is_default: false })
      .eq('user_id', userId);

    // 2. Set the target address as default
    const { error } = await supabase
      .from('user_addresses')
      .update({ is_default: true })
      .eq('id', addressId)
      .eq('user_id', userId);

    if (error) {
      // Fallback to server route
      try {
        const resp = await fetch('/api/addresses', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ addressId, userId, makeDefaultOnly: true }),
        });
        if (resp.ok) return { success: true };
      } catch (e) {}
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to set default address' };
  }
}

/**
 * Get all addresses for a user, ensuring only ONE address has is_default = true
 */
export async function getUserAddresses(userId: string): Promise<UserAddress[]> {
  try {
    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('getUserAddresses error:', error.message);
      return [];
    }

    const rawList = (data || []).filter((item: any) => !item.is_deleted) as UserAddress[];
    if (rawList.length === 0) return [];

    // CRITICAL ENFORCEMENT: ONLY ONE ADDRESS CAN BE DEFAULT
    const defaultIndices: number[] = [];
    rawList.forEach((addr, idx) => {
      if (addr.is_default) defaultIndices.push(idx);
    });

    if (defaultIndices.length > 1) {
      // Pick the first default as the true default, unset all other defaults
      const trueDefaultIndex = defaultIndices[0];
      const nonDefaultIdsToClean: string[] = [];

      const sanitized = rawList.map((addr, idx) => {
        if (idx === trueDefaultIndex) {
          return { ...addr, is_default: true };
        }
        if (addr.is_default) {
          nonDefaultIdsToClean.push(addr.id);
        }
        return { ...addr, is_default: false };
      });

      // Background cleanup in Supabase so database is permanently fixed
      if (nonDefaultIdsToClean.length > 0) {
        (async () => {
          try {
            await supabase
              .from('user_addresses')
              .update({ is_default: false })
              .in('id', nonDefaultIdsToClean);
          } catch (e) {
            console.warn('Background cleanup of multi defaults:', e);
          }
        })();
      }

      return sanitized.sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
    }

    return rawList.sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
  } catch (err) {
    console.error('Failed to fetch addresses:', err);
    return [];
  }
}

/**
 * Delete an address with foreign-key constraint protection
 */
export async function deleteAddress(userId: string, addressId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Try direct delete
    const { error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId);

    if (error) {
      // If foreign key constraint on orders table (error code 23503)
      if (
        error.code === '23503' || 
        error.message?.toLowerCase().includes('foreign key') || 
        error.message?.includes('orders_address_id_fkey')
      ) {
        // Strategy A: Unlink past orders so delete succeeds without constraint violation
        const { error: unlinkError } = await supabase
          .from('orders')
          .update({ address_id: null })
          .eq('address_id', addressId);

        if (!unlinkError) {
          // Retry direct delete
          const { error: retryError } = await supabase
            .from('user_addresses')
            .delete()
            .eq('id', addressId)
            .eq('user_id', userId);

          if (!retryError) return { success: true };
        }

        // Strategy B: Soft-delete fallback
        const { error: softError } = await supabase
          .from('user_addresses')
          .update({ is_deleted: true, is_default: false })
          .eq('id', addressId)
          .eq('user_id', userId);

        if (!softError) return { success: true };
      }

      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete address' };
  }
}
