import { pricingService } from '../../src/services/pricingService';

export async function runPricingTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: Subtotal and standard delivery fee calculation
  try {
    const res = await pricingService.calculateOrderTotals({
      items: [{ price: 100, costPrice: 70, quantity: 2 }],
    });

    if (res.subtotal !== 200) {
      throw new Error(`Expected subtotal 200, got ${res.subtotal}`);
    }
    if (res.deliveryFee !== 25) {
      throw new Error(`Expected delivery fee 25 below threshold, got ${res.deliveryFee}`);
    }
    if (res.totalAmount !== 225) {
      throw new Error(`Expected total 225, got ${res.totalAmount}`);
    }
    results.push({ name: 'PricingService: Subtotal and standard delivery fee', passed: true });
  } catch (err: any) {
    results.push({ name: 'PricingService: Subtotal and standard delivery fee', passed: false, error: err.message });
  }

  // Test 2: Free delivery threshold applied
  try {
    const res = await pricingService.calculateOrderTotals({
      items: [{ price: 350, costPrice: 200, quantity: 1 }],
    });

    if (res.deliveryFee !== 0) {
      throw new Error(`Expected free delivery fee 0 above ₹299, got ${res.deliveryFee}`);
    }
    if (res.totalAmount !== 350) {
      throw new Error(`Expected total 350, got ${res.totalAmount}`);
    }
    results.push({ name: 'PricingService: Free delivery threshold logic', passed: true });
  } catch (err: any) {
    results.push({ name: 'PricingService: Free delivery threshold logic', passed: false, error: err.message });
  }

  return results;
}
