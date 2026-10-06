"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, Pencil, Star, ShoppingCart, Heart } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useStore } from '@/store/useStore';
import { addToCart, updateCartItem } from '@/lib/api/cart';
import { toggleWishlist } from '@/lib/api/wishlist';
import type { CatalogProduct } from '@/lib/types/catalog';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

/**
 * The admin edit modal (large form + image upload + category fetching) was a
 * static import, so it was bundled into every product card — and therefore
 * into the homepage, category pages and search results for every customer,
 * 99.9% of whom are not admins and can never open it. It is now code-split
 * and only downloaded when an admin actually opens the editor.
 */
const ProductEditModal = dynamic(
  () => import('@/components/admin/ProductEditModal').then((m) => m.ProductEditModal),
  { ssr: false }
);
import Image from 'next/image';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';

interface ProductCardProps {
  product: CatalogProduct;
  priority?: boolean;
  onProductUpdated?: (updated: CatalogProduct) => void;
  onProductDeleted?: (id: string) => void;
}

export function ProductCard({
  product: initialProduct,
  priority = false,
  onProductUpdated,
  onProductDeleted,
}: ProductCardProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const user = useStore((s) => s.user);
  const cart = useStore((s) => s.cart);
  const wishlist = useStore((s) => s.wishlist);
  const toggleWishlistLocal = useStore((s) => s.toggleWishlistLocal);
  const addToCartLocal = useStore((s) => s.addToCartLocal);
  const updateCartQuantityLocal = useStore((s) => s.updateCartQuantityLocal);

  const [product, setProduct] = useState<CatalogProduct>(initialProduct);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setProduct(initialProduct);
  }, [initialProduct]);

  const variants = product.product_variants ?? [];
  const firstVariant = variants[0];

  const [selectedVariant, setSelectedVariant] = useState(firstVariant);

  useEffect(() => {
    if (!mounted) return;
    const firstInCart = cart.find((i) => i.productId === product.id);
    if (firstInCart) {
      const match = variants.find((v) => v.id === firstInCart.variantId);
      if (match) setSelectedVariant(match);
    }
  }, [mounted, cart, product.id, variants]);

  useEffect(() => {
    if (variants.length > 0 && (!selectedVariant || !variants.some(v => v.id === selectedVariant.id))) {
      setSelectedVariant(variants[0]);
    }
  }, [variants, selectedVariant]);

  const [showDrawer, setShowDrawer] = useState(false);
  const [busy, setBusy] = useState(false);

  const isSaved = mounted && wishlist.includes(product.id);
  const productCartItems = mounted ? cart.filter((i) => i.productId === product.id) : [];
  const totalQuantity = productCartItems.reduce((sum, i) => sum + i.quantity, 0);
  const isInCart = mounted && totalQuantity > 0;
  const currentVariantQty =
    productCartItems.find((i) => i.variantId === (selectedVariant?.id ?? ''))?.quantity ?? 0;

  // ── Wishlist Toggle ───────────────────────────────────────
  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlistLocal(product.id);
    if (user) {
      await toggleWishlist(user.id, product.id);
    }
  };

  // ── Add to cart ───────────────────────────────────────────
  const handleAdd = useCallback(
    async (e: React.MouseEvent, variantId?: string) => {
      e.preventDefault();
      e.stopPropagation();

      const vid = variantId ?? selectedVariant?.id;
      if (!vid || busy) return;

      if (!variantId && variants.length > 1) {
        setShowDrawer(true);
        return;
      }

      setBusy(true);
      addToCartLocal(product.id, vid, 1);
      if (user) {
        await addToCart(user.id, product.id, vid, 1);
      }
      setBusy(false);
    },
    [selectedVariant, variants, product.id, user, addToCartLocal, busy]
  );

  // ── Update cart quantity ──────────────────────────────────
  const handleUpdate = useCallback(
    async (
      e: React.MouseEvent,
      type: 'inc' | 'dec',
      variantId?: string
    ) => {
      e.preventDefault();
      e.stopPropagation();

      if (variants.length > 1 && !variantId) {
        setShowDrawer(true);
        return;
      }

      const vid = variantId ?? selectedVariant?.id;
      if (!vid || busy) return;

      const currentQty =
        cart.find((i) => i.productId === product.id && i.variantId === vid)?.quantity ?? 0;
      const newQty = type === 'inc' ? currentQty + 1 : Math.max(0, currentQty - 1);

      setBusy(true);
      updateCartQuantityLocal(product.id, vid, newQty);
      if (user) {
        await updateCartItem(user.id, product.id, vid, newQty);
      }
      setBusy(false);
    },
    [selectedVariant, variants, product.id, user, cart, updateCartQuantityLocal, busy]
  );

  if (isDeleted || !firstVariant) return null;

  const availableStock = selectedVariant?.available_quantity ?? selectedVariant?.stock ?? 0;
  const isOutOfStock = availableStock <= 0;
  const isAllOutOfStock = variants.length > 0 && variants.every((v) => (v.available_quantity ?? v.stock ?? 0) <= 0);
  const isLowStock = !isAllOutOfStock && availableStock > 0 && availableStock <= 10;
  const originalPrice = selectedVariant.original_price || Math.round(selectedVariant.price * 1.25);

  return (
    <>
      <div
        className="flex flex-col h-full bg-white rounded-2xl border border-gray-200/90 p-3.5 shadow-2xs hover:shadow-lg hover:border-[#c88a23] transition-all duration-200 cursor-pointer group relative"
        onClick={() => router.push(`/products/${product.id}`)}
      >
        {/* Product Image Container */}
        <div className="relative w-full aspect-square bg-gray-50/80 rounded-xl overflow-hidden mb-3 p-2 flex items-center justify-center">
          
          <Image
            src={product.image_url || PLACEHOLDER_PRODUCT_IMAGE}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            priority={priority}
            className={`w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 ${
              isAllOutOfStock ? 'grayscale opacity-75' : ''
            }`}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).srcset = PLACEHOLDER_PRODUCT_IMAGE;
            }}
          />

          {/* Category / Origin Badge */}
          <span className="absolute top-2 left-2 bg-emerald-50 text-[#0f3e26] border border-emerald-200/80 text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-2xs">
            {product.category || 'Pure Indian'}
          </span>

          {/* Stock Badges */}
          {isAllOutOfStock ? (
            <span className="absolute bottom-2 left-2 bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="absolute bottom-2 left-2 bg-amber-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
              Only {availableStock} left
            </span>
          ) : null}

          {/* Wishlist Heart Button */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            className={`absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 backdrop-blur-xs shadow-sm border border-gray-200 flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-20 ${
              isSaved ? 'text-rose-600' : 'text-gray-400 hover:text-rose-500'
            }`}
            title={isSaved ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-600' : ''}`} />
          </button>

          {/* Admin Quick-Edit Button */}
          {mounted && user?.role === 'admin' && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsEditModalOpen(true);
              }}
              className="absolute top-2 right-10 w-7 h-7 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-20 text-[#0f3e26]"
              title="Admin: Quick Edit"
            >
              <Pencil className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          )}

          {/* Cart Quantity Badge */}
          {isInCart && (
            <div
              className={`absolute bottom-2 right-2 w-5 h-5 rounded-full bg-[#c88a23] text-white text-[10px] font-black flex items-center justify-center shadow-md z-10`}
            >
              {totalQuantity}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex flex-col flex-1 justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-semibold block mb-0.5">
              By Gjanand Farm
            </span>

            <h3 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-[#0f3e26] transition-colors leading-snug">
              {product.name}
            </h3>

            <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mt-1 mb-2">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-gray-700">4.8</span>
              <span className="text-gray-400 font-normal">({120 + product.name.length * 5})</span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-500 font-medium">
                {selectedVariant.weight}
                {variants.length > 1 && ` (+${variants.length - 1})`}
              </span>
            </div>
          </div>

          {/* Price & Action Button */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 mt-1">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-base font-black text-[#0f3e26]">
                  ₹{selectedVariant.price}
                </span>
                {originalPrice > selectedVariant.price && (
                  <span className="text-[11px] text-gray-400 line-through">
                    ₹{originalPrice}
                  </span>
                )}
              </div>
            </div>

            {variants.length === 1 && isOutOfStock ? (
              <button
                disabled
                className="px-3 py-1.5 bg-gray-100 text-gray-400 text-xs font-bold rounded-lg cursor-not-allowed border border-gray-200"
              >
                Sold Out
              </button>
            ) : !isInCart ? (
              <button
                onClick={handleAdd}
                disabled={busy || (variants.length === 1 && isOutOfStock)}
                className="px-3.5 py-1.5 bg-[#0f3e26] hover:bg-[#144f31] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{variants.length > 1 ? 'Select' : 'Add'}</span>
              </button>
            ) : (
              <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
                <button
                  onClick={(e) => handleUpdate(e, 'dec')}
                  disabled={busy}
                  className="w-7 h-7 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors active:scale-90"
                >
                  <Minus className="w-3 h-3 stroke-[3]" />
                </button>
                <span className="px-1.5 text-center text-xs font-black text-gray-900 min-w-[20px]">
                  {variants.length > 1 ? totalQuantity : currentVariantQty}
                </span>
                <button
                  onClick={(e) => handleUpdate(e, 'inc')}
                  disabled={busy || (variants.length === 1 && currentVariantQty >= availableStock)}
                  className="w-7 h-7 flex items-center justify-center bg-[#0f3e26] text-white hover:bg-[#144f31] transition-colors active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  title={currentVariantQty >= availableStock ? 'Max available stock reached' : undefined}
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Variant Drawer */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-xs"
              onClick={() => setShowDrawer(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 rounded-t-3xl z-[70] p-6 max-w-lg mx-auto bg-white shadow-2xl"
            >
              <div className="w-12 h-1.5 rounded-full mx-auto mb-6 bg-gray-300" />
              <div className="flex items-start gap-4 mb-6">
                <img
                  src={product.image_url ?? PLACEHOLDER_PRODUCT_IMAGE}
                  alt={product.name}
                  className="w-16 h-16 rounded-xl object-contain bg-gray-50 border p-1"
                />
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {product.name}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {t('selectSizeToAddToCart')}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 mb-6">
                {variants.map((v) => {
                  const qty = cart.find(
                    (i) => i.productId === product.id && i.variantId === v.id
                  )?.quantity ?? 0;
                  const vStock = v.available_quantity ?? v.stock ?? 0;
                  const isVOutOfStock = vStock <= 0;
                  const isVLowStock = !isVOutOfStock && vStock <= 10;

                  return (
                    <div 
                      key={v.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
                        isVOutOfStock
                          ? 'border-gray-200 bg-gray-50/70 opacity-60'
                          : qty > 0
                          ? 'border-[#0f3e26] bg-emerald-50/40'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-gray-900">{v.weight}</span>
                          {isVOutOfStock ? (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                              Out of Stock
                            </span>
                          ) : isVLowStock ? (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                              Only {vStock} left
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-sm font-black text-[#0f3e26]">
                            ₹{v.price}
                          </span>
                          {v.original_price && (
                            <span className="text-xs line-through text-gray-400">
                              ₹{v.original_price}
                            </span>
                          )}
                        </div>
                      </div>

                      {isVOutOfStock ? (
                        <button
                          disabled
                          className="px-4 py-1.5 rounded-lg font-bold text-xs bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                        >
                          Sold Out
                        </button>
                      ) : qty === 0 ? (
                        <button
                          onClick={(e) => handleAdd(e, v.id)}
                          disabled={busy}
                          className="px-5 py-2 rounded-lg font-bold text-xs bg-[#0f3e26] hover:bg-[#144f31] text-white active:scale-95 disabled:opacity-50 shadow-xs"
                        >
                          Add
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 bg-white rounded-lg border border-emerald-300 p-1 shadow-2xs">
                          <button
                            onClick={(e) => handleUpdate(e, 'dec', v.id)}
                            disabled={busy}
                            className="w-7 h-7 rounded-md flex items-center justify-center bg-gray-100 text-gray-700 hover:bg-gray-200"
                          >
                            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-gray-900">{qty}</span>
                          <button
                            onClick={(e) => handleUpdate(e, 'inc', v.id)}
                            disabled={busy || qty >= vStock}
                            className="w-7 h-7 rounded-md flex items-center justify-center bg-[#0f3e26] text-white hover:bg-[#144f31] disabled:opacity-40 disabled:cursor-not-allowed"
                            title={qty >= vStock ? 'Max available stock reached' : undefined}
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowDrawer(false)}
                className="w-full py-3 bg-[#0f3e26] hover:bg-[#144f31] rounded-xl font-bold text-white text-sm active:scale-95 shadow-md"
              >
                Done
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Admin Edit / Delete Modal */}
      {user?.role === 'admin' && isEditModalOpen && (
        <ProductEditModal
          product={product}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onProductUpdated={(updated) => {
            setProduct(updated);
            if (onProductUpdated) onProductUpdated(updated);
          }}
          onProductDeleted={(id) => {
            setIsDeleted(true);
            if (onProductDeleted) onProductDeleted(id);
          }}
        />
      )}
    </>
  );
}
