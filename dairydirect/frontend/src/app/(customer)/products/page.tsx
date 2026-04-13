"use client";

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '@/lib/i18n';
import { getProducts } from '@/lib/api/products';
import type { ProductWithVariants } from '@/lib/api/products';
import { ProductCard } from '@/components/shared/ProductCard';
import { useStore } from '@/store/useStore';
import { Search, ShoppingBag, ArrowRight, Leaf, Droplets, Package, FlaskConical, Activity, GlassWater } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence, Variants } from 'framer-motion';

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, when: 'beforeChildren' } },
};
const gridItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
};

const CATEGORIES = [
  { id: 'All',        label: 'All',        Icon: Leaf },
  { id: 'Milk',       label: 'Milk',       Icon: Droplets },
  { id: 'Paneer',     label: 'Paneer',     Icon: Package },
  { id: 'Ghee',       label: 'Ghee',       Icon: FlaskConical },
  { id: 'Buttermilk', label: 'Buttermilk', Icon: Activity },
  { id: 'Curd',       label: 'Curd',       Icon: Package },
  { id: 'Lassi',      label: 'Lassi',      Icon: GlassWater },
];

export default function ProductsScreen() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const cart = useStore((s) => s.cart);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Derive cart total from local store (approximated from variant selections)
  // We don't have prices in the cart store, so show count + navigate to cart
  const cartTotal = useStore((s) => {
    // Can't calculate without product data here, use 0 as placeholder until cart page
    return 0;
  });

  useEffect(() => {
    getProducts({ activeOnly: true }).then((data) => {
      setProducts(data);
      setIsLoading(false);
    });
  }, []);

  const filteredProducts = useMemo(() =>
    products.filter((p) => {
      const matchCat = activeCategory === 'All' || p.category === activeCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    }),
  [products, activeCategory, searchQuery]);

  return (
    <div className="flex flex-col min-h-full pb-4">
      {/* Header */}
      <div className="sticky top-0 z-30 glass-surface">
        <div className="px-5 md:px-8 pt-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Leaf className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} strokeWidth={2.5} />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-primary)' }}>
                  {t('search')}
                </span>
              </div>
              <h1 className="font-extrabold text-[24px] tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
                {activeCategory === 'All'
                  ? `${t('all')} ${t('navProducts')}`
                  : t(activeCategory.toLowerCase() as any)}
              </h1>
            </div>
            <span className="text-[13px] font-semibold px-3 py-1 rounded-full"
              style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)' }}>
              {filteredProducts.length} {t('items')}
            </span>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: 'var(--color-outline)' }} strokeWidth={2} />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-3 rounded-[12px] text-[14px] font-medium outline-none transition-all"
              style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface)' }}
              placeholder={t('searchPlaceholder') as string}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={(e) => {
                e.target.style.background = 'var(--color-surface-container-lowest)';
                e.target.style.boxShadow = '0 0 0 1.5px rgba(63, 101, 48, 0.22)';
              }}
              onBlur={(e) => {
                e.target.style.background = 'var(--color-surface-container)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
            {CATEGORIES.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setActiveCategory(id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all duration-200 shrink-0"
                style={activeCategory === id ? {
                  background: 'linear-gradient(135deg, #3f6530, #577f46)',
                  color: 'white',
                  boxShadow: '0 3px 10px rgba(63, 101, 48, 0.25)',
                } : {
                  background: 'var(--color-surface-container-low)',
                  color: 'var(--color-on-surface-variant)',
                }}>
                <Icon className="w-3 h-3" strokeWidth={2} />
                {t(id.toLowerCase() as any) || label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-px opacity-25" style={{ background: 'var(--color-outline-variant)' }} />
      </div>

      {/* Grid */}
      <div className="px-5 md:px-8 pt-5 flex-1">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[240px] rounded-[16px] animate-pulse"
                style={{ background: 'var(--color-surface-container-low)' }} />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {filteredProducts.length > 0 ? (
              <motion.div
                key={activeCategory + searchQuery}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                variants={container} initial="hidden" animate="show" exit={{ opacity: 0 }}>
                {filteredProducts.map((product) => (
                  <motion.div key={product.id} variants={gridItem} className="h-full">
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 text-4xl"
                  style={{ background: 'var(--color-surface-container-low)' }}>🔍</div>
                <h2 className="font-bold text-[20px] mb-2" style={{ color: 'var(--color-on-surface)' }}>
                  {t('nothingFound')}
                </h2>
                <p className="text-sm max-w-[220px] leading-relaxed" style={{ color: 'var(--color-outline)' }}>
                  {t('tryDifferent')}
                </p>
                <button onClick={() => { setActiveCategory('All'); setSearchQuery(''); }}
                  className="mt-6 px-6 py-2.5 rounded-full text-sm font-semibold"
                  style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-primary)' }}>
                  {t('showAll')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Sticky Cart Footer (mobile) */}
      <AnimatePresence>
        {cartItemsCount > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="fixed z-40 left-4 right-4 md:hidden"
            style={{ bottom: 'calc(68px + env(safe-area-inset-bottom, 0px))' }}>
            <Link href="/cart">
              <div className="flex items-center justify-between rounded-[16px] px-5 py-4"
                style={{
                  background: 'linear-gradient(135deg, #3f6530, #577f46)',
                  boxShadow: '0 8px 24px rgba(63, 101, 48, 0.35)',
                }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[8px] bg-white/20 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-white" strokeWidth={2} />
                  </div>
                  <p className="text-white font-bold text-[15px]">
                    {cartItemsCount} {t('items')}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-white font-bold text-[13px]">
                  {t('viewCart')} <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
