"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { getProducts } from '@/lib/api/products';
import type { ProductWithVariants } from '@/lib/api/products';
import { ProductEditModal } from '@/components/admin/ProductEditModal';
import { Search, Plus, Pencil, Eye, Droplets, Package, Cylinder, CupSoda, GlassWater, Loader2, LayoutGrid, List, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api/client';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';

import { categoryColors } from '@/lib/constants/categories';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTable } from '@/components/admin/AdminTable';

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
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [editingProduct, setEditingProduct] = useState<ProductWithVariants | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Progressive scroll blur for category pills
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [categoriesList]);

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
      {/* Standard Admin Header */}
      <AdminHeader
        title="Products"
        subtitle={`${filtered.length} products shown ${category !== 'All' ? `in "${category}"` : 'in catalogue'}`}
        onRefresh={fetchProductList}
        isRefreshing={isLoading}
        actions={
          <>
            <button 
              onClick={() => router.push('/admin/products/approvals')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-[12px] font-bold text-[13px] transition-all border border-success/30 text-success bg-success-bg hover:bg-success-bg cursor-pointer"
            >
              Review Approvals
            </button>
            <button
              onClick={() => router.push('/admin/products/add')}
              className="flex items-center gap-2 px-4 py-2 rounded-[12px] font-bold text-[13px] text-white transition-all active:scale-95 cursor-pointer shadow-xs bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Add Product
            </button>
          </>
        }
      />

      <div className="px-6 md:px-10 py-5 flex flex-col gap-4">
        {/* Category Filter with Progressive Overflow Blur */}
        <div className="relative w-full overflow-hidden">
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-[#F5F6F5] dark:from-black to-transparent z-10 pointer-events-none transition-opacity" />
          )}
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-2 overflow-x-auto no-scrollbar py-1 items-center"
          >
            {categoriesList.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={`whitespace-nowrap h-8 px-3.5 rounded-full text-[12px] font-bold transition-all shrink-0 cursor-pointer flex items-center justify-center border active:scale-95 ${
                  category === cat
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-surface border-border text-foreground-muted hover:text-foreground hover:bg-surface-muted'
                }`}
              >
                {cat === 'All' ? 'All Categories' : cat}
              </button>
            ))}
          </div>
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[#F5F6F5] dark:from-black to-transparent z-10 pointer-events-none transition-opacity" />
          )}
        </div>

        {/* Unified Search, Filter Dropdowns & View Mode (Edit #36) */}
        <div className="bg-surface rounded-2xl border border-border p-3 sm:p-3.5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Top row on mobile / Left on desktop: Search bar with View Mode Switcher */}
          <div className="flex items-center gap-2 w-full lg:max-w-md">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-foreground-muted" strokeWidth={2} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products by title, category..."
                className="w-full pl-10 pr-8 h-10 rounded-xl text-xs font-medium outline-none transition-all bg-surface border border-border text-foreground placeholder:text-foreground-muted focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Switcher pinned beside search on mobile */}
            <div className="flex items-center rounded-xl p-0.5 border border-border bg-surface shadow-2xs h-10 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`h-8.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  viewMode === 'table' ? 'bg-primary text-white shadow-xs' : 'text-foreground-muted hover:text-foreground'
                }`}
                title="Table View (Default)"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`h-8.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  viewMode === 'grid' ? 'bg-primary text-white shadow-xs' : 'text-foreground-muted hover:text-foreground'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
          </div>

          {/* Bottom row on mobile (2 equal-width columns) / Right on desktop: Status & Sort dropdowns */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full lg:w-auto">
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="h-10 px-3 rounded-xl text-xs font-semibold outline-none border border-border bg-surface shadow-2xs text-foreground cursor-pointer focus:border-primary w-full sm:w-auto"
            >
              <option value="All">All Status</option>
              <option value="Active">Active Live</option>
              <option value="Draft">Draft</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="h-10 px-3 rounded-xl text-xs font-semibold outline-none border border-border bg-surface shadow-2xs text-foreground cursor-pointer focus:border-primary w-full sm:w-auto"
            >
              <option value="Name A-Z">Sort: Name (A-Z)</option>
              <option value="Price L-H">Sort: Price (Low → High)</option>
              <option value="Price H-L">Sort: Price (High → Low)</option>
            </select>
          </div>
        </div>

        {/* Products Table / Grid View */}
        {viewMode === 'table' ? (
          <AdminTable
            columns={[
              { header: 'Product' },
              { header: 'Category' },
              { header: 'Price / Unit' },
              { header: 'Stock Units' },
              { header: 'Channel' },
              { header: 'Status' },
              { header: 'Actions', align: 'right' },
            ]}
            isLoading={isLoading}
            isEmpty={!isLoading && filtered.length === 0}
            emptyIcon={Package}
            emptyTitle="No products found"
            emptyDescription={category !== 'All' ? `No products matching category "${category}".` : 'No products in catalogue.'}
          >
            {filtered.map((product) => {
              const catStyle = categoryColors(product.category);
              const variant = product.product_variants?.[0];
              const stock = variant?.stock || 0;
              return (
                <tr
                  key={product.id}
                  className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
                  onClick={() => {
                    setEditingProduct(product);
                    setIsEditModalOpen(true);
                  }}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image_url || PLACEHOLDER_PRODUCT_IMAGE}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded-[10px] border border-border/80 shrink-0"
                      />
                      <div className="min-w-0 max-w-[280px]">
                        <span className="font-bold text-[13px] text-foreground block truncate">
                          {product.name}
                        </span>
                        {product.description && (
                          <span className="text-[11px] text-foreground-muted block truncate" title={product.description}>
                            {product.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap min-w-[150px]">
                    <span
                      className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border inline-block whitespace-nowrap shadow-2xs"
                      style={{
                        background: catStyle.bg,
                        color: catStyle.color,
                        borderColor: `${catStyle.color}40`,
                      }}
                    >
                      {product.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-[13px] text-foreground whitespace-nowrap">
                    {t('currency')}{variant?.price || 0}
                    {variant?.weight && <span className="text-xs font-normal text-foreground-muted ml-1">/ {variant.weight}</span>}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      stock < 10 
                        ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300' 
                        : 'bg-surface-muted text-foreground border-border/70'
                    }`}>
                      {stock} in stock
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {product.seller_id ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300">
                        Seller Partner
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                        Platform Direct
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full border ${
                      product.is_active 
                        ? 'text-emerald-900 bg-emerald-100 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' 
                        : 'text-foreground-muted bg-surface-muted border-border/70'
                    }`}>
                      {product.is_active ? 'Active' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProduct(product);
                        setIsEditModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg hover:bg-surface-muted text-primary cursor-pointer transition-colors"
                      title="Edit Product"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </AdminTable>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 rounded-[16px] animate-pulse"
                style={{ background: 'var(--color-surface-container-lowest)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="w-12 h-12 text-foreground-muted mb-3" />
            <p className="font-bold text-[16px] text-foreground">No products found</p>
            <p className="text-xs text-foreground-muted mt-1">
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
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide z-10"
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
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-surface/95 shadow-md flex items-center justify-center opacity-90 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 z-10 hover:bg-surface text-primary cursor-pointer"
                      title={product.seller_id ? "View Seller Product (Read-Only)" : "Edit Product"}
                    >
                      {product.seller_id ? (
                        <Eye className="w-3.5 h-3.5 text-foreground-muted" />
                      ) : (
                        <Pencil className="w-3.5 h-3.5" strokeWidth={2.5} />
                      )}
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
                      <span className="text-xs font-bold tracking-wide uppercase px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--color-surface-container)', color: catStyle.color }}>
                        {product.category}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {product.seller_id && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                            Seller
                          </span>
                        )}
                        <span className={`text-xs font-bold uppercase ${product.is_active ? 'text-success' : 'text-foreground-muted'}`}>
                          {product.is_active ? 'Active' : 'Draft'}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-bold text-[15px] leading-snug line-clamp-1 mt-1"
                      style={{ color: 'var(--color-on-surface)' }}>
                      {product.name}
                    </h3>

                    <p className="text-[12px] line-clamp-1 mt-0.5"
                      style={{ color: 'var(--color-on-surface-variant)' }}>
                      {product.description || 'Fresh daily dairy product'}
                    </p>

                    <div className="mt-3 pt-3 flex items-center justify-between"
                      style={{ borderTop: '1px solid rgba(195,201,187,0.25)' }}>
                      <div>
                        <span className="font-semibold text-[16px]" style={{ color: 'var(--color-primary)' }}>
                          {t('currency')}{product.product_variants?.[0]?.price || 0}
                        </span>
                        {product.product_variants?.[0]?.weight && (
                          <span className="text-xs ml-1 font-medium" style={{ color: 'var(--color-on-surface-variant)' }}>
                            / {product.product_variants[0].weight}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded-md"
                        style={{
                          background: (product.product_variants?.[0]?.stock || 0) < 10 ? '#ffdcc7' : 'var(--color-surface-container)',
                          color: (product.product_variants?.[0]?.stock || 0) < 10 ? 'var(--warning)' : 'var(--color-on-surface-variant)',
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <AdminProductsContent />
    </Suspense>
  );
}
