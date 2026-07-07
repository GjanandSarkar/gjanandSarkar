import { getProductsServer } from '@/lib/api/products';
import { CategorySection } from '@/components/home/CategorySection';
import { ProductCarousel } from '@/components/home/ProductCarousel';
import { BuyAgainCarousel } from '@/components/discovery/BuyAgainCarousel';
import { TrustSection } from '@/components/home/TrustSection';
import { SocialProof } from '@/components/home/SocialProof';
import { Sparkles, TrendingUp, CalendarDays } from 'lucide-react';
import Link from 'next/link';
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

      {/* ══ SUBSCRIPTION BANNER ══ */}
      <div className="px-4 md:px-10 mt-6 mb-2">
        <Link href="/subscribe/new" className="block relative overflow-hidden bg-primary rounded-[24px] p-6 shadow-sm transition-transform active:scale-[0.98]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-mint/20 rounded-full -ml-8 -mb-8 blur-xl" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-4 h-4 text-mint" />
                <span className="text-[10px] font-black uppercase tracking-widest text-mint">Daily Essentials</span>
              </div>
              <h2 className="text-[19px] font-black text-white leading-tight mb-1 tracking-tight">
                Subscribe & Save 5%
              </h2>
              <p className="text-xs font-medium text-white/80 max-w-[200px] leading-relaxed">
                Fresh A2 milk delivered to your door every morning.
              </p>
            </div>
            <div className="w-20 h-20 shrink-0 flex items-center justify-center">
              <img src="/final_images/A2_Gir_Cow_Milk.png" alt="Milk" className="w-full h-full object-contain drop-shadow-lg scale-125 origin-right" />
            </div>
          </div>
        </Link>
      </div>

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
