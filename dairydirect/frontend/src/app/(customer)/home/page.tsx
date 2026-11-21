import { getHomeFeed } from '@/lib/api/home';
<<<<<<< HEAD
import { HomeBanner } from '@/components/home/HomeBanner';
import { CategoryTiles } from '@/components/home/CategoryTiles';
=======
import { HeroBanner } from '@/components/home/HeroBanner';
import { ProductCarousel } from '@/components/home/ProductCarousel';
import { DealsAndBrands } from '@/components/home/DealsAndBrands';
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
import { TrendingProducts } from '@/components/home/TrendingProducts';
import { DealsAndBrands } from '@/components/home/DealsAndBrands';
import { RecommendationRail } from '@/components/discovery/RecommendationRail';

<<<<<<< HEAD
=======
// Revalidate feed every 5 minutes (and immediately on product updates via tags)
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
export const revalidate = 300;

/**
 * Homepage — commerce only.
 *
 * Before: hero + category circles + trust strip + trending + offers + language
 * badge + a "one brand per category" essay + recommendations + ad slot +
 * heritage banner + why-us. Ten sections, four of them about the company.
 *
 * Now: one banner, categories, two product rails, one personalised rail. The
 * company story lives on /about, the language switcher in the footer, and
 * trust proof on the product page where the decision is actually made.
 */
export default async function HomeScreen() {
<<<<<<< HEAD
  const products = await getHomeFeed();

  return (
    <div className="flex flex-col w-full overflow-x-hidden bg-surface">
      <HomeBanner product={products[0]} />
      <CategoryTiles />
      <TrendingProducts products={products} />
      <DealsAndBrands products={products} />
      <RecommendationRail placement="home" limit={8} />
=======
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

      {/* 2. Deal of the Day (Live Flash Discounts) */}
      <DealsAndBrands products={prods} />

      {/* 3. Daily Farm-Fresh Essentials Carousel */}
      {displayEssentials.length > 0 && (
        <div className="w-full max-w-[1440px] mx-auto pt-4">
          <ProductCarousel
            title="Daily Farm-Fresh Essentials"
            subtitle="Direct From Ethical Goshalas"
            products={displayEssentials}
            isLoading={false}
            viewAllLink="/products"
            priority
          />
        </div>
      )}

      {/* 4. Trending Store Products */}
      <TrendingProducts products={prods} />
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
    </div>
  );
}
