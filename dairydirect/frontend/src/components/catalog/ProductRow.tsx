'use client';

import { useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus } from 'lucide-react';

import { useStore } from '@/store/useStore';
import { addToCart } from '@/lib/api/cart';
import { isSellableVariant } from '@/lib/catalog/sellable';
import type { CatalogProduct, CatalogVariant } from '@/lib/types/catalog';

interface ProductRowProps {
  product: CatalogProduct;
  /** First rows are LCP candidates and should not lazy-load. */
  priority?: boolean;
}

/**
 * Product row — the atom of the rebuilt catalogue.
 *
 * A row, not a card. Boxed cards spend most of their pixels on border,
 * padding and shadow, and fit about four products on a phone screen. A row
 * fits seven or eight and puts the name, price and buy button on one
 * horizontal line the eye can scan straight down. This is the pattern Indian
 * grocery apps converged on for good reason.
 *
 * No hover lift, scale or shadow. Hover does not exist on the phones most
 * customers use, and on desktop it makes a quiet list twitch as the pointer
 * crosses it. Feedback is a press-in on tap and a focus ring for keyboards —
 * both of which are real interactions rather than decoration.
 */
export function ProductRow({ product, priority = false }: ProductRowProps) {
  const user = useStore((s) => s.user);
  const cart = useStore((s) => s.cart);
  const addToCartLocal = useStore((s) => s.addToCartLocal);
  const updateCartQuantityLocal = useStore((s) => s.updateCartQuantityLocal);

  /* Only variants with a real price can be bought. An unpriced variant that
     renders as a buyable row is how a storefront ends up selling something
     for zero rupees. */
  const variants = useMemo(
    () => (product.product_variants ?? []).filter(isSellableVariant),
    [product.product_variants]
  );

  const [selectedId, setSelectedId] = useState<string | null>(variants[0]?.id ?? null);
  const [busy, setBusy] = useState(false);

  const selected: CatalogVariant | undefined =
    variants.find((v) => v.id === selectedId) ?? variants[0];

  const qty = selected
    ? cart.find((i) => i.productId === product.id && i.variantId === selected.id)?.quantity ?? 0
    : 0;

  const stock = selected?.available_quantity ?? selected?.stock ?? 0;
  const soldOut = !selected || stock <= 0;

  const changeQty = useCallback(
    async (next: number) => {
      if (!selected || busy) return;
      setBusy(true);
      try {
        if (qty === 0 && next === 1) {
          /* Optimistic first: the number must move the instant it is tapped,
             or the customer taps again and orders two. */
          addToCartLocal(product.id, selected.id, 1);
          if (user) await addToCart(user.id, product.id, selected.id, 1);
        } else {
          updateCartQuantityLocal(product.id, selected.id, Math.max(0, next));
        }
      } finally {
        setBusy(false);
      }
    },
    [selected, busy, qty, product.id, user, addToCartLocal, updateCartQuantityLocal]
  );

  if (!selected) return null;

  /* Strikethrough only against a genuinely higher original price. Showing a
     crossed-out number that was never charged is a pricing claim we cannot
     support. */
  const hasRealDiscount =
    typeof selected.original_price === 'number' && selected.original_price > selected.price;
  const discountPct = hasRealDiscount
    ? Math.round(((selected.original_price! - selected.price) / selected.original_price!) * 100)
    : 0;

  return (
    <article className="relative flex items-start gap-3 bg-surface px-4 py-3.5 transition-transform duration-150 active:scale-[0.995]">
      {/* Thumbnail. Fixed square so rows align into a clean vertical rhythm
          however tall the text runs. */}
      <Link
        href={`/products/${product.id}`}
        className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-xl bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        tabIndex={-1}
        aria-hidden="true"
      >
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt=""
            fill
            sizes="88px"
            className="object-cover"
            priority={priority}
            loading={priority ? undefined : 'lazy'}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-foreground-muted">
            No image
          </div>
        )}

        {discountPct > 0 && (
          <span className="absolute left-0 top-0 rounded-br-lg bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-on-secondary">
            {discountPct}% OFF
          </span>
        )}
      </Link>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <Link
          href={`/products/${product.id}`}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          {product.brand ? (
            <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
              {product.brand}
            </p>
          ) : null}
          {/* Two lines maximum: a third pushes the price below the fold of
              the row and breaks the scan line. */}
          <h3 className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-foreground">
            {product.name}
          </h3>
        </Link>

        {/* Variants inline. A drawer for two weights is a dialog the customer
            has to dismiss; chips are one tap and keep them in the list. */}
        {variants.length > 1 ? (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {variants.slice(0, 3).map((v) => {
              const active = v.id === selected.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedId(v.id)}
                  aria-pressed={active}
                  className={`rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active
                      ? 'border-primary bg-primary-fixed text-primary'
                      : 'border-border text-foreground-muted'
                  }`}
                >
                  {v.weight}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-1 text-[11.5px] text-foreground-muted">{selected.weight}</p>
        )}

        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-[15px] font-bold text-foreground">
            ₹{selected.price}
          </span>
          {hasRealDiscount && (
            <span className="text-[12px] text-foreground-muted line-through">
              ₹{selected.original_price}
            </span>
          )}
        </div>
      </div>

      {/* Action. Pinned right at a consistent width so every button in the
          list forms one vertical column under the thumb. */}
      <div className="flex w-[88px] shrink-0 flex-col items-end justify-center self-center">
        {soldOut ? (
          <span className="rounded-lg border border-border px-3 py-2 text-[11px] font-semibold text-foreground-muted">
            Sold out
          </span>
        ) : qty === 0 ? (
          <button
            type="button"
            onClick={() => changeQty(1)}
            disabled={busy}
            aria-label={`Add ${product.name} to cart`}
            className="w-full rounded-lg border-2 border-primary bg-surface py-2 text-[13px] font-bold uppercase tracking-wide text-primary transition-transform duration-150 active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Add
          </button>
        ) : (
          <div className="flex w-full items-center justify-between rounded-lg bg-primary text-on-primary">
            <button
              type="button"
              onClick={() => changeQty(qty - 1)}
              disabled={busy}
              aria-label="Decrease quantity"
              className="grid h-9 w-9 place-items-center rounded-l-lg transition-transform duration-150 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-[14px] font-bold tabular-nums" aria-live="polite">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => changeQty(qty + 1)}
              disabled={busy || qty >= stock}
              aria-label="Increase quantity"
              className="grid h-9 w-9 place-items-center rounded-r-lg transition-transform duration-150 active:scale-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Scarcity only when it is true and low enough to matter. */}
        {!soldOut && stock <= 5 && (
          <span className="mt-1 text-[10px] font-medium text-warning">Only {stock} left</span>
        )}
      </div>
    </article>
  );
}
