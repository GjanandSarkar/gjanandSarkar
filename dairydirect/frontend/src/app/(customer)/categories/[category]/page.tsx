import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductsServer } from '@/lib/api/products';
import { ProductCard } from '@/components/shared/ProductCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: rawCategory } = await params;
  const category = decodeURIComponent(rawCategory);
  return {
    title: `Buy Fresh ${category} Online`,
    description: `Order premium, farm-fresh ${category.toLowerCase()} online. Delivered to your doorstep before sunrise by Gjanand Sarkar.`,
    openGraph: {
      title: `Buy Fresh ${category} Online | Gjanand Sarkar`,
      description: `Order premium, farm-fresh ${category.toLowerCase()} online.`,
      type: 'website',
    }
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category: rawCategory } = await params;
  const category = decodeURIComponent(rawCategory);
  
  // Validate category by checking if any products exist
  const products = await getProductsServer({ category, activeOnly: true });

  if (!products || products.length === 0) {
    notFound();
  }

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
        "name": category,
        "item": `https://gjanandsarkar.com/categories/${encodeURIComponent(category)}`
      }
    ]
  };

  return (
    <div className="min-h-screen bg-surface pb-24">
      <JsonLd data={breadcrumbData} />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-sand px-6 py-4 flex items-center gap-4">
        <Link 
          href="/home" 
          className="w-10 h-10 rounded-full bg-sand/30 flex items-center justify-center text-dark hover:bg-sand/50 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-dark">{category}</h1>
          <p className="text-xs text-muted">{products.length} products available</p>
        </div>
      </header>

      {/* Grid */}
      <main className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <div key={product.id} className="h-full">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
