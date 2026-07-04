"use client";

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '@/lib/i18n';
import { getProducts } from '@/lib/api/products';
import type { ProductWithVariants } from '@/lib/api/products';
import { ProductCard } from '@/components/shared/ProductCard';
import { useStore } from '@/store/useStore';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { EmptyState } from '@/components/discovery/EmptyState';
import { CategoryRail } from '@/components/discovery/CategoryRail';
import { FilterBar } from '@/components/discovery/FilterBar';

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, when: 'beforeChildren' } },
};
const gridItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
};

export default function ProductsScreen() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtering state
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [freshnessFilter, setFreshnessFilter] = useState(false);

  const cart = useStore((s) => s.cart);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    getProducts({ activeOnly: true }).then((data) => {
      setProducts(data);
      setIsLoading(false);
    });
  }, []);

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category)));
  }, [products]);

  const filteredProducts = useMemo(() =>
    products.filter((p) => {
      const matchCat = activeCategory === 'All' || p.category === activeCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFreshness = freshnessFilter ? p.is_freshness_guarantee : true;
      return matchCat && matchSearch && matchFreshness;
    }),
  [products, activeCategory, searchQuery, freshnessFilter]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setFreshnessFilter(false);
    setActiveCategory('All');
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 pt-4 bg-surface">
      <div className="md:grid md:grid-cols-[180px_1fr] lg:grid-cols-[220px_1fr] max-w-7xl mx-auto w-full px-5 md:px-8 gap-6 lg:gap-8">
        
        {/* Left Column / Mobile Top: Category Rail */}
        <aside className="mb-6 md:mb-0 md:sticky md:top-24 md:h-[calc(100vh-120px)] md:overflow-y-auto no-scrollbar">
          <CategoryRail 
            categories={uniqueCategories}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
            isLoading={isLoading}
          />
        </aside>

        {/* Right Column: Filters and Grid */}
        <main className="flex-1 flex flex-col">
          <FilterBar 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            freshnessFilter={freshnessFilter}
            onFreshnessToggle={() => setFreshnessFilter(!freshnessFilter)}
            resultCount={filteredProducts.length}
          />

          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-[260px] rounded-[16px] animate-pulse bg-surface-container-low" />
                ))}
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {filteredProducts.length > 0 ? (
                  <motion.div
                    key={activeCategory + searchQuery + freshnessFilter}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                    variants={container} initial="hidden" animate="show" exit={{ opacity: 0 }}>
                    {filteredProducts.map((product) => (
                      <motion.div key={product.id} variants={gridItem} className="h-full">
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <EmptyState 
                      type={searchQuery ? 'search' : 'category'} 
                      onClear={handleClearFilters} 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </main>
      </div>

    </div>
  );
}
