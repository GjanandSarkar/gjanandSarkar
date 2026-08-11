import { getRazorpayClient } from '../config/razorpay';
import { orderRepository } from '../repositories/orderRepository';
import { verifyRazorpaySignature, verifyWebhookSignature } from '../utils/crypto';
import { config } from '../config/env';
import { AppError, NotFoundError, ValidationError } from '../errors/AppError';
import { Order } from '../models/order';

export const paymentService = {
  /**
   * Create Razorpay Order
   */
  async createRazorpayOrder(orderId: string, userId?: string): Promise<{
    razorpayOrderId: string;
    amount: number;
    currency: string;
    keyId: string;
    order: Order;
  }> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (userId && order.user_id && order.user_id !== userId) {
      throw new NotFoundError('Order not found');
    }

    const amountInPaise = Math.round(order.total_amount * 100);

    try {
      const razorpay = getRazorpayClient();
      const rzpOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: order.order_number,
        notes: {
          orderId: order.id,
          orderNumber: order.order_number,
        },
      });

      // Update order with razorpay_order_id
      await orderRepository.updateRazorpayDetails(order.id, rzpOrder.id, undefined, undefined, 'pending');

      return {
        razorpayOrderId: rzpOrder.id,
        amount: amountInPaise,
        currency: 'INR',
        keyId: config.razorpayKeyId,
        order,
      };
    } catch (err: any) {
      // In development / demo fallback if Razorpay credentials are placeholder
      if (config.demoMode || !config.razorpayKeySecret || config.razorpayKeySecret === 'placeholder_secret') {
        const mockRzpOrderId = `order_mock_${Date.now()}`;
        await orderRepository.updateRazorpayDetails(order.id, mockRzpOrderId, undefined, undefined, 'pending');

        return {
          razorpayOrderId: mockRzpOrderId,
          amount: amountInPaise,
          currency: 'INR',
          keyId: config.razorpayKeyId,
          order,
        };
      }

      console.error('[Razorpay Order Creation Error]:', err);
      throw new AppError('Failed to initiate online payment with Razorpay', 500);
    }
  },

  /**
   * Verify Razorpay Payment Signature
   */
  async verifyPayment(data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    orderId?: string;
  }): Promise<{ success: boolean; order: Order }> {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = data;

    // Check if in demo mode or valid signature
    let isValid = false;
    if (config.demoMode && razorpaySignature.startsWith('mock_sig_')) {
      isValid = true;
    } else {
      isValid = verifyRazorpaySignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        config.razorpayKeySecret
      );
    }

    if (!isValid) {
      throw new ValidationError('Invalid payment signature verification failed');
    }

    // Mark order as paid
    const updatedOrder = await orderRepository.updateRazorpayDetails(
      orderId || razorpayOrderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      'paid'
    );

    if (!updatedOrder) {
      throw new NotFoundError('Order not found for the provided payment');
    }

    return {
      success: true,
      order: updatedOrder,
    };
  },

  /**
   * Process Razorpay Webhook
   */
  async handleWebhook(rawBody: string, signature: string): Promise<void> {
    if (!config.razorpayWebhookSecret) return;

    const isValid = verifyWebhookSignature(rawBody, signature, config.razorpayWebhookSecret);
    if (!isValid) {
      throw new ValidationError('Invalid webhook signature');
    }

    const event = JSON.parse(rawBody);
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload.payment.entity;
      const razorpayOrderId = payment.order_id;
      const razorpayPaymentId = payment.id;

      if (razorpayOrderId) {
        await orderRepository.updateRazorpayDetails(
          razorpayOrderId,
          razorpayOrderId,
          razorpayPaymentId,
          undefined,
          'paid'
        );
      }
    }
  },
};
