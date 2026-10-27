"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { getProducts } from '@/lib/api/products';
import type { CatalogProduct } from '@/lib/types/catalog';
import { VISIBLE_CATEGORY_NAMES } from '@/lib/constants/categories';
import { isSectionEnabled } from '@/lib/config/launch';
import { ProductCard } from '@/components/shared/ProductCard';
import { useStore } from '@/store/useStore';
import { 
  Sparkles, 
  MapPin, 
  Filter, 
  SlidersHorizontal, 
  ChevronDown, 
  X,
  Check
} from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { ProductGridSkeleton } from '@/components/shared/Skeletons';

function ProductsScreenContent({ initialProducts }: { initialProducts: CatalogProduct[] }) {
  const { t, tCategory } = useTranslation();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const initialSearch = searchParams.get('search') || searchParams.get('q') || '';
  const initialState = searchParams.get('state') || 'All';

  // Seeded from the server render, so the grid paints with real products on
  // the very first frame instead of showing a skeleton while the browser
  // fetches the whole catalogue over the network.
  const [products, setProducts] = useState<CatalogProduct[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(initialProducts.length === 0);
  
  // Filtering & Sorting State
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [activeState, setActiveState] = useState<string>(initialState);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'rating'>('featured');
  const [priceRange, setPriceRange] = useState<'all' | 'under500' | '500to1500' | 'above1500'>('all');
  // Mobile filter sheet. Closed by default so products are the first thing
  // on screen; see the layout note in the render below.
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    // Only hit the network if the server render produced nothing (e.g. the
    // cached catalogue was empty); otherwise the server data is already
    // correct and refetching on mount would just burn a round-trip.
    if (initialProducts.length > 0) return;

    let cancelled = false;
    getProducts({ activeOnly: true }).then((data) => {
      if (cancelled) return;
      setProducts(data);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [initialProducts.length]);

  // Sync state if query params change
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setActiveCategory(cat);
    const q = searchParams.get('search') || searchParams.get('q');
    if (q !== null) setSearchQuery(q);
    const st = searchParams.get('state');
    if (st) setActiveState(st);
  }, [searchParams]);

  const states = [
    'All', 'Gujarat', 'Rajasthan', 'Kerala', 'Kashmir', 
    'Punjab', 'Tamil Nadu', 'Himachal Pradesh', 'West Bengal'
  ];

  const categories = useMemo(() => {
    const list = Array.from(
      new Set(
        products
          .map((p) => p.category)
          .filter((c): c is string => typeof c === 'string' && c.length > 0)
      )
    );
    return ['All', ...list];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category filter
        const prodCat = (p.category || '').toLowerCase();
        const activeCat = (activeCategory || 'All').toLowerCase();

        let matchCat = activeCat === 'all';
        if (!matchCat) {
          if (prodCat === activeCat) {
            matchCat = true;
          } else if (activeCat.includes('dairy') || activeCat.includes('essentials')) {
            // Legacy data shim: existing rows store dairy sub-products
            // ('Milk', 'Ghee', ...) in products.category rather than 'Dairy'.
            // Mirrors legacyCategoryFilter() used by the server queries.
            matchCat = ['milk', 'ghee', 'paneer', 'curd', 'lassi', 'buttermilk', 'butter', 'dairy'].some(c => prodCat.includes(c));
          } else if (activeCat.includes('oil') || activeCat.includes('spice')) {
            matchCat = prodCat.includes('oil') || prodCat.includes('spice');
          } else {
            matchCat = prodCat.includes(activeCat) || activeCat.includes(prodCat);
          }
        }
        
        // Search filter
        const matchSearch = 
          !searchQuery.trim() ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

        // Price range filter
        const firstPrice = p.product_variants?.[0]?.price || 0;
        let matchPrice = true;
        if (priceRange === 'under500') matchPrice = firstPrice < 500;
        else if (priceRange === '500to1500') matchPrice = firstPrice >= 500 && firstPrice <= 1500;
        else if (priceRange === 'above1500') matchPrice = firstPrice > 1500;

        return matchCat && matchSearch && matchPrice;
      })
      .sort((a, b) => {
        const priceA = a.product_variants?.[0]?.price || 0;
        const priceB = b.product_variants?.[0]?.price || 0;
        if (sortBy === 'price_asc') return priceA - priceB;
        if (sortBy === 'price_desc') return priceB - priceA;
        return 0;
      });
  }, [products, activeCategory, searchQuery, priceRange, sortBy]);

  const handleClearFilters = () => {
    setActiveCategory('All');
    setActiveState('All');
    setSearchQuery('');
    setPriceRange('all');
    setSortBy('featured');
  };

  const activeFilterCount =
    (activeCategory !== 'All' ? 1 : 0) +
    (priceRange !== 'all' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  // Filter controls are rendered twice from one definition: inline in the
  // desktop sidebar, and inside the mobile sheet. Keeping a single source
  // avoids the two copies drifting apart.
  const filterControls = (
    <div className="space-y-4">
      <div className="bg-surface rounded-lg border border-border p-4 shadow-xs">
        <h3 className="text-xs font-semibold text-foreground mb-3">
          {t('filterCategories') || 'Categories'}
        </h3>
        <div className="space-y-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setFiltersOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors min-h-[44px] cursor-pointer ${
                activeCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-foreground-muted hover:bg-surface-muted'
              }`}
            >
              <span>{cat === 'All' ? (t('all') || 'All') : tCategory(cat)}</span>
              {activeCategory.toLowerCase() === cat.toLowerCase() && (
                <Check className="w-4 h-4" />
              )}
            </button>
          ))}
        </div>
      </div>

      {isSectionEnabled('shopByState') && (
        <div className="bg-surface rounded-lg border border-border p-4 shadow-xs">
          <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span>{t('shopByState') || 'Shop by State Origin'}</span>
          </h3>
          <div className="space-y-1">
            {states.map((st) => (
              <button
                key={st}
                onClick={() => { setActiveState(st); setFiltersOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors min-h-[44px] cursor-pointer ${
                  activeState === st
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-foreground-muted hover:bg-surface-muted'
                }`}
              >
                <span>{st === 'All' ? (t('all') || 'All') : tCategory(st)}</span>
                {activeState === st && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-surface rounded-lg border border-border p-4 shadow-xs">
        <h3 className="text-xs font-semibold text-foreground mb-3">
          {t('priceRange') || 'Price'}
        </h3>
        <div className="space-y-1">
          {[
            { id: 'all', label: t('all') || 'All Prices' },
            { id: 'under500', label: t('priceUnder500') || 'Under ₹500' },
            { id: '500to1500', label: t('price500to1000') || '₹500 - ₹1,500' },
            { id: 'above1500', label: t('priceAbove1000') || 'Above ₹1,500' },
          ].map((pr) => (
            <button
              key={pr.id}
              onClick={() => { setPriceRange(pr.id as any); setFiltersOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors min-h-[44px] cursor-pointer ${
                priceRange === pr.id
                  ? 'bg-surface-muted text-primary border border-border'
                  : 'text-foreground-muted hover:bg-surface-muted'
              }`}
            >
              <span>{pr.label}</span>
              {priceRange === pr.id && <Check className="w-4 h-4 text-primary" />}
            </button>
          ))}
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
              {t('allProducts') || 'All Products'}
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted mt-1">
              {t('ourProductsSub') || 'Authentic goods direct from verified Indian manufacturers. One trusted brand per category.'}
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
                  <strong className="text-primary font-semibold">{filteredProducts.length}</strong>
                  <span className="hidden sm:inline"> {t('items') || 'products available'}</span>
                </div>

                <div className="flex items-center gap-2 min-w-0">
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

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    aria-label="Sort products"
                    className="px-2.5 py-2 rounded-lg border border-border text-xs font-medium text-foreground bg-surface focus:border-primary outline-none max-w-[9.5rem] lg:max-w-none min-h-[44px]"
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

            {isLoading ? (
              <ProductGridSkeleton count={8} />
            ) : filteredProducts.length === 0 ? (
              <div className="bg-surface rounded-lg border border-border p-10 text-center space-y-4 shadow-xs">
                <div className="w-14 h-14 rounded-lg bg-surface-muted flex items-center justify-center mx-auto border border-border">
                  <svg className="w-7 h-7 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filteredProducts.map((prod) => (
                  <div key={prod.id} className="h-full">
                    <ProductCard product={prod} />
                  </div>
                ))}
              </div>
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
                onClick={handleClearFilters}
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

export default function ProductsClient({
  initialProducts,
}: {
  initialProducts: CatalogProduct[];
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ProductsScreenContent initialProducts={initialProducts} />
    </Suspense>
  );
}
