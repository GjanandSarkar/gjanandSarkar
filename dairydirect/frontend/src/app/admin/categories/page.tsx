"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getProducts } from '@/lib/api/products';
import { 
  getCategories, 
  deleteCategory, 
  Category 
} from '@/lib/api/categories';
import { CategoryModal } from '@/components/admin/CategoryModal';
import { 
  Tags, 
  Plus, 
  Pencil, 
  Trash2, 
  Package, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Search,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cats, products] = await Promise.all([
        getCategories(),
        getProducts({ activeOnly: false }).catch(() => [])
      ]);

      const counts: Record<string, number> = {};
      products.forEach(p => {
        const cat = p.category?.trim();
        if (cat) {
          counts[cat] = (counts[cat] || 0) + 1;
        }
      });

      setCategories(cats);
      setProductCounts(counts);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAddModal = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: Category) => {
    setSelectedCategory(cat);
    setIsModalOpen(true);
  };

  const handleCategorySaved = (savedCat: Category) => {
    setCategories(prev => {
      const exists = prev.some(c => c.id === savedCat.id);
      if (exists) {
        return prev.map(c => c.id === savedCat.id ? savedCat : c);
      }
      return [savedCat, ...prev];
    });
    setActionFeedback({
      type: 'success',
      message: `Category "${savedCat.name}" saved successfully!`
    });
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleDelete = async (cat: Category) => {
    const count = productCounts[cat.name] || 0;
    const confirmMessage = count > 0 
      ? `Category "${cat.name}" has ${count} product(s) associated with it. Are you sure you want to delete it?`
      : `Are you sure you want to delete category "${cat.name}"?`;

    if (!window.confirm(confirmMessage)) return;

    setDeletingId(cat.id);
    try {
      const res = await deleteCategory(cat.id);
      if (res.success) {
        setCategories(prev => prev.filter(c => c.id !== cat.id));
        setActionFeedback({
          type: 'success',
          message: `Category "${cat.name}" deleted successfully.`
        });
      } else {
        setActionFeedback({
          type: 'error',
          message: res.error || 'Failed to delete category.'
        });
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Error deleting category.'
      });
    } finally {
      setDeletingId(null);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div 
        className="px-6 md:px-10 pt-6 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ background: 'var(--color-surface-container-lowest)' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
              <Tags className="w-3 h-3 text-emerald-600" />
              Taxonomy Management
            </span>
          </div>
          <h1 className="font-extrabold text-[24px] tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
            Categories
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-outline)' }}>
            {categories.length} total categories configured
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData()}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-2xs cursor-pointer"
            title="Refresh categories"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Add Category Trigger */}
          <button 
            onClick={handleOpenAddModal} 
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[13px] text-white transition-all active:scale-95 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #0f3e26, #1b5e3a)',
              boxShadow: '0 4px 12px rgba(15, 62, 38, 0.25)',
            }}
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 md:px-10 py-5 space-y-4">
        {/* Feedback Alert */}
        {actionFeedback && (
          <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {actionFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span>{actionFeedback.message}</span>
            </div>
            <button 
              onClick={() => setActionFeedback(null)}
              className="text-xs font-bold opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories by name or description..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-900 focus:border-[#0f3e26] outline-none shadow-2xs"
          />
        </div>

        {/* Categories Table Container */}
        <div className="rounded-[16px] overflow-hidden shadow-2xs border border-gray-200 bg-white">
          {isLoading ? (
            <div className="p-16 text-center text-sm font-medium text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin text-[#0f3e26] mx-auto mb-3" />
              <span>Loading categories from database...</span>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-16 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#0f3e26] flex items-center justify-center mx-auto border border-emerald-100">
                <Tags className="w-7 h-7" />
              </div>
              <div className="max-w-xs mx-auto space-y-1">
                <p className="font-bold text-gray-900 text-sm">No categories found</p>
                <p className="text-xs text-gray-500">
                  {searchQuery ? 'No categories matched your search term.' : 'Click Add Category above to create your first category.'}
                </p>
              </div>
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f3e26] text-white text-xs font-bold hover:bg-[#144f31] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Category</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200">
                    <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-gray-500">Category</th>
                    <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-gray-500">Description</th>
                    <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-gray-500">Products in DB</th>
                    <th className="px-5 py-3.5 text-[11px] font-black uppercase tracking-wider text-right text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCategories.map((cat) => {
                    const count = productCounts[cat.name] || 0;
                    return (
                      <tr key={cat.id} className="hover:bg-emerald-50/30 transition-colors">
                        {/* 1. Category Image + Name */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs text-emerald-700 relative">
                              {cat.image_url ? (
                                <img
                                  src={cat.image_url}
                                  alt={cat.name}
                                  className="w-full h-full object-cover"
                                  crossOrigin="anonymous"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    const imgEl = e.currentTarget as HTMLElement;
                                    imgEl.style.display = 'none';
                                    const fallback = imgEl.parentElement?.querySelector('.category-fallback-icon');
                                    if (fallback) (fallback as HTMLElement).style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <span 
                                className={`category-fallback-icon items-center justify-center ${cat.image_url ? 'hidden' : 'flex'}`}
                              >
                                <Tags className="w-5 h-5 text-emerald-700" />
                              </span>
                            </div>
                            <div>
                              <span className="font-bold text-sm text-gray-900 block">
                                {cat.name}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                ID: {cat.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Description */}
                        <td className="px-5 py-4 max-w-xs">
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {cat.description || <span className="text-gray-400 italic">No description provided</span>}
                          </p>
                        </td>

                        {/* 3. Products count */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold text-xs text-gray-800">
                              {count} {count === 1 ? 'item' : 'items'}
                            </span>
                          </div>
                        </td>



                        {/* 5. Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/admin/products/add?category=${encodeURIComponent(cat.name)}`}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-[#0f3e26] hover:text-white text-emerald-900 border border-emerald-200 transition-colors flex items-center gap-1"
                              title={`Add product to ${cat.name}`}
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Product</span>
                            </Link>

                            <button
                              onClick={() => handleOpenEditModal(cat)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                              title="Edit Category"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDelete(cat)}
                              disabled={deletingId === cat.id}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer disabled:opacity-40"
                              title="Delete Category"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Category Creation / Edit Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={selectedCategory}
        onSaved={handleCategorySaved}
      />
    </div>
  );
}
