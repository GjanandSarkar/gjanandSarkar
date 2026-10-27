"use client";

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { ProductCard } from '@/components/shared/ProductCard';
import { useStore } from '@/store/useStore';
import { getSessionId, trackProductEvent } from '@/lib/analytics/session';
import type { CatalogProduct } from '@/lib/types/catalog';

type Placement = 'home' | 'product' | 'category' | 'cart';
type Reason = 'popularity' | 'content' | 'collaborative';

interface RecommendedProduct extends CatalogProduct {
  reason: Reason;
}

interface RecommendationRailProps {
  placement: Placement;
  /** Product being viewed, on a product detail page. */
  productId?: string;
  /** Category being browsed, on a category page. */
  category?: string;
  limit?: number;
  /** Overrides the heading derived from the dominant reason. */
  title?: string;
  /**
   * Narrow layout for constrained containers such as the cart drawer, where
   * the full-width page rail would overflow.
   */
  compact?: boolean;
}

/**
 * Headings describe the actual basis for the suggestion.
 *
 * The previous discovery components labelled a reverse-chronological list
 * "Trending" and a same-category slice "Best Sellers", which were claims the
 * data did not support. Each heading here is only used when the ranking
 * genuinely came from that signal.
 */
const REASON_HEADINGS: Record<Reason, { eyebrow: string; title: string }> = {
  popularity: { eyebrow: 'Popular now', title: 'What other shoppers are buying' },
  content: { eyebrow: 'Based on your browsing', title: 'More like what you viewed' },
  collaborative: { eyebrow: 'Recommended for you', title: 'Customers also bought' },
};

export function RecommendationRail({
  placement,
  productId,
  category,
  limit = 8,
  title,
  compact = false,
}: RecommendationRailProps) {
  const cart = useStore((s) => s.cart);
  const [products, setProducts] = useState<RecommendedProduct[]>([]);
  const [variant, setVariant] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sectionClass = compact
    ? 'w-full px-4 py-4 border-t border-border/80'
    : 'w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8';

  // Cart contents are sent so the rail never suggests something already in
  // the basket. Serialised to a string so the effect does not re-run on every
  // store update that leaves the contents unchanged.
  const cartKey = cart.map((i: any) => i.productId).sort().join(',');

  useEffect(() => {
    let cancelled = false;
    const sessionId = getSessionId();
    if (!sessionId) return;

    const params = new URLSearchParams({
      placement,
      sessionId,
      limit: String(limit),
    });
    if (productId) params.set('productId', productId);
    if (category) params.set('category', category);
    // Cart ids are always sent: they seed the recommendations. Only the
    // cart placement also asks for them to be filtered OUT of the results.
    if (cartKey) params.set('cart', cartKey);
    if (placement === 'cart') params.set('excludeCart', '1');

    setIsLoading(true);
    fetch(`/api/recommendations?${params}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((body) => {
        if (cancelled) return;
        setProducts(body.products ?? []);
        setVariant(body.variant ?? null);
      })
      .catch(() => {
        // A failed rail renders nothing rather than an error state; it is
        // supplementary content, not something the customer asked for.
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [placement, productId, category, limit, cartKey]);

  if (isLoading) {
    return (
      <section className={sectionClass}>
        <div className="h-5 w-48 rounded bg-border animate-pulse mb-6" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-[240px] shrink-0 h-[320px] rounded-2xl bg-surface-muted animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  // An empty rail is removed entirely rather than left as a titled blank
  // space, which reads as a broken page.
  if (products.length === 0) return null;

  const dominantReason = products[0]?.reason ?? 'popularity';
  const heading = REASON_HEADINGS[dominantReason];

  const handleScroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  return (
    <section className={sectionClass}>
      <div
        className={
          compact
            ? 'flex items-end justify-between mb-3'
            : 'flex items-end justify-between pb-4 mb-6 border-b border-border/80'
        }
      >
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">
              {heading.eyebrow}
            </span>
          </div>
          <h2 className={compact ? 'text-sm font-semibold text-dark' : 'text-lg sm:text-xl font-semibold text-dark'}>
            {title ?? heading.title}
          </h2>
        </div>

        <div className={compact ? 'hidden' : 'hidden md:flex items-center gap-2'}>
          <button
            type="button"
            onClick={() => handleScroll('left')}
            aria-label="Scroll recommendations left"
            className="p-2 rounded-full border border-border hover:bg-surface-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            aria-label="Scroll recommendations right"
            className="p-2 rounded-full border border-border hover:bg-surface-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className={
              compact
                ? 'w-[150px] shrink-0 snap-start'
                : 'w-[200px] sm:w-[240px] shrink-0 snap-start'
            }
            // Attributing the click to this rail is what makes it possible to
            // tell whether recommendations actually drive purchases, and to
            // compare the hybrid variant against the popularity control.
            onClick={() =>
              trackProductEvent(product.id, 'view', {
                source: `rec:${placement}`,
                variant: variant ?? undefined,
              })
            }
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
