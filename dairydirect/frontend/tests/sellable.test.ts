import { describe, it, expect } from 'vitest';
import {
  isSellableVariant,
  isSellableProduct,
  filterSellable,
  unsellableProducts,
} from '../src/lib/catalog/sellable';

const variant = (over: Record<string, any> = {}) => ({
  id: 'v1',
  price: 100,
  ...over,
});

const product = (over: Record<string, any> = {}) => ({
  id: 'p1',
  name: 'Paneer',
  product_variants: [variant()],
  ...over,
});

describe('isSellableVariant', () => {
  it('accepts an identifiable variant priced above zero', () => {
    expect(isSellableVariant(variant())).toBe(true);
  });

  it('rejects the ₹0 case that reached the cart', () => {
    expect(isSellableVariant(variant({ price: 0 }))).toBe(false);
  });

  it('rejects missing, null and non-numeric prices', () => {
    expect(isSellableVariant(variant({ price: null }))).toBe(false);
    expect(isSellableVariant(variant({ price: undefined }))).toBe(false);
    expect(isSellableVariant(variant({ price: 'abc' }))).toBe(false);
    expect(isSellableVariant(variant({ price: NaN }))).toBe(false);
  });

  it('rejects negative prices', () => {
    expect(isSellableVariant(variant({ price: -50 }))).toBe(false);
  });

  it('accepts a numeric string price, as PostgREST can return numerics', () => {
    expect(isSellableVariant(variant({ price: '249.50' }))).toBe(true);
  });

  it('rejects a variant with no id, which the cart could never resolve', () => {
    expect(isSellableVariant(variant({ id: null }))).toBe(false);
  });

  it('rejects null and undefined', () => {
    expect(isSellableVariant(null)).toBe(false);
    expect(isSellableVariant(undefined)).toBe(false);
  });
});

describe('isSellableProduct', () => {
  it('accepts a product with at least one priced variant', () => {
    expect(isSellableProduct(product())).toBe(true);
  });

  it('rejects a product with no variants at all', () => {
    expect(isSellableProduct(product({ product_variants: [] }))).toBe(false);
    expect(isSellableProduct(product({ product_variants: null }))).toBe(false);
    expect(isSellableProduct(product({ product_variants: undefined }))).toBe(false);
  });

  it('rejects a product whose only variant is unpriced', () => {
    expect(isSellableProduct(product({ product_variants: [variant({ price: 0 })] }))).toBe(false);
  });

  it('accepts when only some variants are priced', () => {
    const p = product({
      product_variants: [variant({ id: 'a', price: 0 }), variant({ id: 'b', price: 120 })],
    });
    expect(isSellableProduct(p)).toBe(true);
  });

  it('rejects a product with no id', () => {
    expect(isSellableProduct(product({ id: null }))).toBe(false);
  });
});

describe('filterSellable', () => {
  it('removes products that cannot be priced', () => {
    const list = [
      product({ id: 'good' }),
      product({ id: 'novariants', product_variants: [] }),
      product({ id: 'zeroprice', product_variants: [variant({ price: 0 })] }),
    ];

    expect(filterSellable(list).map((p) => p.id)).toEqual(['good']);
  });

  it('strips the ₹0 option from a product that also has a real one', () => {
    const list = [
      product({
        product_variants: [variant({ id: 'free', price: 0 }), variant({ id: 'paid', price: 99 })],
      }),
    ];

    const [result] = filterSellable(list);
    expect(result.product_variants.map((v: any) => v.id)).toEqual(['paid']);
  });

  it('does not mutate the input', () => {
    const list = [product({ product_variants: [variant({ price: 0 }), variant({ id: 'b', price: 5 })] })];
    const before = JSON.parse(JSON.stringify(list));

    filterSellable(list);

    expect(list).toEqual(before);
  });

  it('handles null and empty input', () => {
    expect(filterSellable(null)).toEqual([]);
    expect(filterSellable(undefined)).toEqual([]);
    expect(filterSellable([])).toEqual([]);
  });
});

describe('unsellableProducts', () => {
  it('reports what was dropped so it can be logged', () => {
    const list = [product({ id: 'good' }), product({ id: 'bad', product_variants: [] })];

    expect(unsellableProducts(list).map((p) => p.id)).toEqual(['bad']);
  });
});
