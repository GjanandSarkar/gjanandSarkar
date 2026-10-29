import { Suspense } from 'react';

import { getHomeFeed } from '@/lib/api/home';
import { CategoryStrip } from '@/components/catalog/CategoryStrip';
import { ProductList } from '@/components/catalog/ProductList';
import { OneBrandPerCategorySection } from '@/components/home/OneBrandPerCategorySection';
import { RecommendationRail } from '@/components/discovery/RecommendationRail';
import { AdSlot } from '@/components/discovery/AdSlot';
import { HeritageBanner } from '@/components/home/HeritageBanner';
import { WhyGjanandSarkar } from '@/components/home/WhyGjanandSarkar';
import { isSectionEnabled } from '@/lib/config/launch';

export const revalidate = 300;

export default async function HomeScreen() {
  const prods = await getHomeFeed();

  return (
    <div className="flex w-full flex-col overflow-x-hidden bg-background">
      {/* 1. Category filter strip. One line tall and sticky, so the customer
             can change category from anywhere in the feed without scrolling
             back to the top. The circular-icon block it replaces was a full
             screen of illustration between the customer and the goods. */}
      <Suspense fallback={<div className="h-[49px] border-b border-border bg-surface" />}>
        <CategoryStrip />
      </Suspense>

      {/* 2. Products. First item in the document after navigation, so on a
             360px phone three rows are visible before any scrolling. */}
      <ProductList products={prods} />

      {/* 3. Supporting content, strictly below the goods. */}
      <div className="flex flex-col gap-6 pb-10 pt-2">
        {/* Client-rendered: the page is static and revalidated every five
            minutes, so a per-visitor rail baked into that cache would be
            served to everybody. */}
        <RecommendationRail placement="home" limit={8} />

        {/* The one-company-per-category model is the actual differentiator,
            so it earns a place on the homepage — but after the customer has
            seen something to buy, not before. */}
        <OneBrandPerCategorySection />

        <AdSlot placement="home" />
      </div>

      {/* Launch-gated; both return when the catalogue justifies them. */}
      {isSectionEnabled('heritageBanner') && <HeritageBanner />}
      {isSectionEnabled('whyGjanandSarkar') && <WhyGjanandSarkar />}
    </div>
  );
}
