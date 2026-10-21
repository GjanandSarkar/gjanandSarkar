"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, ArrowRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getProducts } from '@/lib/api/products';
import type { ProductWithVariants } from '@/lib/api/products';
import { ProductGridSkeleton } from '@/components/shared/Skeletons';
import { ProductCard } from '@/components/shared/ProductCard';

export default function WishlistPage() {
  const wishlist = useStore((s) => s.wishlist);
  const addToCartLocal = useStore((s) => s.addToCartLocal);

  const [allProducts, setAllProducts] = useState<ProductWithVariants[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getProducts({ activeOnly: true }).then((data) => {
      setAllProducts(data);
      setIsLoading(false);
    });
  }, []);

  const wishlistProducts = allProducts.filter((p) => wishlist.includes(p.id));

  const handleMoveAllToCart = () => {
    wishlistProducts.forEach((product) => {
      const defaultVariant = product.product_variants?.[0];
      if (defaultVariant && defaultVariant.stock > 0) {
        addToCartLocal(product.id, defaultVariant.id, 1);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-4 md:px-8 py-6 max-w-[1440px] mx-auto">
        <ProductGridSkeleton count={8} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-6 px-4 md:px-8 transition-colors duration-150">
      <div className="max-w-[1440px] mx-auto space-y-6">
        
        {/* Standardized Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-600 text-xs font-bold mb-2">
              <Heart className="w-3.5 h-3.5 fill-rose-600" />
              <span>Saved Items</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              My Wishlist
              <span className="ml-2.5 text-base sm:text-lg font-medium text-foreground-muted">
                ({wishlistProducts.length})
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted mt-1">
              Items you have marked to purchase later
            </p>
          </div>

          {wishlistProducts.length > 0 && (
            <button
              onClick={handleMoveAllToCart}
              className="self-start sm:self-auto px-4 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Move In-Stock to Cart</span>
            </button>
          )}
        </div>

        {/* Wishlist Items List */}
        {wishlistProducts.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-border p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-muted text-muted flex items-center justify-center mx-auto border border-border">
              <Heart className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              Your wishlist is empty
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Save your favorite fresh dairy and farm produce to quickly order them anytime.
            </p>
            <Link
              href="/home"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary hover:bg-primary-hover text-foreground-inverse font-bold text-xs rounded-xl shadow-xs transition-all mt-2"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {wishlistProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product as any}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
