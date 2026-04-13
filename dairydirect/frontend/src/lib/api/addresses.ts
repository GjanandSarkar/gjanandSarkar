import { supabase } from '@/lib/supabase';

export type UserAddress = {
  id: string;
  user_id: string;
  label: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  created_at: string;
};

export async function saveAddressAPI(addressData: {
  userId: string;
  label: string;
  address: string;
  lat?: number;
  lng?: number;
  isDefault?: boolean;
}) {
  const { error } = await supabase
    .from('user_addresses')
    .insert({
      user_id: addressData.userId,
      label: addressData.label,
      address: addressData.address,
      latitude: addressData.lat,
      longitude: addressData.lng,
      is_default: addressData.isDefault ?? true,
    });

  if (error) {
    // If the table doesn't exist yet, we'll get an error.
    // We return it so the UI can show the SQL instruction.
    return { success: false, error: error.message, code: error.code };
  }

  return { success: true };
}

export async function getUserAddresses(userId: string) {
  const { data, error } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data as UserAddress[];
}
