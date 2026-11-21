/**
 * Brand constants for Gjanand Sarkar.
 *
 * Previously the brand voice lived as hardcoded strings scattered across
 * layout metadata, hero badges, footers and legal pages — and all of it still
 * described a dairy delivery business ("Farm Fresh Dairy, Delivered Daily",
 * keywords of "A2 milk, paneer"). The platform is a multi-category Indian
 * marketplace in which dairy is one category among many, so the copy now
 * lives in one place and says so.
 */

export const BRAND = {
  name: 'Gjanand Sarkar',
  legalName: 'Gjanand Sarkar',
  domain: 'gjanandsarkar.com',
  url: 'https://gjanandsarkar.com',

  /**
   * Launch positioning.
   *
   * The platform is built to host one trusted partner per category, but at
   * launch exactly one dairy partner is onboarded. Every customer-facing
   * promise therefore talks about milk — not "groceries, spices, wellness and
   * electronics" the storefront cannot actually deliver yet.
   */
  tagline: 'Fresh dairy, before breakfast',
  promise: 'One trusted dairy. Every bottle traceable.',
  shortDescription:
    'A2 milk, curd, paneer and ghee from a single verified dairy partner — chilled, traceable and delivered to your door every morning.',
  longDescription:
    'Gjanand Sarkar works with one vetted dairy for everything we sell. That means no blended milk, no mystery supply chain and no twenty near-identical listings to compare. Choose your milk, build a morning plan, and pause or skip whenever life gets in the way.',
  keywords: [
    'fresh milk delivery',
    'A2 milk online',
    'dairy subscription India',
    'daily milk delivery',
    'paneer online',
    'curd delivery',
    'farm fresh dairy',
  ],

  social: {
    facebook: 'https://facebook.com/gjanandsarkar',
    instagram: 'https://instagram.com/gjanandsarkar',
  },
} as const;

/**
 * Fallback image used when a product has no `image_url`.
 *
 * This replaces `/milk.png`, which was referenced in 14 places and did not
 * exist in `public/` — so every product missing an image rendered a broken
 * image icon. The replacement is a real file and is category-neutral.
 */
export const PLACEHOLDER_PRODUCT_IMAGE = '/placeholder-product.svg';
