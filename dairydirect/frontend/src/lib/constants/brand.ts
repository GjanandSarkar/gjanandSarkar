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

  /** One-line positioning used in the hero and as the default page title. */
  tagline: 'India\u2019s Curated Marketplace',

  /** The promise that actually differentiates the platform. */
  promise: 'One trusted brand per category. Every product made in India.',

  shortDescription:
    'Shop verified Indian products across dairy, groceries, spices, wellness, home, fashion and electronics \u2014 one trusted partner brand per category.',

  longDescription:
    'Gjanand Sarkar brings India\u2019s best brands onto one platform. We partner with exactly one trusted company per category, so every product you see is verified, authentic and made in India \u2014 no counterfeits, no endless duplicate listings, no guesswork.',

  keywords: [
    'Indian products online',
    'made in India marketplace',
    'authentic Indian brands',
    'buy Indian products',
    'verified Indian sellers',
    'swadeshi shopping',
    'Indian ecommerce',
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
