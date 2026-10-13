"use client";

import React, { useRef, useState } from 'react';
import { UploadCloud, Plus, X, Star, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

export interface ImageItem {
  id: string;
  file?: File;
  url: string;
  isPrimary?: boolean;
}

interface MultiImageUploadProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function MultiImageUpload({
  images,
  onChange,
  maxImages = 10,
  disabled = false,
}: MultiImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) return;

    const selectedFiles = Array.from(files).slice(0, remainingSlots);
    const newItems: ImageItem[] = selectedFiles.map((file, idx) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${idx}`,
      file,
      url: URL.createObjectURL(file),
      isPrimary: images.length === 0 && idx === 0,
    }));

    const updated = [...images, ...newItems];
    // Ensure exactly one image is marked primary
    if (!updated.some((img) => img.isPrimary) && updated.length > 0) {
      updated[0].isPrimary = true;
    }

    onChange(updated);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSetPrimary = (index: number) => {
    const updated = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    const wasPrimary = images[index]?.isPrimary;
    const updated = images.filter((_, i) => i !== index);
    if (wasPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  const handleAddUrl = () => {
    if (!urlInputValue.trim()) return;
    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) return;

    const newItem: ImageItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      url: urlInputValue.trim(),
      isPrimary: images.length === 0,
    };

    const updated = [...images, newItem];
    if (!updated.some((img) => img.isPrimary) && updated.length > 0) {
      updated[0].isPrimary = true;
    }

    onChange(updated);
    setUrlInputValue('');
    setShowUrlInput(false);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Hidden Multi-file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          handleFiles(e.target.files);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
      />

      {/* Main Empty State Dropzone */}
      {images.length === 0 ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`w-full h-48 rounded-[14px] border-2 border-dashed flex flex-col items-center justify-center p-5 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-primary bg-primary/5 scale-[0.99]'
              : 'border-[#d8d4c9] hover:border-primary/60 bg-white'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="p-3 rounded-full mb-2 bg-[#f2ede4] text-[#0c3c26]">
            <UploadCloud className="w-7 h-7" />
          </div>
          <span className="font-bold text-[14px] text-[#1c201e] mb-0.5">
            Click to upload multiple images or drag & drop
          </span>
          <span className="text-[12px] font-medium text-[#8a948e] mb-3">
            Select 1 or more images (PNG, JPG, WEBP, up to 10 photos)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[8px] border text-[13px] font-semibold border-[#0c3c26] text-[#0c3c26] hover:bg-[#0c3c26]/5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Choose Files (Multiple)</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowUrlInput(!showUrlInput);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border text-[13px] font-medium border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Paste URL</span>
            </button>
          </div>
        </div>
      ) : (
        /* Image Cards Grid View */
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-semibold text-gray-700">
              {images.length} image{images.length > 1 ? 's' : ''} added{' '}
              <span className="text-gray-400 font-normal">
                (First image is Cover. Click ★ to change cover)
              </span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-xs font-semibold text-gray-500 hover:text-primary flex items-center gap-1"
              >
                <LinkIcon className="w-3 h-3" />
                <span>+ Add via URL</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+ Upload More Files</span>
              </button>
            </div>
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-3 rounded-[14px] border bg-[#faf9f6] ${
              isDragging ? 'border-primary bg-primary/5' : 'border-[#e4e2db]'
            }`}
          >
            {images.map((item, idx) => (
              <div
                key={item.id}
                className={`group relative aspect-square rounded-[12px] overflow-hidden border-2 bg-white shadow-sm transition-all ${
                  item.isPrimary
                    ? 'border-emerald-600 ring-2 ring-emerald-600/20'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                {/* Thumbnail Image */}
                <img
                  src={item.url}
                  alt={`Product view ${idx + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Primary Badge */}
                {item.isPrimary ? (
                  <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-black tracking-wide shadow-md">
                    <Star className="w-3 h-3 fill-current" />
                    <span>COVER</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(idx)}
                    title="Set as cover image"
                    className="absolute top-1.5 left-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/75 hover:bg-black text-white text-[10px] font-semibold shadow-md"
                  >
                    <Star className="w-3 h-3" />
                    <span>Make Cover</span>
                  </button>
                )}

                {/* Remove Image Button */}
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  title="Remove image"
                  className="absolute top-1.5 right-1.5 z-10 p-1 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-md opacity-80 hover:opacity-100 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Footer index indicator */}
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold">
                  #{idx + 1}
                </div>
              </div>
            ))}

            {/* Add More Files Card */}
            {images.length < maxImages && (
              <div
                onClick={() => !disabled && fileInputRef.current?.click()}
                className="aspect-square rounded-[12px] border-2 border-dashed border-gray-300 hover:border-primary/60 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white hover:bg-gray-50/80 p-2 text-center"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 mb-1 group-hover:bg-primary/10 group-hover:text-primary">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-gray-700">Add More</span>
                <span className="text-[9px] text-gray-400">Multiple files</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* URL Input Dropdown/Accordion */}
      {showUrlInput && (
        <div className="flex items-center gap-2 p-2.5 rounded-[10px] border border-gray-200 bg-white shadow-sm">
          <ImageIcon className="w-4 h-4 text-gray-400 ml-1" />
          <input
            type="url"
            value={urlInputValue}
            onChange={(e) => setUrlInputValue(e.target.value)}
            placeholder="Paste public image link (https://...)"
            className="flex-1 text-[13px] outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddUrl();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-3 py-1 rounded-[6px] bg-primary text-white text-[12px] font-bold hover:bg-primary/90"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput(false)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
