import { getHomeFeed } from '@/lib/api/home';
import { HeroBanner } from '@/components/home/HeroBanner';
import { CircularCategories } from '@/components/home/CircularCategories';
import { ProductCarousel } from '@/components/home/ProductCarousel';
import { DealsAndBrands } from '@/components/home/DealsAndBrands';
import { TrendingProducts } from '@/components/home/TrendingProducts';
import { TrustBar } from '@/components/home/TrustBar';
import { WhyGjanandSarkar } from '@/components/home/WhyGjanandSarkar';
import { Sparkles } from 'lucide-react';

// Revalidate feed every 5 minutes (and immediately on product updates via tags)
export const revalidate = 300;

export default async function HomeScreen() {
  const prods = (await getHomeFeed()) ?? [];

  // Curate daily morning essentials (milk, bilona ghee, paneer, dahi)
  const essentials = prods.filter((p) =>
    ['milk', 'ghee', 'paneer', 'dahi', 'curd', 'dairy'].some((c) =>
      (p.category || '').toLowerCase().includes(c) || (p.name || '').toLowerCase().includes(c)
    )
  );
  const displayEssentials = essentials.length > 0 ? essentials : prods.slice(0, 4);

  return (
    <div className="flex flex-col w-full overflow-x-hidden bg-background text-foreground transition-colors duration-150">
      {/* 1. Hero Spotlight & Instant Buy */}
      <HeroBanner products={prods} />

      {/* 2. Visual Category Discovery Rail */}
      <CircularCategories />

      {/* 3. Daily Farm-Fresh Essentials Carousel */}
      {displayEssentials.length > 0 && (
        <div className="w-full max-w-[1440px] mx-auto pt-2">
          <ProductCarousel
            title="Daily Farm-Fresh Essentials"
            subtitle="Direct From Ethical Goshalas"
            icon={<Sparkles className="w-3.5 h-3.5 text-secondary" />}
            products={displayEssentials}
            isLoading={false}
            viewAllLink="/products"
            priority
          />
        </div>
      )}

      {/* 4. Deal of the Day (Live Flash Discounts) */}
      <DealsAndBrands products={prods} />

      {/* 5. Trending Store Products (Artisans & Farms) */}
      <TrendingProducts products={prods} />

      {/* 6. Customer Trust & Cold-Chain Guarantee Strip */}
      <TrustBar />

      {/* 7. How Vedic Farm-to-Doorstep Works */}
      <WhyGjanandSarkar />
    </div>
  );
}
