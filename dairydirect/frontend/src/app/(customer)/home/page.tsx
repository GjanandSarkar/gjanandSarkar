import { getProductsServer } from '@/lib/api/products';
import { CategorySection } from '@/components/home/CategorySection';
import { ProductCarousel } from '@/components/home/ProductCarousel';
import { BuyAgainCarousel } from '@/components/discovery/BuyAgainCarousel';
import { TrustSection } from '@/components/home/TrustSection';
import { SocialProof } from '@/components/home/SocialProof';
import { Sparkles, TrendingUp } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic imports for below-the-fold content
const DynamicTrustSection = dynamic(() => import('@/components/home/TrustSection').then(mod => mod.TrustSection), {
  loading: () => <div className="h-64 bg-surface-container-low animate-pulse my-8 rounded-[24px]" />
});
const DynamicSocialProof = dynamic(() => import('@/components/home/SocialProof').then(mod => mod.SocialProof), {
  loading: () => <div className="h-64 bg-surface-container-low animate-pulse my-8 rounded-[24px]" />
});

export default async function HomeScreen() {
  // Fetch on the server using direct DB query
  const prods = await getProductsServer({ activeOnly: true });

  // Extract unique categories
  const uniqueCategories = Array.from(new Set(prods.map(p => p.category)));

  // Simulate Best Sellers (e.g. first 6 products)
  const bestSellers = prods.slice(0, 6);

  // Featured / Fresh Today (sort by created_at DESC)
  const featuredProducts = [...prods].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 6);

  return (
    <div className="flex flex-col pb-20 pt-4">
      {/* ══ CATEGORY QUICK ACCESS ══ */}
      <CategorySection categories={uniqueCategories} isLoading={false} />

      {/* ══ BUY AGAIN (Personalized) ══ */}
      <BuyAgainCarousel allProducts={prods} />

      {/* ══ BEST SELLERS ══ */}
      <ProductCarousel 
        title="Best Sellers" 
        subtitle="Trending"
        icon={<TrendingUp className="w-4 h-4 text-secondary" strokeWidth={2.5} />}
        products={bestSellers} 
        isLoading={false} 
        viewAllLink="/products"
        priority={true}
      />

      {/* ══ FRESH TODAY / FEATURED ══ */}
      <ProductCarousel 
        title="Fresh Today" 
        subtitle="Newly Added"
        icon={<Sparkles className="w-4 h-4 text-primary" strokeWidth={2.5} />}
        products={featuredProducts} 
        isLoading={false} 
        viewAllLink="/products"
      />

      {/* ══ TRUST INDICATORS ══ */}
      <DynamicTrustSection />

      {/* ══ SOCIAL PROOF ══ */}
      <DynamicSocialProof />
    </div>
  );
}
