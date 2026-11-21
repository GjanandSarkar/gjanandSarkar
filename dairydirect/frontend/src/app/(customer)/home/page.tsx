import { getHomeFeed } from '@/lib/api/home';
import { HomeBanner } from '@/components/home/HomeBanner';
import { CategoryTiles } from '@/components/home/CategoryTiles';
import { TrendingProducts } from '@/components/home/TrendingProducts';
import { DealsAndBrands } from '@/components/home/DealsAndBrands';
import { RecommendationRail } from '@/components/discovery/RecommendationRail';

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
  const products = await getHomeFeed();

  return (
    <div className="flex flex-col w-full overflow-x-hidden bg-surface">
      <HomeBanner product={products[0]} />
      <CategoryTiles />
      <TrendingProducts products={products} />
      <DealsAndBrands products={products} />
      <RecommendationRail placement="home" limit={8} />
    </div>
  );
}
