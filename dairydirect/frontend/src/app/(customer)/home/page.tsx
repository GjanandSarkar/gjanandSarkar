import { getProductsServer } from '@/lib/api/products';
import { HeroBanner } from '@/components/home/HeroBanner';
import { TrustBar } from '@/components/home/TrustBar';

import { DealsAndBrands } from '@/components/home/DealsAndBrands';
import { HeritageBanner } from '@/components/home/HeritageBanner';
import { TrendingProducts } from '@/components/home/TrendingProducts';

import { ImpactAndTestimonial } from '@/components/home/ImpactAndTestimonial';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomeScreen() {
  // Fetch real active products directly from database on server
  const prods = await getProductsServer({ activeOnly: true });

  return (
    <div className="flex flex-col w-full overflow-x-hidden bg-[#fafaf8]">
      {/* 1. Hero Banner (Palace Arch & Heritage Showcase) */}
      <HeroBanner />

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
