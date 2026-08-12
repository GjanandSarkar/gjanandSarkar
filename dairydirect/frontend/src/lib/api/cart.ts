import { supabase } from '@/lib/supabase';
import type { DBCartItem } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────

export type CartItemWithDetails = DBCartItem & {
  products: NonNullable<DBCartItem['products']>;
  product_variants: NonNullable<DBCartItem['product_variants']>;
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(id?: string | null): boolean {
  if (!id) return false;
  return UUID_REGEX.test(id);
}

export async function getCart(userId: string): Promise<CartItemWithDetails[]> {
  if (!isValidUUID(userId)) {
    return [];
  }

  const { data, error } = await supabase
    .from('cart_items')
    .select('*, products(*), product_variants(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('getCart error:', error.message, '| Detail:', error.details, '| Hint:', error.hint);
    return [];
  }

  return (data as CartItemWithDetails[]) ?? [];
}

export async function addToCart(
  userId: string,
  productId: string,
  variantId: string,
  quantity: number = 1
): Promise<{ success: boolean; error?: string }> {
  if (!isValidUUID(userId)) {
    return { success: false, error: 'Invalid user ID format' };
  }

  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .eq('variant_id', variantId)
    .single();


  if (existing) {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  const { error } = await supabase.from('cart_items').insert({
    user_id: userId,
    product_id: productId,
    variant_id: variantId,
    quantity,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateCartItem(
  userId: string,
  productId: string,
  variantId: string,
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  if (!isValidUUID(userId)) {
    return { success: false, error: 'Invalid user ID format' };
  }

  if (quantity <= 0) {
    return removeFromCart(userId, productId, variantId);
  }

  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('user_id', userId)
    .eq('product_id', productId)
    .eq('variant_id', variantId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removeFromCart(
  userId: string,
  productId: string,
  variantId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isValidUUID(userId)) {
    return { success: false, error: 'Invalid user ID format' };
  }

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)
    .eq('variant_id', variantId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function clearCart(userId: string): Promise<{ success: boolean; error?: string }> {
  if (!isValidUUID(userId)) {
    return { success: true };
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const res = await fetch('/api/cart/clear', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ userId })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to clear cart');

    return { success: true };
  } catch (error: any) {
    console.error('clearCart error:', error);
    return { success: false, error: error.message };
  }
}

export async function mergeLocalCart(
  userId: string,
  localItems: { productId: string; variantId: string; quantity: number }[]
): Promise<void> {
  if (!isValidUUID(userId) || localItems.length === 0) return;

  const { data: dbCart } = await supabase
    .from('cart_items')
    .select('product_id, variant_id, quantity')
    .eq('user_id', userId);

  const dbSet = new Set(
    (dbCart ?? []).map((i: any) => `${i.product_id}-${i.variant_id}`)
  );

  const toInsert = localItems
    .filter((i) => !dbSet.has(`${i.productId}-${i.variantId}`))
    .map((i) => ({
      user_id: userId,
      product_id: i.productId,
      variant_id: i.variantId,
      quantity: i.quantity,
    }));

  if (toInsert.length > 0) {
    await supabase.from('cart_items').insert(toInsert).select();
  }
}

