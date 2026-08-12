"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Category } from '@/lib/api/categories';
import { 
  ChevronDown, 
  Check, 
  Plus, 
  Search, 
  Tags, 
  Loader2, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomCategorySelectProps {
  categories: Category[];
  value: string;
  onChange: (categoryName: string) => void;
  onAddNewCategory: () => void;
  isLoading?: boolean;
  error?: string;
}

export function CustomCategorySelect({
  categories,
  value,
  onChange,
  onAddNewCategory,
  isLoading = false,
  error
}: CustomCategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectedCategory = categories.find(
    c => c.name.toLowerCase() === (value || '').toLowerCase()
  );

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative w-full">
      {/* 1. Main Selected Trigger Box */}
      <button
        type="button"
        onClick={() => !isLoading && setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white border transition-all cursor-pointer text-left ${
          isOpen
            ? 'border-[#0f3e26] ring-2 ring-emerald-900/10 shadow-md'
            : error
            ? 'border-rose-300 hover:border-rose-400 bg-rose-50/20'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Category Thumbnail */}
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center overflow-hidden shrink-0 text-emerald-800 shadow-2xs relative">
            {selectedCategory?.image_url ? (
              <img
                src={selectedCategory.image_url}
                alt={selectedCategory.name}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Tags className="w-5 h-5" />
            )}
          </div>

          {/* Category Details */}
          <div className="min-w-0">
            {isLoading ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0f3e26]" />
                <span>Loading categories...</span>
              </div>
            ) : selectedCategory ? (
              <>
                <span className="font-extrabold text-sm text-gray-900 block truncate">
                  {selectedCategory.name}
                </span>
                <span className="text-[11px] text-gray-500 truncate block">
                  {selectedCategory.description || 'Configured taxonomy category'}
                </span>
              </>
            ) : value ? (
              <span className="font-extrabold text-sm text-gray-900 block truncate">
                {value}
              </span>
            ) : (
              <span className="font-medium text-sm text-gray-400 block">
                Select a category from the database...
              </span>
            )}
          </div>
        </div>

        {/* Right Arrow / Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
            isOpen ? 'bg-emerald-100 text-[#0f3e26]' : 'text-gray-400 hover:text-gray-600'
          }`}>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : 'rotate-0'
              }`}
            />
          </div>
        </div>
      </button>

      {/* 2. Floating Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden z-50 flex flex-col max-h-80"
          >
            {/* Search Input (if > 2 categories) */}
            {categories.length > 2 && (
              <div className="p-3 border-b border-gray-100 bg-gray-50/70">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search added categories..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:border-[#0f3e26] outline-none shadow-2xs"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* List of Real Added Categories */}
            <div className="overflow-y-auto p-2 space-y-1 divide-y divide-gray-50 flex-1">
              {filteredCategories.length === 0 ? (
                <div className="py-8 px-4 text-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
                    <Tags className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-gray-800">
                    {search ? `No category matching "${search}"` : 'No categories found in database'}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Click "Add New Category" below to create one.
                  </p>
                </div>
              ) : (
                filteredCategories.map((cat) => {
                  const isSelected = (value || '').toLowerCase() === cat.name.toLowerCase();
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        onChange(cat.name);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl transition-all cursor-pointer text-left group ${
                        isSelected
                          ? 'bg-emerald-50/90 text-emerald-950 font-bold border border-emerald-200/80 shadow-2xs'
                          : 'hover:bg-gray-50 text-gray-700 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Category Thumbnail */}
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center overflow-hidden shrink-0 text-emerald-700 shadow-2xs">
                          {cat.image_url ? (
                            <img
                              src={cat.image_url}
                              alt={cat.name}
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <Tags className="w-4 h-4" />
                          )}
                        </div>

                        {/* Name and Description */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-gray-900 group-hover:text-[#0f3e26] truncate">
                              {cat.name}
                            </span>
                            {cat.is_active && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                                Active
                              </span>
                            )}
                          </div>
                          {cat.description && (
                            <p className="text-[10px] text-gray-500 truncate mt-0.5">
                              {cat.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Selected Checkmark */}
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-[#0f3e26] text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Bottom Action: Create Category */}
            <div className="p-2.5 border-t border-gray-100 bg-gray-50/80">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onAddNewCategory();
                }}
                className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-[#0f3e26] to-[#1b5e3a] hover:from-[#144f31] hover:to-[#227246] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span>Add New Category</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
