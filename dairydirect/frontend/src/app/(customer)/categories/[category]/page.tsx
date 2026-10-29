import { Metadata } from 'next';
import { getCategoryProducts } from '@/lib/api/home';
import { ProductCard } from '@/components/shared/ProductCard';
import { PartnerBadge } from '@/components/shared/PartnerBadge';
import { BrandStory } from '@/components/trust/BrandStory';
import { JsonLd } from '@/components/seo/JsonLd';
import { ChevronLeft, Sparkles, ArrowRight, PackageOpen } from 'lucide-react';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/constants/categories';
import { RecommendationRail } from '@/components/discovery/RecommendationRail';
import { AdSlot } from '@/components/discovery/AdSlot';

interface Props {
  params: Promise<{ category: string }>;
}

function formatCategoryTitle(slug: string): string {
  const decoded = decodeURIComponent(slug).replace(/-/g, ' ');
  return decoded.replace(/\b\w/g, (char) => char.toUpperCase());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: rawCategory } = await params;
  const categoryTitle = formatCategoryTitle(rawCategory);
  return {
    title: `Buy Authentic ${categoryTitle} Online | Gjanand Sarkar`,
    description: `Order authentic ${categoryTitle.toLowerCase()} directly from verified Indian manufacturers. One trusted brand per category, transparent pricing.`,
    openGraph: {
      title: `Buy Authentic ${categoryTitle} Online | Gjanand Sarkar`,
      description: `Order authentic ${categoryTitle.toLowerCase()} direct from verified Indian manufacturers.`,
      type: 'website',
    }
  };
}

export const revalidate = 300;

export default async function CategoryPage({ params }: Props) {
  const { category: rawCategory } = await params;
  const categoryTitle = formatCategoryTitle(rawCategory);
  
  // Fetch products matching category
  const products = await getCategoryProducts(
    rawCategory.toLowerCase() === 'all' ? undefined : categoryTitle
  );

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://gjanandsarkar.com/home"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": categoryTitle,
        "item": `https://gjanandsarkar.com/categories/${encodeURIComponent(rawCategory)}`
      }
    ]
  };

  const popularCategories = CATEGORIES.filter(
    (c) => c.name.toLowerCase() !== rawCategory.toLowerCase(),
  )
    .slice(0, 6)
    .map((c) => ({ name: c.name, category: c.name }));

  const railCategory =
    rawCategory.toLowerCase() === 'all' ? undefined : categoryTitle;

  return (
    <div className="min-h-screen bg-background pb-24">
      <JsonLd data={breadcrumbData} />
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link 
            href="/home" 
            className="w-9 h-9 rounded-full bg-surface-muted flex items-center justify-center text-foreground hover:bg-border transition-colors min-h-[44px] min-w-[44px]"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-semibold text-foreground">{categoryTitle}</h1>
              <PartnerBadge />
            </div>
            <p className="text-xs text-foreground-muted font-normal">{products.length} products direct from partner</p>
          </div>
        </div>

        <Link
          href="/products"
          className="text-xs font-medium text-primary hover:text-primary-hover flex items-center gap-1 transition-colors min-h-[44px]"
        >
          <span>All Products</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Grid or Empty State */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {products.length > 0 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map((product) => (
                <div key={product.id} className="h-full">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {/* Partner Story Section */}
            <div className="max-w-3xl">
              <BrandStory categoryName={categoryTitle} />
            </div>
          </div>
        ) : (
          <div className="bg-surface rounded-lg border border-border p-8 sm:p-12 text-center max-w-2xl mx-auto my-8 shadow-xs">
            <div className="w-14 h-14 rounded-lg bg-surface-muted text-primary flex items-center justify-center mx-auto mb-4 border border-border">
              <PackageOpen className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No products found in &ldquo;{categoryTitle}&rdquo;
            </h2>
            <p className="text-xs text-foreground-muted max-w-md mx-auto mb-6">
              Our verified manufacturing partner is currently restocking this vertical. Browse other verified categories below.
            </p>

            {/* Quick Category Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              {popularCategories.map((c) => (
                <Link
                  key={c.name}
                  href={`/products?category=${encodeURIComponent(c.category)}`}
                  className="px-3.5 py-1.5 rounded-full bg-surface-muted hover:bg-border text-xs font-medium text-foreground transition-colors min-h-[36px] flex items-center"
                >
                  {c.name}
                </Link>
              ))}
            </div>

            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-on-primary text-xs font-medium shadow-xs transition-colors min-h-[44px]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Browse All Available Products</span>
            </Link>
          </div>
        )}
      </main>

      <RecommendationRail placement="category" category={railCategory} limit={8} />
      <AdSlot placement="category" category={railCategory} />
    </div>
  );
}

