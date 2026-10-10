/**
 * Minimal product shape required to render a product card / listing tile.
 *
 * Listing surfaces (homepage, category, search, store) only ever read these
 * fields. Typing them against this instead of the full `ProductWithVariants`
 * lets those pages run narrow `select(...)` queries and ship a much smaller
 * RSC payload, while the richer `ProductWithVariants` (used on the product
 * detail page and in admin) remains structurally assignable to it.
 */
export type CatalogVariant = {
  id: string;
  weight: string;
  price: number;
  original_price: number | null;
  stock: number;
  product_id?: string;
  /** Stock minus active reservations; falls back to `stock` when absent. */
  available_quantity?: number;
};

export type CatalogProduct = {
  id: string;
  name: string;
  category: string | null;
  image_url: string | null;
  product_variants: CatalogVariant[];
  /**
   * Detail-only fields. Optional here so listing queries can omit them, but
   * present on the richer `ProductWithVariants` used by detail/admin screens.
   */
  description?: string | null;
  is_freshness_guarantee?: boolean;
  /**
   * The partner brand that makes the product. `products.brand` exists in the
   * schema but no listing query selected it, so every card rendered the
   * hardcoded string "By Gjanand Farm" — including on electronics and books.
   */
  brand?: string | null;
  /**
   * Real aggregates from `products.rating` / `products.reviews_count`.
   * Cards previously hardcoded "4.8" and faked the count as
   * `120 + product.name.length * 5`. Render these only when
   * `reviews_count > 0`; a default rating with no reviews behind it is a
   * fabricated endorsement.
   */
  rating?: number | null;
  reviews_count?: number | null;
  is_active?: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected' | 'suspended';
  rejection_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  sku?: string | null;
  subcategory?: string | null;
  tax_rate?: number;
  shipping_details?: string | null;
  return_policy?: string | null;
  attributes?: Record<string, any>;
  compliance_documents?: any[];
  gallery_images?: string[];
  seller_id?: string | null;
  created_by?: string | null;
  created_at?: string;
};
