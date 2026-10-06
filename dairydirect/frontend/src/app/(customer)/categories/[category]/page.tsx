import { Metadata } from 'next';
import { getProductsServer } from '@/lib/api/products.server';
import { ProductCard } from '@/components/shared/ProductCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { ChevronLeft, Sparkles, ArrowRight, PackageOpen } from 'lucide-react';
import Link from 'next/link';

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

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CategoryPage({ params }: Props) {
  const { category: rawCategory } = await params;
  const categoryTitle = formatCategoryTitle(rawCategory);
  
  // Fetch products matching category
  const products = await getProductsServer({ 
    category: rawCategory.toLowerCase() === 'all' ? undefined : categoryTitle, 
    activeOnly: true 
  });

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

  const popularCategories = [
    { name: 'A2 Gir Milk', category: 'Milk' },
    { name: 'Bilona Ghee', category: 'Ghee' },
    { name: 'Fresh Paneer', category: 'Paneer' },
    { name: 'Curd & Lassi', category: 'Curd' },
    { name: 'Handicrafts', category: 'Handicrafts' },
    { name: 'Ayurveda', category: 'Ayurveda' },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf8] pb-24">
      <JsonLd data={breadcrumbData} />
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/home" 
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-gray-900">{categoryTitle}</h1>
            <p className="text-xs text-gray-500 font-medium">{products.length} products available</p>
          </div>
        </div>

        <Link
          href="/products"
          className="text-xs font-bold text-[#0f3e26] hover:text-[#c88a23] flex items-center gap-1 transition-colors"
        >
          <span>All Products</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Grid or Empty State */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => (
              <div key={product.id} className="h-full">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-200/90 p-8 sm:p-12 text-center max-w-2xl mx-auto my-8 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-[#c88a23] flex items-center justify-center mx-auto mb-4">
              <PackageOpen className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              No products found in &ldquo;{categoryTitle}&rdquo;
            </h2>
            <p className="text-xs text-gray-500 max-w-md mx-auto mb-6">
              Our artisans and verified farm vendors are stocking fresh batches. Check out our active heritage categories below!
            </p>

            {/* Quick Category Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              {popularCategories.map((c) => (
                <Link
                  key={c.name}
                  href={`/products?category=${encodeURIComponent(c.category)}`}
                  className="px-3.5 py-1.5 rounded-full bg-gray-100 hover:bg-emerald-50 hover:text-[#0f3e26] text-xs font-semibold text-gray-700 transition-colors"
                >
                  {c.name}
                </Link>
              ))}
            </div>

            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0f3e26] hover:bg-[#144f31] text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-[#c88a23]" />
              <span>Browse All Available Products</span>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
