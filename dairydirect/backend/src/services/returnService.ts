import { returnRepository } from '../repositories/returnRepository';
import { orderRepository } from '../repositories/orderRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { ReturnRequest, ReturnStatus } from '../models/returnRequest';
import { NotFoundError, ValidationError } from '../errors/AppError';

export const returnService = {
  async listReturns(params: { userId?: string; status?: ReturnStatus }): Promise<ReturnRequest[]> {
    return returnRepository.findAll(params);
  },

  async getReturnById(id: string): Promise<ReturnRequest> {
    const claim = await returnRepository.findById(id);
    if (!claim) {
      throw new NotFoundError('Return request not found');
    }
    return claim;
  },

  async submitReturnClaim(data: {
    orderId: string;
    userId: string;
    reason: string;
    description?: string;
    images?: string[];
  }): Promise<ReturnRequest> {
    const order = await orderRepository.findById(data.orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.user_id && order.user_id !== data.userId) {
      throw new ValidationError('You can only submit return claims for your own orders');
    }

    const claim = await returnRepository.create(data);

    // Notify admin
    await notificationRepository.create({
      roleTarget: 'admin',
      title: 'Freshness Guarantee Claim Submitted',
      message: `Return claim filed for Order #${order.order_number}: ${data.reason}`,
      type: 'return',
      relatedId: claim.id,
    });

    return claim;
  },

  async processReturnClaim(
    id: string,
    status: ReturnStatus,
    refundAmount?: number,
    adminNotes?: string
  ): Promise<ReturnRequest> {
    const claim = await returnRepository.updateStatus(id, status, refundAmount, adminNotes);
    if (!claim) {
      throw new NotFoundError('Return claim not found');
    }

    // Notify user
    await notificationRepository.create({
      userId: claim.user_id,
      roleTarget: 'customer',
      title: `Return Claim ${status.toUpperCase()}`,
      message: `Your return claim for order #${claim.order_number || ''} has been ${status}. ${
        refundAmount ? `Refund amount: ₹${refundAmount}` : ''
      }`,
      type: 'return',
      relatedId: claim.id,
    });

    return claim;
  },
};
