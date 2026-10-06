"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import {
  getProductById,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  type ProductWithVariants,
} from '@/lib/api/products';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  UploadCloud,
  Save,
  ShieldAlert,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { motion } from 'framer-motion';

// Was a dairy-only list, so an admin editing an Electronics product would
// have had its category silently reset to a dairy value.
import { CATEGORY_NAMES } from '@/lib/constants/categories';

const CATEGORIES = CATEGORY_NAMES;

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Milk');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isFreshnessGuarantee, setIsFreshnessGuarantee] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [variants, setVariants] = useState<
    Array<{
      id?: string;
      weight: string;
      price: string;
      cost_price: string;
      original_price: string;
      stock: string;
    }>
  >([]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [permanentDelete, setPermanentDelete] = useState(false);

  useEffect(() => {
    if (!productId) return;
    setIsLoading(true);
    getProductById(productId)
      .then((data) => {
        if (!data) {
          setError('Product not found');
          return;
        }
        setName(data.name || '');
        setCategory(data.category || 'Milk');
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
        setError(err.message || 'Failed to load product');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [productId]);

  const addVariant = () => {
    setVariants([
      ...variants,
      { weight: '', price: '', cost_price: '', original_price: '', stock: '0' },
    ]);
  };

  const updateVariant = (index: number, field: string, value: string) => {
    const next = [...variants];
    next[index] = { ...next[index], [field]: value };
    setVariants(next);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !category) {
      setError('Product name and category are required');
      return;
    }

    const validVariants = variants.filter((v) => v.weight.trim() && v.price.trim());
    if (validVariants.length === 0) {
      setError('At least one variant with weight and selling price is required');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        const uploadRes = await uploadProductImage(imageFile);
        if (uploadRes.error || !uploadRes.url) {
          throw new Error(uploadRes.error || 'Failed to upload image');
        }
        finalImageUrl = uploadRes.url;
      }

      const res = await updateProduct(productId, {
        name,
        category,
        description,
        image_url: finalImageUrl,
        is_freshness_guarantee: isFreshnessGuarantee,
        is_active: isActive,
        variants: validVariants.map((v) => ({
          id: v.id,
          weight: v.weight.trim(),
          price: parseFloat(v.price) || 0,
          cost_price: parseFloat(v.cost_price) || 0,
          original_price: v.original_price ? parseFloat(v.original_price) : undefined,
          stock: parseInt(v.stock, 10) || 0,
        })),
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to update product');
      }

      setSuccess('Product updated successfully!');
      setTimeout(() => {
        router.push('/admin/products');
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Failed to update product');
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');
    setSuccess('');

    try {
      const res = await deleteProduct(productId, permanentDelete);
      if (!res.success) {
        throw new Error(res.error || 'Failed to delete product');
      }

      setSuccess(res.message || 'Product removed successfully');
      setTimeout(() => {
        router.push('/admin/products');
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <p className="text-[13px] font-semibold text-gray-500">Loading product details...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-16">
      {/* Top Header */}
      <div
        className="px-6 md:px-10 pt-6 pb-5 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md"
        style={{
          background: 'rgba(255,255,255,0.92)',
          borderBottom: '1px solid rgba(195,201,187,0.3)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors"
            style={{ color: 'var(--color-on-surface-variant)' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1
              className="font-extrabold text-[22px] tracking-tight"
              style={{ color: 'var(--color-on-surface)' }}
            >
              Edit Product
            </h1>
            <p className="text-[12px] text-gray-500">ID: {productId}</p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || isDeleting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] font-bold text-[13px] text-white transition-all active:scale-95 shadow-md disabled:opacity-50"
          style={{
            background: 'var(--cta-gradient)',
          }}
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </button>
      </div>

      <div className="px-6 md:px-10 py-6 max-w-4xl flex flex-col gap-6">
        {/* Status Alerts */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-[14px] flex items-center gap-3 bg-red-50 text-red-700 text-[13px] font-medium border border-red-200"
          >
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-[14px] flex items-center gap-3 bg-emerald-50 text-emerald-800 text-[13px] font-medium border border-emerald-200"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </motion.div>
        )}

        {/* Basic Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              className="text-[12px] font-bold uppercase tracking-wider mb-2 block"
              style={{ color: 'var(--color-outline)' }}
            >
              Product Name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Creamy Thick Curd"
              className="w-full h-12 px-4 rounded-[12px] text-[15px] font-medium outline-none border focus:border-primary transition-all"
              style={{
                background: 'var(--color-surface-container)',
                color: 'var(--color-on-surface)',
                borderColor: 'rgba(195,201,187,0.3)',
              }}
            />
          </div>

          <div>
            <label
              className="text-[12px] font-bold uppercase tracking-wider mb-2 block"
              style={{ color: 'var(--color-outline)' }}
            >
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-12 px-4 rounded-[12px] text-[15px] font-medium outline-none border focus:border-primary transition-all"
              style={{
                background: 'var(--color-surface-container)',
                color: 'var(--color-on-surface)',
                borderColor: 'rgba(195,201,187,0.3)',
              }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label
            className="text-[12px] font-bold uppercase tracking-wider mb-2 block"
            style={{ color: 'var(--color-outline)' }}
          >
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Product description and highlights"
            rows={3}
            className="w-full p-4 rounded-[12px] text-[15px] font-medium outline-none border focus:border-primary transition-all resize-none"
            style={{
              background: 'var(--color-surface-container)',
              color: 'var(--color-on-surface)',
              borderColor: 'rgba(195,201,187,0.3)',
            }}
          />
        </div>

        {/* Status Toggles */}
        <div
          className="p-4 rounded-[16px] grid grid-cols-1 sm:grid-cols-2 gap-4 border"
          style={{
            background: 'var(--color-surface-container-low)',
            borderColor: 'rgba(195,201,187,0.3)',
          }}
        >
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
            />
            <div>
              <span className="text-[14px] font-bold block" style={{ color: 'var(--color-on-surface)' }}>
                Active on Storefront
              </span>
              <span className="text-[12px] text-gray-500 block">
                {isActive ? 'Available to customer view and cart' : 'Draft / hidden from customer store'}
              </span>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isFreshnessGuarantee}
              onChange={(e) => setIsFreshnessGuarantee(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
            />
            <div>
              <span className="text-[14px] font-bold block" style={{ color: 'var(--color-on-surface)' }}>
                Freshness Guarantee
              </span>
              <span className="text-[12px] text-gray-500 block">
                Displays "Fresh" guarantee ribbon badge
              </span>
            </div>
          </label>
        </div>

        {/* Product Image */}
        <div>
          <label
            className="text-[12px] font-bold uppercase tracking-wider mb-2 block"
            style={{ color: 'var(--color-outline)' }}
          >
            Product Image
          </label>
          <div className="flex items-center gap-4">
            <label
              className="cursor-pointer relative flex flex-col items-center justify-center w-28 h-28 rounded-[14px] border-2 border-dashed transition-all hover:border-primary overflow-hidden group"
              style={{
                borderColor: 'rgba(195,201,187,0.6)',
                background: 'var(--color-surface-container)',
              }}
            >
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                  }
                }}
              />
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold">
                    Change
                  </div>
                </>
              ) : (
                <>
                  <UploadCloud className="w-6 h-6 mb-1 text-gray-400" />
                  <span className="text-[11px] font-bold text-gray-500">Upload</span>
                </>
              )}
            </label>

            {imagePreview && (
              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                  setImageUrl('');
                }}
                className="text-[12px] font-bold text-red-600 hover:underline"
              >
                Remove Image
              </button>
            )}
          </div>
        </div>

        {/* Variants Manager */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <label
                className="text-[13px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                style={{ color: 'var(--color-outline)' }}
              >
                <Layers className="w-4 h-4 text-primary" />
                Product Variants & Margin Rules ({variants.length})
              </label>
              <span className="text-[12px] text-gray-500">
                Minimum 20% profit margin calculated from cost price.
              </span>
            </div>
            <button
              type="button"
              onClick={addVariant}
              className="flex items-center gap-1 px-3 py-1.5 rounded-[10px] text-[12px] font-bold text-white transition-all active:scale-95 shadow-sm"
              style={{
                background: 'var(--cta-gradient)',
              }}
            >
              <Plus className="w-4 h-4" /> Add Variant
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {variants.map((variant, index) => {
              const cost = parseFloat(variant.cost_price) || 0;
              const price = parseFloat(variant.price) || 0;
              const marginPct = cost > 0 ? (((price - cost) / cost) * 100).toFixed(0) : '0';
              const isMarginLow = cost > 0 && price < cost * 1.2;

              return (
                <div
                  key={variant.id || index}
                  className="p-4 rounded-[14px] space-y-3 border transition-all"
                  style={{
                    background: 'var(--color-surface-container-lowest)',
                    borderColor: isMarginLow ? '#fca5a5' : 'rgba(195,201,187,0.4)',
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[13px] font-bold px-2.5 py-0.5 rounded-[6px]"
                        style={{ background: 'var(--color-surface-container)' }}
                      >
                        Variant {index + 1}
                      </span>
                      {cost > 0 && (
                        <span
                          className={`text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                            isMarginLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          <Percent className="w-3 h-3" />
                          {marginPct}% Margin
                        </span>
                      )}
                    </div>

                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="p-1 rounded-full text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                        Weight / Size *
                      </label>
                      <input
                        value={variant.weight}
                        onChange={(e) => updateVariant(index, 'weight', e.target.value)}
                        placeholder="e.g. 500g, 1L"
                        className="w-full h-10 px-3 rounded-[8px] text-[14px] font-semibold border outline-none focus:border-primary"
                        style={{ background: 'var(--color-surface-container)' }}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                        Selling Price (₹) *
                      </label>
                      <input
                        value={variant.price}
                        onChange={(e) => updateVariant(index, 'price', e.target.value)}
                        placeholder="Selling Price"
                        type="number"
                        className="w-full h-10 px-3 rounded-[8px] text-[14px] font-bold border outline-none focus:border-primary text-emerald-700"
                        style={{ background: 'var(--color-surface-container)' }}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                        Cost Price (₹)
                      </label>
                      <input
                        value={variant.cost_price}
                        onChange={(e) => updateVariant(index, 'cost_price', e.target.value)}
                        placeholder="Cost Price"
                        type="number"
                        className="w-full h-10 px-3 rounded-[8px] text-[14px] font-semibold border outline-none focus:border-primary"
                        style={{ background: 'var(--color-surface-container)' }}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                        Original MRP (₹)
                      </label>
                      <input
                        value={variant.original_price}
                        onChange={(e) => updateVariant(index, 'original_price', e.target.value)}
                        placeholder="MRP Price"
                        type="number"
                        className="w-full h-10 px-3 rounded-[8px] text-[14px] font-medium border outline-none focus:border-primary text-gray-500"
                        style={{ background: 'var(--color-surface-container)' }}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                        Stock Qty
                      </label>
                      <input
                        value={variant.stock}
                        onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                        placeholder="Stock"
                        type="number"
                        className="w-full h-10 px-3 rounded-[8px] text-[14px] font-semibold border outline-none focus:border-primary"
                        style={{ background: 'var(--color-surface-container)' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Danger Zone: Remove / Delete Product */}
        <div className="p-5 rounded-[16px] border border-red-200 bg-red-50/50 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-[14px] font-bold text-red-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                Danger Zone: Remove Product
              </h4>
              <p className="text-[12px] text-red-700 mt-0.5">
                Deactivate or permanently remove this product from the inventory.
              </p>
            </div>

            {!showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-[10px] text-[12px] font-bold text-red-700 border border-red-300 hover:bg-red-100 transition-colors"
              >
                Remove Product...
              </button>
            )}
          </div>

          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-3 border-t border-red-200 space-y-3"
            >
              <p className="text-[13px] text-red-900 font-semibold">
                Are you sure you want to remove <span className="font-bold underline">{name}</span>?
              </p>

              <div className="space-y-2 text-[12px] text-gray-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="del_choice"
                    checked={!permanentDelete}
                    onChange={() => setPermanentDelete(false)}
                    className="text-primary accent-primary"
                  />
                  <span>
                    <strong>Soft Delete (Recommended):</strong> Archive and deactivate. Keeps customer orders and subscription history intact.
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-red-700">
                  <input
                    type="radio"
                    name="del_choice"
                    checked={permanentDelete}
                    onChange={() => setPermanentDelete(true)}
                    className="text-red-600 accent-red-600"
                  />
                  <span>
                    <strong>Permanent Delete:</strong> Remove entirely from database (fails if order history exists).
                  </span>
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="px-4 py-1.5 rounded-[8px] text-[12px] font-bold text-white bg-red-600 hover:bg-red-700 transition-all flex items-center gap-1.5"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Confirm Remove
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
