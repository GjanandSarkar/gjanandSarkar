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
import { motion, AnimatePresence } from 'framer-motion';
import { ProductGridSkeleton } from '@/components/shared/Skeletons';

function ProductsScreenContent({ initialProducts }: { initialProducts: CatalogProduct[] }) {
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

  // Was a hand-maintained 16-item array that disagreed with the navigation
  // and with the admin product form. Now derived from the single taxonomy.
  const defaultCategories = ['All', ...VISIBLE_CATEGORY_NAMES];

  const categories = useMemo(() => {
    const list = Array.from(
      new Set(
        products
          .map((p) => p.category)
          .filter((c): c is string => typeof c === 'string' && c.length > 0)
      )
    );
    return Array.from(new Set([...defaultCategories, ...list]));
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
    <div className="space-y-6">
      <div className="bg-surface rounded-2xl border border-border/90 p-4 shadow-2xs">
        <h3 className="text-xs font-black text-foreground mb-3 uppercase tracking-wider">
          Categories
        </h3>
        <div className="space-y-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setFiltersOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                activeCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-primary text-on-primary shadow-2xs'
                  : 'text-foreground-muted hover:bg-surface-muted'
              }`}
            >
              <span>{cat}</span>
              {activeCategory.toLowerCase() === cat.toLowerCase() && (
                <Check className="w-4 h-4" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* State-origin filter is gated: it needs a multi-state catalogue to
          mean anything, and today every product ships from one dairy
          partner. See lib/config/launch.ts. */}
      {isSectionEnabled('shopByState') && (
        <div className="bg-surface rounded-2xl border border-border/90 p-4 shadow-2xs">
          <h3 className="text-xs font-black text-foreground mb-3 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-secondary" />
            <span>Shop by State Origin</span>
          </h3>
          <div className="space-y-1">
            {states.map((st) => (
              <button
                key={st}
                onClick={() => { setActiveState(st); setFiltersOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  activeState === st
                    ? 'bg-secondary text-on-secondary shadow-2xs'
                    : 'text-foreground-muted hover:bg-surface-muted'
                }`}
              >
                <span>{st}</span>
                {activeState === st && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-surface rounded-2xl border border-border/90 p-4 shadow-2xs">
        <h3 className="text-xs font-black text-foreground mb-3 uppercase tracking-wider">
          Price
        </h3>
        <div className="space-y-1">
          {[
            { id: 'all', label: 'All Prices' },
            { id: 'under500', label: 'Under \u20b9500' },
            { id: '500to1500', label: '\u20b9500 - \u20b91,500' },
            { id: 'above1500', label: 'Above \u20b91,500' },
          ].map((pr) => (
            <button
              key={pr.id}
              onClick={() => { setPriceRange(pr.id as any); setFiltersOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                priceRange === pr.id
                  ? 'bg-success-bg text-success'
                  : 'text-foreground-muted hover:bg-surface-muted'
              }`}
            >
              <span>{pr.label}</span>
              {priceRange === pr.id && <Check className="w-4 h-4 text-success" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-10">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-6">

        {/* Page heading. Deliberately small on mobile: this used to be a tall
            gradient hero that, combined with the filter sidebar stacking
            above the grid, meant a phone user had to scroll roughly two
            screens before seeing a single product. */}
        <div className="mb-4 lg:mb-6">
          <div className="lg:bg-gradient-to-r lg:from-[var(--primary)] lg:to-[var(--primary-hover)] lg:text-on-primary lg:rounded-2xl lg:p-8 lg:shadow-md">
            <h1 className="text-xl lg:text-3xl font-black tracking-tight text-foreground lg:text-on-primary">
              Shop all products
            </h1>
            <p className="hidden lg:block text-sm text-on-primary/80 mt-1">
              Lab-tested Gir A2 dairy, delivered direct from our verified partner.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">

          {/* Desktop-only sidebar. On mobile these same controls live in the
              bottom sheet below, so they cannot push the grid down. */}
          <aside className="hidden lg:block">{filterControls}</aside>

          <main className="space-y-4 min-w-0">

            {/* Compact toolbar. Sticky on mobile so filtering and sorting stay
                reachable without scrolling back to the top of a long grid. */}
            <div className="sticky top-0 z-20 -mx-4 px-4 py-2.5 bg-background/95 backdrop-blur-sm border-b border-border lg:static lg:mx-0 lg:px-4 lg:py-4 lg:bg-surface lg:rounded-2xl lg:border lg:border-border/90 lg:shadow-2xs lg:backdrop-blur-none">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-bold text-foreground shrink-0">
                  <strong className="text-primary">{filteredProducts.length}</strong>
                  <span className="hidden sm:inline"> products</span>
                </div>

                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => setFiltersOpen(true)}
                    className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border-hover bg-surface text-xs font-bold text-foreground active:scale-95 transition-transform"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="ml-0.5 w-4 h-4 rounded-full bg-primary text-on-primary text-[10px] font-black grid place-items-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    aria-label="Sort products"
                    className="px-2.5 py-2 rounded-xl border border-border-hover text-xs font-bold text-foreground bg-surface focus:border-primary outline-none max-w-[9.5rem] lg:max-w-none"
                  >
                    <option value="featured">Featured</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>

                  {activeFilterCount > 0 && (
                    <button
                      onClick={handleClearFilters}
                      className="hidden lg:flex text-xs font-bold text-error hover:underline items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {isLoading ? (
              <ProductGridSkeleton count={8} />
            ) : filteredProducts.length === 0 ? (
              <div className="bg-surface rounded-2xl border border-border/90 p-10 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-surface-muted flex items-center justify-center mx-auto">
                  <svg className="w-7 h-7 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <h3 className="text-base font-black text-foreground">
                  No products match your filters
                </h3>
                <p className="text-sm text-foreground-muted max-w-sm mx-auto">
                  Try clearing your search or choosing a different category.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-5 py-2.5 bg-primary text-on-primary text-sm font-bold rounded-xl shadow-sm hover:bg-primary-hover transition-colors"
                >
                  Reset filters
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

      {/* Mobile filter sheet. */}
      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFiltersOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.22 }}
              className="fixed inset-x-0 bottom-0 z-[70] lg:hidden bg-background rounded-t-2xl max-h-[85dvh] flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <h2 className="text-base font-black text-foreground">Filters</h2>
                <div className="flex items-center gap-3">
                  {activeFilterCount > 0 && (
                    <button
                      onClick={handleClearFilters}
                      className="text-xs font-bold text-error"
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    onClick={() => setFiltersOpen(false)}
                    aria-label="Close filters"
                    className="w-9 h-9 grid place-items-center rounded-full bg-surface-muted text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {filterControls}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
