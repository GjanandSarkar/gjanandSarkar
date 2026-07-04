"use client";

import { useEffect, useState } from 'react';
import { Layers } from 'lucide-react';
import { ProductCarousel } from '@/components/home/ProductCarousel';
import { getProducts } from '@/lib/api/products';
import type { ProductWithVariants } from '@/lib/api/products';

interface RelatedProductsProps {
  currentProductId: string;
  category: string;
}

export function RelatedProducts({ currentProductId, category }: RelatedProductsProps) {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRelated() {
      setIsLoading(true);
      try {
        const allProducts = await getProducts({ activeOnly: true });
        
        // Filter by same category, exclude current product, must be in stock
        const related = allProducts
          .filter(p => p.category === category && p.id !== currentProductId && p.product_variants.some(v => v.stock > 0))
          .slice(0, 6); // Limit to 6

        setProducts(related);
      } catch (err) {
        console.error('Failed to load related products:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadRelated();
  }, [currentProductId, category]);

  if (!isLoading && products.length === 0) return null;

  return (
    <div className="mt-4 border-t border-sand/50 pt-8">
      <ProductCarousel 
        title="Similar Products" 
        subtitle="Explore More"
        icon={<Layers className="w-4 h-4 text-primary" strokeWidth={2.5} />}
        products={products} 
        isLoading={isLoading} 
      />
    </div>
  );
}
