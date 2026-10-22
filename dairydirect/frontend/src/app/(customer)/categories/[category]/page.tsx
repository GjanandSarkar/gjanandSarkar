import { Metadata } from 'next';
import { getCategoryProducts } from '@/lib/api/home';
import { ProductCard } from '@/components/shared/ProductCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { ChevronLeft, Sparkles, ArrowRight, PackageOpen, Search } from 'lucide-react';
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
    description: `Order premium, 100% pure ${categoryTitle.toLowerCase()} online. Verified sellers, lab-tested quality, fast delivery across India.`,
    openGraph: {
      title: `Buy Authentic ${categoryTitle} Online | Gjanand Sarkar`,
      description: `Order premium, 100% pure ${categoryTitle.toLowerCase()} online.`,
      type: 'website',
    }
  };
}

// Was force-dynamic + revalidate 0: a full, unbounded category query on every
// single page view. Category listings change when the catalogue changes, not
// per visitor, so they are cached and tag-invalidated like the homepage.
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

  // Cross-links to other categories. Previously four of the six were dairy
  // sub-products that are not categories at all, so they linked to pages with
  // no results. Now drawn from the taxonomy, excluding the current category.
  const popularCategories = CATEGORIES.filter(
    (c) => c.name.toLowerCase() !== rawCategory.toLowerCase(),
  )
    .slice(0, 6)
    .map((c) => ({ name: c.name, category: c.name }));

  const allCategories = CATEGORIES.map((c) => ({
    name: c.name,
    key: c.key,
    icon: c.icon,
    isActive: c.name.toLowerCase() === categoryTitle.toLowerCase(),
  }));

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 transition-colors duration-150">
      <JsonLd data={breadcrumbData} />
      
      {/* ── Sticky Top Header with Back, Title & Search ── */}
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <Link 
            href="/categories" 
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-surface hover:bg-surface-muted border border-border flex items-center justify-center text-foreground transition-colors shrink-0"
            aria-label="Back to all categories"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-foreground truncate leading-tight">
              {categoryTitle}
            </h1>
            <p className="text-xs text-foreground-muted font-medium flex items-center gap-1.5">
              <span>{products.length} {products.length === 1 ? 'item' : 'items'}</span>
              <span className="text-border">•</span>
              <span className="text-primary font-semibold">Delivery in 15-20 Mins</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/search"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-surface hover:bg-surface-muted border border-border flex items-center justify-center text-foreground transition-colors"
            aria-label="Search within store"
          >
            <Search className="w-4 h-4" />
          </Link>
          <Link
            href="/products"
            className="text-xs font-semibold text-primary hover:underline hidden sm:flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg bg-primary-fixed"
          >
            <span>All Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ── Category Quick-Switch Rail (Blinkit style) ── */}
      <div className="bg-surface border-b border-border py-2 px-4 overflow-x-auto no-scrollbar snap-rail">
        <div className="flex items-center gap-2 max-w-[1440px] mx-auto">
          {allCategories.map((c) => (
            <Link
              key={c.key}
              href={`/categories/${encodeURIComponent(c.key)}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                c.isActive
                  ? 'bg-primary text-white shadow-2xs'
                  : 'bg-surface text-foreground hover:bg-surface-muted border border-border'
              }`}
            >
              <span>{c.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Grid or Empty State */}
      <main className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {products.map((product) => (
              <div key={product.id} className="h-full">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-border p-8 sm:p-12 text-center max-w-xl mx-auto my-8 shadow-2xs">
            <div className="w-14 h-14 rounded-xl bg-primary-fixed text-primary flex items-center justify-center mx-auto mb-4 border border-primary/20">
              <PackageOpen className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">
              No products found in &ldquo;{categoryTitle}&rdquo;
            </h2>
            <p className="text-xs text-foreground-muted max-w-md mx-auto mb-6">
              Our verified partner farms are preparing fresh batches. Browse other categories below:
            </p>

            {/* Quick Category Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              {popularCategories.map((c) => (
                <Link
                  key={c.name}
                  href={`/categories/${encodeURIComponent(c.category.toLowerCase().replace(/\s+/g, '-'))}`}
                  className="px-3 py-1.5 rounded-lg bg-surface-muted hover:bg-primary-fixed hover:text-primary text-xs font-medium text-foreground transition-colors border border-border"
                >
                  {c.name}
                </Link>
              ))}
            </div>

            <Link
              href="/categories"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <span>Explore All Categories</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </main>

      {/* Scoped to this category: suggesting an unrelated department on a
          category page is noise rather than discovery. */}
      <RecommendationRail placement="category" category={categoryTitle} limit={8} />
      <AdSlot placement="category" category={categoryTitle} />
    </div>
  );
}
