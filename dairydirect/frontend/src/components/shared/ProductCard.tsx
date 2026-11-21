"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
<<<<<<< HEAD
import Image from 'next/image';
import { Minus, Plus, X } from 'lucide-react';
=======
import { Plus, Minus, Pencil, Star, Heart } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
import { useStore } from '@/store/useStore';
import { addToCart, updateCartItem } from '@/lib/api/cart';
import type { CatalogProduct } from '@/lib/types/catalog';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';

/**
 * Product card — the most repeated element in the app, so it is also the
 * least decorated one.
 *
 * What it shows: image, name (2 lines), pack size, price, MRP if discounted,
 * and one ADD control. Gone: rating stars, partner badge, delivery estimate,
 * wishlist heart, savings pill, subscription line and inline discount ribbon —
 * seven competing signals that made every card look busy and none looked
 * important. The discount is now a single quiet line under the price.
 *
 * ADD → −/qty/+ happens in place. When a product has several pack sizes the
 * same button opens a small sheet, because that is the one decision the card
 * cannot make for the customer.
 */
interface ProductCardProps {
  product: CatalogProduct;
  priority?: boolean;
  onProductUpdated?: (updated: CatalogProduct) => void;
  onProductDeleted?: (id: string) => void;
}

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export function ProductCard({ product: initialProduct, priority = false }: ProductCardProps) {
  const [product] = useState<CatalogProduct>(initialProduct);
  const [mounted, setMounted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const cart = useStore((s) => s.cart);
  const user = useStore((s) => s.user);
  const addToCartLocal = useStore((s) => s.addToCartLocal);
  const updateCartQuantityLocal = useStore((s) => s.updateCartQuantityLocal);

  useEffect(() => setMounted(true), []);

  const variants = product.product_variants ?? [];
  const variant = variants[0];

  const cartItems = mounted ? cart.filter((i) => i.productId === product.id) : [];
  const totalQuantity = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const inCart = mounted && totalQuantity > 0;

  const price = variant?.price ?? 0;
  const mrp = variant?.original_price ?? 0;
  const hasDiscount = mrp > price;
  const outOfStock = (variant?.available_quantity ?? variant?.stock ?? 0) <= 0;

  const changeQuantity = useCallback(
    async (next: number) => {
      if (!variant || busy) return;
      setBusy(true);
      try {
        if (next <= 0) {
          if (inCart) {
            updateCartQuantityLocal(product.id, variant.id, 0);
            if (user) await updateCartItem(user.id, product.id, variant.id, 0);
          }
        } else if (inCart) {
          if (cartItems.some((i) => i.variantId === variant.id)) {
            updateCartQuantityLocal(product.id, variant.id, next);
            if (user) await updateCartItem(user.id, product.id, variant.id, next);
          } else {
            addToCartLocal(product.id, variant.id, next - totalQuantity);
            if (user) await addToCart(user.id, product.id, variant.id, next - totalQuantity);
          }
        } else {
          addToCartLocal(product.id, variant.id, next);
          if (user) await addToCart(user.id, product.id, variant.id, next);
        }
      } catch {
        // The optimistic store already reflects the intent; a failed sync is
        // corrected on the next cart fetch rather than blocking the tap.
      } finally {
        setBusy(false);
      }
    },
    [variant, busy, cartItems, inCart, product, totalQuantity, user, addToCartLocal, updateCartQuantityLocal]
  );

  function handleAdd(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (outOfStock) return;
    if (variants.length > 1) {
      setSheetOpen(true);
      return;
    }
    void changeQuantity(1);
  }

  return (
    <>
<<<<<<< HEAD
      <article className="group relative flex flex-col">
        <Link
          href={`/products/${product.id}`}
          className="block relative aspect-square rounded-xl bg-surface-muted overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={product.name}
        >
=======
      <div className="flex flex-col h-full bg-surface rounded-xl border border-border hover:border-gray-300 p-2.5 sm:p-3 shadow-2xs hover:shadow-sm group relative transition-all duration-150">
        {/* Product Image Container */}
        <div className="relative w-full aspect-square bg-surface-muted/40 rounded-lg overflow-hidden mb-2.5 flex items-center justify-center border border-border/50">
          <Link
            href={`/products/${product.id}`}
            className="absolute inset-0 z-0"
            aria-label={`View details for ${product.name}`}
          />
          
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
          <Image
            src={product.image_url || PLACEHOLDER_PRODUCT_IMAGE}
            alt=""
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 190px"
            priority={priority}
<<<<<<< HEAD
            className="object-contain p-2.5 transition-transform duration-200 group-hover:scale-[1.03]"
          />
          {outOfStock && (
            <span className="absolute inset-0 grid place-items-center bg-surface/70 text-[11px] font-bold uppercase tracking-wide text-foreground-muted">
              Out of stock
=======
            className={`w-full h-full object-cover transition-transform duration-200 group-hover:scale-105 pointer-events-none ${
              isAllOutOfStock ? 'grayscale opacity-60' : ''
            }`}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).srcset = PLACEHOLDER_PRODUCT_IMAGE;
            }}
          />

          {/* Genuine discount badge */}
          {hasRealDiscount && discountPct >= 1 && (
            <span className="absolute top-1.5 left-1.5 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-2xs tabular-nums">
              {discountPct}% OFF
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
            </span>
          )}
        </Link>

<<<<<<< HEAD
        {/* ADD / stepper, overlapping the image like every Indian q-commerce app */}
        <div className="absolute right-1.5 bottom-[74px] sm:bottom-[78px]">
          {outOfStock ? (
            <span className="inline-flex h-8 items-center rounded-lg border border-border bg-surface px-2 text-[10px] font-bold text-foreground-muted">
              Notify
            </span>
          ) : inCart ? (
            <div className="inline-flex h-8 items-center rounded-lg bg-primary text-on-primary shadow-sm">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void changeQuantity(totalQuantity - 1);
                }}
                className="w-8 h-8 grid place-items-center rounded-l-lg hover:bg-primary-hover"
                aria-label={`Remove one ${product.name}`}
              >
                <Minus className="w-3.5 h-3.5" aria-hidden />
              </button>
              <span className="min-w-[18px] text-center text-[12px] font-extrabold tabular-nums" aria-live="polite">
                {totalQuantity}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void changeQuantity(totalQuantity + 1);
                }}
                className="w-8 h-8 grid place-items-center rounded-r-lg hover:bg-primary-hover"
                aria-label={`Add one more ${product.name}`}
              >
                <Plus className="w-3.5 h-3.5" aria-hidden />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              disabled={busy}
              className="inline-flex h-8 min-w-[52px] items-center justify-center rounded-lg border border-primary/25 bg-surface px-2.5 text-[11px] font-extrabold uppercase tracking-wide text-primary shadow-sm hover:bg-primary-fixed active:scale-95 transition disabled:opacity-60"
              aria-label={`Add ${product.name} to cart`}
            >
              Add
            </button>
          )}
        </div>

        <div className="mt-2 min-w-0">
          <Link href={`/products/${product.id}`} className="block">
            <h3 className="text-[13px] font-semibold leading-[1.3] text-foreground line-clamp-2 min-h-[34px]">
              {product.name}
            </h3>
          </Link>
          <p className="text-[11px] font-medium text-foreground-muted mt-1 truncate">
            {variant?.weight ? `${variant.weight}` : '1 pack'}
          </p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-[15px] font-extrabold text-foreground tabular-nums">₹{inr.format(price)}</span>
            {hasDiscount && (
              <span className="text-[11px] font-medium text-foreground-muted line-through tabular-nums">
                ₹{inr.format(mrp)}
              </span>
=======
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
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
            )}
          </div>
        </div>
      </article>

<<<<<<< HEAD
      {/* Pack-size sheet: only when one product has several variants */}
      {sheetOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center sm:justify-center" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close"
            onClick={() => setSheetOpen(false)}
          />
          <div className="relative w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl bg-surface p-4 pb-6 sm:pb-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <h2 className="text-[14px] font-extrabold text-foreground truncate">{product.name}</h2>
                <p className="text-[11px] text-foreground-muted">Choose a pack size</p>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="w-8 h-8 grid place-items-center rounded-full hover:bg-surface-muted"
                aria-label="Close pack sizes"
=======
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
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
              >
                <X className="w-4 h-4" aria-hidden />
              </button>
            </div>
            <ul className="divide-y divide-border">
              {variants.map((v) => {
                const qty = cartItems.find((i) => i.variantId === v.id)?.quantity ?? 0;
                const soldOut = (v.available_quantity ?? v.stock ?? 0) <= 0;
                return (
                  <li key={v.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-foreground">{v.weight}</p>
                      <p className="text-[11px] text-foreground-muted tabular-nums">
                        ₹{inr.format(v.price)}
                        {v.original_price && v.original_price > v.price ? (
                          <span className="line-through ml-1.5">₹{inr.format(v.original_price)}</span>
                        ) : null}
                      </p>
                    </div>
                    {soldOut ? (
                      <span className="text-[11px] font-bold text-foreground-muted">Out of stock</span>
                    ) : qty > 0 ? (
                      <div className="inline-flex h-9 items-center rounded-lg bg-primary text-on-primary">
                        <button
                          type="button"
                          onClick={() => {
                            updateCartQuantityLocal(product.id, v.id, qty - 1);
                            if (user) void updateCartItem(user.id, product.id, v.id, qty - 1);
                          }}
                          className="w-9 h-9 grid place-items-center"
                          aria-label={`Remove one ${v.weight}`}
                        >
                          <Minus className="w-3.5 h-3.5" aria-hidden />
                        </button>
                        <span className="min-w-[16px] text-center text-[12px] font-extrabold">{qty}</span>
                        <button
                          type="button"
                          onClick={() => {
                            updateCartQuantityLocal(product.id, v.id, qty + 1);
                            if (user) void updateCartItem(user.id, product.id, v.id, qty + 1);
                          }}
                          className="w-9 h-9 grid place-items-center"
                          aria-label={`Add one more ${v.weight}`}
                        >
                          <Plus className="w-3.5 h-3.5" aria-hidden />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          addToCartLocal(product.id, v.id, 1);
                          if (user) void addToCart(user.id, product.id, v.id, 1);
                        }}
                        className="h-9 min-w-[64px] rounded-lg border border-primary/25 px-3 text-[11px] font-extrabold uppercase tracking-wide text-primary hover:bg-primary-fixed"
                      >
                        Add
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="mt-3 w-full h-11 rounded-xl bg-primary text-on-primary text-[13px] font-bold hover:bg-primary-hover"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
