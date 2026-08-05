import { supabase } from '@/lib/supabase';

export async function getWishlist(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', userId);

    if (error) throw error;
    return ((data as any[]) || []).map((item: any) => item.product_id);
  } catch (err) {
    // If table doesn't exist yet or offline, local store persists
    return [];
  }
}

export async function toggleWishlist(userId: string, productId: string): Promise<boolean> {
  try {
    const { data: existing } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (existing) {
      await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);
      return false; // Removed
    } else {
      await supabase
        .from('wishlists')
        .insert({ user_id: userId, product_id: productId });
      return true; // Added
    }
  } catch (err) {
    return true;
  }
}
