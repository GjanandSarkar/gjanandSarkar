import { getHomeFeed } from '@/lib/api/home';
import { CategoryQuickNav } from '@/components/home/CategoryQuickNav';
import { ShopGrid } from '@/components/home/ShopGrid';
import { TrustBar } from '@/components/home/TrustBar';
import { DealsAndBrands } from '@/components/home/DealsAndBrands';
import { HeritageBanner } from '@/components/home/HeritageBanner';
import { WhyGjanandSarkar } from '@/components/home/WhyGjanandSarkar';
import { RecommendationRail } from '@/components/discovery/RecommendationRail';
import { AdSlot } from '@/components/discovery/AdSlot';
import { isSectionEnabled } from '@/lib/config/launch';

// Statically rendered, revalidated every 5 minutes, and invalidated
// immediately on product changes via revalidateTag('products'). The
// catalogue is not per-user, so there is nothing here to render per request.
export const revalidate = 300;

export default async function HomeScreen() {
  const prods = await getHomeFeed();

  return (
    <div className="flex w-full flex-col overflow-x-hidden bg-background pb-8">
      {/* 1. Categories. The old HeroBanner lived here and cost an entire
             phone screen before a customer saw anything buyable. A rail is
             navigation rather than decoration, so it earns its space and
             takes about a fifth of the height. */}
      <CategoryQuickNav />

      {/* 2. Products, immediately. On a 360px phone the first row of the
             grid is visible without scrolling, which is the single thing
             this redesign is built around. */}
      <ShopGrid products={prods} />

      {/* 3. Everything below is support, not the main event. Discounts come
             first because they are still product, just framed by price. */}
      <div className="mt-10 flex flex-col gap-10">
        <DealsAndBrands products={prods} />

        {/* Client-rendered on purpose: the page is statically generated, and
            a per-visitor rail baked into that cache would be served to
            everyone. */}
        <RecommendationRail placement="home" limit={8} />

        <AdSlot placement="home" />

        {/* Reassurance belongs after the customer has seen the goods, not
            before. Nobody is convinced by a delivery promise for a shop
            whose products they have not looked at yet. */}
        <TrustBar />
      </div>

      {/* Launch-gated. Both return automatically once the catalogue
          justifies them — see lib/config/launch.ts. */}
      {isSectionEnabled('heritageBanner') && <HeritageBanner />}
      {isSectionEnabled('whyGjanandSarkar') && <WhyGjanandSarkar />}
    </div>
  );
}
