import { getHomeFeed } from '@/lib/api/home';
import { HeroBanner } from '@/components/home/HeroBanner';
import { TrustBar } from '@/components/home/TrustBar';
import { DealsAndBrands } from '@/components/home/DealsAndBrands';
import { HeritageBanner } from '@/components/home/HeritageBanner';
import { TrendingProducts } from '@/components/home/TrendingProducts';
import { WhyGjanandSarkar } from '@/components/home/WhyGjanandSarkar';
import { RecommendationRail } from '@/components/discovery/RecommendationRail';
import { AdSlot } from '@/components/discovery/AdSlot';
import { isSectionEnabled } from '@/lib/config/launch';

// Previously `force-dynamic` + `revalidate = 0`: every visitor triggered a
// full-catalogue database query and a fresh server render, so the homepage
// could never be cached or served from a CDN edge. The catalogue is not
// per-user, so it is now statically rendered and revalidated every 5 minutes
// (and immediately on product changes via `revalidateTag('products')`).
export const revalidate = 300;

export default async function HomeScreen() {
  // Cached, column-limited feed (see src/lib/api/home.ts).
  const prods = await getHomeFeed();

  return (
    <div className="flex flex-col w-full overflow-x-hidden bg-background">
      {/* 1. Hero. */}
      <HeroBanner products={prods} />

      {/* 2. Trust strip. */}
      <TrustBar />

      {/* 3. Live discounts. */}
      <DealsAndBrands products={prods} />

      {/* 4. Real products, as high up the page as possible. On a phone every
          decorative section above this is a screen the customer has to scroll
          past before seeing anything buyable. */}
      <TrendingProducts products={prods} />

      {/* 5. Personalised rail. Client-rendered on purpose: the page itself is
          statically generated and revalidated every 5 minutes, and a
          per-visitor rail baked into that cache would be served to everyone. */}
      <RecommendationRail placement="home" limit={8} />

      {/* 6. House promotion slot. */}
      <AdSlot placement="home" />

      {/* Gated below. Heritage describes crafts we do not sell yet, and the
          marketing explainer duplicates TrustBar. Both return automatically
          once the catalogue justifies them — see lib/config/launch.ts. */}
      {isSectionEnabled('heritageBanner') && <HeritageBanner />}
      {isSectionEnabled('whyGjanandSarkar') && <WhyGjanandSarkar />}
    </div>
  );
}
