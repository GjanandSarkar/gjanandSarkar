"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { uploadProductImage, createProduct } from '@/lib/api/products';
import { getCategories, Category } from '@/lib/api/categories';
import { CategoryModal } from '@/components/admin/CategoryModal';
import { CustomCategorySelect } from '@/components/admin/CustomCategorySelect';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Loader2, 
  UploadCloud, 
  Tags, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Image as ImageIcon, 
  ShieldCheck, 
  Percent, 
  IndianRupee, 
  Package, 
  Sparkles,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface VariantForm {
  weight: string;
  price: string;
  cost_price: string;
  stock: string;
}

export default function AddProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategoryParam = searchParams.get('category') || '';
  const { t } = useTranslation();

  // Categories from database
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isFreshnessGuarantee, setIsFreshnessGuarantee] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // Variants state
  const [variants, setVariants] = useState<VariantForm[]>([
    { weight: '500 ml', price: '', cost_price: '', stock: '100' }
  ]);

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Status & modal states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // 1. Fetch only added categories from database
  const loadCategories = async () => {
    setIsCategoriesLoading(true);
    try {
      const cats = await getCategories({ activeOnly: false });
      setCategoriesList(cats);

      // Auto-select category: use query param, or first available added category
      if (initialCategoryParam && cats.some(c => c.name.toLowerCase() === initialCategoryParam.toLowerCase())) {
        const found = cats.find(c => c.name.toLowerCase() === initialCategoryParam.toLowerCase());
        if (found) setCategory(found.name);
      } else if (cats.length > 0) {
        setCategory(cats[0].name);
      } else {
        setCategory('');
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [initialCategoryParam]);

  // Variants management
  const addVariant = () => {
    setVariants([
      ...variants,
      { weight: '', price: '', cost_price: '', stock: '50' }
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

  // Image handling
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
  };

  // Submit product
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validations
    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }

    if (!category.trim()) {
      setError('Please select or create a category for this product.');
      return;
    }

    const validVariants = variants.filter(v => v.weight.trim() && v.price.trim());
    if (validVariants.length === 0) {
      setError('At least one variant with weight and selling price is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      let image_url = '';
      if (imageFile) {
        const uploadRes = await uploadProductImage(imageFile);
        if (uploadRes.error || !uploadRes.url) {
          throw new Error(uploadRes.error || 'Failed to upload product image');
        }
        image_url = uploadRes.url;
      }

      const payload = {
        name: name.trim(),
        category: category.trim(),
        description: description.trim() || undefined,
        image_url: image_url || undefined,
        is_freshness_guarantee: isFreshnessGuarantee,
        is_active: isActive,
      };

      const formattedVariants = validVariants.map(v => {
        const p = parseFloat(v.price) || 0;
        const cp = parseFloat(v.cost_price) || 0;
        return {
          weight: v.weight.trim(),
          price: p,
          cost_price: cp > 0 ? cp : Math.round(p * 0.75),
          stock: parseInt(v.stock) || 0,
        };
      });

      const res = await createProduct(payload, formattedVariants);

      if (!res.success) {
        throw new Error(res.error || 'Failed to create product');
      }

      setSuccess('Product created and published successfully!');
      setTimeout(() => {
        router.push('/admin/products');
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Failed to create product. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8]">
      {/* Header */}
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
                <h1 className="font-black text-2xl text-[#0f3e26] tracking-tight">Add New Product</h1>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Catalog Editor
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Configure item details, weight units, pricing matrix & freshness guarantees
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#0f3e26] hover:bg-[#144f31] text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                  <span>Publish Product</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Form Body */}
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
                placeholder="e.g. Pure Gir Cow A2 Milk, Vedic Bilona Ghee, Fresh Organic Malai Paneer..."
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

              {categoriesList.length === 0 && !isCategoriesLoading ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-xs font-bold">No categories created yet in the database.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0f3e26] text-white text-xs font-bold hover:bg-[#144f31] transition-all cursor-pointer self-start sm:self-auto"
                  >
                    + Create Category
                  </button>
                </div>
              ) : (
                <CustomCategorySelect
                  categories={categoriesList}
                  value={category}
                  onChange={(val) => setCategory(val)}
                  onAddNewCategory={() => setIsCategoryModalOpen(true)}
                  isLoading={isCategoriesLoading}
                />
              )}
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
                placeholder="Detailed description highlighting farm origins, pure ingredients, nutritional health benefits and Vedic preparation methods..."
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
                  <p className="text-xs text-gray-500 font-medium">Upload high-resolution photography of the product packaging</p>
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
                    ? `Selected: ${imageFile.name} (${(imageFile.size / 1024).toFixed(1)} KB)`
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
                  <p className="text-xs text-gray-500 font-medium">Add different package sizes, weights, selling prices and warehouse stock</p>
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
                    key={idx}
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
                          Initial Stock
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

          {/* Sticky Bottom Actions */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3 pb-12">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-2xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 rounded-2xl bg-[#0f3e26] hover:bg-[#144f31] text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Product...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  <span>Publish Product</span>
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
          setCategoriesList(prev => {
            const exists = prev.some(c => c.id === newCat.id || c.name.toLowerCase() === newCat.name.toLowerCase());
            return exists ? prev : [newCat, ...prev];
          });
          setCategory(newCat.name);
        }}
      />
    </div>
  );
}