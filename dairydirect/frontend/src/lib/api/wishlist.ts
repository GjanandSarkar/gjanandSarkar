import { api } from './client';

export async function getWishlist(userId: string): Promise<string[]> {
  try {
    const res = await api.wishlist.get(userId);
    return res.wishlist || [];
  } catch (err) {
    console.error('getWishlist error:', err);
    return [];
  }
}

export async function toggleWishlist(userId: string, productId: string): Promise<boolean> {
  try {
    const res = await api.wishlist.toggle(userId, productId);
    return res.added ?? true;
  } catch (err) {
    console.error('toggleWishlist error:', err);
    return true;
  }
}
