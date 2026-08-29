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
import { getProducts } from '@/lib/api/products';
import { toggleWishlist } from '@/lib/api/wishlist';
import type { ProductWithVariants } from '@/lib/api/products';

export default function WishlistPage() {
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
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf8]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f3e26]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf8] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
              <span>Your Saved Heritage Items</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f3e26] tracking-tight">
              My Wishlist ({wishlistProducts.length})
            </h1>
          </div>

          {wishlistProducts.length > 0 && (
            <button
              onClick={handleMoveAllToCart}
              className="px-5 py-2.5 bg-[#0f3e26] hover:bg-[#144f31] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Move All to Cart</span>
            </button>
          )}
        </div>

        {/* Wishlist Items List */}
        {wishlistProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto shadow-2xs">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-gray-900">
              Your wishlist is currently empty
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Explore our curated selection of pure Gir A2 dairy, cold-pressed oils, and artisanal heritage crafts.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0f3e26] hover:bg-[#144f31] text-white font-bold text-xs rounded-xl shadow-md transition-all mt-2"
            >
              <span>Explore Authentic Products</span>
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
                  className="bg-white rounded-2xl border border-gray-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                >
                  <div className="relative aspect-square w-full bg-gray-50 overflow-hidden">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-amber-50/50">
                        <svg className="w-10 h-10 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      </div>
                    )}

                    <button
                      onClick={() => handleRemoveFromWishlist(product.id)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-rose-600 hover:scale-110 transition-transform"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-[#0f3e26]/90 text-white text-[10px] font-bold">
                      {product.category}
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-grow justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 line-clamp-2 hover:text-[#0f3e26]">
                        <Link href={`/products/${product.id}`}>{product.name}</Link>
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                        {product.description}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-sm font-black text-[#0f3e26]">
                          ₹{price}
                        </span>
                        {originalPrice && originalPrice > price && (
                          <span className="text-xs text-gray-400 line-through">
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
                        className="w-full py-2 bg-[#0f3e26] hover:bg-[#144f31] text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
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
