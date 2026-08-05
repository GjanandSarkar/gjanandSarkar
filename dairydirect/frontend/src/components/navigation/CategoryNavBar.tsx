"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Menu, 
  ChevronDown, 
  Sparkles,
  Truck,
  ShieldCheck,
  Milk,
  Flame,
  Layers,
  Activity,
  HeartHandshake
} from 'lucide-react';

export function CategoryNavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  // Reduced, core categories with spacious separation
  const reducedCategories = [
    { name: 'Milk', href: '/products?category=Milk', badge: 'Fresh Daily' },
    { name: 'Ghee', href: '/products?category=Ghee', badge: 'Bilona' },
    { name: 'Paneer', href: '/products?category=Paneer', badge: 'Malai' },
    { name: 'Curd & Lassi', href: '/products?category=Curd', badge: 'Probiotic' },
    { name: 'Cold-Pressed Oils', href: '/products?category=Cold-Pressed%20Oils', badge: 'Pure' },
  ];

  // Full catalog categories inside All Categories & More dropdowns
  const allCategories = [
    { name: 'All Products (Full Catalog)', href: '/products', icon: '🌟' },
    { name: 'A2 Gir Cow Milk', href: '/products?category=Milk', icon: '🥛' },
    { name: 'Vedic Bilona Ghee', href: '/products?category=Ghee', icon: '🧈' },
    { name: 'Fresh Malai Paneer', href: '/products?category=Paneer', icon: '🧀' },
    { name: 'Organic Curd & Lassi', href: '/products?category=Curd', icon: '🥣' },
    { name: 'Cold-Pressed Organic Oils', href: '/products?category=Cold-Pressed%20Oils', icon: '🫒' },
    { name: 'Ayurveda & Vedic Herbs', href: '/products?category=Ayurveda', icon: '🌿' },
    { name: 'Artisanal Handicrafts', href: '/products?category=Handicrafts', icon: '🐘' },
    { name: 'Spices & Traditional Masalas', href: '/products?category=Spices', icon: '🌶️' },
    { name: 'Organic Farm Groceries', href: '/products?category=Organic%20Groceries', icon: '🌾' },
    { name: 'Handloom & Textiles', href: '/products?category=Fashion', icon: '👗' },
    { name: 'Pooja & Spiritual Essentials', href: '/products?category=Pooja', icon: '🪔' },
    { name: 'Home & Kitchen Essentials', href: '/products?category=Home%20%26%20Kitchen', icon: '🍳' },
    { name: 'Natural Beauty & Personal Care', href: '/products?category=Beauty%20%26%20Personal%20Care', icon: '💄' },
  ];

  // Additional categories inside "More" dropdown
  const moreCategories = [
    { name: 'Ayurveda & Herbs', href: '/products?category=Ayurveda', icon: '🌿', desc: 'Ancient wellness' },
    { name: 'Artisanal Handicrafts', href: '/products?category=Handicrafts', icon: '🐘', desc: 'Handmade decor' },
    { name: 'Spices & Masalas', href: '/products?category=Spices', icon: '🌶️', desc: 'Aromatic & pure' },
    { name: 'Organic Groceries', href: '/products?category=Organic%20Groceries', icon: '🌾', desc: 'Direct farm harvest' },
    { name: 'Pooja Essentials', href: '/products?category=Pooja', icon: '🪔', desc: 'Sacred items' },
    { name: 'Home & Kitchen', href: '/products?category=Home%20%26%20Kitchen', icon: '🍳', desc: 'Cookware & brass' },
    { name: 'View Complete Catalog ↗', href: '/products', icon: '✨', desc: 'All departments' },
  ];

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full bg-white border-b border-gray-200/90 text-gray-700 relative z-30 shadow-2xs">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-start gap-4 lg:gap-8 h-11 md:h-12">
        
        {/* ── Left: All Categories Dropdown Trigger ── */}
        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 font-black text-gray-900 hover:text-[#0f3e26] transition-colors py-1.5 px-2 rounded-lg hover:bg-gray-100/70 cursor-pointer"
          >
            <Menu className="w-4 h-4 text-[#0f3e26]" />
            <span className="text-xs md:text-sm font-extrabold tracking-tight">All Categories</span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMenuOpen && (
            <div className="absolute left-0 top-full mt-2 w-72 max-h-[420px] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="px-4 py-2 text-[10px] font-black text-[#c88a23] uppercase tracking-wider border-b border-gray-100 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Explore Departments
                </span>
                <span className="text-gray-400 font-medium">14 categories</span>
              </div>
              <div className="py-1">
                {allCategories.map((cat) => (
                  <Link
                    key={cat.name}
                    href={cat.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-[#0f3e26] transition-colors"
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span>{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Vertical Divider ── */}
        <div className="h-5 w-px bg-gray-300/80 shrink-0 hidden sm:block" />

        {/* ── Center: Spacious Category Navigation Links (Reduced list with wide spacing) ── */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-12 xl:gap-14 overflow-x-auto no-scrollbar py-1">
          {reducedCategories.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-gray-800 hover:text-[#0f3e26] font-bold text-xs lg:text-[13px] tracking-tight hover:underline underline-offset-8 decoration-2 decoration-[#c88a23] transition-all whitespace-nowrap py-1 px-1 group flex items-center gap-1.5"
            >
              <span>{item.name}</span>
            </Link>
          ))}

          {/* More Dropdown */}
          <div ref={moreRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className="flex items-center gap-1 text-gray-700 hover:text-[#0f3e26] font-bold text-xs lg:text-[13px] hover:bg-gray-100/70 py-1 px-2 rounded-lg transition-colors cursor-pointer"
            >
              <span>More</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isMoreOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMoreOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="px-3.5 py-1.5 text-[10px] font-black text-[#c88a23] uppercase tracking-wider border-b border-gray-100">
                  More Categories
                </div>
                <div className="py-1">
                  {moreCategories.map((cat) => (
                    <Link
                      key={cat.name}
                      href={cat.href}
                      onClick={() => setIsMoreOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-2 text-xs text-gray-800 hover:bg-emerald-50 hover:text-[#0f3e26] transition-colors group"
                    >
                      <span className="text-base">{cat.icon}</span>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 group-hover:text-[#0f3e26] truncate">{cat.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{cat.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* ── Right: Covers remaining space with live customer trust highlights ── */}
        <div className="ml-auto hidden xl:flex items-center gap-6 shrink-0 text-xs font-semibold text-gray-600">
          <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50/90 px-3 py-1 rounded-full border border-emerald-200/60">
            <Truck className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
            <span className="text-[11px] font-bold">Doorstep by 7:00 AM</span>
          </div>

          <div className="flex items-center gap-1.5 text-amber-900 bg-amber-50/90 px-3 py-1 rounded-full border border-amber-200/60">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            <span className="text-[11px] font-bold">100% Lab Tested Purity</span>
          </div>
        </div>

      </div>
    </div>
  );
}
