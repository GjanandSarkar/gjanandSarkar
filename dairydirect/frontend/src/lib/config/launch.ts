/**
 * Launch configuration.
 *
 * The platform is built for one verified partner per category across twelve
 * categories, but at launch only the dairy partner is onboarded. Showing an
 * empty "Handicrafts" or "Electronics" category is worse than not showing it:
 * it makes a working store look abandoned, and it is the single fastest way
 * to lose a first-time customer.
 *
 * So the multi-category machinery stays fully intact and is only hidden here.
 * Nothing is deleted. When the second partner signs, flip `DAIRY_ONLY` to
 * false and the taxonomy, the heritage storytelling and the state-origin
 * filter all come back exactly as they were.
 *
 * Keep this file free of imports so it can be read from both server and
 * client components without pulling anything into the bundle.
 */

/**
 * Master switch. True while dairy is the only live category.
 */
export const DAIRY_ONLY = true;

/**
 * Category keys that have a live, onboarded seller behind them.
 * Only consulted while DAIRY_ONLY is true.
 */
export const LIVE_CATEGORY_KEYS = ['dairy', 'handicrafts'] as const;

/**
 * Section-level switches.
 *
 * These are deliberately separate from DAIRY_ONLY. Some of these sections are
 * hidden because they have no inventory to describe yet (heritage,
 * stateOrigin); others are hidden because they are decorative filler that
 * pushes real products below the fold on a phone, which is where most of our
 * customers are. The second group should probably stay off even after the
 * catalogue fills out.
 */
export const SECTIONS = {
  /** "Explore India's Rich Heritage" — describes crafts we do not yet sell. */
  heritageBanner: false,
  /** "Shop by State Origin" — needs a multi-state catalogue to be meaningful. */
  shopByState: false,
  /** Long marketing explainer. Real trust signals live in TrustBar instead. */
  whyGjanandSarkar: false,
  /** Duplicate of TrustBar further down the page. */
  trustSection: false,
  /** Category ring nav. Redundant while there is one live category. */
  circularCategories: false,
  /** State filter inside the products page sidebar. */
  stateOriginFilter: false,
  /** Customer-facing lab report browser. No reports published yet. */
  qualityReports: false,
  /** Loyalty points UI with no scheme behind it. */
  rewards: false,
} as const;

export type SectionKey = keyof typeof SECTIONS;

/**
 * Whether a gated section should render.
 */
export function isSectionEnabled(key: SectionKey): boolean {
  return SECTIONS[key];
}

/**
 * Whether a category should be shown anywhere in the UI.
 *
 * Compares on the category key, not the display name, because display names
 * are user-facing copy and change; keys are stable.
 */
export function isCategoryLive(key: string | null | undefined): boolean {
  if (!DAIRY_ONLY) return true;
  if (!key) return false;
  return (LIVE_CATEGORY_KEYS as readonly string[]).includes(key.toLowerCase());
}
