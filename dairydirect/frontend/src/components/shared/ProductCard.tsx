"use client";

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Minus, Pencil, Star, ShoppingCart, Heart } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { createPortal } from 'react-dom';
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

  /* Lock the page behind the size picker. Without this the list underneath
     scrolls while the sheet is open, which on mobile reads as the sheet
     drifting off-screen. */
  useEffect(() => {
    if (!showDrawer) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [showDrawer]);
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
      // A cart add is weighted far above a view in popularity scoring, so it
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
      {/*
        The card was a plain <div> with an onClick handler: unreachable by
        keyboard, not announced as a link, no focus ring, and impossible to
        middle-click or open in a new tab.

        It is not wrapped in an <a> either, because the card contains buttons
        (wishlist, add to cart, quantity stepper) and interactive content
        nested inside an anchor is invalid HTML — it breaks keyboard order and
        confuses screen readers.

        Instead this uses the "stretched link" pattern: a real anchor that is
        visually hidden but absolutely covers the card, sitting *below* the
        controls in z-order. The whole card is clickable, the link is properly
        announced and focusable, and the buttons stay genuinely separate.
      */}
      <div className="flex flex-col h-full bg-surface rounded-2xl border border-border/90 p-3.5 shadow-2xs hover:border-secondary group relative lift pressable focus-within:ring-2 focus-within:ring-[var(--primary)]/40">
        <Link
          href={`/products/${product.id}`}
          className="absolute inset-0 z-10 rounded-2xl"
        >
          <span className="sr-only">
            {product.name}
            {product.brand ? ` by ${product.brand}` : ''}, ₹{selectedVariant.price}
          </span>
        </Link>
        {/* Product Image Container */}
        <div className="relative w-full aspect-square bg-surface-muted/80 rounded-xl overflow-hidden mb-3 p-2 flex items-center justify-center">
          
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

          {/* A real discount badge, shown only when there is a genuine saving.
              This is the single strongest scanning cue on a listing grid and
              the card had none. */}
          {hasRealDiscount && discountPct >= 1 && (
            <span className="absolute top-2 left-2 bg-secondary text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-sm tabular-nums">
              {discountPct}% OFF
            </span>
          )}

          {/* Stock Badges */}
          {isAllOutOfStock ? (
            <span className="absolute bottom-2 left-2 bg-error text-on-error text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="absolute bottom-2 left-2 bg-warning text-on-warning text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
              Only {availableStock} left
            </span>
          ) : null}

          {/* Wishlist Heart Button */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            className={`absolute top-2 right-2 w-7 h-7 rounded-full bg-surface/95 backdrop-blur-xs shadow-sm border border-border flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-20 ${
              isSaved ? 'text-error' : 'text-foreground-muted hover:text-error'
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
              className="absolute top-2 right-10 w-7 h-7 rounded-full bg-surface shadow-md border border-border flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-20 text-primary"
              title="Admin: Quick Edit"
            >
              <Pencil className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          )}

          {/* Cart Quantity Badge */}
          {isInCart && (
            <div
              className={`absolute bottom-2 right-2 w-5 h-5 rounded-full bg-secondary text-white text-[10px] font-black flex items-center justify-center shadow-md z-10`}
            >
              {totalQuantity}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex flex-col flex-1 justify-between">
          <div>
            {/* The partner brand. This was hardcoded to "By Gjanand Farm" on
                every card, which is wrong on a marketplace whose entire pitch
                is one verified brand per category — and absurd on electronics
                or books. */}
            {product.brand && (
              <span className="text-[10px] text-foreground-muted font-semibold block mb-0.5 truncate">
                {product.brand}
              </span>
            )}

            <h3 className="text-xs sm:text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors leading-snug">
              {product.name}
            </h3>

            <div className="flex items-center gap-1 text-[10px] font-bold mt-1 mb-2">
              {showRating && (
                <>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-success text-on-success">
                    <Star className="w-2.5 h-2.5 fill-white text-white" />
                    {rating!.toFixed(1)}
                  </span>
                  <span className="text-foreground-muted font-normal">({reviewCount})</span>
                  <span className="text-foreground-muted">•</span>
                </>
              )}
              <span className="text-foreground-muted font-medium">
                {selectedVariant.weight}
                {variants.length > 1 && ` (+${variants.length - 1})`}
              </span>
            </div>
          </div>

          {/* Price & Action Button.
              `relative z-20` lifts this row above the stretched link (z-10)
              so the add button and quantity stepper stay directly clickable
              instead of being covered by the card-wide anchor. */}
          <div className="relative z-20 flex items-center justify-between gap-2 pt-2 border-t border-border mt-1">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-base font-black text-primary">
                  ₹{selectedVariant.price}
                </span>
                {hasRealDiscount && (
                  <span className="text-[11px] text-foreground-muted line-through">
                    ₹{originalPrice}
                  </span>
                )}
              </div>
            </div>

            {variants.length === 1 && isOutOfStock ? (
              <button
                disabled
                className="px-3 py-1.5 bg-surface-muted text-foreground-muted text-xs font-bold rounded-lg cursor-not-allowed border border-border"
              >
                Sold Out
              </button>
            ) : !isInCart ? (
              <button
                onClick={handleAdd}
                disabled={busy || (variants.length === 1 && isOutOfStock)}
                className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-on-primary text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{variants.length > 1 ? 'Select' : 'Add'}</span>
              </button>
            ) : (
              <div className="flex items-center bg-surface-muted rounded-lg overflow-hidden border border-border-hover">
                <button
                  onClick={(e) => handleUpdate(e, 'dec')}
                  disabled={busy}
                  className="w-7 h-7 flex items-center justify-center text-foreground hover:bg-border transition-colors active:scale-90"
                >
                  <Minus className="w-3 h-3 stroke-[3]" />
                </button>
                <span className="px-1.5 text-center text-xs font-black text-foreground min-w-[20px]">
                  {variants.length > 1 ? totalQuantity : currentVariantQty}
                </span>
                <button
                  onClick={(e) => handleUpdate(e, 'inc')}
                  disabled={busy || (variants.length === 1 && currentVariantQty >= availableStock)}
                  className="w-7 h-7 flex items-center justify-center bg-primary text-on-primary hover:bg-primary-hover transition-colors active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  title={currentVariantQty >= availableStock ? 'Max available stock reached' : undefined}
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Size picker.

          Rendered through a portal into document.body. It used to live
          inside the card, and `position: fixed` resolves against the
          nearest ancestor with a transform -- which the animated product
          rails provide. The sheet was therefore trapped at the card's width
          and position instead of the viewport, and the "full screen"
          backdrop only covered the card, so the page never dimmed.

          A flex wrapper does the positioning (bottom sheet on mobile,
          centred dialog from sm up) so the sheet's own transform stays free
          for the open/close animation. It scrolls internally and clears the
          home indicator, instead of overflowing off-screen when a product
          has several sizes. */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {showDrawer && (
              <>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[60] backdrop-blur-xs"
                  style={{ background: 'var(--scrim)' }}
                  onClick={() => setShowDrawer(false)}
                />
                <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6 pointer-events-none">
                  <motion.div
                    initial={{ y: '100%', opacity: 0.6 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0.6 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Choose a size for ${product.name}`}
                    className="pointer-events-auto w-full sm:w-auto sm:min-w-[22rem] sm:max-w-md bg-surface shadow-2xl rounded-t-3xl sm:rounded-3xl max-h-[85dvh] sm:max-h-[80dvh] overflow-y-auto overscroll-contain px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:pt-5 sm:pb-6"
                  >
                    <div className="w-12 h-1.5 rounded-full mx-auto mb-5 bg-border sm:hidden" />
              <div className="flex items-start gap-4 mb-6">
                <img
                  src={product.image_url ?? PLACEHOLDER_PRODUCT_IMAGE}
                  alt={product.name}
                  className="w-16 h-16 rounded-xl object-contain bg-surface-muted border p-1"
                />
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    {product.name}
                  </h2>
                  <p className="text-xs text-foreground-muted">
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
                          ? 'border-border bg-surface-muted/70 opacity-60'
                          : qty > 0
                          ? 'border-primary bg-success-bg/40'
                          : 'border-border bg-surface'
                      }`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">{v.weight}</span>
                          {isVOutOfStock ? (
                            <span className="text-[10px] font-bold text-error bg-error-bg px-1.5 py-0.5 rounded">
                              Out of Stock
                            </span>
                          ) : isVLowStock ? (
                            <span className="text-[10px] font-bold text-warning bg-warning-bg px-1.5 py-0.5 rounded">
                              Only {vStock} left
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-sm font-black text-primary">
                            ₹{v.price}
                          </span>
                          {v.original_price && (
                            <span className="text-xs line-through text-foreground-muted">
                              ₹{v.original_price}
                            </span>
                          )}
                        </div>
                      </div>

                      {isVOutOfStock ? (
                        <button
                          disabled
                          className="px-4 py-1.5 rounded-lg font-bold text-xs bg-surface-muted text-foreground-muted border border-border cursor-not-allowed"
                        >
                          Sold Out
                        </button>
                      ) : qty === 0 ? (
                        <button
                          onClick={(e) => handleAdd(e, v.id)}
                          disabled={busy}
                          className="px-5 py-2 rounded-lg font-bold text-xs bg-primary hover:bg-primary-hover text-on-primary active:scale-95 disabled:opacity-50 shadow-xs"
                        >
                          Add
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 bg-surface rounded-lg border border-success p-1 shadow-2xs">
                          <button
                            onClick={(e) => handleUpdate(e, 'dec', v.id)}
                            disabled={busy}
                            className="w-7 h-7 rounded-md flex items-center justify-center bg-surface-muted text-foreground hover:bg-border"
                          >
                            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-foreground">{qty}</span>
                          <button
                            onClick={(e) => handleUpdate(e, 'inc', v.id)}
                            disabled={busy || qty >= vStock}
                            className="w-7 h-7 rounded-md flex items-center justify-center bg-primary text-on-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed"
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
                className="w-full py-3 bg-primary hover:bg-primary-hover rounded-xl font-bold text-on-primary text-sm active:scale-95 shadow-md sticky bottom-0"
              >
                Done
              </button>
                  </motion.div>
                </div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}

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
