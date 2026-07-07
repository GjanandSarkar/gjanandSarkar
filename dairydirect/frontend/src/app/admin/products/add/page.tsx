"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { getProducts, uploadProductImage } from '@/lib/api/products';
import { ArrowLeft, Plus, Trash2, Loader2, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['Milk', 'Paneer', 'Ghee', 'Buttermilk', 'Curd', 'Lassi'];

function AddProductPage() {
  const router = useRouter();
  const { t } = useTranslation();
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Milk');
  const [description, setDescription] = useState('');
  const [variants, setVariants] = useState([{ weight: '', price: '', cost_price: '', stock: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
    if (!name.trim() || !category) {
      setError('Product name and category are required');
      return;
    }

    const validVariants = variants.filter(v => v.weight && v.price && v.cost_price);
    if (validVariants.length === 0) {
      setError('At least one variant with weight, price, and cost price is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let image_url = '';
      if (imageFile) {
        const uploadRes = await uploadProductImage(imageFile);
        if (uploadRes.error || !uploadRes.url) {
          throw new Error(uploadRes.error || 'Failed to upload image');
        }
        image_url = uploadRes.url;
      }

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          description,
          image_url,
          is_freshness_guarantee: true,
          variants: validVariants.map(v => ({
            weight: v.weight,
            price: parseFloat(v.price),
            cost_price: parseFloat(v.cost_price),
            stock: parseInt(v.stock) || 0,
          })),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create product');
      }

      router.replace('/admin/products');
    } catch (err: any) {
      setError(err.message || 'Failed to create product');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-6 md:px-10 pt-6 pb-5 flex items-center gap-4"
        style={{ background: 'var(--color-surface-container-lowest)' }}>
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full"
          style={{ color: 'var(--color-on-surface-variant)' }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-extrabold text-[24px] tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
          Add Product
        </h1>
      </div>

      <div className="px-6 md:px-10 py-6 flex flex-col gap-6">
        <div>
          <label className="text-[12px] font-bold uppercase tracking-wider mb-2 block"
            style={{ color: 'var(--color-outline)' }}>Product Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter product name"
            className="w-full h-12 px-4 rounded-[12px] text-[15px] font-medium outline-none"
            style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface)' }}
          />
        </div>

        <div>
          <label className="text-[12px] font-bold uppercase tracking-wider mb-2 block"
            style={{ color: 'var(--color-outline)' }}>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-12 px-4 rounded-[12px] text-[15px] font-medium outline-none"
            style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface)' }}
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[12px] font-bold uppercase tracking-wider mb-2 block"
            style={{ color: 'var(--color-outline)' }}>Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Product description"
            className="w-full min-h-24 px-4 py-3 rounded-[12px] text-[15px] font-medium outline-none resize-none"
            style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface)' }}
          />
        </div>

        <div>
          <label className="text-[12px] font-bold uppercase tracking-wider mb-2 block"
            style={{ color: 'var(--color-outline)' }}>Product Image (Optional)</label>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer flex flex-col items-center justify-center w-24 h-24 rounded-[12px] border-2 border-dashed transition-colors hover:border-primary"
              style={{ borderColor: 'rgba(195,201,187,0.5)', background: 'var(--color-surface-container)' }}>
              <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setImageFile(file);
                  setImagePreview(URL.createObjectURL(file));
                }
              }} />
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-[10px]" />
              ) : (
                <>
                  <UploadCloud className="w-6 h-6 mb-1" style={{ color: 'var(--color-outline)' }} />
                  <span className="text-[10px] font-medium" style={{ color: 'var(--color-outline)' }}>Upload</span>
                </>
              )}
            </label>
            {imagePreview && (
              <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="text-[12px] font-bold text-red-600">
                Remove
              </button>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[12px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--color-outline)' }}>Variants</label>
            <button
              onClick={addVariant}
              className="flex items-center gap-1 text-[12px] font-bold"
              style={{ color: 'var(--color-primary)' }}
            >
              <Plus className="w-4 h-4" /> Add Variant
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {variants.map((variant, index) => (
              <div key={index} className="p-4 rounded-[12px] space-y-3"
                style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(195,201,187,0.3)' }}>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-bold" style={{ color: 'var(--color-on-surface)' }}>
                    Variant {index + 1}
                  </span>
                  {variants.length > 1 && (
                    <button
                      onClick={() => removeVariant(index)}
                      className="p-1 rounded-full"
                      style={{ color: 'var(--color-error)' }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={variant.weight}
                    onChange={(e) => updateVariant(index, 'weight', e.target.value)}
                    placeholder="Weight (e.g. 1L)"
                    className="w-full h-10 px-3 rounded-[8px] text-[14px] font-medium outline-none"
                    style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface)' }}
                  />
                  <input
                    value={variant.price}
                    onChange={(e) => updateVariant(index, 'price', e.target.value)}
                    placeholder="Selling Price"
                    type="number"
                    className="w-full h-10 px-3 rounded-[8px] text-[14px] font-medium outline-none"
                    style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface)' }}
                  />
                  <input
                    value={variant.cost_price}
                    onChange={(e) => updateVariant(index, 'cost_price', e.target.value)}
                    placeholder="Cost Price"
                    type="number"
                    className="w-full h-10 px-3 rounded-[8px] text-[14px] font-medium outline-none"
                    style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface)' }}
                  />
                  <input
                    value={variant.stock}
                    onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                    placeholder="Stock"
                    type="number"
                    className="w-full h-10 px-3 rounded-[8px] text-[14px] font-medium outline-none"
                    style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-[13px] font-bold" style={{ color: 'var(--color-error)' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full h-12 rounded-[12px] font-bold text-white flex items-center justify-center gap-2"
          style={{
            background: isSubmitting ? 'var(--color-surface-container)' : 'linear-gradient(135deg, #3f6530, #577f46)',
            color: isSubmitting ? 'var(--color-on-surface-variant)' : 'white',
          }}
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          {isSubmitting ? 'Creating...' : 'Create Product'}
        </button>
      </div>
    </div>
  );
}

export default AddProductPage;