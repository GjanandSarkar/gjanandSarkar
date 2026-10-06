import React from 'react';
import { getProductsServer } from '@/lib/api/products.server';
import { ProductCard } from '@/components/shared/ProductCard';

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const q = params.q || '';
  const category = params.category || '';
  const products = await getProductsServer({ q, category, activeOnly: true });

  const headingText = q ? `Search Results for "${q}"` : category ? `Category: ${category}` : 'All Products';

  return (
    <div className="w-full bg-[#fafaf8] min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 pt-24 md:pt-32">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">{headingText}</h1>
        
        {products.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <h2 className="text-xl font-medium text-gray-800 mb-2">No products found</h2>
            <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {products.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
