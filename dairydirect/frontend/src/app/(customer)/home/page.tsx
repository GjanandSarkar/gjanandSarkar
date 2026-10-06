import { getHomeFeed } from '@/lib/api/home';
import { HeroBanner } from '@/components/home/HeroBanner';
import { TrustBar } from '@/components/home/TrustBar';

import { DealsAndBrands } from '@/components/home/DealsAndBrands';
import { HeritageBanner } from '@/components/home/HeritageBanner';
import { TrendingProducts } from '@/components/home/TrendingProducts';

import { ImpactAndTestimonial } from '@/components/home/ImpactAndTestimonial';

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
    <div className="flex flex-col w-full overflow-x-hidden bg-[#fafaf8]">
      {/* 1. Hero Banner (Palace Arch & Heritage Showcase) */}
      <HeroBanner products={prods} />

      {/* 2. Trust Proposition Strip (5 Pillars) */}
      <TrustBar />


      {/* 4. Deal of the Day (Countdown) + Trusted Indian Brands (Grid) */}
      <DealsAndBrands products={prods} />

      {/* 5. Explore India's Rich Heritage & Culture Banner */}
      <HeritageBanner />

      {/* 6. Trending Products (Live Store Catalog) */}
      <TrendingProducts products={prods} />

      {/* 8. Impact Stats, Why Choose & Verified Testimonial */}
      <ImpactAndTestimonial />
    </div>
  );
}
