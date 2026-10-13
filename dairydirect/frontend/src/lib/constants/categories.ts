/**
 * The canonical Gjanand Sarkar category taxonomy.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The category list was previously duplicated, with different contents, in at
 * least four places:
 *
 *   - `CategoryNavBar`      — 14 dairy-led names ("A2 Gir Cow Milk",
 *                             "Vedic Bilona Ghee", "Fresh Malai Paneer"...)
 *   - `ProductsClient`      — a different 16-item array
 *   - `admin/products/edit` — `['Milk','Paneer','Ghee','Buttermilk','Curd','Lassi']`
 *   - `DBProduct.category`  — a closed TypeScript union of six dairy values,
 *                             while the UI already offered Electronics and Fashion
 *
 * They disagreed, which meant a product created in admin could be
 * unreachable from the navigation, and the type system actively lied about
 * what a category could be.
 *
 * Dairy is now ONE category among many, not the organising principle of the
 * site.
 *
 * BUSINESS RULE
 * -------------
 * Gjanand Sarkar partners with exactly one company per category. That rule is
 * enforced in the database by `uniq_active_seller_per_category` (migration
 * 20261006_product_ownership_columns.sql); this file is the customer-facing
 * expression of the same idea.
 */

export type CategoryKey =
  | 'dairy'
  | 'groceries'
  | 'spices'
  | 'oils'
  | 'ayurveda'
  | 'beauty'
  | 'home-kitchen'
  | 'handicrafts'
  | 'fashion'
  | 'pooja'
  | 'electronics'
  | 'books';

export type Category = {
  /** Stable slug used in URLs. */
  key: CategoryKey;
  /** Display name. Also the value stored in `products.category`. */
  name: string;
  /** Short line shown in mega-menus and category headers. */
  description: string;
  /** Optional short badge for the condensed nav bar. */
  badge?: string;
  /** lucide-react icon name, resolved by the consuming component. */
  icon: string;
  /** Show in the condensed top navigation strip. */
  featured: boolean;
};

export const CATEGORIES: Category[] = [
  {
    key: 'dairy',
    name: 'Dairy',
    description: 'Milk, ghee, paneer and curd',
    badge: 'Fresh Daily',
    icon: 'Milk',
    featured: true,
  },
  {
    key: 'groceries',
    name: 'Groceries',
    description: 'Grains, pulses, flours and staples',
    badge: 'Everyday',
    icon: 'Wheat',
    featured: true,
  },
  {
    key: 'spices',
    name: 'Spices & Masalas',
    description: 'Whole spices and traditional blends',
    badge: 'Aromatic',
    icon: 'Flame',
    featured: true,
  },
  {
    key: 'oils',
    name: 'Cold-Pressed Oils',
    description: 'Wood-pressed cooking and wellness oils',
    badge: 'Pure',
    icon: 'Droplets',
    featured: true,
  },
  {
    key: 'ayurveda',
    name: 'Ayurveda & Wellness',
    description: 'Herbs, supplements and remedies',
    badge: 'Natural',
    icon: 'FlaskConical',
    featured: true,
  },
  {
    key: 'beauty',
    name: 'Beauty & Personal Care',
    description: 'Skincare, haircare and grooming',
    icon: 'Heart',
    featured: false,
  },
  {
    key: 'home-kitchen',
    name: 'Home & Kitchen',
    description: 'Cookware, storage and home essentials',
    icon: 'CookingPot',
    featured: false,
  },
  {
    key: 'handicrafts',
    name: 'Handicrafts & Decor',
    description: 'Handmade art, brass and home decor',
    icon: 'Hammer',
    featured: false,
  },
  {
    key: 'fashion',
    name: 'Handloom & Fashion',
    description: 'Handwoven textiles, apparel and accessories',
    icon: 'Shirt',
    featured: false,
  },
  {
    key: 'pooja',
    name: 'Pooja & Spiritual',
    description: 'Puja essentials and devotional items',
    icon: 'Sun',
    featured: false,
  },
  {
    key: 'electronics',
    name: 'Electronics',
    description: 'Appliances, audio and everyday tech',
    icon: 'Plug',
    featured: false,
  },
  {
    key: 'books',
    name: 'Books & Stationery',
    description: 'Books, journals and desk supplies',
    icon: 'BookOpen',
    featured: false,
  },
];

/** Category names only — for selects, filter chips and admin forms. */
export const CATEGORY_NAMES: string[] = CATEGORIES.map((c) => c.name);

/** Categories shown in the condensed top navigation strip. */
export const FEATURED_CATEGORIES: Category[] = CATEGORIES.filter((c) => c.featured);

/** Categories hidden behind the "More" dropdown. */
export const SECONDARY_CATEGORIES: Category[] = CATEGORIES.filter((c) => !c.featured);

/** Link to a category listing. */
export function categoryHref(category: Category | string): string {
  const name = typeof category === 'string' ? category : category.name;
  return `/products?category=${encodeURIComponent(name)}`;
}

/** Look up a category by its slug or (case-insensitive) display name. */
export function findCategory(value?: string | null): Category | undefined {
  if (!value) return undefined;
  const needle = value.trim().toLowerCase();
  return CATEGORIES.find(
    (c) => c.key === needle || c.name.toLowerCase() === needle
  );
}

/**
 * Accent colours per category, used for cart tiles and admin badges.
 *
 * Three separate copies of a dairy-only colour map previously existed (cart
 * page, cart drawer, admin product list). Each keyed on 'Milk' | 'Paneer' |
 * 'Ghee' | 'Buttermilk' | 'Curd' | 'Lassi', so every non-dairy product fell
 * through to the same generic colour — Electronics, Fashion and Books were
 * all tinted pale green.
 */
const CATEGORY_COLORS: Record<CategoryKey, { bg: string; color: string }> = {
  dairy: { bg: '#e8f4fd', color: '#3f7fb8' },
  groceries: { bg: '#f4f1e4', color: '#8a7638' },
  spices: { bg: '#fdeee8', color: '#c0552a' },
  oils: { bg: '#fef5ec', color: '#c07a24' },
  ayurveda: { bg: '#e9f6ee', color: '#2f7d4f' },
  beauty: { bg: '#fdecf3', color: '#b5447a' },
  'home-kitchen': { bg: '#f1f0ec', color: '#6e6758' },
  handicrafts: { bg: '#f3edfa', color: '#7452a8' },
  fashion: { bg: '#ecf0fb', color: '#4a5fa8' },
  pooja: { bg: '#fdf6e3', color: '#b08a1e' },
  electronics: { bg: '#e9f2f5', color: '#3b7383' },
  books: { bg: '#f0f2e9', color: '#5f7334' },
};

const FALLBACK_CATEGORY_COLOR = { bg: '#f2f1ed', color: '#6b6659' };

export function categoryColors(category?: string | null): { bg: string; color: string } {
  const match = findCategory(category);
  return match ? CATEGORY_COLORS[match.key] : FALLBACK_CATEGORY_COLOR;
}

export function categoryBg(category?: string | null): string {
  return categoryColors(category).bg;
}

/**
 * Categories that pair well with a given category, for cart cross-sells.
 * Falls back to the featured set for categories with no explicit pairing.
 */
const RELATED: Partial<Record<CategoryKey, CategoryKey[]>> = {
  dairy: ['groceries', 'spices'],
  groceries: ['spices', 'oils', 'dairy'],
  spices: ['oils', 'groceries'],
  oils: ['spices', 'groceries'],
  ayurveda: ['beauty', 'groceries'],
  beauty: ['ayurveda', 'handicrafts'],
  'home-kitchen': ['handicrafts', 'groceries'],
  handicrafts: ['home-kitchen', 'pooja'],
  fashion: ['handicrafts', 'beauty'],
  pooja: ['handicrafts', 'ayurveda'],
  electronics: ['home-kitchen', 'books'],
  books: ['electronics', 'pooja'],
};

export function relatedCategories(category?: string | null): string[] {
  const match = findCategory(category);
  if (!match) return [];
  return (RELATED[match.key] ?? [])
    .map((key) => CATEGORIES.find((c) => c.key === key)?.name)
    .filter((n): n is string => Boolean(n));
}

/**
 * Legacy data shim.
 *
 * Existing rows in `products.category` predate the taxonomy and store dairy
 * sub-products ('Milk', 'Ghee', 'Paneer', 'Curd', 'Lassi', 'Buttermilk')
 * rather than the category name 'Dairy'. Until those rows are migrated, a
 * request for the Dairy category must also match the legacy values.
 *
 * Returns a PostgREST `.or()` filter string, or null when the category needs
 * no special handling.
 */
export function legacyCategoryFilter(category: string): string | null {
  const clean = category.replace(/-/g, ' ').trim().toLowerCase();
  if (clean === 'dairy' || clean === 'dairy & essentials') {
    return [
      'category.ilike.%Milk%',
      'category.ilike.%Ghee%',
      'category.ilike.%Paneer%',
      'category.ilike.%Curd%',
      'category.ilike.%Lassi%',
      'category.ilike.%Buttermilk%',
      'category.ilike.%Dairy%',
    ].join(',');
  }
  return null;
}
