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
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
            </select>
            
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2.5 rounded-xl text-xs font-semibold bg-surface border border-border text-foreground outline-none cursor-pointer"
            >
              <option value="Name A-Z">Name A-Z</option>
              <option value="Price L-H">Price L-H</option>
              <option value="Price H-L">Price H-L</option>
            </select>
          </div>
        </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-64 rounded-xl animate-pulse bg-surface border border-border" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-surface border border-border rounded-xl">
            <Package className="w-10 h-10 text-foreground-muted opacity-40 mb-2" />
            <p className="font-bold text-sm text-foreground">No products found</p>
            <p className="text-xs text-foreground-muted mt-0.5">
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
                    
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProduct(product);
                        setIsEditModalOpen(true);
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-surface/90 border border-border shadow-2xs flex items-center justify-center text-foreground-muted hover:text-primary hover:bg-surface transition-all active:scale-95 z-10 cursor-pointer"
                      title="Quick Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
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
                    </div>

                    <div className="mt-3 pt-2.5 flex items-center justify-between border-t border-border/60">
                      <div>
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
                          ? 'bg-warning-bg text-warning border-warning/20' 
                          : 'bg-success-bg text-success border-success/20'
                      }`}>
                        {stock} in stock
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
      <div className="flex flex-col min-h-screen items-center justify-center pt-20 px-6 bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <AdminProductsContent />
    </Suspense>
  );
}
