/**
 * Cart reconciliation between the locally-held cart and the saved (server)
 * cart.
 *
 * AuthProvider previously did `setCart(serverCart)` on login and on every
 * auth re-hydration, which REPLACED whatever was on screen. Two ways that
 * lost a customer's items:
 *
 *   1. A guest adds items, then logs in. The saved cart (older, or empty
 *      from a previous session) overwrote everything they had just added.
 *   2. A write to the server cart failed silently -- addToCart() returns
 *      { success: false } and no caller checks it -- so the next hydration
 *      replaced the on-screen cart with a stale server copy and the item
 *      the customer added simply vanished.
 *
 * Merging makes the operation safe to repeat: hydration can run as often as
 * it likes without ever destroying items.
 *
 * Strategy is "keep the higher quantity" rather than summing. Summing looks
 * correct but double-counts the common case: the guest item was already
 * pushed to the server, so it exists in BOTH lists and adding them would
 * silently turn 1 unit into 2.
 */

export interface MergeableCartItem {
  productId: string;
  variantId: string;
  quantity: number;
}

const keyOf = (item: MergeableCartItem) => `${item.productId}::${item.variantId}`;

/**
 * Union of both carts. For a variant present in both, the larger quantity
 * wins. Order is stable: local items keep their position, saved-only items
 * are appended.
 */
export function mergeCarts<T extends MergeableCartItem>(
  localCart: readonly T[],
  savedCart: readonly T[]
): T[] {
  const merged: T[] = [];
  const indexByKey = new Map<string, number>();

  for (const item of localCart) {
    // Defensive: a malformed line can never be reconciled, and keeping it
    // would make the cart permanently un-checkout-able.
    if (!item?.productId || !item?.variantId) continue;

    const key = keyOf(item);
    const existing = indexByKey.get(key);

    if (existing === undefined) {
      indexByKey.set(key, merged.length);
      merged.push({ ...item, quantity: Math.max(0, item.quantity) });
    } else {
      // The incoming list already contained this variant twice; collapse it.
      merged[existing] = {
        ...merged[existing],
        quantity: Math.max(merged[existing].quantity, Math.max(0, item.quantity)),
      };
    }
  }

  for (const item of savedCart) {
    if (!item?.productId || !item?.variantId) continue;

    const key = keyOf(item);
    const existing = indexByKey.get(key);

    if (existing === undefined) {
      indexByKey.set(key, merged.length);
      merged.push({ ...item, quantity: Math.max(0, item.quantity) });
    } else {
      merged[existing] = {
        ...merged[existing],
        quantity: Math.max(merged[existing].quantity, Math.max(0, item.quantity)),
      };
    }
  }

  // A zero-quantity line is a removal, not an item.
  return merged.filter((item) => item.quantity > 0);
}

/**
 * Lines present in the merged cart that the server does not yet know about,
 * so the caller can push them up after a merge.
 */
export function itemsMissingFromSaved<T extends MergeableCartItem>(
  mergedCart: readonly T[],
  savedCart: readonly MergeableCartItem[]
): T[] {
  const savedKeys = new Map(savedCart.map((i) => [keyOf(i), i.quantity]));
  return mergedCart.filter((item) => {
    const savedQty = savedKeys.get(keyOf(item));
    return savedQty === undefined || savedQty !== item.quantity;
  });
}
