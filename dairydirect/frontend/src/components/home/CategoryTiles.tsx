import Link from 'next/link';
import { Milk, Droplets, CookingPot, CakeSlice, Coffee, GlassWater, type LucideIcon } from 'lucide-react';

/**
 * Dairy department tiles.
 *
 * Square, image-first tiles are the quick-commerce convention. We do not have
 * photography per department yet, so the tile carries a single monoline icon on
 * a neutral well — no gradient, no badge, no description line. Six tiles, one
 * row on phones, one quiet row on desktop.
 */
const TILES: { label: string; category: string; icon: LucideIcon }[] = [
  { label: 'Milk', category: 'Milk', icon: Milk },
  { label: 'Curd', category: 'Curd', icon: GlassWater },
  { label: 'Paneer', category: 'Paneer', icon: CakeSlice },
  { label: 'Ghee', category: 'Ghee', icon: CookingPot },
  { label: 'Butter', category: 'Butter', icon: Coffee },
  { label: 'Lassi', category: 'Lassi', icon: Droplets },
];

export function CategoryTiles() {
  return (
    <section aria-labelledby="shop-by-category" className="w-full max-w-[1440px] mx-auto px-4 md:px-6 pt-5">
      <div className="flex items-center justify-between mb-2.5">
        <h2 id="shop-by-category" className="text-[15px] font-extrabold tracking-[-0.01em] text-foreground">
          Shop by category
        </h2>
        <Link href="/products" className="text-[12px] font-bold text-primary hover:underline">
          See all
        </Link>
      </div>

      <ul className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
        {TILES.map(({ label, category, icon: Icon }) => (
          <li key={category}>
            <Link
              href={`/products?category=${encodeURIComponent(category)}`}
              className="flex flex-col items-center gap-1.5 group"
            >
              <span className="w-full aspect-square max-h-[92px] rounded-xl bg-surface-muted grid place-items-center group-hover:bg-primary-fixed transition-colors">
                <Icon className="w-7 h-7 text-primary" strokeWidth={1.6} aria-hidden />
              </span>
              <span className="text-[12px] font-semibold text-foreground text-center leading-tight">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
