"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import type { ProductWithVariants } from '@/lib/api/products';
import { updateProduct, createProduct, deleteProduct, uploadProductImage } from '@/lib/api/products';
import {
  X,
  Plus,
  Trash2,
  Loader2,
  UploadCloud,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  Percent,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';



interface ProductEditModalProps {
  product: ProductWithVariants | null;
  isOpen: boolean;
  onClose: () => void;
  onProductUpdated?: (updatedProduct: ProductWithVariants) => void;
  onProductDeleted?: (deletedProductId: string) => void;
}

export function ProductEditModal({
  product,
  isOpen,
  onClose,
  onProductUpdated,
  onProductDeleted,
}: ProductEditModalProps) {
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
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
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [permanentDelete, setPermanentDelete] = useState(false);

  // Fetch live categories from API (show ONLY categories created in database by admin)
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data?.categories && Array.isArray(data.categories)) {
          const liveNames: string[] = (data.categories || [])
            .map((c: any) => c.name?.trim())
            .filter((n: any): n is string => Boolean(n))
            .sort((a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
          setCategoriesList(liveNames);
          if (!category && liveNames.length > 0) {
            setCategory(liveNames[0]);
          }
        }
      })
      .catch((err) => console.warn('[ProductEditModal] Live categories fetch warning:', err));
  }, [isOpen]);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setCategory(product.category || (categoriesList[0] || ''));
      setDescription(product.description || '');
      setImageUrl(product.image_url || '');
      setImagePreview(product.image_url || null);
      setImageFile(null);
      setIsFreshnessGuarantee(product.is_freshness_guarantee ?? true);
      setIsActive(product.is_active ?? true);
      setVariants(
        (product.product_variants || []).map((v) => ({
          id: v.id,
          weight: v.weight || '',
          price: v.price?.toString() || '',
          cost_price: (v as any).cost_price?.toString() || '',
          original_price: v.original_price?.toString() || '',
          stock: v.stock !== undefined ? v.stock.toString() : '0',
        }))
      );
      if ((product.product_variants || []).length === 0) {
        setVariants([{ weight: '500g', price: '', cost_price: '', original_price: '', stock: '50' }]);
      }
      setErrorMessage('');
      setSuccessMessage('');
      setShowDeleteConfirm(false);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      { weight: '', price: '', cost_price: '', original_price: '', stock: '0' },
    ]);
  };

  const handleUpdateVariant = (index: number, field: string, value: string) => {
    const next = [...variants];
    next[index] = { ...next[index], [field]: value };
    setVariants(next);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMessage('Product name is required');
      return;
    }
    if (!category) {
      setErrorMessage('Category is required');
      return;
    }

    const validVariants = variants.filter((v) => v.weight.trim() && v.price.trim());
    if (validVariants.length === 0) {
      setErrorMessage('At least one variant with weight and selling price is required');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        const uploadRes = await uploadProductImage(imageFile);
        if (uploadRes.error || !uploadRes.url) {
          throw new Error(uploadRes.error || 'Failed to upload new image');
        }
        finalImageUrl = uploadRes.url;
      }

      if (!product.id) {
        const createRes = await createProduct(
          {
            name,
            category,
            description,
            image_url: finalImageUrl,
            is_freshness_guarantee: isFreshnessGuarantee,
          },
          validVariants.map((v) => ({
            weight: v.weight.trim(),
            price: parseFloat(v.price) || 0,
            original_price: v.original_price ? parseFloat(v.original_price) : undefined,
            stock: parseInt(v.stock, 10) || 0,
          }))
        );

        if (!createRes.success) {
          throw new Error(createRes.error || 'Failed to create product');
        }

        setSuccessMessage('Product created successfully!');
        if (onProductUpdated) {
          const newProd: ProductWithVariants = {
            id: createRes.id || 'prod-' + Date.now(),
            name,
            category,
            description,
            image_url: finalImageUrl,
            is_freshness_guarantee: isFreshnessGuarantee,
            is_active: isActive,
            created_at: new Date().toISOString(),
            product_variants: validVariants.map((v, idx) => ({
              id: 'var-' + idx,
              product_id: createRes.id || '',
              weight: v.weight.trim(),
              price: parseFloat(v.price) || 0,
              original_price: v.original_price ? parseFloat(v.original_price) : null,
              stock: parseInt(v.stock, 10) || 0,
            })),
          };
          onProductUpdated(newProd);
        }
      } else {
        const res = await updateProduct(product.id, {
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

        setSuccessMessage('Product updated successfully!');
        if (res.product && onProductUpdated) {
          onProductUpdated(res.product);
        }
      }

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (permanent: boolean) => {
    setIsDeleting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await deleteProduct(product.id, permanent);
      if (!res.success) {
        throw new Error(res.error || 'Failed to delete product');
      }

      setSuccessMessage(res.message || (permanent ? 'Product deleted permanently!' : 'Product deactivated!'));
      if (onProductDeleted) {
        onProductDeleted(product.id);
      }

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => {
            if (!isSaving && !isDeleting) onClose();
          }}
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-white rounded-[24px] shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
          style={{ background: 'var(--color-surface, #ffffff)' }}
        >
          {/* Header */}
          <div
            className="px-6 py-4 border-b flex items-center justify-between shrink-0"
            style={{
              borderColor: 'rgba(195,201,187,0.3)',
              background: 'var(--color-surface-container-lowest, #ffffff)',
            }}
          >
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    background: 'var(--color-primary-fixed, #eaf6ef)',
                    color: 'var(--color-primary, #3f6530)',
                  }}
                >
                  {(product as any)?.seller_id || (product as any)?.isSeller ? 'Seller Hub' : 'Admin Panel'}
                </span>
                {product.id ? (
                  <span className="text-[12px] font-medium text-gray-500">
                    ID: {product.id.slice(0, 8)}...
                  </span>
                ) : (
                  <span className="text-[12px] font-medium text-emerald-700 font-bold">
                    New Product
                  </span>
                )}
              </div>
              <h2
                className="text-[18px] font-bold mt-0.5"
                style={{ color: 'var(--color-on-surface, #1b1c18)' }}
              >
                {product.id ? `Edit Product: ${product.name}` : 'Add New Product'}
              </h2>
            </div>

            <button
              onClick={onClose}
              disabled={isSaving || isDeleting}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors"
              style={{ color: 'var(--color-on-surface-variant, #43483f)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Feedback Alerts */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-[12px] flex items-center gap-3 bg-red-50 text-red-700 text-[13px] font-medium border border-red-200"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-[12px] flex items-center gap-3 bg-emerald-50 text-emerald-800 text-[13px] font-medium border border-emerald-200"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </motion.div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block"
                  style={{ color: 'var(--color-outline, #73796e)' }}
                >
                  Product Name *
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Creamy Thick Curd"
                  className="w-full h-11 px-3.5 rounded-[12px] text-[14px] font-medium outline-none border focus:border-primary transition-all"
                  style={{
                    background: 'var(--color-surface-container, #f3f4ef)',
                    color: 'var(--color-on-surface, #1b1c18)',
                    borderColor: 'rgba(195,201,187,0.3)',
                  }}
                />
              </div>

              <div>
                <label
                  className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block"
                  style={{ color: 'var(--color-outline, #73796e)' }}
                >
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-[12px] text-[14px] font-medium outline-none border focus:border-primary transition-all"
                  style={{
                    background: 'var(--color-surface-container, #f3f4ef)',
                    color: 'var(--color-on-surface, #1b1c18)',
                    borderColor: 'rgba(195,201,187,0.3)',
                  }}
                >
                  {Array.from(new Set([...(category ? [category] : []), ...categoriesList]))
                    .filter((cat): cat is string => Boolean(cat))
                    .sort((a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
                    .map((cat) => (
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
                className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block"
                style={{ color: 'var(--color-outline, #73796e)' }}
              >
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Product description and features..."
                rows={2}
                className="w-full p-3 rounded-[12px] text-[14px] font-medium outline-none border focus:border-primary transition-all resize-none"
                style={{
                  background: 'var(--color-surface-container, #f3f4ef)',
                  color: 'var(--color-on-surface, #1b1c18)',
                  borderColor: 'rgba(195,201,187,0.3)',
                }}
              />
            </div>

            {/* Status & Badges Toggles */}
            <div
              className="p-4 rounded-[16px] grid grid-cols-1 sm:grid-cols-2 gap-3"
              style={{
                background: 'var(--color-surface-container-low, #f7f9f2)',
                border: '1px solid rgba(195,201,187,0.3)',
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
                  <span className="text-[13px] font-bold block" style={{ color: 'var(--color-on-surface)' }}>
                    Active on Storefront
                  </span>
                  <span className="text-[11px] text-gray-500 block">
                    {isActive ? 'Customers can view and buy' : 'Hidden from customer views'}
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
                  <span className="text-[13px] font-bold block" style={{ color: 'var(--color-on-surface)' }}>
                    Freshness Guarantee
                  </span>
                  <span className="text-[11px] text-gray-500 block">
                    Shows "FRESH" badge on product cards
                  </span>
                </div>
              </label>
            </div>

            {/* Product Image */}
            <div>
              <label
                className="text-[11px] font-bold uppercase tracking-wider mb-2 block"
                style={{ color: 'var(--color-outline, #73796e)' }}
              >
                Product Image
              </label>
              <div className="flex items-center gap-4">
                <label
                  className="cursor-pointer relative flex flex-col items-center justify-center w-24 h-24 rounded-[14px] border-2 border-dashed transition-all hover:border-primary overflow-hidden group"
                  style={{
                    borderColor: 'rgba(195,201,187,0.6)',
                    background: 'var(--color-surface-container, #f3f4ef)',
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
                        alt="Product Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                        Change
                      </div>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-6 h-6 mb-1 text-gray-400" />
                      <span className="text-[10px] font-bold text-gray-500">Upload</span>
                    </>
                  )}
                </label>

                {imagePreview && (
                  <div className="flex flex-col gap-1 text-[12px]">
                    <span className="font-semibold text-gray-700">Image selected</span>
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        setImageUrl('');
                      }}
                      className="text-red-600 font-bold hover:underline self-start text-[11px]"
                    >
                      Remove image
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Variants Management */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3
                    className="text-[13px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                    style={{ color: 'var(--color-outline, #73796e)' }}
                  >
                    <Layers className="w-4 h-4 text-primary" />
                    Product Variants & Pricing ({variants.length})
                  </h3>
                  <span className="text-[11px] text-gray-500">
                    Define sizes, selling prices, and cost prices. Minimum profit margin applies.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-[10px] text-[12px] font-bold text-white transition-all active:scale-95 shadow-sm"
                  style={{
                    background: 'linear-gradient(135deg, #3f6530, #577f46)',
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Variant
                </button>
              </div>

              <div className="space-y-3">
                {variants.map((v, idx) => {
                  const cost = parseFloat(v.cost_price) || 0;
                  const price = parseFloat(v.price) || 0;
                  const marginPct = cost > 0 ? (((price - cost) / cost) * 100).toFixed(0) : '0';
                  const isMarginLow = cost > 0 && price < cost * 1.2;

                  return (
                    <div
                      key={v.id || idx}
                      className="p-3.5 rounded-[14px] border space-y-3"
                      style={{
                        background: 'var(--color-surface-container-lowest, #ffffff)',
                        borderColor: isMarginLow ? '#fca5a5' : 'rgba(195,201,187,0.4)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[12px] font-bold px-2 py-0.5 rounded-[6px]"
                            style={{ background: 'var(--color-surface-container)' }}
                          >
                            Variant #{idx + 1}
                          </span>
                          {cost > 0 && (
                            <span
                              className={`text-[11px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
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
                            onClick={() => handleRemoveVariant(idx)}
                            className="p-1 rounded-full text-red-500 hover:bg-red-50 transition-colors"
                            title="Remove Variant"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-[13px]">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                            Weight / Size *
                          </label>
                          <input
                            value={v.weight}
                            onChange={(e) => handleUpdateVariant(idx, 'weight', e.target.value)}
                            placeholder="e.g. 500g, 1L"
                            className="w-full h-9 px-2.5 rounded-[8px] font-semibold border outline-none focus:border-primary"
                            style={{ background: 'var(--color-surface-container)' }}
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                            Selling Price (₹) *
                          </label>
                          <input
                            type="number"
                            value={v.price}
                            onChange={(e) => handleUpdateVariant(idx, 'price', e.target.value)}
                            placeholder="₹ Selling"
                            className="w-full h-9 px-2.5 rounded-[8px] font-bold border outline-none focus:border-primary text-emerald-700"
                            style={{ background: 'var(--color-surface-container)' }}
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                            Cost Price (₹)
                          </label>
                          <input
                            type="number"
                            value={v.cost_price}
                            onChange={(e) => handleUpdateVariant(idx, 'cost_price', e.target.value)}
                            placeholder="₹ Cost"
                            className="w-full h-9 px-2.5 rounded-[8px] font-semibold border outline-none focus:border-primary"
                            style={{ background: 'var(--color-surface-container)' }}
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                            Original MRP (₹)
                          </label>
                          <input
                            type="number"
                            value={v.original_price}
                            onChange={(e) => handleUpdateVariant(idx, 'original_price', e.target.value)}
                            placeholder="₹ MRP"
                            className="w-full h-9 px-2.5 rounded-[8px] font-medium border outline-none focus:border-primary text-gray-500"
                            style={{ background: 'var(--color-surface-container)' }}
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                            Stock Qty
                          </label>
                          <input
                            type="number"
                            value={v.stock}
                            onChange={(e) => handleUpdateVariant(idx, 'stock', e.target.value)}
                            placeholder="Stock"
                            className="w-full h-9 px-2.5 rounded-[8px] font-semibold border outline-none focus:border-primary"
                            style={{ background: 'var(--color-surface-container)' }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delete / Remove Zone */}
            <div
              className="p-4 rounded-[16px] border border-red-200 bg-red-50/50 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[13px] font-bold text-red-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    Danger Zone: Remove Product
                  </h4>
                  <p className="text-[11px] text-red-700">
                    Deactivate or permanently remove this product from your inventory and customer app.
                  </p>
                </div>

                {!showDeleteConfirm && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3.5 py-1.5 rounded-[10px] text-[12px] font-bold text-red-700 border border-red-300 hover:bg-red-100 transition-colors"
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
                  <p className="text-[12px] text-red-900 font-semibold">
                    Are you sure you want to remove <span className="font-bold underline">{product.name}</span>?
                  </p>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-[12px] text-gray-700">
                      <input
                        type="radio"
                        name="del_option"
                        checked={!permanentDelete}
                        onChange={() => setPermanentDelete(false)}
                        className="text-primary accent-primary"
                      />
                      <span>
                        <strong>Soft Delete (Recommended):</strong> Archive & deactivate. Keeps historical customer order and subscription records safe.
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-[12px] text-gray-700">
                      <input
                        type="radio"
                        name="del_option"
                        checked={permanentDelete}
                        onChange={() => setPermanentDelete(true)}
                        className="text-red-600 accent-red-600"
                      />
                      <span className="text-red-700">
                        <strong>Permanent Delete:</strong> Completely delete product and variants (only allowed if product has no past order history).
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
                      onClick={() => handleDelete(permanentDelete)}
                      className="px-4 py-1.5 rounded-[8px] text-[12px] font-bold text-white bg-red-600 hover:bg-red-700 transition-all flex items-center gap-1.5 shadow-sm"
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

          {/* Modal Footer */}
          <div
            className="p-4 border-t flex items-center justify-end gap-3 shrink-0"
            style={{
              borderColor: 'rgba(195,201,187,0.3)',
              background: 'var(--color-surface-container-lowest, #ffffff)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isDeleting}
              className="px-5 py-2.5 rounded-[12px] text-[13px] font-semibold text-gray-700 hover:bg-black/5 transition-all"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isDeleting}
              className="px-6 py-2.5 rounded-[12px] text-[13px] font-bold text-white transition-all active:scale-95 flex items-center gap-2 shadow-md hover:opacity-95 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #3f6530, #577f46)',
              }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
