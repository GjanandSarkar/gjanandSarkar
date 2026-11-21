"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, X } from 'lucide-react';
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
      <article className="group relative flex flex-col">
        <Link
          href={`/products/${product.id}`}
          className="block relative aspect-square rounded-xl bg-surface-muted overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={product.name}
        >
          <Image
            src={product.image_url || PLACEHOLDER_PRODUCT_IMAGE}
            alt=""
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 190px"
            priority={priority}
            className="object-contain p-2.5 transition-transform duration-200 group-hover:scale-[1.03]"
          />
          {outOfStock && (
            <span className="absolute inset-0 grid place-items-center bg-surface/70 text-[11px] font-bold uppercase tracking-wide text-foreground-muted">
              Out of stock
            </span>
          )}
        </Link>

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
            )}
          </div>
        </div>
      </article>

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
