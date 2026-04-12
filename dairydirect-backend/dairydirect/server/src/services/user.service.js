// src/services/user.service.js — User Business Logic

import { supabase, cc, dbError } from '../utils/supabase.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Get authenticated user's full profile with addresses
 */
export const getMyProfile = async (userId) => {
  const { data: user, error } = await supabase
    .from('users')
    .select(`
      id, phone, name, role, created_at,
      addresses(id, label, street, area, city, pincode, lat, lng, is_default, created_at)
    `)
    .eq('id', userId)
    .single();

  if (error || !user) throw new ApiError(404, 'User not found');

  const result = cc(user);
  // Sort addresses: default first, then by created_at asc
  result.addresses?.sort((a, b) => {
    if (b.isDefault !== a.isDefault) return b.isDefault ? 1 : -1;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  return result;
};

/**
 * Update user profile (name only)
 */
export const updateProfile = async (userId, data) => {
  const { data: user, error } = await supabase
    .from('users')
    .update({ name: data.name })
    .eq('id', userId)
    .select('id, phone, name, role')
    .single();

  dbError(error, 'Failed to update profile');
  return cc(user);
};

/**
 * Add a new delivery address.
 * FIX: Added null guard on count — Supabase returns null count on error,
 *      which caused `count === 0` to be false even for a fresh user with no addresses.
 */
export const addAddress = async (userId, data) => {
  const { count, error: countErr } = await supabase
    .from('addresses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // If count check fails, default to treating it as non-empty (safe fallback)
  const addressCount = countErr ? 1 : (count ?? 0);
  const isDefault = addressCount === 0 ? true : !!data.isDefault;

  // If new address should be default, unset existing default first
  if (isDefault) {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);
  }

  const { data: address, error } = await supabase
    .from('addresses')
    .insert({
      user_id: userId,
      label: data.label || 'Home',
      street: data.street,
      area: data.area,
      city: data.city || 'Ahmedabad',
      pincode: data.pincode,
      lat: data.lat || null,
      lng: data.lng || null,
      is_default: isDefault,
    })
    .select()
    .single();

  dbError(error, 'Failed to add address');
  return cc(address);
};

/**
 * Delete an address (cannot delete default if other addresses exist).
 * FIX: Added null guard on count.
 */
export const deleteAddress = async (userId, addressId) => {
  const { data: address, error: findErr } = await supabase
    .from('addresses')
    .select('id, is_default')
    .eq('id', addressId)
    .eq('user_id', userId)
    .single();

  if (findErr || !address) throw new ApiError(404, 'Address not found');

  if (address.is_default) {
    const { count, error: countErr } = await supabase
      .from('addresses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const addressCount = countErr ? 2 : (count ?? 2); // safe fallback: block deletion

    if (addressCount > 1) {
      throw new ApiError(
        400,
        'Cannot delete default address. Set another address as default first.'
      );
    }
  }

  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', addressId);

  dbError(error, 'Failed to delete address');
  return { deleted: true };
};
