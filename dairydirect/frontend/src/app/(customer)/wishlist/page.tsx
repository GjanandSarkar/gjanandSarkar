"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  ArrowRight, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/lib/i18n';
import { getProducts } from '@/lib/api/products';
import { toggleWishlist } from '@/lib/api/wishlist';
import type { ProductWithVariants } from '@/lib/api/products';
import { ProductGridSkeleton } from '@/components/shared/Skeletons';

export default function WishlistPage() {
  const { t } = useTranslation();
  const user = useStore((s) => s.user);
  const wishlist = useStore((s) => s.wishlist);
  const toggleWishlistLocal = useStore((s) => s.toggleWishlistLocal);
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

  const handleRemoveFromWishlist = async (productId: string) => {
    toggleWishlistLocal(productId);
    if (user) {
      await toggleWishlist(user.id, productId);
    }
  };

  const handleMoveAllToCart = () => {
    wishlistProducts.forEach((product) => {
      const defaultVariant = product.product_variants?.[0];
      if (defaultVariant) {
        addToCartLocal(product.id, defaultVariant.id, 1);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-4 md:px-8 py-6 max-w-[1440px] mx-auto">
        <ProductGridSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-muted text-foreground-muted text-xs font-semibold mb-2">
              <Heart className="w-3.5 h-3.5 text-error" />
              <span>{t('wishlistSavedItems', { count: String(wishlistProducts.length) }) || 'Saved Items'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              {t('myWishlist') || 'My Wishlist'} ({wishlistProducts.length})
            </h1>
          </div>

          {wishlistProducts.length > 0 && (
            <button
              onClick={handleMoveAllToCart}
              className="px-5 py-2.5 min-h-[44px] bg-primary hover:bg-primary-hover text-on-primary font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{t('moveAllToCart') || 'Move All to Cart'}</span>
            </button>
          )}
        </div>

        {/* Wishlist Items List */}
        {wishlistProducts.length === 0 ? (
          <div className="bg-surface rounded-lg border border-border p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-surface-muted text-foreground-muted flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8 text-error" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {t('emptyWishlist') || 'Your wishlist is currently empty'}
            </h3>
            <p className="text-xs text-foreground-muted leading-relaxed">
              {t('emptyWishlistSub') || 'Explore verified products directly from official Indian manufacturer partners.'}
            </p>
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-[44px] bg-primary hover:bg-primary-hover text-on-primary font-semibold text-xs rounded-lg shadow-xs transition-colors mt-2"
            >
              <span>{t('browseProducts') || 'Explore Products'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistProducts.map((product) => {
              const defaultVariant = product.product_variants?.[0];
              const price = defaultVariant?.price || 0;
              const originalPrice = defaultVariant?.original_price;

              return (
                <div
                  key={product.id}
                  className="bg-surface rounded-lg border border-border shadow-xs hover:border-primary/40 transition-colors overflow-hidden flex flex-col justify-between"
                >
                  <div className="relative aspect-square w-full bg-surface-muted overflow-hidden">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-surface-muted">
                        <svg className="w-10 h-10 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      </div>
                    )}

                    <button
                      onClick={() => handleRemoveFromWishlist(product.id)}
                      className="absolute top-3 right-3 w-10 h-10 min-h-[44px] min-w-[44px] rounded-full bg-surface/90 backdrop-blur-xs flex items-center justify-center text-error hover:scale-105 transition-transform"
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-sm bg-surface/90 text-foreground text-xs font-medium">
                      {product.category}
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-grow justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground line-clamp-2 hover:text-primary">
                        <Link href={`/products/${product.id}`}>{product.name}</Link>
                      </h4>
                      <p className="text-xs text-foreground-muted mt-1 line-clamp-2">
                        {product.description}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-base font-semibold text-primary">
                          ₹{price}
                        </span>
                        {originalPrice && originalPrice > price && (
                          <span className="text-xs text-foreground-muted line-through">
                            ₹{originalPrice}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          if (defaultVariant) {
                            addToCartLocal(product.id, defaultVariant.id, 1);
                          }
                        }}
                        className="w-full py-2.5 min-h-[44px] bg-primary hover:bg-primary-hover text-on-primary font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98]"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
