"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { createProduct, uploadProductImage } from '@/lib/api/products';
import { MultiImageUpload, ImageItem } from '@/components/admin/MultiImageUpload';
import { api } from '@/lib/api/client';
import {
  ArrowLeft,
  Tag,
  FileText,
  LayoutGrid,
  ChevronDown,
  UploadCloud,
  Package,
  Plus,
  GripVertical,
  Trash2,
  Scale,
  Loader2,
  X,
} from 'lucide-react';

function AddProductPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [description, setDescription] = useState('');
  const [variants, setVariants] = useState([{ weight: '', price: '', cost_price: '', stock: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<ImageItem[]>([]);

  useEffect(() => {
    async function loadCategories() {
      try {
        setIsLoadingCategories(true);
        const res = await api.categories.get();
        const catNames = (res.categories || []).map((c: any) => c.name).filter(Boolean);
        if (catNames.length > 0) {
          const uniqueCats = Array.from(new Set<string>(catNames));
          setCategories(uniqueCats);
          setCategory(uniqueCats[0]);
        } else {
          setCategories([]);
          setIsCustomCategory(true);
        }
      } catch (err) {
        console.error('Failed to load categories from database:', err);
        setCategories([]);
        setIsCustomCategory(true);
      } finally {
        setIsLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

  const addVariant = () => {
    setVariants([...variants, { weight: '', price: '', cost_price: '', stock: '' }]);
  };

  const updateVariant = (index: number, field: string, value: string) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    const selectedCategory = isCustomCategory ? customCategory.trim() : category.trim();

    if (!name.trim()) {
      setError('Product name is required');
      return;
    }

    if (!selectedCategory) {
      setError('Product category is required');
      return;
    }

    const validVariants = variants.filter(v => v.weight && v.price);
    if (validVariants.length === 0) {
      setError('At least one variant with weight and price is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Upload all files in images array
      const uploadedImageUrls: string[] = [];
      let primaryUrl = '';

      for (const item of images) {
        let finalUrl = item.url;
        if (item.file) {
          const uploadRes = await uploadProductImage(item.file);
          if (uploadRes.error || !uploadRes.url) {
            throw new Error(uploadRes.error || 'Failed to upload one of the product images');
          }
          finalUrl = uploadRes.url;
        }
        uploadedImageUrls.push(finalUrl);
        if (item.isPrimary) {
          primaryUrl = finalUrl;
        }
      }

      if (!primaryUrl && uploadedImageUrls.length > 0) {
        primaryUrl = uploadedImageUrls[0];
      }

      const res = await createProduct(
        {
          name: name.trim(),
          category: selectedCategory,
          description: description.trim() || undefined,
          image_url: primaryUrl || undefined,
          gallery_images: uploadedImageUrls,
          is_freshness_guarantee: true,
        },
        validVariants.map(v => ({
          weight: v.weight.trim(),
          price: parseFloat(v.price),
          cost_price: v.cost_price ? parseFloat(v.cost_price) : 0,
          stock: v.stock ? parseInt(v.stock, 10) : 0,
        }))
      );

      if (!res.success) {
        throw new Error(res.error || 'Failed to create product');
      }

      router.replace('/admin/products');
    } catch (err: any) {
      setError(err.message || 'Failed to create product');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-12" style={{ background: 'var(--color-background, #fbfaf6)' }}>
      {/* Header */}
      <div className="px-6 md:px-10 pt-6 pb-5 flex items-center justify-between border-b"
        style={{ background: 'var(--color-surface, #ffffff)', borderColor: 'var(--color-border, #e4e2db)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors"
            style={{ color: 'var(--color-foreground-muted, #58625c)' }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-extrabold text-[22px] tracking-tight" style={{ color: 'var(--color-foreground, #1c201e)' }}>
              Add Product
            </h1>
            <p className="text-[13px]" style={{ color: 'var(--color-foreground-muted, #58625c)' }}>
              Create a new product listing with custom attributes and pricing variants.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 h-11 rounded-[10px] font-semibold text-[14px] text-white shadow-sm transition-all hover:opacity-95 disabled:opacity-50"
          style={{ background: 'var(--color-primary, #0c3c26)' }}
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {isSubmitting ? 'Creating Product...' : 'Save Product'}
        </button>
      </div>

      <div className="px-6 md:px-10 py-6 max-w-7xl w-full mx-auto flex flex-col gap-6">
        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column: Name & Description */}
          <div className="flex flex-col gap-5">
            {/* Product Name */}
            <div>
              <label className="text-[13px] font-semibold mb-2 flex items-center"
                style={{ color: 'var(--color-foreground, #1c201e)' }}>
                Product Name <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1.5"></span>
              </label>
              <div className="relative flex items-center">
                <Tag className="absolute left-3.5 w-4.5 h-4.5 pointer-events-none" style={{ color: 'var(--color-foreground-muted, #8a948e)' }} />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter product name"
                  className="w-full h-12 pl-11 pr-4 rounded-[10px] text-[14px] font-medium outline-none border transition-all focus:ring-2 focus:ring-primary/20"
                  style={{
                    background: 'var(--color-surface, #ffffff)',
                    borderColor: 'var(--color-border, #e4e2db)',
                    color: 'var(--color-foreground, #1c201e)',
                  }}
                />
              </div>
            </div>

            {/* Description (Optional) */}
            <div>
              <label className="text-[13px] font-semibold mb-2 block"
                style={{ color: 'var(--color-foreground, #1c201e)' }}>
                Description (Optional)
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3.5 w-4.5 h-4.5 pointer-events-none" style={{ color: 'var(--color-foreground-muted, #8a948e)' }} />
                <textarea
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter product description..."
                  className="w-full h-44 pl-11 pr-4 pt-3 pb-8 rounded-[10px] text-[14px] font-medium outline-none border resize-none transition-all focus:ring-2 focus:ring-primary/20"
                  style={{
                    background: 'var(--color-surface, #ffffff)',
                    borderColor: 'var(--color-border, #e4e2db)',
                    color: 'var(--color-foreground, #1c201e)',
                  }}
                />
                <div className="absolute bottom-3 right-3 text-[12px] font-semibold tracking-wide pointer-events-none"
                  style={{ color: 'var(--color-foreground-muted, #8a948e)' }}>
                  {description.length} / 500
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Category & Image */}
          <div className="flex flex-col gap-5">
            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[13px] font-semibold flex items-center"
                  style={{ color: 'var(--color-foreground, #1c201e)' }}>
                  Category <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1.5"></span>
                </label>
                {categories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCategory(!isCustomCategory);
                      if (isCustomCategory && categories.length > 0) {
                        setCategory(categories[0]);
                      }
                    }}
                    className="text-[13px] font-semibold flex items-center gap-1 hover:underline"
                    style={{ color: 'var(--color-primary, #0c3c26)' }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {isCustomCategory ? "Select Existing Category" : "Add New Category"}
                  </button>
                )}
              </div>

              <div className="relative flex items-center">
                <LayoutGrid className="absolute left-3.5 w-4.5 h-4.5 pointer-events-none z-10" style={{ color: 'var(--color-foreground-muted, #8a948e)' }} />
                
                {isLoadingCategories ? (
                  <div className="w-full h-12 pl-11 pr-4 rounded-[10px] flex items-center gap-2 border"
                    style={{ background: 'var(--color-surface, #ffffff)', borderColor: 'var(--color-border, #e4e2db)' }}>
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--color-foreground-muted, #8a948e)' }} />
                    <span className="text-[14px] font-medium" style={{ color: 'var(--color-foreground-muted, #8a948e)' }}>Loading categories...</span>
                  </div>
                ) : isCustomCategory || categories.length === 0 ? (
                  <input
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter category name"
                    className="w-full h-12 pl-11 pr-4 rounded-[10px] text-[14px] font-medium outline-none border transition-all focus:ring-2 focus:ring-primary/20"
                    style={{
                      background: 'var(--color-surface, #ffffff)',
                      borderColor: 'var(--color-border, #e4e2db)',
                      color: 'var(--color-foreground, #1c201e)',
                    }}
                  />
                ) : (
                  <>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-12 pl-11 pr-10 rounded-[10px] text-[14px] font-medium outline-none border appearance-none transition-all focus:ring-2 focus:ring-primary/20 cursor-pointer"
                      style={{
                        background: 'var(--color-surface, #ffffff)',
                        borderColor: 'var(--color-border, #e4e2db)',
                        color: 'var(--color-foreground, #1c201e)',
                      }}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 w-4.5 h-4.5 pointer-events-none" style={{ color: 'var(--color-foreground-muted, #8a948e)' }} />
                  </>
                )}
              </div>
            </div>

            {/* Product Images (Multiple allowed) */}
            <div>
              <label className="text-[13px] font-semibold mb-2 block"
                style={{ color: 'var(--color-foreground, #1c201e)' }}>
                Product Photos (Upload multiple at once)
              </label>

              <MultiImageUpload
                images={images}
                onChange={setImages}
                disabled={isSubmitting}
                maxImages={10}
              />
            </div>
          </div>
        </div>

        {/* Variants Card Section */}
        <div className="rounded-[16px] border p-6 mt-2"
          style={{ background: 'var(--color-surface, #ffffff)', borderColor: 'var(--color-border, #e4e2db)' }}>
          
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-[10px] mt-0.5" style={{ background: 'var(--color-surface-muted, #f2ede4)' }}>
                <Package className="w-5 h-5" style={{ color: 'var(--color-primary, #0c3c26)' }} />
              </div>
              <div>
                <h2 className="font-extrabold text-[17px] tracking-tight" style={{ color: 'var(--color-foreground, #1c201e)' }}>
                  Variants
                </h2>
                <p className="text-[13px]" style={{ color: 'var(--color-foreground-muted, #58625c)' }}>
                  Add variants to manage different sizes or packaging.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={addVariant}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] border text-[13px] font-semibold transition-colors hover:bg-primary/5"
              style={{ borderColor: 'var(--color-primary, #0c3c26)', color: 'var(--color-primary, #0c3c26)' }}
            >
              <Plus className="w-4 h-4" /> Add Variant
            </button>
          </div>

          {/* List of Variant Cards */}
          <div className="flex flex-col gap-4">
            {variants.map((variant, index) => (
              <div
                key={index}
                className="p-5 rounded-[12px] border space-y-4 transition-all"
                style={{
                  background: 'var(--color-surface-muted, #fbfaf6)',
                  borderColor: 'var(--color-border, #e4e2db)',
                }}
              >
                {/* Variant Item Header */}
                <div className="flex justify-between items-center pb-2 border-b"
                  style={{ borderColor: 'var(--color-border, #e4e2db)' }}>
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 cursor-grab" style={{ color: 'var(--color-foreground-muted, #8a948e)' }} />
                    <span className="text-[14px] font-bold" style={{ color: 'var(--color-foreground, #1c201e)' }}>
                      Variant {index + 1}
                    </span>
                  </div>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="p-1.5 rounded-md text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Variant Input 2x2 Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Weight */}
                  <div>
                    <label className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--color-foreground, #1c201e)' }}>
                      Weight (e.g. 1L, 500g)
                    </label>
                    <div className="relative flex items-center">
                      <Scale className="absolute left-3.5 w-4 h-4 pointer-events-none" style={{ color: 'var(--color-foreground-muted, #8a948e)' }} />
                      <input
                        value={variant.weight}
                        onChange={(e) => updateVariant(index, 'weight', e.target.value)}
                        placeholder="e.g. 500g"
                        className="w-full h-11 pl-10 pr-3 rounded-[8px] text-[14px] font-medium outline-none border transition-all focus:ring-2 focus:ring-primary/20"
                        style={{
                          background: 'var(--color-surface, #ffffff)',
                          borderColor: 'var(--color-border, #e4e2db)',
                          color: 'var(--color-foreground, #1c201e)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Selling Price */}
                  <div>
                    <label className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--color-foreground, #1c201e)' }}>
                      Selling Price (₹)
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-[14px] font-bold pointer-events-none" style={{ color: 'var(--color-foreground-muted, #8a948e)' }}>
                        ₹
                      </span>
                      <input
                        value={variant.price}
                        onChange={(e) => updateVariant(index, 'price', e.target.value)}
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                        className="w-full h-11 pl-9 pr-3 rounded-[8px] text-[14px] font-medium outline-none border transition-all focus:ring-2 focus:ring-primary/20"
                        style={{
                          background: 'var(--color-surface, #ffffff)',
                          borderColor: 'var(--color-border, #e4e2db)',
                          color: 'var(--color-foreground, #1c201e)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Cost Price */}
                  <div>
                    <label className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--color-foreground, #1c201e)' }}>
                      Cost Price (₹)
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-[14px] font-bold pointer-events-none" style={{ color: 'var(--color-foreground-muted, #8a948e)' }}>
                        ₹
                      </span>
                      <input
                        value={variant.cost_price}
                        onChange={(e) => updateVariant(index, 'cost_price', e.target.value)}
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                        className="w-full h-11 pl-9 pr-3 rounded-[8px] text-[14px] font-medium outline-none border transition-all focus:ring-2 focus:ring-primary/20"
                        style={{
                          background: 'var(--color-surface, #ffffff)',
                          borderColor: 'var(--color-border, #e4e2db)',
                          color: 'var(--color-foreground, #1c201e)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Stock Quantity */}
                  <div>
                    <label className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--color-foreground, #1c201e)' }}>
                      Stock Quantity
                    </label>
                    <div className="relative flex items-center">
                      <Package className="absolute left-3.5 w-4 h-4 pointer-events-none" style={{ color: 'var(--color-foreground-muted, #8a948e)' }} />
                      <input
                        value={variant.stock}
                        onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                        placeholder="0"
                        type="number"
                        className="w-full h-11 pl-10 pr-3 rounded-[8px] text-[14px] font-medium outline-none border transition-all focus:ring-2 focus:ring-primary/20"
                        style={{
                          background: 'var(--color-surface, #ffffff)',
                          borderColor: 'var(--color-border, #e4e2db)',
                          color: 'var(--color-foreground, #1c201e)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error message display */}
        {error && (
          <div className="p-4 rounded-[10px] border border-red-200 bg-red-50 text-red-700 text-[14px] font-semibold flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        {/* Submit button at bottom */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-8 h-12 rounded-[10px] font-bold text-[15px] text-white shadow-md transition-all hover:opacity-95 disabled:opacity-50"
            style={{ background: 'var(--color-primary, #0c3c26)' }}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            {isSubmitting ? 'Creating Product...' : 'Create Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddProductPage;
