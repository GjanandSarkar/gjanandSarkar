import { getHomeFeed } from '@/lib/api/home';
import { CurationHero } from '@/components/home/CurationHero';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { ProductCarousel } from '@/components/home/ProductCarousel';
import { DealsAndBrands } from '@/components/home/DealsAndBrands';
import { TrendingProducts } from '@/components/home/TrendingProducts';
import { RecommendationRail } from '@/components/discovery/RecommendationRail';
import { AdSlot } from '@/components/discovery/AdSlot';
import { CATEGORIES } from '@/lib/constants/categories';

// Revalidate feed every 5 minutes (and immediately on product updates via tags)
export const revalidate = 300;

export default async function HomeScreen() {
  const prods = (await getHomeFeed()) ?? [];

  // Dairy is one category among many, so this rail is only shown when the
  // catalogue actually has dairy in it rather than being padded out with
  // unrelated products to fill the slot.
  const essentials = prods.filter((p) =>
    ['milk', 'ghee', 'paneer', 'dahi', 'curd', 'dairy'].some((c) =>
      (p.category || '').toLowerCase().includes(c) || (p.name || '').toLowerCase().includes(c)
    )
  );

  return (
    <div className="flex flex-col w-full overflow-x-hidden bg-background text-foreground transition-colors duration-150">
      {/* 1. The promise. Curation, not speed — see CurationHero for why. */}
      <CurationHero categoryCount={CATEGORIES.length} />

      {/* 2. Whole taxonomy in one glance, above the fold on a phone. */}
      <CategoryGrid />

      {/* 3. Personalised rail. Client-rendered deliberately: this page is
             statically generated and revalidated every 5 minutes, so a
             per-visitor rail baked into that cache would be served to
             everyone. Restored here after a UI merge dropped the mount. */}
      <RecommendationRail placement="home" limit={8} />

      {/* 4. Live discounts. */}
      <DealsAndBrands products={prods} />

      {/* 5. Dairy rail, only when there is dairy to show. */}
      {essentials.length > 0 && (
        <div className="w-full max-w-[1440px] mx-auto pt-4">
          <ProductCarousel
            title="Daily Farm-Fresh Essentials"
            subtitle="Direct From Ethical Goshalas"
            products={essentials}
            isLoading={false}
            viewAllLink="/products"
            priority
          />
        </div>
      )}

      {/* 6. Newest catalogue additions. */}
      <TrendingProducts products={prods} />

      {/* 7. House promotion slot. */}
      <AdSlot placement="home" />
    </div>
  );
}
