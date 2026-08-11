import { orderService } from '../../src/services/orderService';
import { productRepository } from '../../src/repositories/productRepository';

export async function runOrdersIntegrationTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: Order with invalid empty items should throw
  try {
    let failedAsExpected = false;
    try {
      await orderService.placeOrder({
        userId: null,
        addressId: null,
        shippingAddress: '123 Test St, Palanpur',
        deliverySlot: 'Early Morning',
        deliveryDate: null,
        notes: null,
        paymentMethod: 'COD',
        items: [],
      });
    } catch {
      failedAsExpected = true;
    }

    if (!failedAsExpected) {
      throw new Error('Order with empty items should be rejected');
    }
    results.push({ name: 'Orders Integration: Reject empty order items', passed: true });
  } catch (err: any) {
    results.push({ name: 'Orders Integration: Reject empty order items', passed: false, error: err.message });
  }

  // Test 2: Order with non-existent variant ID should throw
  try {
    let failedAsExpected = false;
    try {
      await orderService.placeOrder({
        userId: null,
        addressId: null,
        shippingAddress: '123 Test St',
        deliverySlot: 'Early Morning',
        deliveryDate: null,
        notes: null,
        paymentMethod: 'COD',
        items: [{ variantId: '99999999-9999-9999-9999-999999999999', quantity: 2 }],
      });
    } catch {
      failedAsExpected = true;
    }

    if (!failedAsExpected) {
      throw new Error('Order with non-existent variant ID should fail');
    }
    results.push({ name: 'Orders Integration: Validate variant existence and availability', passed: true });
  } catch (err: any) {
    results.push({ name: 'Orders Integration: Validate variant existence and availability', passed: false, error: err.message });
  }

  return results;
}
