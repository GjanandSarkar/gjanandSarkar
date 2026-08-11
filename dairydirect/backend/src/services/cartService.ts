import { cartRepository } from '../repositories/cartRepository';
import { productRepository } from '../repositories/productRepository';
import { CartItem } from '../models/cart';
import { NotFoundError, ValidationError } from '../errors/AppError';

export const cartService = {
  async getUserCart(userId: string): Promise<{ cart: CartItem[] }> {
    const items = await cartRepository.findByUserId(userId);
    return { cart: items };
  },

  async addToCart(userId: string, productId: string, variantId: string, quantity = 1): Promise<void> {
    if (quantity <= 0) {
      throw new ValidationError('Quantity must be greater than 0');
    }

    const variant = await productRepository.findVariantById(variantId);
    if (!variant || !variant.is_active) {
      throw new NotFoundError('Product variant is unavailable');
    }

    await cartRepository.addQuantity(userId, productId, variantId, quantity);
  },

  async updateQuantity(userId: string, productId: string, variantId: string, quantity: number): Promise<void> {
    if (quantity <= 0) {
      await cartRepository.removeItem(userId, productId, variantId);
      return;
    }

    const variant = await productRepository.findVariantById(variantId);
    if (!variant || !variant.is_active) {
      throw new NotFoundError('Product variant is unavailable');
    }

    await cartRepository.upsert(userId, productId, variantId, quantity);
  },

  async removeItem(userId: string, productId: string, variantId: string): Promise<void> {
    await cartRepository.removeItem(userId, productId, variantId);
  },

  async clearCart(userId: string): Promise<void> {
    await cartRepository.clearUserCart(userId);
  },
};
