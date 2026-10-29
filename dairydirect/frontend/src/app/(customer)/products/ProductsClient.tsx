'use client';

import { Suspense, useCallback, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import type { CatalogProduct } from '@/lib/types/catalog';
import { VISIBLE_CATEGORY_NAMES } from '@/lib/constants/categories';
import { isSectionEnabled } from '@/lib/config/launch';
import { ProductCard } from '@/components/shared/ProductCard';
import { ProductGridSkeleton } from '@/components/shared/Skeletons';
import { Sheet } from '@/components/ui/Sheet';
import {
  MapPin,
  SlidersHorizontal,
  ChevronDown,
  X,
  Check,
} from 'lucide-react';
import { useState } from 'react';
import dynamic from 'next/dynamic';

// Pagination bar is a client component that reads useSearchParams internally.
const PaginationBar = dynamic(() => import('./PaginationBar'), { ssr: false });

interface ProductsClientProps {
  initialProducts: CatalogProduct[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  currentCategory?: string;
  currentQ?: string;
  currentSort?: 'featured' | 'price_asc' | 'price_desc';
}

const STATES = [
  'All', 'Gujarat', 'Rajasthan', 'Kerala', 'Kashmir',
  'Punjab', 'Tamil Nadu', 'Himachal Pradesh', 'West Bengal',
];

/**
 * ProductsClient — URL-driven product listing.
 *
 * Phase 4 change:
 *   BEFORE: held all ~500 products in state; filtered/sorted with useMemo.
 *   AFTER:  reads server-rendered initialProducts (24 rows max); every filter
 *   change pushes a new URL param which triggers a full Server Component
 *   re-render on the server — Postgres does the filtering.
 *
 * The component manages only pure UI state (filter sheet open/close).
 * Everything else is URL state.
 */
function ProductsScreenContent({
  initialProducts,
  page,
  pageSize,
  total,
  hasMore,
  currentCategory,
  currentQ,
  currentSort = 'featured',
}: ProductsClientProps) {
  const { t, tCategory } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [filtersOpen, setFiltersOpen] = useState(false);

  /** Build a new URL with the given key=value, resetting page to 1. */
  const pushFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('page'); // filter change resets to page 1
      if (value === null || value === '' || value === 'All' || value === 'featured') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      const qs = params.toString();
      startTransition(() => {
        router.push(`${pathname}${qs ? '?' + qs : ''}`, { scroll: false });
      });
    },
    [searchParams, pathname, router]
  );

  const handleCategoryChange = (cat: string) => {
    pushFilter('category', cat === 'All' ? null : cat);
    setFiltersOpen(false);
  };

  const handleSortChange = (sort: string) => {
    pushFilter('sort', sort === 'featured' ? null : sort);
  };

  const handleClearFilters = () => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  };

  const activeCategory = currentCategory || 'All';
  const activeSort = currentSort;

  const activeFilterCount =
    (activeCategory !== 'All' ? 1 : 0) +
    (activeSort !== 'featured' ? 1 : 0) +
    (currentQ?.trim() ? 1 : 0);

  // The categories list comes from the constant list (not derived from product data)
  // so it is stable and doesn't re-derive when the product slice changes.
  const categories = ['All', ...VISIBLE_CATEGORY_NAMES];

  // ── Filter controls ────────────────────────────────────────────────────────
  // Defined once, rendered in both the desktop sidebar and the mobile sheet.
  const filterControls = (
    <div className="space-y-4">
      {/* Category */}
      <div className="bg-surface rounded-lg border border-border p-4 shadow-xs">
        <h3 className="text-xs font-semibold text-foreground mb-3">
          {t('filterCategories') || 'Categories'}
        </h3>
        <div className="space-y-1">
          {categories.map((cat) => {
            const isActive = activeCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors min-h-[44px] cursor-pointer ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-foreground-muted hover:bg-surface-muted'
                }`}
              >
                <span>{cat === 'All' ? (t('all') || 'All') : tCategory(cat)}</span>
                {isActive && <Check className="w-4 h-4" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort — inside filter sheet on mobile */}
      <div className="bg-surface rounded-lg border border-border p-4 shadow-xs">
        <h3 className="text-xs font-semibold text-foreground mb-3">Sort by</h3>
        <div className="space-y-1">
          {[
            { id: 'featured', label: t('sortFeatured') || 'Featured' },
            { id: 'price_asc', label: t('sortPriceAsc') || 'Price: Low to High' },
            { id: 'price_desc', label: t('sortPriceDesc') || 'Price: High to Low' },
          ].map((opt) => {
            const isActive = activeSort === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => { handleSortChange(opt.id); setFiltersOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors min-h-[44px] cursor-pointer ${
                  isActive
                    ? 'bg-surface-muted text-primary border border-border'
                    : 'text-foreground-muted hover:bg-surface-muted'
                }`}
              >
                <span>{opt.label}</span>
                {isActive && <Check className="w-4 h-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-10">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-6">

        {/* Page heading */}
        <div className="mb-4 lg:mb-6">
          <div className="bg-surface border border-border rounded-lg p-5 lg:p-6 shadow-xs">
            <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-foreground">
              {currentQ
                ? `Results for "${currentQ}"`
                : activeCategory !== 'All'
                  ? tCategory(activeCategory)
                  : (t('allProducts') || 'All Products')}
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted mt-1">
              {t('ourProductsSub') ||
                'Authentic goods direct from verified Indian manufacturers. One trusted brand per category.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">

          {/* Desktop-only sidebar */}
          <aside className="hidden lg:block">{filterControls}</aside>

          <main className="space-y-4 min-w-0">

            {/* Toolbar */}
            <div className="sticky top-0 z-20 -mx-4 px-4 py-2.5 bg-background/95 backdrop-blur-sm border-b border-border lg:static lg:mx-0 lg:px-4 lg:py-3.5 lg:bg-surface lg:rounded-lg lg:border lg:border-border lg:shadow-xs lg:backdrop-blur-none">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-medium text-foreground shrink-0">
                  {total > 0 && (
                    <>
                      <strong className="text-primary font-semibold">{total}</strong>
                      <span className="hidden sm:inline"> {t('items') || 'products'}</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 min-w-0">
                  {/* Mobile filters button */}
                  <button
                    onClick={() => setFiltersOpen(true)}
                    className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface text-xs font-medium text-foreground active:scale-95 transition-transform min-h-[44px]"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>{t('filters') || 'Filters'}</span>
                    {activeFilterCount > 0 && (
                      <span className="ml-0.5 w-4 h-4 rounded-full bg-primary text-on-primary text-xs font-semibold grid place-items-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  {/* Desktop sort select */}
                  <select
                    value={activeSort}
                    onChange={(e) => handleSortChange(e.target.value)}
                    aria-label="Sort products"
                    className="hidden lg:block px-2.5 py-2 rounded-lg border border-border text-xs font-medium text-foreground bg-surface focus:border-primary outline-none min-h-[44px]"
                  >
                    <option value="featured">{t('sortFeatured') || 'Featured'}</option>
                    <option value="price_asc">{t('sortPriceAsc') || 'Price: Low to High'}</option>
                    <option value="price_desc">{t('sortPriceDesc') || 'Price: High to Low'}</option>
                  </select>

                  {activeFilterCount > 0 && (
                    <button
                      onClick={handleClearFilters}
                      className="hidden lg:flex text-xs font-medium text-error hover:underline items-center gap-1 min-h-[44px]"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{t('clearFilters') || 'Clear'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Pending overlay: show skeleton while the server is re-rendering */}
            {isPending ? (
              <ProductGridSkeleton count={8} />
            ) : initialProducts.length === 0 ? (
              <div className="bg-surface rounded-lg border border-border p-10 text-center space-y-4 shadow-xs">
                <div className="w-14 h-14 rounded-lg bg-surface-muted flex items-center justify-center mx-auto border border-border">
                  <svg className="w-7 h-7 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  {t('noProductsFound') || 'No products match your filters'}
                </h3>
                <p className="text-xs text-foreground-muted max-w-sm mx-auto">
                  {t('noProductsFoundSub') || 'Try clearing your search or choosing a different category.'}
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-5 py-2.5 bg-primary text-on-primary text-xs font-medium rounded-lg shadow-xs hover:bg-primary-hover transition-colors min-h-[44px]"
                >
                  {t('clearFilters') || 'Reset filters'}
                </button>
              </div>
            ) : (
              <>
                {/* Product grid — reserved aspect-ratio prevents CLS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {initialProducts.map((prod) => (
                    <ProductCard key={prod.id} product={prod} />
                  ))}
                </div>

                {/* Pagination */}
                <PaginationBar
                  page={page}
                  hasMore={hasMore}
                  total={total}
                  pageSize={pageSize}
                />
              </>
            )}

          </main>
        </div>
      </div>

      {/* Mobile filter sheet */}
      <Sheet
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={t('filters') || 'Filters'}
      >
        <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-4">
          {activeFilterCount > 0 && (
            <div className="flex justify-end">
              <button
                onClick={() => { handleClearFilters(); setFiltersOpen(false); }}
                className="text-xs font-medium text-error hover:underline cursor-pointer"
              >
                {t('clearFilters') || 'Clear all filters'}
              </button>
            </div>
          )}
          {filterControls}
        </div>
      </Sheet>
    </div>
  );
}

export default function ProductsClient(props: ProductsClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ProductsScreenContent {...props} />
    </Suspense>
  );
}
