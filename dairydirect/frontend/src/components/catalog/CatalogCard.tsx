'use client';

import { useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';

import { useStore } from '@/store/useStore';
import { addToCart } from '@/lib/api/cart';
import { isSellableVariant } from '@/lib/catalog/sellable';
import type { CatalogProduct, CatalogVariant } from '@/lib/types/catalog';

interface CatalogCardProps {
  product: CatalogProduct;
  priority?: boolean;
}

/**
 * Product card, Amazon search-result pattern.
 *
 * The shape is deliberate and copied in structure, not in colour:
 *   image on white, contained not cropped -> the whole product is visible
 *   two-line title                        -> every card is the same height
 *   stars, then price, then button        -> one fixed reading order
 *
 * `object-contain` matters more than it looks. Cropping to fill makes a
 * 1kg flour bag and a spice jar occupy identical rectangles with their
 * edges cut off; containing them keeps their real proportions, which is how
 * a customer recognises a product at a glance.
 *
 * No hover lift or shadow: the card is already separated from the grey page
 * by being white, so movement adds nothing but noise.
 */
export function CatalogCard({ product, priority = false }: CatalogCardProps) {
  const user = useStore((s) => s.user);
  const cart = useStore((s) => s.cart);
  const addToCartLocal = useStore((s) => s.addToCartLocal);
  const updateCartQuantityLocal = useStore((s) => s.updateCartQuantityLocal);

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

  const handleAdd = useCallback(async () => {
    if (!selected || busy) return;
    setBusy(true);
    try {
      addToCartLocal(product.id, selected.id, 1);
      if (user) await addToCart(user.id, product.id, selected.id, 1);
    } finally {
      setBusy(false);
    }
  }, [selected, busy, product.id, user, addToCartLocal]);

  if (!selected) return null;

  const hasRealDiscount =
    typeof selected.original_price === 'number' && selected.original_price > selected.price;
  const discountPct = hasRealDiscount
    ? Math.round(((selected.original_price! - selected.price) / selected.original_price!) * 100)
    : 0;

  /* Ratings render only with reviews behind them. A default star count on a
     product nobody has reviewed is a fabricated endorsement. */
  const reviews = product.reviews_count ?? 0;
  const rating = product.rating ?? 0;
  const showRating = reviews > 0 && rating > 0;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-surface p-3">
      <Link
        href={`/products/${product.id}`}
        className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-xl bg-surface">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw"
              className="object-contain p-1"
              priority={priority}
              loading={priority ? undefined : 'lazy'}
            />
          ) : (
            /* Real catalogue rows can have no photo yet. An empty frame
               reading "No image" looks like a failed load; a branded tile
               carrying the product's initial looks deliberate and keeps the
               grid's rhythm intact. */
            <div
              className="flex h-full w-full items-center justify-center rounded-xl bg-primary-fixed"
              aria-hidden="true"
            >
              <span className="text-2xl font-bold text-primary">
                {product.name.trim().charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <h3 className="mt-2 line-clamp-2 min-h-[2.5rem] text-[13px] leading-tight text-foreground group-hover:underline">
          {product.name}
        </h3>
      </Link>

      {showRating ? (
        <div className="mt-1 flex items-center gap-1">
          <span className="flex" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < Math.round(rating)
                    ? 'fill-secondary text-secondary'
                    : 'text-border-hover'
                }`}
              />
            ))}
          </span>
          <span className="text-[11px] text-foreground-muted">
            {rating.toFixed(1)} ({reviews})
          </span>
        </div>
      ) : (
        <div className="mt-1 h-[18px]" aria-hidden="true" />
      )}

      {/* Price. Large and unmissable: it is the number the customer is
          actually scanning the grid for. */}
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-[18px] font-bold leading-none text-foreground">
          ₹{selected.price}
        </span>
        {hasRealDiscount && (
          <>
            <span className="text-[12px] text-foreground-muted line-through">
              ₹{selected.original_price}
            </span>
            <span className="text-[11px] font-semibold text-error">({discountPct}% off)</span>
          </>
        )}
      </div>

      {variants.length > 1 ? (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {variants.slice(0, 3).map((v) => {
            const active = v.id === selected.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedId(v.id)}
                aria-pressed={active}
                className={`rounded-lg border px-1.5 py-0.5 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active
                    ? 'border-primary bg-primary-fixed font-semibold text-primary'
                    : 'border-border text-foreground-muted'
                }`}
              >
                {v.weight}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="mt-1 text-[11px] text-foreground-muted">{selected.weight}</p>
      )}

      {/* mt-auto pins the button to the bottom so buttons line up across a
          row even when titles wrap to different heights. */}
      <div className="mt-auto pt-2.5">
        {soldOut ? (
          <span className="block rounded-full border border-border py-1.5 text-center text-[12px] font-semibold text-foreground-muted">
            Currently unavailable
          </span>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            disabled={busy}
            aria-label={`Add ${product.name} to cart`}
            className="w-full rounded-full bg-primary py-1.5 text-[12.5px] font-semibold text-on-primary transition-transform duration-150 active:scale-[0.97] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {qty > 0 ? `In cart (${qty})` : 'Add to cart'}
          </button>
        )}
        {!soldOut && stock <= 5 && (
          <p className="mt-1 text-center text-[10.5px] font-medium text-warning">
            Only {stock} left
          </p>
        )}
      </div>
    </article>
  );
}
