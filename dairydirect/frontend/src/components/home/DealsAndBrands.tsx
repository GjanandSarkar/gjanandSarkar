"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';
import type { CatalogProduct } from '@/lib/types/catalog';
import { ProductCard } from '@/components/shared/ProductCard';

interface DealsAndBrandsProps {
  products: CatalogProduct[];
}

export function DealsAndBrands({ products }: DealsAndBrandsProps) {
  /**
   * Countdown to the actual end of the deal window.
   *
   * This used to start at a hardcoded 8h 45m 32s for every visitor, tick
   * down, and then loop back to 12:00:00 — so two people looking at the same
   * "Deal of the Day" saw different times remaining, and the deal never
   * actually ended. It now counts down to midnight India time, which is a
   * real, shared, verifiable deadline.
   *
   * Starts null and fills in after mount: the remaining time depends on the
   * viewer's clock, so rendering it on the server would cause a hydration
   * mismatch.
   */
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const msUntilEndOfDayIST = () => {
      // IST is UTC+5:30 with no daylight saving.
      const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
      const nowIst = new Date(Date.now() + IST_OFFSET_MS);
      const endOfDayIst = Date.UTC(
        nowIst.getUTCFullYear(),
        nowIst.getUTCMonth(),
        nowIst.getUTCDate() + 1,
        0, 0, 0, 0,
      );
      return endOfDayIst - nowIst.getTime();
    };

    const tick = () => {
      const remaining = Math.max(0, msUntilEndOfDayIST());
      const totalSeconds = Math.floor(remaining / 1000);
      setTimeLeft({
        hours: Math.floor(totalSeconds / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
      });
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!products || products.length === 0) return null;

  // Products that are genuinely discounted.
  const dealProducts = products.filter(p => {
    const v = p.product_variants?.[0];
    return v && v.original_price && v.original_price > v.price;
  }).slice(0, 4);

  // There used to be a fallback to `products.slice(0, 4)` here, which
  // presented four full-price products under a "Deal of the Day" heading with
  // a countdown timer. If nothing is actually discounted, show nothing —
  // an empty deals rail is honest, a fake one is misleading advertising.
  const displayProducts = dealProducts;
  if (displayProducts.length === 0) return null;

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6">
      <div>
        {/* ── DEAL OF THE DAY (Full Width) ── */}
        <div className="bg-surface rounded-2xl p-5 md:p-6 border border-border/80 shadow-xs flex flex-col justify-between">

          {/* Header & Countdown */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border mb-5">
            <div className="flex items-center gap-3">
               <h2 className="text-xl md:text-2xl font-black text-primary tracking-tight">
                Deal of the Day
              </h2>
              {/* Reserve the pill's space before the client clock resolves so
                  the header does not shift on hydration. */}
              <div className="flex items-center gap-1.5 bg-success-bg/80 text-success text-xs font-bold px-3 py-1 rounded-full min-h-[26px]">
                <Clock className="w-3.5 h-3.5 text-success" />
                {timeLeft ? (
                  <span className="tabular-nums">
                    Ends in {String(timeLeft.hours).padStart(2, '0')} :{' '}
                    {String(timeLeft.minutes).padStart(2, '0')} :{' '}
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                ) : (
                  <span className="tabular-nums opacity-0" aria-hidden="true">
                    Ends in 00 : 00 : 00
                  </span>
                )}
              </div>
            </div>

            <Link href="/offers" className="text-xs font-bold text-secondary hover:text-primary flex items-center gap-1">
              <span>View Offers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Deal cards.

              This grid used to hand-roll its own card: a plain "Add" button
              that never read the cart, so it could not show how many units
              were already added, and it added variant[0] blindly even for a
              product with several sizes. It also duplicated the pricing and
              rating rules, which is how fabricated discounts and ratings
              survived here after being fixed everywhere else.

              Reusing ProductCard removes the duplicate entirely: the
              quantity stepper, the size picker for multi-variant products,
              honest pricing, optimised images and the theme tokens all come
              from one implementation. */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 items-stretch">
            {displayProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod as any} />
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
