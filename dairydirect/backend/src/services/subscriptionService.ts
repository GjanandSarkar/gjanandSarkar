import { subscriptionRepository } from '../repositories/subscriptionRepository';
import { productRepository } from '../repositories/productRepository';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../models/subscription';
import { NotFoundError, ValidationError } from '../errors/AppError';

export const subscriptionService = {
  async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    return subscriptionRepository.findByUserId(userId);
  },

  async listAllSubscriptions(params: { status?: SubscriptionStatus; limit?: number; offset?: number }) {
    return subscriptionRepository.findAll(params);
  },

  async createSubscription(data: {
    userId: string;
    productId: string;
    variantId?: string;
    volume: number;
    plan: SubscriptionPlan;
    deliverySlot?: string;
    startDate?: string;
    notes?: string;
  }): Promise<Subscription> {
    let variantId = data.variantId;

    if (!variantId) {
      // Pick first active variant for product
      const product = await productRepository.findById(data.productId);
      if (!product || !product.variants || product.variants.length === 0) {
        throw new NotFoundError('Product or variant not found');
      }
      variantId = product.variants[0].id;
    }

    if (data.volume <= 0) {
      throw new ValidationError('Volume must be at least 1');
    }

    return subscriptionRepository.create({
      userId: data.userId,
      productId: data.productId,
      variantId,
      volume: data.volume,
      plan: data.plan,
      deliverySlot: data.deliverySlot,
      startDate: data.startDate,
      notes: data.notes,
    });
  },

  async updateSubscriptionAction(
    subId: string,
    userId: string,
    action: 'pause' | 'resume' | 'change_volume' | 'change_plan' | 'cancel',
    payload: { newVolume?: number; newPlan?: SubscriptionPlan; pauseUntil?: string }
  ): Promise<Subscription> {
    const sub = await subscriptionRepository.findById(subId);
    if (!sub) {
      throw new NotFoundError('Subscription not found');
    }

    const updated = await subscriptionRepository.updateAction(subId, userId, action, payload);
    if (!updated) {
      throw new NotFoundError('Subscription not found or update failed');
    }
    return updated;
  },
};
