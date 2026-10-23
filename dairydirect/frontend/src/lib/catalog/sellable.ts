/**
 * What makes a catalogue row safe to show a customer.
 *
 * A product reached the storefront with no priced variant, so it listed at
 * ₹0 and put a ₹0 line in the cart. Price lives on product_variants, not on
 * products, so a product row can exist and be perfectly valid while having
 * nothing a customer could actually buy -- the approval flow creates the
 * variant in a second step, and anything that creates the product row
 * without that step leaves it unsellable.
 *
 * Rather than trusting every insert path to get this right, the storefront
 * refuses to list a product it cannot price. This is a display rule, not a
 * data fix: the row stays in the database and stays visible to admin and
 * seller tooling, which must still see it in order to repair it.
 */

export interface PricedVariant {
  id?: string | null;
  price?: number | string | null;
  [key: string]: any;
}

export interface SellableProduct {
  id?: string | null;
  product_variants?: PricedVariant[] | null;
  [key: string]: any;
}

/** A variant a customer could actually buy: identifiable and priced above zero. */
export function isSellableVariant(variant: PricedVariant | null | undefined): boolean {
  if (!variant) return false;
  // Without an id the cart cannot reference the line, so it can never resolve.
  if (!variant.id) return false;

  const price = Number(variant.price);
  return Number.isFinite(price) && price > 0;
}

/** True when at least one variant is sellable. */
export function isSellableProduct(product: SellableProduct | null | undefined): boolean {
  if (!product?.id) return false;
  const variants = product.product_variants;
  if (!Array.isArray(variants) || variants.length === 0) return false;
  return variants.some(isSellableVariant);
}

/**
 * Drop unsellable products, and drop unsellable variants from the ones that
 * remain, so a half-priced product cannot offer a ₹0 option.
 */
export function filterSellable<T extends SellableProduct>(products: readonly T[] | null | undefined): T[] {
  if (!Array.isArray(products)) return [];

  const sellable: T[] = [];
  for (const product of products) {
    if (!isSellableProduct(product)) continue;
    sellable.push({
      ...product,
      product_variants: (product.product_variants ?? []).filter(isSellableVariant),
    });
  }
  return sellable;
}

/**
 * Products that were dropped, for logging. Shipping a product nobody can buy
 * is a seller-facing problem, so it should be noticeable rather than silent.
 */
export function unsellableProducts<T extends SellableProduct>(products: readonly T[] | null | undefined): T[] {
  if (!Array.isArray(products)) return [];
  return products.filter((p) => !isSellableProduct(p));
}
