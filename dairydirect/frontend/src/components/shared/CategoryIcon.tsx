'use client';

import React from 'react';
import {
  BookOpen,
  CookingPot,
  Droplets,
  Flame,
  FlaskConical,
  Hammer,
  Heart,
  LayoutGrid,
  Milk,
  Plug,
  Shirt,
  Sun,
  Wheat,
  type LucideIcon,
} from 'lucide-react';

import { findCategory } from '@/lib/constants/categories';

/**
 * Single icon registry for the category taxonomy.
 *
 * There used to be four independent, dairy-only icon maps — in CategoryNavBar,
 * CategoryRail, CategorySection and CircularCategories — each keyed on 'Milk',
 * 'Paneer', 'Ghee', 'Curd', 'Lassi', 'Buttermilk'. Any category outside that
 * set rendered with no icon or a generic leaf, so the entire non-dairy half of
 * the catalogue looked unfinished.
 */
const ICON_BY_NAME: Record<string, LucideIcon> = {
  Milk,
  Wheat,
  Flame,
  Droplets,
  FlaskConical,
  Heart,
  CookingPot,
  Hammer,
  Shirt,
  Sun,
  Plug,
  BookOpen,
  LayoutGrid,
};

/** Resolve a lucide icon component from an icon name in the taxonomy. */
export function iconByName(name?: string | null): LucideIcon {
  return (name && ICON_BY_NAME[name]) || LayoutGrid;
}

/** Resolve the icon for a category by its display name (or legacy alias). */
export function iconForCategory(category?: string | null): LucideIcon {
  if (category === 'All') return LayoutGrid;
  return iconByName(findCategory(category)?.icon);
}

/** Render the icon for an icon name from the taxonomy. */
export function CategoryIcon({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  const Icon = iconByName(name);
  return <Icon className={className ?? 'w-4 h-4 text-[#0f3e26]'} />;
}

/** Render the icon for a category display name. */
export function CategoryNameIcon({
  category,
  className,
}: {
  category?: string | null;
  className?: string;
}) {
  const Icon = iconForCategory(category);
  return <Icon className={className ?? 'w-4 h-4 text-[#0f3e26]'} />;
}
