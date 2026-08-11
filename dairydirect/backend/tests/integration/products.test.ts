import { productService } from '../../src/services/productService';

export async function runProductsIntegrationTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: List products with active filter
  try {
    const res = await productService.listProducts({ activeOnly: true, limit: 10 });
    if (!Array.isArray(res.products)) {
      throw new Error('Expected products array');
    }
    results.push({ name: 'Products Integration: List catalog products', passed: true });
  } catch (err: any) {
    results.push({ name: 'Products Integration: List catalog products', passed: false, error: err.message });
  }

  // Test 2: Profit margin guard check
  try {
    let failedAsExpected = false;
    try {
      await productService.createProduct({
        name: 'Invalid Price Milk',
        category: 'Milk',
        variants: [{ weight: '1L', price: 40, costPrice: 50 }], // Selling below cost!
      });
    } catch {
      failedAsExpected = true;
    }

    if (!failedAsExpected) {
      throw new Error('Product with selling price lower than cost price should be rejected');
    }
    results.push({ name: 'Products Integration: Profit Margin Guardrail prevents below-cost price', passed: true });
  } catch (err: any) {
    results.push({ name: 'Products Integration: Profit Margin Guardrail prevents below-cost price', passed: false, error: err.message });
  }

  return results;
}
