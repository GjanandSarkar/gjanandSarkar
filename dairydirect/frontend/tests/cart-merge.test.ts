import { describe, it, expect } from 'vitest';
import { mergeCarts, itemsMissingFromSaved } from '../src/lib/cart/merge';

const item = (productId: string, variantId: string, quantity: number) => ({
  productId,
  variantId,
  quantity,
});

describe('mergeCarts', () => {
  it('keeps guest items when logging in to an account with a saved cart', () => {
    // The regression this exists for: AuthProvider used to call
    // setCart(savedCart), discarding everything the guest had added.
    const local = [item('p1', 'v1', 2)];
    const saved = [item('p2', 'v2', 1)];

    const merged = mergeCarts(local, saved);

    expect(merged).toHaveLength(2);
    expect(merged).toContainEqual(item('p1', 'v1', 2));
    expect(merged).toContainEqual(item('p2', 'v2', 1));
  });

  it('does not double-count a variant that is in both carts', () => {
    // The usual case: the guest item already synced to the server, so it
    // appears in both lists. Summing would turn 1 unit into 2.
    const merged = mergeCarts([item('p1', 'v1', 1)], [item('p1', 'v1', 1)]);

    expect(merged).toEqual([item('p1', 'v1', 1)]);
  });

  it('keeps the higher quantity when the two carts disagree', () => {
    expect(mergeCarts([item('p1', 'v1', 5)], [item('p1', 'v1', 2)])).toEqual([
      item('p1', 'v1', 5),
    ]);
    expect(mergeCarts([item('p1', 'v1', 2)], [item('p1', 'v1', 5)])).toEqual([
      item('p1', 'v1', 5),
    ]);
  });

  it('treats different variants of one product as separate lines', () => {
    const merged = mergeCarts([item('p1', 'v1', 1)], [item('p1', 'v2', 3)]);

    expect(merged).toHaveLength(2);
    expect(merged).toContainEqual(item('p1', 'v1', 1));
    expect(merged).toContainEqual(item('p1', 'v2', 3));
  });

  it('is idempotent, so repeated auth hydration cannot inflate the cart', () => {
    const local = [item('p1', 'v1', 2), item('p2', 'v2', 1)];
    const saved = [item('p1', 'v1', 2)];

    const once = mergeCarts(local, saved);
    const twice = mergeCarts(once, saved);
    const thrice = mergeCarts(twice, saved);

    expect(twice).toEqual(once);
    expect(thrice).toEqual(once);
  });

  it('handles either side being empty', () => {
    expect(mergeCarts([], [item('p1', 'v1', 1)])).toEqual([item('p1', 'v1', 1)]);
    expect(mergeCarts([item('p1', 'v1', 1)], [])).toEqual([item('p1', 'v1', 1)]);
    expect(mergeCarts([], [])).toEqual([]);
  });

  it('drops malformed and zero-quantity lines that could never check out', () => {
    const local = [
      item('p1', 'v1', 1),
      item('', 'v2', 1),
      item('p3', '', 1),
      item('p4', 'v4', 0),
      item('p5', 'v5', -3),
    ];

    expect(mergeCarts(local, [])).toEqual([item('p1', 'v1', 1)]);
  });

  it('collapses a duplicated variant inside a single cart', () => {
    const merged = mergeCarts([item('p1', 'v1', 1), item('p1', 'v1', 4)], []);

    expect(merged).toEqual([item('p1', 'v1', 4)]);
  });

  it('preserves local ordering and appends saved-only items', () => {
    const local = [item('a', 'v', 1), item('b', 'v', 1)];
    const saved = [item('c', 'v', 1)];

    expect(mergeCarts(local, saved).map((i) => i.productId)).toEqual(['a', 'b', 'c']);
  });

  it('does not mutate its inputs', () => {
    const local = [item('p1', 'v1', 1)];
    const saved = [item('p1', 'v1', 9)];

    mergeCarts(local, saved);

    expect(local).toEqual([item('p1', 'v1', 1)]);
    expect(saved).toEqual([item('p1', 'v1', 9)]);
  });
});

describe('itemsMissingFromSaved', () => {
  it('reports items the server has not seen, so they can be pushed up', () => {
    const merged = [item('p1', 'v1', 2), item('p2', 'v2', 1)];
    const saved = [item('p1', 'v1', 2)];

    expect(itemsMissingFromSaved(merged, saved)).toEqual([item('p2', 'v2', 1)]);
  });

  it('reports items whose quantity the merge changed', () => {
    const merged = [item('p1', 'v1', 5)];
    const saved = [item('p1', 'v1', 2)];

    expect(itemsMissingFromSaved(merged, saved)).toEqual([item('p1', 'v1', 5)]);
  });

  it('reports nothing when the server is already in sync', () => {
    const merged = [item('p1', 'v1', 2)];

    expect(itemsMissingFromSaved(merged, merged)).toEqual([]);
  });
});
