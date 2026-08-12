export const DB_CATEGORIES = [
  'Milk',
  'Ghee',
  'Paneer',
  'Curd',
  'Buttermilk',
  'Butter',
  'Sweets',
  'Other'
] as const;

export type DBCategory = typeof DB_CATEGORIES[number];

export const CATEGORY_STYLES: Record<string, { bg: string; color: string }> = {
  'Milk':       { bg: '#e8f4fd', color: '#4a90d9' },
  'Ghee':       { bg: '#fef5ec', color: '#d4712a' },
  'Paneer':     { bg: '#fff8e6', color: '#c78c2e' },
  'Curd':       { bg: '#fff8e6', color: '#c78c2e' },
  'Buttermilk': { bg: '#eaf6ef', color: '#3b8a55' },
  'Butter':     { bg: '#fef9e7', color: '#d4ac0d' },
  'Sweets':     { bg: '#fbf0f4', color: '#b03a66' },
  'Other':      { bg: '#f3f4f6', color: '#4b5563' },
};

export function getCategoryStyle(category?: string): { bg: string; color: string } {
  if (category && CATEGORY_STYLES[category]) {
    return CATEGORY_STYLES[category];
  }
  return { bg: 'rgba(63, 101, 48, 0.08)', color: '#3f6530' };
}

/**
 * Returns all valid categories present in database plus any existing product categories.
 * Only returns actual added categories without hardcoded defaults.
 */
export function getProductCategories(
  products?: Array<{ category?: string }>,
  customCategories?: Array<{ name?: string }>
): string[] {
  const base = new Set<string>();
  if (customCategories && customCategories.length > 0) {
    customCategories.forEach(c => {
      if (c.name && c.name.trim()) base.add(c.name.trim());
    });
  }
  if (products && products.length > 0) {
    products.forEach(p => {
      if (p.category && p.category.trim()) {
        base.add(p.category.trim());
      }
    });
  }
  return Array.from(base);
}
