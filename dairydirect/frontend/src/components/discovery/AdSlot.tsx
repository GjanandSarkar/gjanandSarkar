"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Megaphone } from 'lucide-react';
import { getSessionId, trackAdEvent } from '@/lib/analytics/session';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';

interface AdProduct {
  id: string;
  name: string;
  category: string | null;
  image_url: string | null;
  brand: string | null;
  product_variants: { id: string; price: number; original_price: number | null; stock: number }[];
}

interface ServedAd {
  campaignId: string;
  campaignName: string;
  objective: string;
  placement: string;
  products: AdProduct[];
}

interface AdSlotProps {
  placement: 'home' | 'product' | 'category' | 'cart' | 'search';
  category?: string;
  className?: string;
}

/**
 * A promotional slot.
 *
 * Renders nothing unless the server returns an eligible, frequency-capped,
 * in-stock campaign, so an empty slot collapses rather than leaving a gap.
 */
export function AdSlot({ placement, category, className }: AdSlotProps) {
  const [ad, setAd] = useState<ServedAd | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const impressionLogged = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const sessionId = getSessionId();
    if (!sessionId) return;

    const params = new URLSearchParams({ placement, sessionId });
    if (category) params.set('category', category);

    fetch(`/api/ads?${params}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((body) => {
        if (!cancelled) setAd(body.ads?.[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setAd(null);
      });

    return () => {
      cancelled = true;
    };
  }, [placement, category]);

  // An impression is only counted once the slot is actually on screen.
  // Counting on render would inflate impressions with ads nobody scrolled to,
  // which in turn deflates CTR and makes ROAS meaningless.
  useEffect(() => {
    if (!ad || !containerRef.current || impressionLogged.current) return;

    const el = containerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !impressionLogged.current) {
            impressionLogged.current = true;
            trackAdEvent(ad.campaignId, 'impression', { placement });
            observer.disconnect();
          }
        }
      },
      // Half the slot visible counts as seen.
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ad, placement]);

  if (!ad || ad.products.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={`w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6 ${className ?? ''}`}
    >
      <div className="rounded-2xl border border-warning/20/80 bg-gradient-to-br from-amber-50 to-white p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="w-4 h-4 text-secondary" />
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">
            {ad.campaignName}
          </span>
          {/* Labelling promoted placements is a legal requirement for
              advertising in India and the honest thing to do regardless. */}
          <span className="ml-auto text-xs font-semibold uppercase tracking-wider text-foreground-muted border border-border rounded px-1.5 py-0.5">
            Promoted
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {ad.products.slice(0, 4).map((product) => {
            const price = product.product_variants?.[0]?.price;
            return (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                onClick={() =>
                  trackAdEvent(ad.campaignId, 'click', {
                    productId: product.id,
                    placement,
                  })
                }
                className="group bg-surface rounded-xl border border-border/80 p-3 hover:border-secondary/50 hover:shadow-sm transition-all"
              >
                <div className="relative w-full aspect-square mb-2 rounded-lg overflow-hidden bg-surface-muted">
                  <Image
                    src={product.image_url || PLACEHOLDER_PRODUCT_IMAGE}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 45vw, 220px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="text-[13px] font-bold text-dark line-clamp-2 leading-snug">
                  {product.name}
                </p>
                {typeof price === 'number' && (
                  <p className="text-sm font-semibold text-primary mt-1">
                    ₹{price.toLocaleString('en-IN')}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
