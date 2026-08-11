import { wishlistRepository } from '../repositories/wishlistRepository';
import { WishlistItem } from '../models/wishlist';

export const wishlistService = {
  async getUserWishlist(userId: string): Promise<WishlistItem[]> {
    return wishlistRepository.findByUserId(userId);
  },

  async toggleWishlist(userId: string, productId: string): Promise<{ inWishlist: boolean }> {
    const inWishlist = await wishlistRepository.toggle(userId, productId);
    return { inWishlist };
  },

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    await wishlistRepository.remove(userId, productId);
  },
};
