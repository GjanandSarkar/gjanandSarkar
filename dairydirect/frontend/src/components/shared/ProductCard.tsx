"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Plus, Minus, Pencil, Star, ShoppingCart, Heart, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';
import { useStore } from '@/store/useStore';
import { addToCart, updateCartItem } from '@/lib/api/cart';
import { toggleWishlist } from '@/lib/api/wishlist';
import type { CatalogProduct } from '@/lib/types/catalog';
import { PartnerBadge } from '@/components/shared/PartnerBadge';
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
  const { t, tProduct } = useTranslation();

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
      <div className="flex flex-col h-full bg-surface rounded-2xl border border-border/90 p-3.5 shadow-2xs hover:border-secondary/70 group relative lift pressable focus-within:ring-2 focus-within:ring-primary/40">
        <Link
          href={`/products/${product.id}`}
          className="absolute inset-0 z-10 rounded-2xl"
        >
          <span className="sr-only">
            {tProduct(product.name)}
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
            className={`w-full h-full object-contain transition-transform duration-200 group-hover:scale-105 ${
              isAllOutOfStock ? 'grayscale opacity-75' : ''
            }`}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).srcset = PLACEHOLDER_PRODUCT_IMAGE;
            }}
          />

          {/* A real discount badge, shown only when there is a genuine saving. */}
          {hasRealDiscount && discountPct >= 1 && (
            <span className="absolute top-2 left-2 bg-highlight text-on-secondary text-xs font-medium px-2 py-0.5 rounded-full shadow-xs tabular-nums">
              {discountPct}% OFF
            </span>
          )}

          {/* Stock Badges */}
          {isAllOutOfStock ? (
            <span className="absolute bottom-2 left-2 bg-error text-on-error text-xs font-medium px-2 py-0.5 rounded-full shadow-xs">
              {t('outOfStock')}
            </span>
          ) : isLowStock ? (
            <span className="absolute bottom-2 left-2 bg-warning-bg text-warning border border-warning/20 text-xs font-medium px-2 py-0.5 rounded-full shadow-xs">
              {t('onlyLeft', { amount: String(availableStock) })}
            </span>
          ) : null}

          {/* Wishlist Heart Button */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-surface shadow-xs border border-border flex items-center justify-center transition-colors hover:bg-surface-muted z-20 ${
              isSaved ? 'text-error' : 'text-foreground-muted hover:text-error'
            }`}
            title={isSaved ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-current text-error' : ''}`} />
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
              className="absolute top-2 right-11 w-8 h-8 rounded-full bg-surface shadow-xs border border-border flex items-center justify-center transition-colors hover:bg-surface-muted z-20 text-primary"
              title="Admin: Quick Edit"
            >
              <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          )}

          {/* Cart Quantity Badge */}
          {isInCart && (
            <div
              className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-primary text-on-primary text-xs font-semibold flex items-center justify-center shadow-xs z-10 tabular-nums"
            >
              {totalQuantity}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex flex-col flex-1 justify-between">
          <div>
            {/* Verified Partner Badge */}
            <PartnerBadge size="sm" className="mb-1.5 self-start text-xs py-0 px-2" />

            {/* Partner Brand */}
            {product.brand && (
              <span className="text-xs text-foreground-muted font-normal block mb-0.5 truncate">
                {product.brand}
              </span>
            )}

            <h3 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors leading-snug">
              {tProduct(product.name)}
            </h3>

            <div className="flex items-center gap-1.5 text-xs font-normal mt-1 mb-2">
              {showRating && (
                <>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-success-bg text-success font-medium">
                    <Star className="w-3 h-3 fill-current text-success" />
                    {rating!.toFixed(1)}
                  </span>
                  <span className="text-foreground-muted">({reviewCount})</span>
                  <span className="text-foreground-muted">•</span>
                </>
              )}
              <span className="text-foreground-muted">
                {selectedVariant.weight}
                {variants.length > 1 && ` (+${variants.length - 1})`}
              </span>
            </div>
          </div>

          {/* Price & Action Button */}
          <div className="relative z-20 flex items-center justify-between gap-2 pt-2 border-t border-border mt-1">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold text-primary tabular-nums">
                  ₹{selectedVariant.price}
                </span>
                {hasRealDiscount && (
                  <span className="text-xs text-foreground-muted line-through tabular-nums">
                    ₹{originalPrice}
                  </span>
                )}
              </div>
            </div>

            {variants.length === 1 && isOutOfStock ? (
              <button
                disabled
                className="min-h-[40px] px-3 py-1.5 bg-surface-muted text-foreground-muted text-xs font-semibold rounded-lg cursor-not-allowed border border-border"
              >
                {t('soldOut')}
              </button>
            ) : !isInCart ? (
              <button
                onClick={handleAdd}
                disabled={busy || (variants.length === 1 && isOutOfStock)}
                className="min-h-[40px] px-4 py-2 bg-primary hover:bg-primary-hover text-on-primary text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{variants.length > 1 ? t('select') : t('addShortcut')}</span>
              </button>
            ) : (
              <div className="flex items-center bg-surface rounded-lg overflow-hidden border border-border shadow-xs">
                <button
                  onClick={(e) => handleUpdate(e, 'dec')}
                  disabled={busy}
                  className="w-9 h-9 flex items-center justify-center text-foreground hover:bg-surface-muted transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
                <span className="px-2 text-center text-xs font-semibold text-foreground min-w-[20px] tabular-nums">
                  {variants.length > 1 ? totalQuantity : currentVariantQty}
                </span>
                <button
                  onClick={(e) => handleUpdate(e, 'inc')}
                  disabled={busy || (variants.length === 1 && currentVariantQty >= availableStock)}
                  className="w-9 h-9 flex items-center justify-center bg-primary text-on-primary hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title={currentVariantQty >= availableStock ? 'Max available stock reached' : undefined}
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
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
      {/* Size picker portal: Centered on desktop, full-width bottom sheet on mobile */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {showDrawer && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="fixed inset-0 z-[75] bg-black/50 backdrop-blur-xs"
                  onClick={() => setShowDrawer(false)}
                  aria-hidden="true"
                />
                <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6 pointer-events-none">
                  <motion.div
                    initial={{ y: '100%', opacity: 0.8 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Select size for ${product.name}`}
                    className="pointer-events-auto w-full sm:w-auto sm:min-w-[24rem] sm:max-w-md bg-surface shadow-2xl rounded-t-2xl sm:rounded-2xl max-h-[85dvh] sm:max-h-[80dvh] overflow-y-auto overscroll-contain px-5 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:pt-5 sm:pb-6 border border-border"
                  >
                    {/* Mobile drag handle */}
                    <div className="w-12 h-1.5 rounded-full mx-auto mb-4 bg-border sm:hidden" />

                    {/* Header */}
                    <div className="flex items-center justify-between gap-4 pb-4 border-b border-border mb-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image_url || PLACEHOLDER_PRODUCT_IMAGE}
                          alt={product.name}
                          className="w-12 h-12 rounded-xl object-contain bg-surface-muted border p-1"
                        />
                        <div>
                          <h2 className="text-base font-bold text-foreground line-clamp-1">
                            {tProduct(product.name)}
                          </h2>
                          <p className="text-xs text-foreground-muted">
                            {product.brand ? `By ${product.brand}` : 'Select a size to add to cart'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowDrawer(false)}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-muted text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                        aria-label="Close"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Variant items list */}
                    <div className="space-y-2.5 mb-5">
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
                            className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                              isVOutOfStock
                                ? 'border-border bg-surface-muted/60 opacity-60'
                                : qty > 0
                                ? 'border-primary/40 bg-success-bg/40'
                                : 'border-border bg-surface'
                            }`}
                          >
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-foreground">{v.weight}</span>
                                {isVOutOfStock ? (
                                  <span className="text-[11px] font-semibold text-error bg-error-bg px-1.5 py-0.5 rounded-full">
                                    {t('outOfStock')}
                                  </span>
                                ) : isVLowStock ? (
                                  <span className="text-[11px] font-semibold text-warning bg-warning-bg px-1.5 py-0.5 rounded-full">
                                    {t('onlyLeft', { amount: String(vStock) })}
                                  </span>
                                ) : null}
                              </div>
                              <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="text-sm font-bold text-foreground tabular-nums">
                                  ₹{v.price}
                                </span>
                                {v.original_price && v.original_price > v.price && (
                                  <span className="text-xs line-through text-foreground-muted tabular-nums">
                                    ₹{v.original_price}
                                  </span>
                                )}
                              </div>
                            </div>

                            {isVOutOfStock ? (
                              <button
                                disabled
                                className="min-h-[44px] px-3.5 py-1.5 rounded-xl font-medium text-xs bg-surface-muted text-foreground-muted border border-border cursor-not-allowed"
                              >
                                {t('soldOut')}
                              </button>
                            ) : qty === 0 ? (
                              <button
                                onClick={(e) => handleAdd(e, v.id)}
                                disabled={busy}
                                className="min-h-[44px] px-4 py-2 rounded-xl font-bold text-xs bg-primary hover:bg-primary-hover text-on-primary disabled:opacity-50 shadow-xs cursor-pointer active:scale-95 transition-transform"
                              >
                                {t('addShortcut')}
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5 bg-surface rounded-xl border border-border p-1 shadow-xs">
                                <button
                                  onClick={(e) => handleUpdate(e, 'dec', v.id)}
                                  disabled={busy}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-muted text-foreground hover:bg-border transition-colors cursor-pointer"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                                <span className="w-6 text-center text-xs font-bold text-foreground tabular-nums">{qty}</span>
                                <button
                                  onClick={(e) => handleUpdate(e, 'inc', v.id)}
                                  disabled={busy || qty >= vStock}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary text-on-primary hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                  title={qty >= vStock ? 'Max available stock reached' : undefined}
                                  aria-label="Increase quantity"
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
                      className="w-full min-h-[44px] py-2.5 bg-primary hover:bg-primary-hover text-on-primary font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.99] cursor-pointer"
                    >
                      {t('confirm') || 'Done'}
                    </button>
                  </motion.div>
                </div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )
      }

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
