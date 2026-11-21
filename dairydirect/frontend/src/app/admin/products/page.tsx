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
<<<<<<< HEAD
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
=======
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 sm:px-8 pt-6 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Product Catalog
          </h1>
          <p className="text-xs text-foreground-muted mt-0.5">
            {filtered.length} products listed {category !== 'All' ? `in "${category}"` : 'across all aisles'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            type="button"
            onClick={() => router.push('/admin/products/approvals')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-border bg-surface hover:bg-surface-muted text-foreground transition-colors cursor-pointer"
          >
            Review Approvals
          </button>
          <button 
            type="button"
            onClick={() => router.push('/admin/products/add')} 
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      <div className="px-5 sm:px-8 py-5 flex flex-col gap-5">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products by name or category..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-foreground-muted"
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2.5 rounded-xl text-xs font-semibold bg-surface border border-border text-foreground outline-none cursor-pointer"
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
            >
              <option value="All">All Status</option>
              <option value="Active">Active Live</option>
              <option value="Draft">Draft</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
<<<<<<< HEAD
              className="h-10 px-3 rounded-xl text-xs font-semibold outline-none border border-border bg-surface shadow-2xs text-foreground cursor-pointer focus:border-primary w-full sm:w-auto"
=======
              className="flex-1 sm:flex-none px-3 py-2.5 rounded-xl text-xs font-semibold bg-surface border border-border text-foreground outline-none cursor-pointer"
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
            >
              <option value="Name A-Z">Sort: Name (A-Z)</option>
              <option value="Price L-H">Sort: Price (Low → High)</option>
              <option value="Price H-L">Sort: Price (High → Low)</option>
            </select>
          </div>
        </div>

<<<<<<< HEAD
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
=======
        {/* Category Pills Filter */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {categoriesList.map(cat => (
            <button 
              key={cat} 
              type="button"
              onClick={() => handleCategorySelect(cat)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer border ${
                category === cat
                  ? 'bg-primary text-white border-primary shadow-2xs font-bold'
                  : 'bg-surface text-foreground-muted border-border hover:text-foreground hover:bg-surface-muted'
              }`}
            >
              {cat === 'All' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {isLoading ? (
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-64 rounded-xl animate-pulse bg-surface border border-border" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
<<<<<<< HEAD
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="w-12 h-12 text-foreground-muted mb-3" />
            <p className="font-bold text-[16px] text-foreground">No products found</p>
            <p className="text-xs text-foreground-muted mt-1">
=======
          <div className="flex flex-col items-center justify-center py-20 text-center bg-surface border border-border rounded-xl">
            <Package className="w-10 h-10 text-foreground-muted opacity-40 mb-2" />
            <p className="font-bold text-sm text-foreground">No products found</p>
            <p className="text-xs text-foreground-muted mt-0.5">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
              {category !== 'All' ? `No products matching category "${category}".` : 'No products in catalogue.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((product, i) => {
              const defaultVariant = product.product_variants?.[0];
              const stock = defaultVariant?.stock ?? 0;
              return (
                <motion.div key={product.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                  className="rounded-xl overflow-hidden group bg-surface border border-border shadow-2xs hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  {/* Image area */}
                  <div className="h-36 relative flex items-center justify-center overflow-hidden bg-surface-muted/50 p-2">
                    <img 
                      src={product.image_url || PLACEHOLDER_PRODUCT_IMAGE} 
                      alt={product.name} 
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" 
                    />
                    
<<<<<<< HEAD
                    {product.is_freshness_guarantee && (
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide z-10"
                        style={{ background: 'rgba(255,255,255,0.88)', color: 'var(--color-primary)' }}>
                        Fresh
                      </div>
                    )}
=======
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProduct(product);
                        setIsEditModalOpen(true);
                      }}
<<<<<<< HEAD
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-surface/95 shadow-md flex items-center justify-center opacity-90 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 z-10 hover:bg-surface text-primary cursor-pointer"
                      title={product.seller_id ? "View Seller Product (Read-Only)" : "Edit Product"}
                    >
                      {product.seller_id ? (
                        <Eye className="w-3.5 h-3.5 text-foreground-muted" />
                      ) : (
                        <Pencil className="w-3.5 h-3.5" strokeWidth={2.5} />
                      )}
=======
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-surface/90 border border-border shadow-2xs flex items-center justify-center text-foreground-muted hover:text-primary hover:bg-surface transition-all active:scale-95 z-10 cursor-pointer"
                      title="Quick Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                    </button>
                  </div>

                  {/* Details */}
                  <div
                    className="p-3.5 cursor-pointer flex-1 flex flex-col justify-between"
                    onClick={() => {
                      setEditingProduct(product);
                      setIsEditModalOpen(true);
                    }}
                  >
<<<<<<< HEAD
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
=======
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-surface-muted text-foreground-muted border border-border">
                          {product.category}
                        </span>
                        <span className={`text-[10px] font-bold uppercase ${product.is_active ? 'text-primary' : 'text-slate-400'}`}>
                          {product.is_active ? 'Active' : 'Draft'}
                        </span>
                      </div>

                      <h3 className="font-semibold text-xs leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                    </div>

                    <div className="mt-3 pt-2.5 flex items-center justify-between border-t border-border/60">
                      <div>
<<<<<<< HEAD
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
=======
                        <span className="font-bold text-sm text-foreground">
                          ₹{defaultVariant?.price || 0}
                        </span>
                        {defaultVariant?.weight && (
                          <span className="text-[11px] ml-1 text-foreground-muted">
                            / {defaultVariant.weight}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        stock < 10 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {stock} in stock
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
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
<<<<<<< HEAD
      <div className="flex flex-col min-h-screen items-center justify-center pt-20 px-6" style={{ background: 'var(--color-surface)' }}>
=======
      <div className="flex flex-col min-h-screen items-center justify-center pt-20 px-6 bg-background">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <AdminProductsContent />
    </Suspense>
  );
}
