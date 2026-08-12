"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { getProducts, deleteProduct } from '@/lib/api/products';
import type { ProductWithVariants } from '@/lib/api/products';
import { getCategories, Category } from '@/lib/api/categories';
import { getCategoryStyle } from '@/lib/categories';
import { 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  Package, 
  Loader2, 
  Filter, 
  ArrowUpDown, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Tags, 
  SlidersHorizontal,
  ChevronDown,
  Layers,
  IndianRupee,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function AdminProductsPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Active' | 'Draft'>('All');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'newest'>('newest');

  // Custom Dropdown Open States
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState<ProductWithVariants | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setIsStatusOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      const [prodsData, catsData] = await Promise.all([
        getProducts({ activeOnly: false, forceRefresh }).catch(() => []),
        getCategories({ activeOnly: false }).catch(() => [])
      ]);
      setProducts(prodsData);
      setCategoriesList(catsData);
    } catch (err) {
      console.error('Failed to load products catalogue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: products.length };
    products.forEach(p => {
      const cat = p.category?.trim();
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  // Combined categories: 'All' + database categories + any orphan product categories
  const allCategoryPills = useMemo(() => {
    const list: Array<{ name: string; image_url?: string; count: number }> = [
      { name: 'All', count: products.length }
    ];

    // Database categories
    categoriesList.forEach(c => {
      list.push({
        name: c.name,
        image_url: c.image_url,
        count: categoryCounts[c.name] || 0
      });
    });

    // Check if any product has a category not in categoriesList
    products.forEach(p => {
      const pCat = p.category?.trim();
      if (pCat && !list.some(item => item.name.toLowerCase() === pCat.toLowerCase())) {
        list.push({
          name: pCat,
          count: categoryCounts[pCat] || 0
        });
      }
    });

    return list;
  }, [categoriesList, products, categoryCounts]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      const matchCat = selectedCategory === 'All' || (p.category || '').toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch = !search.trim() || 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        (p.category || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(search.toLowerCase());
      
      const matchStatus = 
        selectedStatus === 'All' ? true : 
        selectedStatus === 'Active' ? p.is_active : 
        !p.is_active;

      return matchCat && matchSearch && matchStatus;
    });

    result.sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      
      const priceA = a.product_variants?.[0]?.price || 0;
      const priceB = b.product_variants?.[0]?.price || 0;
      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;

      const stockA = a.product_variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
      const stockB = b.product_variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
      if (sortBy === 'stock_asc') return stockA - stockB;

      // newest first
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

    return result;
  }, [products, selectedCategory, search, selectedStatus, sortBy]);

  // Quick Delete Handler
  const handleDeleteProduct = async (product: ProductWithVariants) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) return;

    setIsDeletingId(product.id);
    try {
      const res = await deleteProduct(product.id, true);
      if (res.success) {
        setProducts(prev => prev.filter(p => p.id !== product.id));
        setFeedback({ type: 'success', message: `Product "${product.name}" removed from catalog.` });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to delete product.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error deleting product.' });
    } finally {
      setIsDeletingId(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedStatus('All');
    setSortBy('newest');
  };

  const hasActiveFilters = search.trim() !== '' || selectedCategory !== 'All' || selectedStatus !== 'All' || sortBy !== 'newest';

  // Stats calculation
  const totalActive = products.filter(p => p.is_active).length;
  const totalDraft = products.length - totalActive;

  const sortLabels: Record<string, string> = {
    newest: 'Newest First',
    name_asc: 'Name (A to Z)',
    name_desc: 'Name (Z to A)',
    price_asc: 'Price: Low to High',
    price_desc: 'Price: High to Low',
    stock_asc: 'Low Stock First',
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8]">
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="px-6 md:px-10 pt-6 pb-5 bg-white border-b border-gray-200/80 shadow-xs sticky top-0 z-30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-7xl mx-auto">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                <Package className="w-3 h-3 text-emerald-700" />
                Catalog Management
              </span>
              <span className="text-xs font-semibold text-gray-400">•</span>
              <span className="text-xs font-semibold text-gray-500">
                {products.length} {products.length === 1 ? 'product' : 'products'} total
              </span>
            </div>
            <h1 className="font-black text-2xl text-[#0f3e26] tracking-tight">
              Products Catalogue
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData(true)}
              disabled={isLoading}
              className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-2xs cursor-pointer"
              title="Refresh catalog"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => router.push('/admin/products/add')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] text-white transition-all active:scale-95 cursor-pointer shadow-md"
              style={{
                background: 'linear-gradient(135deg, #0f3e26, #1b5e3a)',
                boxShadow: '0 4px 14px rgba(15, 62, 38, 0.25)',
              }}
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span>Add Product</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Body Container ───────────────────────────────── */}
      <div className="px-6 md:px-10 py-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Feedback Alert */}
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="opacity-70 hover:opacity-100 text-xs font-bold"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {/* ── Filters Container Card ────────────────────────────── */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/90 shadow-sm space-y-4">
          {/* Row 1: Search + Status Dropdown + Sort Dropdown */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* 1. Search Bar */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by title, category, or description..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0f3e26] focus:ring-2 focus:ring-emerald-900/10 outline-none transition-all shadow-2xs"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 2. Status Dropdown */}
            <div ref={statusDropdownRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsStatusOpen(!isStatusOpen);
                  setIsSortOpen(false);
                }}
                className={`w-full sm:w-auto min-w-[140px] flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  isStatusOpen
                    ? 'border-[#0f3e26] ring-2 ring-emerald-900/10 bg-white text-gray-900'
                    : selectedStatus !== 'All'
                    ? 'border-emerald-300 bg-emerald-50/60 text-emerald-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    selectedStatus === 'Active' ? 'bg-emerald-500' :
                    selectedStatus === 'Draft' ? 'bg-amber-500' : 'bg-gray-400'
                  }`} />
                  <span>
                    {selectedStatus === 'All' ? 'All Status' : selectedStatus}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isStatusOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isStatusOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-2xl border border-gray-200 shadow-xl p-1.5 z-40 space-y-1"
                  >
                    {[
                      { id: 'All', label: 'All Status', count: products.length, dot: 'bg-gray-400' },
                      { id: 'Active', label: 'Active Items', count: totalActive, dot: 'bg-emerald-500' },
                      { id: 'Draft', label: 'Draft / Hidden', count: totalDraft, dot: 'bg-amber-500' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setSelectedStatus(st.id as any);
                          setIsStatusOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          selectedStatus === st.id
                            ? 'bg-emerald-50 text-emerald-950 border border-emerald-100'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                          <span>{st.label}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">({st.count})</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3. Sort Dropdown */}
            <div ref={sortDropdownRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsSortOpen(!isSortOpen);
                  setIsStatusOpen(false);
                }}
                className={`w-full sm:w-auto min-w-[170px] flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  isSortOpen
                    ? 'border-[#0f3e26] ring-2 ring-emerald-900/10 bg-white text-gray-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                  <span className="truncate">{sortLabels[sortBy]}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isSortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-2xl border border-gray-200 shadow-xl p-1.5 z-40 space-y-1"
                  >
                    {[
                      { id: 'newest', label: 'Newest First' },
                      { id: 'name_asc', label: 'Name (A to Z)' },
                      { id: 'name_desc', label: 'Name (Z to A)' },
                      { id: 'price_asc', label: 'Price: Low to High' },
                      { id: 'price_desc', label: 'Price: High to Low' },
                      { id: 'stock_asc', label: 'Low Stock First' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSortBy(s.id as any);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          sortBy === s.id
                            ? 'bg-emerald-50 text-emerald-950 border border-emerald-100'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Clear Filters Button (If Active) */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
                title="Reset all filters"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Row 2: Category Filter Pills */}
          <div className="pt-3 border-t border-gray-100 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 shrink-0 mr-1 flex items-center gap-1">
              <Tags className="w-3.5 h-3.5 text-gray-400" />
              Category:
            </span>

            {allCategoryPills.map((pill) => {
              const isSelected = selectedCategory.toLowerCase() === pill.name.toLowerCase();
              return (
                <button
                  key={pill.name}
                  type="button"
                  onClick={() => setSelectedCategory(pill.name)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'bg-[#0f3e26] text-white shadow-md'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200/80 hover:border-gray-300'
                  }`}
                >
                  {pill.image_url ? (
                    <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 border border-white/20">
                      <img
                        src={pill.image_url}
                        alt={pill.name}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                      />
                    </div>
                  ) : null}
                  <span>{pill.name}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-gray-200/70 text-gray-600'
                  }`}>
                    {pill.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Products Grid ─────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-80 rounded-3xl bg-white border border-gray-200 animate-pulse p-4 space-y-4"
              >
                <div className="h-44 rounded-2xl bg-gray-100" />
                <div className="h-4 w-3/4 bg-gray-100 rounded-md" />
                <div className="h-3 w-1/2 bg-gray-100 rounded-md" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-200/90 shadow-sm space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#0f3e26] flex items-center justify-center mx-auto border border-emerald-100">
              <Package className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-gray-900 text-base">
                No products match your criteria
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {hasActiveFilters
                  ? 'Try adjusting your search terms, changing the category, or clearing active filters.'
                  : 'Your catalogue is empty. Click "+ Add Product" to publish your first item.'}
              </p>
            </div>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            ) : (
              <button
                onClick={() => router.push('/admin/products/add')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f3e26] text-white text-xs font-bold hover:bg-[#144f31] transition-all cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Product</span>
              </button>
            )}
          </div>
        ) : (
          /* Products Grid Cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((product, i) => {
              const catStyle = getCategoryStyle(product.category);
              const mainVariant = product.product_variants?.[0];
              const totalStock = (product.product_variants || []).reduce((acc, v) => acc + (v.stock || 0), 0);
              const isDeleting = isDeletingId === product.id;

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  className="bg-white rounded-3xl overflow-hidden border border-gray-200/90 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col group relative"
                >
                  {/* Top Image Preview Container */}
                  <div className="h-48 relative overflow-hidden bg-gray-50 border-b border-gray-100 flex items-center justify-center">
                    <img
                      src={product.image_url || '/milk.png'}
                      alt={product.name}
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/milk.png';
                      }}
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 opacity-60 group-hover:opacity-40 transition-opacity pointer-events-none" />

                    {/* Top Left Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                      {product.is_freshness_guarantee && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-[#0f3e26] text-[10px] font-black uppercase tracking-wider shadow-sm">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          100% Fresh
                        </span>
                      )}

                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm ${
                        product.is_active ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                      }`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Top Right Quick Action Buttons */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/products/edit/${product.id}`);
                        }}
                        className="w-8 h-8 rounded-full bg-white/95 hover:bg-white text-gray-700 hover:text-[#0f3e26] shadow-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
                        title="Edit Product"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProduct(product);
                        }}
                        disabled={isDeleting}
                        className="w-8 h-8 rounded-full bg-white/95 hover:bg-rose-50 text-gray-400 hover:text-rose-600 shadow-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-50"
                        title="Delete Product"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Product Details Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      {/* Category Badge */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                          {product.category || 'Uncategorized'}
                        </span>

                        {/* Stock status indicator */}
                        <span className={`text-[10px] font-bold ${
                          totalStock > 20 ? 'text-emerald-700' :
                          totalStock > 0 ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {totalStock > 0 ? `${totalStock} in stock` : 'Out of stock'}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-extrabold text-sm text-gray-900 group-hover:text-[#0f3e26] transition-colors line-clamp-1">
                        {product.name}
                      </h3>

                      {/* Description */}
                      {product.description && (
                        <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Pricing & Variants Section */}
                    <div className="pt-3 border-t border-gray-100 space-y-2">
                      {/* Main Variant Highlight */}
                      {mainVariant && (
                        <div className="flex items-baseline justify-between">
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-black text-gray-900 tracking-tight">
                              ₹{mainVariant.price}
                            </span>
                            <span className="text-xs text-gray-500 font-semibold">
                              / {mainVariant.weight}
                            </span>
                          </div>

                          {(product.product_variants?.length || 0) > 1 && (
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                              +{product.product_variants!.length - 1} sizes
                            </span>
                          )}
                        </div>
                      )}

                      {/* Edit Button */}
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            router.push(`/admin/products/edit/${product.id}`);
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-gray-50 hover:bg-[#0f3e26] text-gray-700 hover:text-white border border-gray-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs group/btn"
                        >
                          <Pencil className="w-3.5 h-3.5 text-gray-400 group-hover/btn:text-white" />
                          <span>Edit Product</span>
                        </button>
                      </div>
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
