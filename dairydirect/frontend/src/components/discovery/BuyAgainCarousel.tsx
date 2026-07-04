"use client";

import { useEffect, useState } from 'react';
import { Repeat } from 'lucide-react';
import { ProductCarousel } from '@/components/home/ProductCarousel';
import { getUserOrders } from '@/lib/api/orders';
import { getProducts } from '@/lib/api/products';
import type { ProductWithVariants } from '@/lib/api/products';
import { useStore } from '@/store/useStore';

interface BuyAgainCarouselProps {
  allProducts?: ProductWithVariants[];
}

export function BuyAgainCarousel({ allProducts }: BuyAgainCarouselProps = {}) {
  const user = useStore(state => state.user);
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBuyAgain() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        const [orders, fetchedProducts] = await Promise.all([
          getUserOrders(user.id),
          allProducts ? Promise.resolve(allProducts) : getProducts({ activeOnly: true })
        ]);

        const productsToUse = allProducts || fetchedProducts;

        if (!orders || orders.length === 0) {
          setIsLoading(false);
          return;
        }

        // Flatten all product IDs from all orders
        const productCounts: Record<string, number> = {};
        orders.forEach(order => {
          order.order_items?.forEach(item => {
            if (item.product_id) {
              productCounts[item.product_id] = (productCounts[item.product_id] || 0) + item.quantity;
            }
          });
        });

        // Sort by frequency and map to products
        const sortedProductIds = Object.entries(productCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([id]) => id)
          .slice(0, 8); // Top 8 frequently bought

        const buyAgainProducts = sortedProductIds
          .map(id => productsToUse.find(p => p.id === id))
          .filter((p): p is ProductWithVariants => 
            p !== undefined && p.product_variants.some(v => v.stock > 0)
          );

        setProducts(buyAgainProducts);
      } catch (err) {
        console.error('Failed to load buy again:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadBuyAgain();
  }, [user, allProducts]);

  if (!isLoading && products.length === 0) return null;

  return (
    <ProductCarousel 
      title="Buy Again" 
      subtitle="Frequently Ordered"
      icon={<Repeat className="w-4 h-4 text-primary" strokeWidth={2.5} />}
      products={products} 
      isLoading={isLoading} 
    />
  );
}
