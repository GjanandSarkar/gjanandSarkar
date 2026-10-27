import { getHomeFeed } from '@/lib/api/home';
import { CircularCategories } from '@/components/home/CircularCategories';
import { TrustBar } from '@/components/home/TrustBar';
import { DealsAndBrands } from '@/components/home/DealsAndBrands';
import { HeritageBanner } from '@/components/home/HeritageBanner';
import { TrendingProducts } from '@/components/home/TrendingProducts';
import { WhyGjanandSarkar } from '@/components/home/WhyGjanandSarkar';
import { OneBrandPerCategorySection } from '@/components/home/OneBrandPerCategorySection';
import { RecommendationRail } from '@/components/discovery/RecommendationRail';
import { AdSlot } from '@/components/discovery/AdSlot';
import { LanguageTrustBadge } from '@/components/home/LanguageTrustBadge';
import { isSectionEnabled } from '@/lib/config/launch';

export const revalidate = 300;

export default async function HomeScreen() {
  // Cached, column-limited feed (see src/lib/api/home.ts).
  const prods = await getHomeFeed();

  return (
    <div className="flex flex-col w-full overflow-x-hidden bg-background bg-dot-pattern">
      {/* 1. Category Quick Navigation */}
      <CircularCategories />

      {/* 2. Trust strip */}
      <TrustBar />

      {/* 3. Real products feed - multiple products first */}
      <TrendingProducts products={prods} />

      {/* 4. Live discounts & Deals (minimal) */}
      <DealsAndBrands products={prods} />

      {/* Language Support Badge */}
      <LanguageTrustBadge />

      {/* 5. One Brand Per Category Marketplace Model */}
      <OneBrandPerCategorySection />

      {/* 6. Personalised rail */}
      <RecommendationRail placement="home" limit={8} />

      {/* 7. House promotion slot */}
      <AdSlot placement="home" />

      {isSectionEnabled('heritageBanner') && <HeritageBanner />}
      {isSectionEnabled('whyGjanandSarkar') && <WhyGjanandSarkar />}
    </div>
  );
}
