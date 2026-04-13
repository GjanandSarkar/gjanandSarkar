"use client";

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { getProducts } from '@/lib/api/products';
import type { ProductWithVariants } from '@/lib/api/products';
import { Search, Plus, Pencil, Droplets, Package, Cylinder, CupSoda, GlassWater, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const categoryIcons: Record<string, any> = {
  'Milk': Droplets,
  'Paneer': Package,
  'Ghee': Cylinder,
  'Buttermilk': CupSoda,
  'Curd': Package,
  'Lassi': GlassWater,
};

const categoryColors: Record<string, { bg: string; color: string }> = {
  'Milk':       { bg: '#e8f4fd', color: '#4a90d9' },
  'Paneer':     { bg: '#fff8e6', color: '#c78c2e' },
  'Ghee':       { bg: '#fef5ec', color: '#d4712a' },
  'Buttermilk': { bg: '#eaf6ef', color: '#3b8a55' },
  'Curd':       { bg: '#fff8e6', color: '#c78c2e' },
  'Lassi':      { bg: '#e8f4fd', color: '#4a90d9' },
};

export default function AdminProductsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    getProducts({ activeOnly: false }).then(data => {
      setProducts(data);
      setIsLoading(false);
    });
  }, []);

  const categories = ['All', 'Milk', 'Paneer', 'Ghee', 'Buttermilk', 'Curd', 'Lassi'];
  const filtered = products.filter(p => {
    const matchCat = category === 'All' || p.category === category;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-6 md:px-10 pt-6 pb-5 flex items-center justify-between"
        style={{ background: 'var(--color-surface-container-lowest)' }}>
        <div>
          <h1 className="font-extrabold text-[24px] tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
            Products
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-outline)' }}>
            {products.length} products in catalogue
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] font-bold text-[13px] text-white transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #3f6530, #577f46)',
            boxShadow: '0 4px 12px rgba(63, 101, 48, 0.25)',
          }}>
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Add Product
        </button>
      </div>

      <div className="px-6 md:px-10 py-5 flex flex-col gap-5">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: 'var(--color-outline)' }} strokeWidth={2} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-3 rounded-[12px] text-[14px] font-medium outline-none transition-all"
              style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface)' }}
              onFocus={e => { e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 1.5px rgba(63,101,48,0.22)'; }}
              onBlur={e => { e.target.style.background = 'var(--color-surface-container)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className="whitespace-nowrap px-4 py-2.5 rounded-[12px] text-[12px] font-semibold transition-all shrink-0"
                style={category === cat ? {
                  background: 'linear-gradient(135deg, #3f6530, #577f46)',
                  color: 'white',
                  boxShadow: '0 3px 10px rgba(63, 101, 48, 0.25)',
                } : {
                  background: 'var(--color-surface-container)',
                  color: 'var(--color-on-surface-variant)',
                }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 rounded-[16px] animate-pulse"
                style={{ background: 'var(--color-surface-container-lowest)' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((product, i) => {
              const catStyle = categoryColors[product.category] || categoryColors['Milk'];
              return (
                <motion.div key={product.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: i * 0.04 }}
                  className="rounded-[16px] overflow-hidden group"
                  style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(195,201,187,0.3)' }}>

                  {/* Image area */}
                  <div className="h-36 relative flex items-center justify-center overflow-hidden"
                    style={{ background: catStyle.bg }}>
                    <img src={product.image_url || '/milk.png'} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90" />
                    <div className="absolute inset-0 bg-black/5" />
                    
                    {product.is_freshness_guarantee && (
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide z-10"
                        style={{ background: 'rgba(255,255,255,0.88)', color: 'var(--color-primary)' }}>
                        Fresh
                      </div>
                    )}
                    <button className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/85 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      style={{ color: 'var(--color-primary)' }}>
                      <Pencil className="w-3 h-3" strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-[14px] leading-tight" style={{ color: 'var(--color-on-surface)' }}>
                          {product.name}
                        </h3>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ background: catStyle.bg, color: catStyle.color }}>
                          {product.category}
                        </span>
                      </div>
                      {!product.is_active && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                          Inactive
                        </span>
                      )}
                    </div>

                    {/* Variants */}
                    <div className="flex flex-col gap-1.5 mt-3">
                      {product.product_variants?.map(v => (
                        <div key={v.id} className="flex justify-between items-center px-2.5 py-1.5 rounded-[8px]"
                          style={{ background: 'var(--color-surface-container-low)' }}>
                          <span className="text-[12px] font-medium" style={{ color: 'var(--color-on-surface-variant)' }}>
                            {v.weight}
                          </span>
                          <span className="font-bold text-[13px]" style={{ color: 'var(--color-primary)' }}>
                            {t('currency')}{v.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
