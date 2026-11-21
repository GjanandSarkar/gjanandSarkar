'use client';

import { Suspense, useCallback, useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import type { CatalogProduct } from '@/lib/types/catalog';
import { VISIBLE_CATEGORY_NAMES } from '@/lib/constants/categories';
import { ProductCard } from '@/components/shared/ProductCard';
import { ProductGridSkeleton } from '@/components/shared/Skeletons';
import { Sheet } from '@/components/ui/Sheet';
import { SlidersHorizontal } from 'lucide-react';
import dynamic from 'next/dynamic';

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

/**
 * Product listing.
 *
 * Before: a bordered heading card ("All Products" + a sentence of marketing),
 * a second bordered toolbar with an item count and a mobile Filters button,
 * a bordered sidebar card of category buttons (the active one a filled green
 * pill), and a second bordered card for sort options. Four boxes of chrome
 * around a grid of products.
 *
 * Now: one line — title, count, sort. Category is a plain text list in the
 * sidebar (the same list the header tabs offer), and sort is a native select.
 * Phones get a single Filters button that opens the same plain list.
 *
 * Filtering still lives entirely in the URL; the server re-renders the grid.
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

  const pushFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('page');
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
    [searchParams, pathname, router],
  );

  const handleCategoryChange = (cat: string) => {
    pushFilter('category', cat === 'All' ? null : cat);
    setFiltersOpen(false);
  };

  const handleSortChange = (sort: string) => {
    pushFilter('sort', sort === 'featured' ? null : sort);
  };

  const activeCategory = currentCategory || 'All';
  const categories = ['All', ...VISIBLE_CATEGORY_NAMES];

  const title = currentQ
    ? `“${currentQ}”`
    : activeCategory !== 'All'
      ? tCategory(activeCategory)
      : t('allProducts') || 'All products';

  // Plain list: no cards, no filled pills. Active row is green and bold.
  const filterControls = (
    <div className="space-y-1">
      {categories.map((cat) => {
        const isActive = activeCategory.toLowerCase() === cat.toLowerCase();
        return (
          <button
            key={cat}
            type="button"
            onClick={() => handleCategoryChange(cat)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex min-h-11 w-full items-center justify-between px-2 text-sm ${
              isActive ? 'font-semibold text-primary' : 'text-foreground-muted'
            }`}
          >
            {cat === 'All' ? t('all') || 'All' : tCategory(cat)}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-surface pb-24 lg:pb-10">
      <div className="mx-auto max-w-[1440px] px-4 pt-3 sm:px-6 lg:px-8 lg:pt-5">
        <div className="flex items-end justify-between gap-3 border-b border-border pb-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground lg:text-xl">
              {title}
            </h1>
            {total > 0 && (
              <p className="mt-0.5 text-xs text-foreground-muted">
                {total} {total === 1 ? 'product' : 'products'}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex min-h-11 items-center gap-1.5 text-sm font-medium text-foreground lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              {activeCategory === 'All' ? 'Category' : tCategory(activeCategory)}
            </button>
            <select
              value={currentSort}
              onChange={(e) => handleSortChange(e.target.value)}
              aria-label="Sort products"
              className="h-11 border-0 bg-transparent pr-1 text-sm font-medium text-foreground outline-none"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[180px_1fr]">
          <aside className="hidden lg:block lg:pt-4">{filterControls}</aside>

          <main className="min-w-0 pt-3">
            {isPending ? (
              <ProductGridSkeleton count={8} />
            ) : initialProducts.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm font-semibold text-foreground">
                  {t('noProductsFound') || 'Nothing here yet'}
                </p>
                <p className="mt-1 text-xs text-foreground-muted">
                  {t('noProductsFoundSub') || 'Try another category.'}
                </p>
                {activeCategory !== 'All' && (
                  <button
                    type="button"
                    onClick={() => handleCategoryChange('All')}
                    className="mt-4 text-sm font-semibold text-primary underline-offset-2 hover:underline"
                  >
                    Show everything
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                  {initialProducts.map((prod) => (
                    <ProductCard key={prod.id} product={prod} />
                  ))}
                </div>
                <PaginationBar page={page} hasMore={hasMore} total={total} pageSize={pageSize} />
              </>
            )}
          </main>
        </div>
      </div>

      <Sheet isOpen={filtersOpen} onClose={() => setFiltersOpen(false)} title="Category">
        <div className="px-2 pb-[max(1rem,env(safe-area-inset-bottom))] py-2">{filterControls}</div>
      </Sheet>
    </div>
  );
}

export default function ProductsClient(props: ProductsClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <ProductsScreenContent {...props} />
    </Suspense>
  );
}
