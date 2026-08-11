import { orderRepository } from '../repositories/orderRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { Order, OrderStatus, PaymentStatus } from '../models/order';
import { NotFoundError } from '../errors/AppError';

export const orderService = {
  async placeOrder(params: {
    userId: string | null;
    addressId: string | null;
    shippingAddress: string | null;
    deliverySlot: string | null;
    deliveryDate: string | null;
    notes: string | null;
    paymentMethod: string;
    items: Array<{ variantId: string; quantity: number }>;
    couponCode?: string | null;
  }): Promise<{ order: Order }> {
    const { order } = await orderRepository.placeAtomicOrder(params);

    // Create confirmation notification for customer
    if (order.user_id) {
      await notificationRepository.create({
        userId: order.user_id,
        roleTarget: 'customer',
        title: 'Order Placed Successfully',
        message: `Your order #${order.order_number} for ₹${order.total_amount} has been received.`,
        type: 'order',
        relatedId: order.id,
      });
    }

    // Create alert for admin
    await notificationRepository.create({
      roleTarget: 'admin',
      title: 'New Order Received',
      message: `Order #${order.order_number} placed for ₹${order.total_amount}.`,
      type: 'order',
      relatedId: order.id,
    });

    return { order };
  },

  async getOrderById(id: string, userId?: string, isAdmin = false): Promise<Order> {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // IDOR Protection: Customers can only view their own orders
    if (!isAdmin && userId && order.user_id !== userId) {
      throw new NotFoundError('Order not found');
    }

    return order;
  },

  async listOrders(params: {
    userId?: string;
    status?: OrderStatus;
    limit?: number;
    offset?: number;
    isAdmin?: boolean;
  }): Promise<{ orders: Order[]; total: number }> {
    const { userId, status, limit, offset, isAdmin } = params;

    return orderRepository.findAll({
      userId: isAdmin ? undefined : userId,
      status,
      limit,
      offset,
    });
  },

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus
  ): Promise<Order> {
    const updated = await orderRepository.updateStatus(orderId, status, paymentStatus);
    if (!updated) {
      throw new NotFoundError('Order not found');
    }

    // Send status update notification to customer
    if (updated.user_id) {
      const statusLabels: Record<string, string> = {
        confirmed: 'Confirmed',
        processing: 'Being Packed',
        out_for_delivery: 'Out for Delivery',
        delivered: 'Delivered',
        cancelled: 'Cancelled',
      };

      await notificationRepository.create({
        userId: updated.user_id,
        roleTarget: 'customer',
        title: `Order ${statusLabels[status] || status}`,
        message: `Your order #${updated.order_number} status is now: ${statusLabels[status] || status}.`,
        type: 'order',
        relatedId: updated.id,
      });
    }

    return updated;
  },
};
