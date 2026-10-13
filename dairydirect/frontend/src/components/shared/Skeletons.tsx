import React from 'react';

/**
 * Layout-matched loading skeletons.
 *
 * These replace centred `<Loader2 className="animate-spin" />` spinners. A
 * spinner communicates "something is happening" but gives no sense of
 * progress or shape, and when the content lands the page jumps — which reads
 * as slow even when the actual load time is identical.
 *
 * A skeleton that mirrors the final layout reserves the space (no CLS) and
 * measurably lowers perceived wait. This is what Blinkit/Swiggy/Zepto do on
 * every listing surface.
 *
 * `.skeleton` (shimmer, reduced-motion aware) is defined in globals.css.
 */

/** A single shimmering block. */
export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} aria-hidden="true" />;
}

/** Mirrors ProductCard: square image, brand line, title, meta, price row. */
export function ProductCardSkeleton() {
  return (
    <div
      className="flex flex-col h-full bg-white rounded-2xl border border-gray-200/90 p-3.5"
      aria-hidden="true"
    >
      <SkeletonBlock className="w-full aspect-square rounded-xl mb-3" />
      <SkeletonBlock className="h-2 w-1/3 mb-2" />
      <SkeletonBlock className="h-3 w-4/5 mb-2" />
      <SkeletonBlock className="h-2 w-1/2 mb-3" />
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 mt-auto">
        <SkeletonBlock className="h-4 w-14" />
        <SkeletonBlock className="h-7 w-16 rounded-lg" />
      </div>
    </div>
  );
}

/** A responsive grid of product skeletons. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
      role="status"
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** A horizontally scrolling rail of product skeletons. */
export function ProductRailSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div
      className="flex gap-3 sm:gap-4 overflow-hidden"
      role="status"
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-[160px] sm:w-[200px] shrink-0">
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  );
}

/** Mirrors the circular category rail. */
export function CategoryRailSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-hidden" role="status" aria-label="Loading categories">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2 min-w-[72px]">
          <SkeletonBlock className="w-14 h-14 sm:w-16 sm:h-16 rounded-full" />
          <SkeletonBlock className="h-2 w-12" />
        </div>
      ))}
    </div>
  );
}

/** Generic stacked list rows (orders, addresses, notifications). */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 bg-white rounded-2xl border border-gray-200/90 p-4"
        >
          <SkeletonBlock className="w-12 h-12 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0">
            <SkeletonBlock className="h-3 w-2/5 mb-2" />
            <SkeletonBlock className="h-2 w-3/5" />
          </div>
          <SkeletonBlock className="h-6 w-16 rounded-lg shrink-0" />
        </div>
      ))}
    </div>
  );
}

/** Full-page storefront skeleton used by the route-level loading UI. */
export function PageSkeleton() {
  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6" role="status" aria-label="Loading page">
      <span className="sr-only">Loading</span>
      <SkeletonBlock className="w-full h-40 sm:h-56 rounded-3xl mb-8" />
      <div className="mb-8">
        <CategoryRailSkeleton />
      </div>
      <SkeletonBlock className="h-4 w-40 mb-4" />
      <ProductGridSkeleton count={8} />
    </div>
  );
}
