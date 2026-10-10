"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { getProducts } from '@/lib/api/products';
import type { ProductWithVariants } from '@/lib/api/products';
import { ProductEditModal } from '@/components/admin/ProductEditModal';
import { Search, Plus, Pencil, Droplets, Package, Cylinder, CupSoda, GlassWater, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api/client';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';

import { categoryColors } from '@/lib/constants/categories';

function AdminProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get('category') || 'All';

  const { t } = useTranslation();
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>(['All']);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(categoryFromUrl);
  const [status, setStatus] = useState('All'); // 'All' | 'Active' | 'Draft'
  const [sortBy, setSortBy] = useState('Name A-Z'); // 'Name A-Z' | 'Price L-H' | 'Price H-L'
  const [editingProduct, setEditingProduct] = useState<ProductWithVariants | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchProductList = () => {
    Promise.all([
      getProducts({ activeOnly: false }),
      api.categories.get().catch(() => ({ categories: [] })),
    ]).then(([productsData, categoriesData]) => {
      setProducts(productsData);
      const catNames = (categoriesData.categories || []).map((c: any) => c.name);
      const uniqueCats = Array.from(new Set(['All', ...catNames]));
      setCategoriesList(uniqueCats);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchProductList();
  }, []);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setCategory(cat);
    } else {
      setCategory('All');
    }
  }, [searchParams]);

  const handleCategorySelect = (catName: string) => {
    setCategory(catName);
    if (catName === 'All') {
      router.push('/admin/products');
    } else {
      router.push(`/admin/products?category=${encodeURIComponent(catName)}`);
    }
  };

  let filtered = products.filter(p => {
    const pCat = (p.category || '').toLowerCase().trim();
    const selCat = category.toLowerCase().trim();
    const matchCat = category === 'All' || category === 'All Categories' ||
      pCat === selCat ||
      pCat.includes(selCat) ||
      selCat.includes(pCat);

    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = status === 'All' ? true : (status === 'Active' ? p.is_active : !p.is_active);
    return matchCat && matchSearch && matchStatus;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'Name A-Z') return a.name.localeCompare(b.name);
    const priceA = a.product_variants?.[0]?.price || 0;
    const priceB = b.product_variants?.[0]?.price || 0;
    if (sortBy === 'Price L-H') return priceA - priceB;
    if (sortBy === 'Price H-L') return priceB - priceA;
    return 0;
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
            {filtered.length} products shown {category !== 'All' ? `in "${category}"` : 'in catalogue'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => router.push('/admin/products/approvals')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] font-bold text-[13px] transition-all border border-emerald-700/30 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 cursor-pointer"
          >
            Review Approvals
          </button>
          <button onClick={() => router.push('/admin/products/add')} className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] font-bold text-[13px] text-white transition-all active:scale-95 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #0c3c26, #114e32)',
              boxShadow: '0 4px 12px rgba(12, 60, 38, 0.25)',
            }}>
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Add Product
          </button>
        </div>
      </div>

      <div className="px-6 md:px-10 py-5 flex flex-col gap-5">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
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
          
          <div className="flex gap-2">
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="px-4 py-2.5 rounded-[12px] text-[13px] font-semibold outline-none border border-gray-200 cursor-pointer"
              style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface)' }}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
            </select>
            
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-4 py-2.5 rounded-[12px] text-[13px] font-semibold outline-none border border-gray-200 cursor-pointer"
              style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface)' }}
            >
              <option value="Name A-Z">Name A-Z</option>
              <option value="Price L-H">Price L-H</option>
              <option value="Price H-L">Price H-L</option>
            </select>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categoriesList.map(cat => (
            <button key={cat} onClick={() => handleCategorySelect(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-[12px] font-bold transition-all shrink-0 cursor-pointer ${
                category === cat
                  ? 'bg-[#0c3c26] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat === 'All' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 rounded-[16px] animate-pulse"
                style={{ background: 'var(--color-surface-container-lowest)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="w-12 h-12 text-gray-300 mb-3" />
            <p className="font-bold text-[16px] text-gray-800">No products found</p>
            <p className="text-xs text-gray-500 mt-1">
              {category !== 'All' ? `No products matching category "${category}".` : 'No products in catalogue.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((product, i) => {
              const catStyle = categoryColors(product.category);
              return (
                <motion.div key={product.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: i * 0.04 }}
                  className="rounded-[16px] overflow-hidden group"
                  style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(195,201,187,0.3)' }}>

                  {/* Image area */}
                  <div className="h-36 relative flex items-center justify-center overflow-hidden"
                    style={{ background: catStyle.bg }}>
                    <img src={product.image_url || PLACEHOLDER_PRODUCT_IMAGE} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90" />
                    <div className="absolute inset-0 bg-black/5" />
                    
                    {product.is_freshness_guarantee && (
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide z-10"
                        style={{ background: 'rgba(255,255,255,0.88)', color: 'var(--color-primary)' }}>
                        Fresh
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProduct(product);
                        setIsEditModalOpen(true);
                      }}
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 shadow-md flex items-center justify-center opacity-90 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 z-10 hover:bg-white text-primary cursor-pointer"
                      title="Edit Product"
                    >
                      <Pencil className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Details */}
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => {
                      setEditingProduct(product);
                      setIsEditModalOpen(true);
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--color-surface-container)', color: catStyle.color }}>
                        {product.category}
                      </span>
                      <span className={`text-[10px] font-bold uppercase ${product.is_active ? 'text-emerald-700' : 'text-gray-400'}`}>
                        {product.is_active ? 'Active' : 'Draft'}
                      </span>
                    </div>

                    <h3 className="font-bold text-[15px] leading-snug line-clamp-1 mt-1"
                      style={{ color: 'var(--color-on-surface)' }}>
                      {product.name}
                    </h3>

                    <p className="text-[12px] line-clamp-1 mt-0.5"
                      style={{ color: 'var(--color-outline)' }}>
                      {product.description || 'Fresh daily dairy product'}
                    </p>

                    <div className="mt-3 pt-3 flex items-center justify-between"
                      style={{ borderTop: '1px solid rgba(195,201,187,0.25)' }}>
                      <div>
                        <span className="font-extrabold text-[16px]" style={{ color: 'var(--color-primary)' }}>
                          {t('currency')}{product.product_variants?.[0]?.price || 0}
                        </span>
                        {product.product_variants?.[0]?.weight && (
                          <span className="text-[11px] ml-1 font-medium" style={{ color: 'var(--color-outline)' }}>
                            / {product.product_variants[0].weight}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold px-2 py-1 rounded-md"
                        style={{
                          background: (product.product_variants?.[0]?.stock || 0) < 10 ? '#ffdcc7' : 'var(--color-surface-container)',
                          color: (product.product_variants?.[0]?.stock || 0) < 10 ? '#774117' : 'var(--color-on-surface-variant)',
                        }}>
                        {product.product_variants?.[0]?.stock || 0} in stock
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <ProductEditModal
          product={editingProduct}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingProduct(null);
          }}
          onProductUpdated={() => {
            fetchProductList();
          }}
        />
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen items-center justify-center pt-20 px-6" style={{ background: 'var(--color-surface)' }}>
        <Loader2 className="w-8 h-8 animate-spin text-[#0c3c26]" />
      </div>
    }>
      <AdminProductsContent />
    </Suspense>
  );
}
