import { api } from './client';
import type { DBCartItem } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────

export type CartItemWithDetails = DBCartItem & {
  products: NonNullable<DBCartItem['products']>;
  product_variants: NonNullable<DBCartItem['product_variants']>;
};

export async function getCart(userId: string): Promise<CartItemWithDetails[]> {
  try {
    const res = await api.cart.get(userId);
    return (res.cart as CartItemWithDetails[]) || [];
  } catch (error: any) {
    console.error('getCart error:', error.message);
    return [];
  }
}

export async function addToCart(
  userId: string,
  productId: string,
  variantId: string,
  quantity: number = 1
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await api.cart.add(userId, productId, variantId, quantity);
    return { success: res.success ?? true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCartItem(
  userId: string,
  productId: string,
  variantId: string,
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  try {
    if (quantity <= 0) {
      return removeFromCart(userId, productId, variantId);
    }
    const res = await api.cart.update(userId, productId, variantId, quantity);
    return { success: res.success ?? true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removeFromCart(
  userId: string,
  productId: string,
  variantId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await api.cart.remove(userId, productId, variantId);
    return { success: res.success ?? true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function clearCart(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await api.cart.clear(userId);
    return { success: res.success ?? true };
  } catch (error: any) {
    console.error('clearCart error:', error);
    return { success: false, error: error.message };
  }
}

export async function mergeLocalCart(
  userId: string,
  localItems: { productId: string; variantId: string; quantity: number }[]
): Promise<void> {
  if (localItems.length === 0) return;

  try {
    const dbCart = await getCart(userId);
    const dbSet = new Set(
      (dbCart ?? []).map((i: any) => `${i.product_id}-${i.variant_id}`)
    );

    for (const item of localItems) {
      if (!dbSet.has(`${item.productId}-${item.variantId}`)) {
        await addToCart(userId, item.productId, item.variantId, item.quantity);
      }
    }
  } catch (err) {
    console.warn('mergeLocalCart error:', err);
  }
}
