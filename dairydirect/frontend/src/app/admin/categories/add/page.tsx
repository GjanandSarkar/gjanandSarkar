"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  UploadCloud, 
  Tags, 
  Loader2, 
  Check, 
  AlertCircle, 
  Image as ImageIcon,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { createCategory, uploadCategoryImage } from '@/lib/api/categories';

export default function AddCategoryPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

      if (imageFile) {
        const uploadRes = await uploadCategoryImage(imageFile);
        if (uploadRes.error || !uploadRes.url) {
          throw new Error(uploadRes.error || 'Failed to upload category image.');
        }
        finalImageUrl = uploadRes.url;
      }

      const res = await createCategory({
        name: name.trim(),
        description: description.trim() || null,
        image_url: finalImageUrl,
        is_active: isActive,
      });

      if (!res.success || !res.category) {
        throw new Error(res.error || 'Failed to create category.');
      }

      setSuccess('Category created successfully! Redirecting...');
      setTimeout(() => {
        router.push('/admin/categories');
      }, 700);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div 
        className="px-6 md:px-10 pt-6 pb-5 flex items-center gap-4 border-b border-gray-100"
        style={{ background: 'var(--color-surface-container-lowest)' }}
      >
        <button 
          onClick={() => router.back()} 
          className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors cursor-pointer text-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-extrabold text-[24px] tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
            Add New Category
          </h1>
          <p className="text-[13px] text-gray-500">
            Create and publish a new product category taxonomy
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="px-6 md:px-10 py-6 max-w-2xl">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xs border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Feedback Alerts */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* 1. Category Name (Required) */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                Category Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. A2 Vedic Ghee, Organic Butter, Mithai..."
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50/50 text-sm font-medium text-gray-900 focus:bg-white focus:border-[#0f3e26] focus:ring-2 focus:ring-emerald-900/10 outline-none transition-all"
                required
              />
            </div>

            {/* 2. Description (Optional) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                  Description
                </label>
                <span className="text-[11px] text-gray-400 font-medium">Optional</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a descriptive overview for this category..."
                rows={3}
                className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-xs font-medium text-gray-900 focus:bg-white focus:border-[#0f3e26] focus:ring-2 focus:ring-emerald-900/10 outline-none transition-all resize-none"
              />
            </div>

            {/* 3. Category Image / Icon (Required) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                  Category Image / Icon <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-bold text-emerald-700">Required</span>
              </div>

              {/* Upload box + Preview */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <div className="w-18 h-18 rounded-2xl bg-white border border-gray-200 shadow-2xs flex items-center justify-center overflow-hidden shrink-0">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                      onError={() => {
                        setImagePreview(null);
                      }}
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-800 hover:bg-gray-100 hover:border-gray-300 transition-colors cursor-pointer shadow-2xs">
                      <UploadCloud className="w-4 h-4 text-emerald-700" />
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
                        className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove Image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-400">
                    {imageFile ? imageFile.name : 'PNG, JPG, or WebP up to 5MB'}
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Status (Active / Inactive) */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700">
                  Status
                </label>
                <p className="text-[11px] text-gray-400">
                  {isActive ? 'Active — Visible in shop taxonomy and filters' : 'Inactive — Hidden from catalog'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsActive(true)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    !isActive
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-5 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-[#0f3e26] hover:from-emerald-900 hover:to-[#0a2e1c] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Category...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Create Category</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
