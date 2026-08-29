"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tags, Plus, Pencil, Trash2, Package, Loader2, X, ExternalLink, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api/client';
import { uploadImageToImageKit } from '@/lib/api/imagekit';

export type Category = {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  image_url?: string | null;
  icon_name?: string | null;
  sort_order?: number;
  product_count?: number;
};

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Delete Confirmation Modal State
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [categoriesData, productsData] = await Promise.all([
        api.categories.get().catch(() => ({ categories: [] })),
        api.products.get({ activeOnly: false }).catch(() => ({ products: [] })),
      ]);

      const products = productsData.products || [];
      const rawCategories = categoriesData.categories || [];

      const categoriesWithLiveCount = rawCategories.map((cat: Category) => {
        const cNameLower = (cat.name || '').toLowerCase().trim();
        const count = products.filter((p: any) => {
          if (p.category_id && String(p.category_id) === String(cat.id)) return true;
          if (!p.category) return false;
          const pCatLower = String(p.category).toLowerCase().trim();
          return (
            pCatLower === cNameLower ||
            pCatLower.includes(cNameLower) ||
            cNameLower.includes(pCatLower)
          );
        }).length;

        return {
          ...cat,
          product_count: Math.max(cat.product_count || 0, count),
        };
      });

      setCategories(categoriesWithLiveCount);
    } catch (e: any) {
      console.error('Failed to load categories:', e);
      setError('Failed to load categories. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleNavigateToCategoryProducts = (catName: string) => {
    router.push(`/admin/products?category=${encodeURIComponent(catName)}`);
  };

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setImageUrl('');
    setSortOrder(String(categories.length + 1));
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name || '');
    setDescription(cat.description || '');
    setImageUrl(cat.image_url || '');
    setSortOrder(String(cat.sort_order ?? 0));
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      image_url: imageUrl.trim() || null,
      sort_order: parseInt(sortOrder) || 0,
    };

    try {
      if (editingCategory) {
        // Edit category
        await api.categories.update(editingCategory.id, payload);
      } else {
        // Add new category
        await api.categories.create(payload);
      }
      setIsModalOpen(false);
      await fetchCategories();
    } catch (err: any) {
      console.error('Save category error:', err);
      setError(err.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    setIsSubmitting(true);
    try {
      await api.categories.delete(deletingCategory.id);
      setDeletingCategory(null);
      await fetchCategories();
    } catch (err: any) {
      console.error('Delete category error:', err);
      setError('Failed to delete category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div
        className="px-6 md:px-10 pt-6 pb-5 flex items-center justify-between"
        style={{ background: 'var(--color-surface-container-lowest)', borderBottom: '1px solid rgba(195,201,187,0.2)' }}
      >
        <div>
          <h1 className="font-extrabold text-[24px] tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
            Categories
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-outline)' }}>
            Manage product taxonomy ({categories.length} total)
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] font-bold text-[13px] text-white transition-all active:scale-95 cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #0c3c26, #114e32)',
            boxShadow: '0 4px 12px rgba(12, 60, 38, 0.25)',
          }}
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          <span>New Category</span>
        </button>
      </div>

      <div className="px-6 md:px-10 py-5">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-[#0c3c26]" />
          </div>
        ) : error && categories.length === 0 ? (
          <div className="text-center py-16 text-red-600 font-semibold">{error}</div>
        ) : (
          <div
            className="rounded-[16px] overflow-hidden shadow-xs"
            style={{ border: '1px solid rgba(195,201,187,0.3)', background: 'var(--color-surface-container-lowest)' }}
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ background: 'var(--color-surface-container-low)' }}>
                  <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-outline)' }}>
                    Category Name
                  </th>
                  <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-outline)' }}>
                    Products
                  </th>
                  <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-right" style={{ color: 'var(--color-outline)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, idx) => (
                  <tr
                    key={cat.id || cat.name}
                    style={{ borderBottom: idx !== categories.length - 1 ? '1px solid rgba(195,201,187,0.3)' : 'none' }}
                    className="hover:bg-black/[0.02] transition-colors"
                  >
                    <td className="px-5 py-4 cursor-pointer" onClick={() => handleNavigateToCategoryProducts(cat.name)}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center bg-[#e6f2ec] text-[#0c3c26] shrink-0 font-bold overflow-hidden">
                          {cat.image_url ? (
                            <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover rounded-[10px]" />
                          ) : (
                            <Tags className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-[14px] block hover:text-[#0c3c26] transition-colors" style={{ color: 'var(--color-on-surface)' }}>
                            {cat.name}
                          </span>
                          {cat.description && (
                            <span className="text-[11px] text-muted block max-w-xs truncate">{cat.description}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 cursor-pointer" onClick={() => handleNavigateToCategoryProducts(cat.name)}>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-[#0c3c26]" />
                        <span className="font-bold text-[13px] hover:underline text-[#0c3c26]">
                          {cat.product_count ?? 0} items
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleNavigateToCategoryProducts(cat.name)}
                          className="p-2 rounded-full hover:bg-black/5 transition-colors cursor-pointer text-[#0c3c26]"
                          title="View Products in this category"
                          type="button"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(cat)}
                          className="p-2 rounded-full hover:bg-black/5 transition-colors cursor-pointer text-[#0c3c26]"
                          title="Edit Category"
                          type="button"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingCategory(cat)}
                          className="p-2 rounded-full hover:bg-black/5 transition-colors cursor-pointer text-red-600"
                          title="Delete Category"
                          type="button"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-extrabold text-[#0c3c26] mb-1">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <p className="text-xs text-gray-500 mb-5">
                {editingCategory ? 'Update category details' : 'Create a new category for products'}
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Fresh Milk"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-[#0c3c26] text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief category description..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-[#0c3c26] text-sm font-medium resize-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Category Image
                    </label>
                    <label className="text-[11px] font-bold text-[#0c3c26] hover:underline cursor-pointer flex items-center gap-1">
                      {isUploadingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />}
                      <span>Upload to ImageKit</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploadingImage(true);
                          setError('');
                          const res = await uploadImageToImageKit(file, '/categories');
                          setIsUploadingImage(false);
                          if (res.success && res.url) {
                            setImageUrl(res.url);
                          } else {
                            setError(res.error || 'Failed to upload category image');
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://ik.imagekit.io/... or paste URL"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 outline-none focus:border-[#0c3c26] text-sm font-medium"
                  />
                  {imageUrl && (
                    <div className="mt-2 w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                      <img src={imageUrl} alt="Category preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 outline-none focus:border-[#0c3c26] text-sm font-medium"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-[#0c3c26] hover:bg-[#114e32] disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {editingCategory ? 'Save Changes' : 'Create Category'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setDeletingCategory(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-gray-900 mb-1">Delete Category?</h3>
              <p className="text-xs text-gray-500 mb-5">
                Are you sure you want to delete <strong className="text-gray-800">{deletingCategory.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingCategory(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
