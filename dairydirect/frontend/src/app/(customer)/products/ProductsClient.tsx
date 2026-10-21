"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getProducts } from '@/lib/api/products';
import type { CatalogProduct } from '@/lib/types/catalog';
import { ProductCard } from '@/components/shared/ProductCard';
import { 
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { ProductGridSkeleton } from '@/components/shared/Skeletons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

const PRICE_PRESETS = [
  { id: 'all', label: 'All Prices' },
  { id: 'under500', label: 'Under ₹500' },
  { id: '500to1500', label: '₹500 - ₹1,500' },
  { id: 'above1500', label: 'Above ₹1,500' },
] as const;

type PriceRangeId = (typeof PRICE_PRESETS)[number]['id'];

function ProductsScreenContent({ initialProducts }: { initialProducts: CatalogProduct[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const initialSearch = searchParams.get('search') || searchParams.get('q') || '';

  const [products, setProducts] = useState<CatalogProduct[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(initialProducts.length === 0);
  
  // Filtering & Sorting State
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc'>('featured');
  const [priceRange, setPriceRange] = useState<PriceRangeId>('all');

  useEffect(() => {
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
    else setActiveCategory('All');

    const q = searchParams.get('search') || searchParams.get('q');
    if (q !== null) setSearchQuery(q);
    else setSearchQuery('');
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category filter (matched from CategoryNavBar or query params)
        const prodCat = (p.category || '').toLowerCase();
        const activeCat = (activeCategory || 'All').toLowerCase();

        let matchCat = activeCat === 'all';
        if (!matchCat) {
          if (prodCat === activeCat) {
            matchCat = true;
          } else if (activeCat.includes('dairy') || activeCat.includes('essentials')) {
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
    setSearchQuery('');
    setPriceRange('all');
    setSortBy('featured');
    if (searchParams.get('category') || searchParams.get('search') || searchParams.get('q')) {
      router.push('/products');
    }
  };

  const isFiltered = activeCategory !== 'All' || Boolean(searchQuery) || priceRange !== 'all' || sortBy !== 'featured';

  return (
    <div className="min-h-screen bg-background text-foreground py-4 sm:py-6 px-4 sm:px-6 lg:px-8 transition-colors duration-150">
      <div className="max-w-[1440px] mx-auto space-y-4">

        {/* ── Products Header & Toolbar ── */}
        <div className="-mx-4 px-4 py-3 sm:mx-0 sm:px-4 sm:py-3.5 rounded-none border-x-0 border-y sm:rounded-2xl sm:border bg-surface border-border/80 shadow-2xs space-y-2.5 transition-colors duration-150">
          
          {/* Top Row: Count & Badges (Left) + Sort Dropdown & Reset (Right) */}
          <div className="flex items-center justify-between gap-2.5 flex-wrap sm:flex-nowrap">
            
            {/* Left: Product Count + Active Category / Search Filter Tag */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
              <div className="text-xs sm:text-sm font-bold text-foreground whitespace-nowrap">
                Showing <strong className="text-primary">{filteredProducts.length}</strong> products
              </div>

              {/* Active Category Filter Tag if set */}
              {activeCategory !== 'All' && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-xs font-bold shrink-0">
                  <span>{activeCategory}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory('All');
                      router.push('/products');
                    }}
                    className="hover:opacity-75 cursor-pointer"
                    aria-label="Remove category filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {/* Search Query Tag if set */}
              {Boolean(searchQuery) && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface-muted text-foreground text-xs font-semibold border border-border shrink-0">
                  <span className="truncate max-w-[100px] sm:max-w-none">&quot;{searchQuery}&quot;</span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="hover:opacity-75 cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {/* Desktop / Tablet Inline Price Filter Presets */}
              <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-border/60">
                {PRICE_PRESETS.map((preset) => {
                  const isSelected = priceRange === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setPriceRange(preset.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-white shadow-2xs font-bold'
                          : 'bg-surface hover:bg-surface-muted text-foreground-muted hover:text-foreground border border-border/70'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Sort Dropdown + Reset Action */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <div className="w-32 sm:w-40">
                <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                  <SelectTrigger className="h-8 sm:h-9 text-xs">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isFiltered && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                  title="Reset all filters"
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>

          </div>

          {/* Bottom Row on Phone: Full-Width Price Range Selector */}
          <div className="flex sm:hidden items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-border/50 -mx-1 px-1">
            <span className="text-[11px] font-bold text-foreground-muted shrink-0 mr-0.5">Price:</span>
            {PRICE_PRESETS.map((preset) => {
              const isSelected = priceRange === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setPriceRange(preset.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-white font-bold shadow-2xs'
                      : 'bg-surface-muted text-foreground-muted hover:text-foreground border border-border/70'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

        </div>

        {/* ── Main Products Grid (Full-Width, Clean, Non-Jagged) ── */}
        <main>
          {isLoading ? (
            <ProductGridSkeleton count={10} />
          ) : filteredProducts.length === 0 ? (
            <div className="bg-surface rounded-2xl border border-border p-8 sm:p-12 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-surface-muted flex items-center justify-center mx-auto text-muted">
                <X className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-foreground">
                No products found matching your selection
              </h3>
              <p className="text-xs text-foreground-muted max-w-sm mx-auto">
                Try resetting your filters or browsing all store products.
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary-hover transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
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
  );
}

export function ProductsClient({ initialProducts }: { initialProducts: CatalogProduct[] }) {
  return (
    <Suspense fallback={<ProductGridSkeleton count={10} />}>
      <ProductsScreenContent initialProducts={initialProducts} />
    </Suspense>
  );
}

export default ProductsClient;
