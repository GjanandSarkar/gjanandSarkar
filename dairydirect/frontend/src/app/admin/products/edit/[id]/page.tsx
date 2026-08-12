"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import {
  getProductById,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} from '@/lib/api/products';
import { getCategories, Category } from '@/lib/api/categories';
import { CategoryModal } from '@/components/admin/CategoryModal';
import { CustomCategorySelect } from '@/components/admin/CustomCategorySelect';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  UploadCloud,
  Save,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  IndianRupee,
  Sparkles,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface VariantForm {
  id?: string;
  weight: string;
  price: string;
  cost_price: string;
  original_price: string;
  stock: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;
  const { t } = useTranslation();

  // Categories from database
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Loading & submission state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [permanentDelete, setPermanentDelete] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isFreshnessGuarantee, setIsFreshnessGuarantee] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [variants, setVariants] = useState<VariantForm[]>([]);

  // Image upload
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 1. Fetch categories
  const loadCategories = async () => {
    setIsCategoriesLoading(true);
    try {
      const cats = await getCategories({ activeOnly: false });
      setCategoriesList(cats);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // 2. Fetch product data
  useEffect(() => {
    if (!productId) return;
    setIsLoading(true);
    getProductById(productId)
      .then((data) => {
        if (!data) {
          setError('Product not found in database.');
          return;
        }
        setName(data.name || '');
        setCategory(data.category || '');
        setDescription(data.description || '');
        setImageUrl(data.image_url || '');
        setImagePreview(data.image_url || null);
        setIsFreshnessGuarantee(data.is_freshness_guarantee ?? true);
        setIsActive(data.is_active ?? true);
        setVariants(
          (data.product_variants || []).map((v) => ({
            id: v.id,
            weight: v.weight || '',
            price: v.price?.toString() || '',
            cost_price: (v as any).cost_price?.toString() || '',
            original_price: v.original_price?.toString() || '',
            stock: v.stock !== undefined ? v.stock.toString() : '0',
          }))
        );
      })
      .catch((err) => {
        setError(err.message || 'Failed to load product details.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [productId]);

  // Variants handlers
  const addVariant = () => {
    setVariants([
      ...variants,
      { weight: '', price: '', cost_price: '', original_price: '', stock: '50' },
    ]);
  };

  const updateVariant = (index: number, field: keyof VariantForm, value: string) => {
    const next = [...variants];
    next[index] = { ...next[index], [field]: value };
    setVariants(next);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  // Image handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl('');
  };

  // Submit updates
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }

    if (!category.trim()) {
      setError('Category is required.');
      return;
    }

    const validVariants = variants.filter((v) => v.weight.trim() && v.price.trim());
    if (validVariants.length === 0) {
      setError('At least one variant with weight and selling price is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        const uploadRes = await uploadProductImage(imageFile);
        if (uploadRes.error || !uploadRes.url) {
          throw new Error(uploadRes.error || 'Failed to upload product image');
        }
        finalImageUrl = uploadRes.url;
      }

      const res = await updateProduct(productId, {
        name: name.trim(),
        category: category.trim(),
        description: description.trim() || undefined,
        image_url: finalImageUrl || undefined,
        is_freshness_guarantee: isFreshnessGuarantee,
        is_active: isActive,
        variants: validVariants.map((v) => {
          const p = parseFloat(v.price) || 0;
          const cp = parseFloat(v.cost_price) || 0;
          return {
            id: v.id,
            weight: v.weight.trim(),
            price: p,
            cost_price: cp > 0 ? cp : Math.round(p * 0.75),
            original_price: v.original_price ? parseFloat(v.original_price) : undefined,
            stock: parseInt(v.stock, 10) || 0,
          };
        }),
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to update product');
      }

      setSuccess('Product changes saved successfully!');
      setTimeout(() => {
        router.push('/admin/products');
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Failed to update product. Please check your inputs.');
      setIsSubmitting(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');
    setSuccess('');

    try {
      const res = await deleteProduct(productId, permanentDelete);
      if (!res.success) {
        throw new Error(res.error || 'Failed to delete product');
      }

      setSuccess(res.message || 'Product removed from catalog.');
      setTimeout(() => {
        router.push('/admin/products');
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#0f3e26]" />
        <p className="text-xs font-bold text-gray-500">Loading product details from database...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8]">
      {/* ── Top Sticky Header ───────────────────────────────────── */}
      <div className="px-6 md:px-10 pt-6 pb-5 bg-white border-b border-gray-200/80 shadow-xs sticky top-0 z-30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-2xl text-[#0f3e26] tracking-tight">Edit Product</h1>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  ID: {productId.slice(0, 8)}...
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Update catalog pricing, size variants, media assets and visibility status
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isSubmitting || isDeleting}
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSubmitting || isDeleting}
              className="px-6 py-2 rounded-xl bg-[#0f3e26] hover:bg-[#144f31] text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Form Body ──────────────────────────────────────── */}
      <div className="px-6 md:px-10 py-8 max-w-5xl w-full mx-auto space-y-6">
        {/* Feedback Alerts */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-3 shadow-xs"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-3 shadow-xs"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Basic Information */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0f3e26] flex items-center justify-center font-bold">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900">Basic Information</h2>
                <p className="text-xs text-gray-500 font-medium">Product title, taxonomy category and summary</p>
              </div>
            </div>

            {/* Product Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Pure Gir Cow A2 Milk, Vedic Bilona Ghee..."
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0f3e26] focus:ring-2 focus:ring-emerald-900/10 outline-none transition-all"
                required
              />
            </div>

            {/* Category Selector with Only Added Categories */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                  Category <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-xs font-bold text-[#0f3e26] hover:text-[#1b5e3a] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Category</span>
                </button>
              </div>

              <CustomCategorySelect
                categories={categoriesList}
                value={category}
                onChange={(val) => setCategory(val)}
                onAddNewCategory={() => setIsCategoryModalOpen(true)}
                isLoading={isCategoriesLoading}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                  Description
                </label>
                <span className="text-[10px] text-gray-400 font-semibold">Optional</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed product highlights, health benefits, Vedic preparation method..."
                rows={3}
                className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50/50 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0f3e26] focus:ring-2 focus:ring-emerald-900/10 outline-none transition-all resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Card 2: Product Image */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0f3e26] flex items-center justify-center font-bold">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-gray-900">Product Image & Media</h2>
                  <p className="text-xs text-gray-500 font-medium">Update high-resolution packaging photography</p>
                </div>
              </div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">PNG, JPG, WebP</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 p-5 rounded-2xl bg-gray-50/70 border border-gray-200 border-dashed">
              <div className="w-24 h-24 rounded-2xl bg-white border border-gray-200 shadow-2xs flex items-center justify-center overflow-hidden shrink-0 relative group">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-gray-300">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-800 hover:bg-gray-100 hover:border-gray-400 transition-colors cursor-pointer shadow-2xs">
                    <UploadCloud className="w-4 h-4 text-[#0f3e26]" />
                    <span>{imagePreview ? 'Change Product Image' : 'Select Product Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>

                  {imagePreview && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-gray-500">
                  {imageFile 
                    ? `Selected file: ${imageFile.name} (${(imageFile.size / 1024).toFixed(1)} KB)`
                    : 'Recommended size: 800x800px square photo with clear white or transparent background.'}
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Variants, Pricing & Stock Matrix */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0f3e26] flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-gray-900">Variants & Pricing Matrix</h2>
                  <p className="text-xs text-gray-500 font-medium">Manage sizes, package weights, selling prices and warehouse stock</p>
                </div>
              </div>

              <button
                type="button"
                onClick={addVariant}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-[#0f3e26] hover:bg-[#0f3e26] hover:text-white border border-emerald-200 text-xs font-bold transition-all cursor-pointer shadow-2xs self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Variant</span>
              </button>
            </div>

            <div className="space-y-4">
              {variants.map((v, idx) => {
                const sellPrice = parseFloat(v.price) || 0;
                const costPrice = parseFloat(v.cost_price) || 0;
                const profit = sellPrice - costPrice;
                const marginPercent = sellPrice > 0 ? Math.round((profit / sellPrice) * 100) : 0;

                return (
                  <div
                    key={v.id || idx}
                    className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors space-y-4 shadow-2xs"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200/60">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#0f3e26] text-white text-[11px] font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-black text-gray-900 uppercase tracking-wide">
                          Variant {idx + 1} {v.weight ? `(${v.weight})` : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {sellPrice > 0 && costPrice > 0 && (
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                            profit >= 0
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border-rose-200'
                          }`}>
                            Margin: ₹{profit} ({marginPercent}%)
                          </span>
                        )}

                        {variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariant(idx)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove Variant"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Weight / Unit */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-600 block">
                          Weight / Unit <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={v.weight}
                          onChange={(e) => updateVariant(idx, 'weight', e.target.value)}
                          placeholder="e.g. 500 ml, 1 Litre, 1 kg"
                          className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                          required
                        />
                      </div>

                      {/* Selling Price */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-600 block">
                          Selling Price (₹) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            value={v.price}
                            onChange={(e) => updateVariant(idx, 'price', e.target.value)}
                            placeholder="e.g. 85"
                            className="w-full h-11 pl-8 pr-3 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                            required
                          />
                        </div>
                      </div>

                      {/* Cost Price */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-600 block">
                          Cost Price (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            value={v.cost_price}
                            onChange={(e) => updateVariant(idx, 'cost_price', e.target.value)}
                            placeholder="e.g. 60"
                            className="w-full h-11 pl-8 pr-3 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                          />
                        </div>
                      </div>

                      {/* Stock Quantity */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-600 block">
                          Stock Quantity
                        </label>
                        <input
                          type="number"
                          value={v.stock}
                          onChange={(e) => updateVariant(idx, 'stock', e.target.value)}
                          placeholder="e.g. 100"
                          className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 4: Product Attributes & Guarantees */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0f3e26] flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900">Product Settings & Guarantees</h2>
                <p className="text-xs text-gray-500 font-medium">Control freshness labels and store catalog visibility</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Freshness Guarantee */}
              <div 
                onClick={() => setIsFreshnessGuarantee(!isFreshnessGuarantee)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  isFreshnessGuarantee 
                    ? 'bg-emerald-50/60 border-emerald-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-black text-gray-900">Freshness Guarantee</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-snug">
                    Displays the "100% Fresh Farm Promise" badge to boost customer trust.
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                  isFreshnessGuarantee ? 'bg-[#0f3e26] border-[#0f3e26] text-white' : 'border-gray-300 bg-white'
                }`}>
                  {isFreshnessGuarantee && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              {/* Active Status */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                    Status
                  </label>
                  <p className="text-[11px] text-gray-400">
                    {isActive ? 'Active — Visible in customer shop and product catalogues' : 'Inactive — Hidden from store listings'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsActive(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsActive(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      !isActive
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Danger Zone (Delete Product) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-rose-900">Danger Zone</h2>
                  <p className="text-xs text-rose-600/80 font-medium">Remove or archive this product from your catalogue</p>
                </div>
              </div>

              {!showDeleteConfirm && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  Delete Product...
                </button>
              )}
            </div>

            {showDeleteConfirm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-4"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-extrabold text-rose-900">
                      Are you sure you want to delete "{name}"?
                    </p>
                    <p className="text-[11px] text-rose-700 leading-relaxed">
                      Choose whether to soft-archive (hide from catalogue while keeping past order records intact) or permanently delete.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-rose-200/70">
                  <label className="flex items-center gap-2.5 text-xs font-bold text-gray-800 cursor-pointer">
                    <input
                      type="radio"
                      name="deleteMode"
                      checked={!permanentDelete}
                      onChange={() => setPermanentDelete(false)}
                      className="text-rose-600 accent-rose-600"
                    />
                    <span>
                      <strong>Safe Archive (Recommended):</strong> Hides product from storefront and retains customer order history.
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs font-bold text-gray-800 cursor-pointer">
                    <input
                      type="radio"
                      name="deleteMode"
                      checked={permanentDelete}
                      onChange={() => setPermanentDelete(true)}
                      className="text-rose-600 accent-rose-600"
                    />
                    <span>
                      <strong>Permanent Delete:</strong> Removes product record entirely from database (will fail if orders reference it).
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDelete}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Confirm Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sticky Bottom Actions */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3 pb-12">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isSubmitting || isDeleting}
              className="px-6 py-3 rounded-2xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isDeleting}
              className="px-8 py-3 rounded-2xl bg-[#0f3e26] hover:bg-[#144f31] text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Inline Category Creation Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSaved={(newCat) => {
          setCategoriesList((prev) => {
            const exists = prev.some(
              (c) => c.id === newCat.id || c.name.toLowerCase() === newCat.name.toLowerCase()
            );
            return exists ? prev : [newCat, ...prev];
          });
          setCategory(newCat.name);
        }}
      />
    </div>
  );
}
