"use client";

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Minus, Pencil, Star, Heart } from 'lucide-react';
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
import { trackProductEvent } from '@/lib/analytics/session';

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
      // A cart add is weighted well above a view in popularity scoring, so it
      // has to be recorded wherever it can happen.
      trackProductEvent(product.id, 'add_to_cart', { source: 'product_card' });
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
  // Previously: `selectedVariant.original_price || Math.round(price * 1.25)`.
  // That invented a 25% "discount" for every product that had no original
  // price set, so the card showed a struck-through price that had never been
  // charged. Besides being untrue, presenting a fictitious reference price is
  // a misleading-pricing offence under the Consumer Protection Act 2019 and
  // the Legal Metrology (Packaged Commodities) Rules. Only ever show a
  // strikethrough when a real, higher original price exists.
  const originalPrice = selectedVariant.original_price ?? null;
  const hasRealDiscount = originalPrice !== null && originalPrice > selectedVariant.price;
  const discountPct = hasRealDiscount
    ? Math.round(((originalPrice - selectedVariant.price) / originalPrice) * 100)
    : 0;

  // Real review aggregates. Rating is only meaningful with reviews behind it:
  // products.rating defaults to 4.80 in the schema, so showing it on a product
  // with zero reviews would present a default as customer sentiment.
  const reviewCount = product.reviews_count ?? 0;
  const rating = product.rating ?? null;
  const showRating = reviewCount > 0 && rating !== null;

  return (
    <>
      <div className="card-surface press flex flex-col h-full p-2.5 sm:p-3 group relative">
        {/* Product Image Container */}
        <div className="relative w-full aspect-square bg-surface-muted rounded-lg overflow-hidden mb-2.5 flex items-center justify-center">
          <Link
            href={`/products/${product.id}`}
            className="absolute inset-0 z-0"
            aria-label={`View details for ${product.name}`}
          />
          
          <Image
            src={product.image_url || PLACEHOLDER_PRODUCT_IMAGE}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            priority={priority}
            className={`w-full h-full object-cover transition-transform duration-200 group-hover:scale-105 pointer-events-none ${
              isAllOutOfStock ? 'grayscale opacity-60' : ''
            }`}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).srcset = PLACEHOLDER_PRODUCT_IMAGE;
            }}
          />

          {/* Genuine discount badge */}
          {hasRealDiscount && discountPct >= 1 && (
            <span className="absolute top-1.5 left-1.5 bg-accent text-on-accent text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shadow-2xs tabular-nums tracking-tight">
              {discountPct}% OFF
            </span>
          )}

          {/* Stock Badges */}
          {isAllOutOfStock ? (
            <span className="absolute bottom-1.5 left-1.5 bg-neutral-900/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-2xs">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="absolute bottom-1.5 left-1.5 bg-amber-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-2xs">
              Only {availableStock} left
            </span>
          ) : null}

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            className={`absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-surface/90 shadow-2xs border border-border flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-20 ${
              isSaved ? 'text-rose-600' : 'text-foreground-muted hover:text-rose-500'
            }`}
            title={isSaved ? 'Remove from Wishlist' : 'Add to Wishlist'}
            aria-label={isSaved ? 'Remove from Wishlist' : 'Add to Wishlist'}
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
              className="absolute top-1.5 right-9 w-7 h-7 rounded-full bg-surface shadow-xs border border-border flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-20 text-primary"
              title="Admin: Quick Edit"
            >
              <Pencil className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}

          {/* Cart Quantity Badge (when looking at multi-variant items) */}
          {isInCart && variants.length > 1 && (
            <div
              className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shadow-xs z-10"
            >
              {totalQuantity}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex flex-col flex-1 justify-between">
          <div>
            {/* Weight / Pack Size */}
            <div className="flex items-center justify-between text-[11px] text-foreground-muted font-medium mb-1">
              <span>{selectedVariant.weight}</span>
              {variants.length > 1 && (
                <span className="text-[10px] text-primary font-semibold">
                  +{variants.length - 1} options
                </span>
              )}
            </div>

            <Link href={`/products/${product.id}`} className="block">
              <h3 className="text-xs sm:text-[13px] font-semibold text-foreground line-clamp-2 min-h-[2rem] sm:min-h-[2.4rem] group-hover:text-primary transition-colors leading-snug">
                {product.name}
              </h3>
            </Link>

            {/* Rating only if real reviews exist */}
            {showRating && (
              <div className="flex items-center gap-1 text-[11px] font-medium mt-1 text-foreground-muted">
                <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-primary/10 text-primary font-bold text-[10px]">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  {rating!.toFixed(1)}
                </span>
                <span>({reviewCount})</span>
              </div>
            )}
          </div>

          {/* Price & Action Button Row */}
          <div className="relative z-20 flex items-center justify-between gap-2 pt-2 border-t border-border/50 mt-2">
            <div className="flex flex-col min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm sm:text-base font-bold text-foreground">
                  ₹{selectedVariant.price}
                </span>
                {hasRealDiscount && (
                  <span className="text-[11px] text-foreground-muted line-through truncate">
                    ₹{originalPrice}
                  </span>
                )}
              </div>
            </div>

            {variants.length === 1 && isOutOfStock ? (
              <button
                disabled
                className="px-3 py-1.5 bg-surface-muted text-foreground-muted text-xs font-semibold rounded-lg cursor-not-allowed border border-border"
              >
                Out of Stock
              </button>
            ) : !isInCart ? (
              <button
                type="button"
                onClick={handleAdd}
                disabled={busy || (variants.length === 1 && isOutOfStock)}
                className="px-3 sm:px-4 py-1.5 bg-primary-fixed hover:bg-primary text-primary hover:text-white border border-primary/40 hover:border-primary font-bold text-xs uppercase tracking-wide rounded-lg transition-all duration-150 flex items-center justify-center gap-1 shadow-2xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>{variants.length > 1 ? 'Options' : 'ADD'}</span>
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            ) : (
              <div className="flex items-center bg-primary text-white rounded-lg overflow-hidden shadow-2xs border border-primary">
                <button
                  type="button"
                  onClick={(e) => handleUpdate(e, 'dec')}
                  disabled={busy}
                  className="w-7 h-7 flex items-center justify-center text-white hover:bg-primary-hover transition-colors active:scale-90 cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3 h-3 stroke-[2.5]" />
                </button>
                <span className="px-1.5 text-center text-xs font-bold min-w-[20px] select-none text-white">
                  {variants.length > 1 ? totalQuantity : currentVariantQty}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleUpdate(e, 'inc')}
                  disabled={busy || (variants.length === 1 && currentVariantQty >= availableStock)}
                  className="w-7 h-7 flex items-center justify-center hover:bg-primary-hover transition-colors active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-white"
                  title={currentVariantQty >= availableStock ? 'Max available stock reached' : undefined}
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3 h-3 stroke-[2.5]" />
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
              className="fixed bottom-0 left-0 right-0 rounded-t-2xl z-[70] p-5 sm:p-6 max-w-lg mx-auto bg-surface text-foreground border-t border-border shadow-2xl max-h-[85vh] overflow-y-auto"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}
            >
              <div className="w-10 h-1.5 rounded-full mx-auto mb-4 bg-border" />
              <div className="flex items-start gap-4 mb-4">
                <img
                  src={product.image_url ?? PLACEHOLDER_PRODUCT_IMAGE}
                  alt={product.name}
                  className="w-16 h-16 rounded-xl object-contain bg-surface-muted border border-border p-1"
                />
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    {product.name}
                  </h2>
                  <p className="text-xs text-muted">
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
                          ? 'border-border/60 bg-surface-muted/60 opacity-60'
                          : qty > 0
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-surface hover:border-border-hover'
                      }`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">{v.weight}</span>
                          {isVOutOfStock ? (
                            <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">
                              Out of Stock
                            </span>
                          ) : isVLowStock ? (
                            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                              Only {vStock} left
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-sm font-black text-primary">
                            ₹{v.price}
                          </span>
                          {v.original_price && (
                            <span className="text-xs line-through text-muted">
                              ₹{v.original_price}
                            </span>
                          )}
                        </div>
                      </div>

                      {isVOutOfStock ? (
                        <button
                          disabled
                          className="px-4 py-1.5 rounded-lg font-bold text-xs bg-surface-muted text-muted border border-border cursor-not-allowed"
                        >
                          Sold Out
                        </button>
                      ) : qty === 0 ? (
                        <button
                          onClick={(e) => handleAdd(e, v.id)}
                          disabled={busy}
                          className="px-5 py-2 rounded-lg font-bold text-xs bg-primary hover:bg-primary-hover text-foreground-inverse active:scale-95 disabled:opacity-50 shadow-xs cursor-pointer"
                        >
                          Add
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 bg-primary text-foreground-inverse rounded-lg p-1 shadow-2xs">
                          <button
                            onClick={(e) => handleUpdate(e, 'dec', v.id)}
                            disabled={busy}
                            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-primary-hover transition-colors cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold">{qty}</span>
                          <button
                            onClick={(e) => handleUpdate(e, 'inc', v.id)}
                            disabled={busy || qty >= vStock}
                            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
                className="w-full py-3 bg-primary hover:bg-primary-hover rounded-xl font-bold text-foreground-inverse text-sm active:scale-95 shadow-md cursor-pointer"
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
