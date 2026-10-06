"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { getProducts } from '@/lib/api/products';
import type { CatalogProduct } from '@/lib/types/catalog';
import { CATEGORY_NAMES } from '@/lib/constants/categories';
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
  const defaultCategories = ['All', ...CATEGORY_NAMES];

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

  return (
    <div className="min-h-screen bg-[#fafaf8] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1440px] mx-auto">
        
        {/* Top Header Banner */}
        <div className="mb-6 bg-gradient-to-r from-[#0f3e26] via-[#144f31] to-[#0f3e26] rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-[#c88a23] text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Authentic Bharat Heritage</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Direct-from-Farm & Artisan Marketplace
            </h1>
            <p className="text-xs text-gray-200 mt-1">
              Explore 100% lab-tested Gir A2 dairy, cold-pressed oils, handlooms, and state specialities.
            </p>
          </div>
        </div>

        {/* Layout Grid: Sidebar Filters + Main Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          
          {/* Left Sidebar Filters */}
          <aside className="space-y-6">
            
            {/* Categories Filter */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs">
              <h3 className="text-xs font-black text-gray-900 mb-3 uppercase tracking-wider">
                Categories
              </h3>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      activeCategory.toLowerCase() === cat.toLowerCase()
                        ? 'bg-[#0f3e26] text-white shadow-2xs'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>{cat}</span>
                    {activeCategory.toLowerCase() === cat.toLowerCase() && (
                      <Check className="w-3.5 h-3.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* State Origin Filter */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs">
              <h3 className="text-xs font-black text-gray-900 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#c88a23]" />
                <span>Shop by State Origin</span>
              </h3>
              <div className="space-y-1">
                {states.map((st) => (
                  <button
                    key={st}
                    onClick={() => setActiveState(st)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      activeState === st
                        ? 'bg-[#c88a23] text-white shadow-2xs'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>{st}</span>
                    {activeState === st && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs">
              <h3 className="text-xs font-black text-gray-900 mb-3 uppercase tracking-wider">
                Price Filter
              </h3>
              <div className="space-y-1">
                {[
                  { id: 'all', label: 'All Prices' },
                  { id: 'under500', label: 'Under ₹500' },
                  { id: '500to1500', label: '₹500 - ₹1,500' },
                  { id: 'above1500', label: 'Above ₹1,500' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPriceRange(p.id as any)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      priceRange === p.id
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>{p.label}</span>
                    {priceRange === p.id && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                  </button>
                ))}
              </div>
            </div>

          </aside>

          {/* Right Product Grid */}
          <main className="space-y-4">
            
            {/* Top Toolbar (Sort + Count + Active Filter Tags) */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs font-bold text-gray-700">
                Showing <strong className="text-[#0f3e26]">{filteredProducts.length}</strong> authentic products
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 font-bold">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-800 bg-white focus:border-[#0f3e26] outline-none"
                >
                  <option value="featured">Featured / Popular</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>

                {(activeCategory !== 'All' || activeState !== 'All' || searchQuery || priceRange !== 'all') && (
                  <button
                    onClick={handleClearFilters}
                    className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              /* Was eight blank pulsing rectangles of a fixed 18rem height,
                 which did not match the real card and so still shifted the
                 layout on load. ProductGridSkeleton mirrors the card exactly. */
              <ProductGridSkeleton count={8} />
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200/90 p-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto"><svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
                <h3 className="text-base font-black text-gray-900">
                  No products found matching your filters
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Try clearing your search term or selecting a different category or state.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-5 py-2.5 bg-[#0f3e26] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#144f31] transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 reveal">
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
    </div>
  );
}

export default function ProductsClient({
  initialProducts,
}: {
  initialProducts: CatalogProduct[];
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafaf8]" />}>
      <ProductsScreenContent initialProducts={initialProducts} />
    </Suspense>
  );
}
