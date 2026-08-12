"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  UploadCloud, 
  Tags, 
  Loader2, 
  Check, 
  AlertCircle, 
  Image as ImageIcon,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Category, createCategory, updateCategory, uploadCategoryImage } from '@/lib/api/categories';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
  onSaved: (category: Category) => void;
}

export function CategoryModal({ isOpen, onClose, category, onSaved }: CategoryModalProps) {
  const isEditing = Boolean(category);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Populate when editing
  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setDescription(category.description || '');
      setImageUrl(category.image_url || '');
      setImagePreview(category.image_url || null);
      setIsActive(category.is_active ?? true);
      setImageFile(null);
    } else {
      setName('');
      setDescription('');
      setImageUrl('');
      setImagePreview(null);
      setIsActive(true);
      setImageFile(null);
    }
    setError('');
    setSuccess('');
  }, [category, isOpen]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation 1: Name Required
    if (!name.trim()) {
      setError('Category Name is required.');
      return;
    }

    // Validation 2: Image Required
    if (!imageUrl.trim() && !imageFile && !imagePreview) {
      setError('Please upload a category image.');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalImageUrl = imageUrl.trim();

      // If user uploaded a new file, upload it
      if (imageFile) {
        const uploadRes = await uploadCategoryImage(imageFile);
        if (uploadRes.error || !uploadRes.url) {
          throw new Error(uploadRes.error || 'Failed to upload category image.');
        }
        finalImageUrl = uploadRes.url;
      }

      if (isEditing && category) {
        const res = await updateCategory(category.id, {
          name: name.trim(),
          description: description.trim() || null,
          image_url: finalImageUrl,
          is_active: isActive,
        });

        if (!res.success || !res.category) {
          throw new Error(res.error || 'Failed to update category.');
        }

        setSuccess('Category updated successfully!');
        setTimeout(() => {
          onSaved(res.category!);
          onClose();
        }, 500);
      } else {
        const res = await createCategory({
          name: name.trim(),
          description: description.trim() || null,
          image_url: finalImageUrl,
          is_active: isActive,
        });

        if (!res.success || !res.category) {
          throw new Error(res.error || 'Failed to create category.');
        }

        setSuccess('Category created successfully!');
        setTimeout(() => {
          onSaved(res.category!);
          onClose();
        }, 500);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-10 my-8"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-emerald-900 to-[#0f3e26] text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                <Tags className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">
                  {isEditing ? 'Edit Category' : 'Add New Category'}
                </h2>
                <p className="text-xs text-emerald-200/80">
                  Configure category taxonomy, image assets, and visibility
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Feedback Alerts */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* 1. Category Name (Required) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                Category Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Milk, Vedic Ghee, Organic Butter, Sweets..."
                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-sm font-medium text-gray-900 focus:bg-white focus:border-[#0f3e26] focus:ring-2 focus:ring-emerald-900/10 outline-none transition-all"
                required
              />
            </div>

            {/* 2. Description (Optional) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                  Description
                </label>
                <span className="text-[10px] text-gray-400 font-medium">Optional</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short summary describing products in this category..."
                rows={2}
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50/50 text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0f3e26] focus:ring-2 focus:ring-emerald-900/10 outline-none transition-all resize-none"
              />
            </div>

            {/* 3. Category Image / Icon (Required) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                  Category Image / Icon <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] font-bold text-emerald-700">Required</span>
              </div>

              {/* Image Preview & Upload Controls */}
              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
                <div className="w-16 h-16 rounded-xl bg-white border border-gray-200 shadow-2xs flex items-center justify-center overflow-hidden shrink-0 relative group">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Category preview"
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      onError={() => {
                        setImagePreview(null);
                      }}
                    />
                  ) : (
                    <ImageIcon className="w-7 h-7 text-gray-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-800 hover:bg-gray-100 hover:border-gray-300 transition-colors cursor-pointer shadow-2xs">
                      <UploadCloud className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{imagePreview ? 'Change Image' : 'Upload Custom Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>

                    {imagePreview && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="p-1.5 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove Image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-400 truncate">
                    {imageFile ? imageFile.name : 'PNG, JPG, or WebP up to 5MB'}
                  </p>
                </div>
              </div>
            </div>



            {/* Actions */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-[#0f3e26] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Category...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{isEditing ? 'Save Changes' : 'Create Category'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
