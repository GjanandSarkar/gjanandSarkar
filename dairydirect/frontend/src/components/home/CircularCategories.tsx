"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Milk,
  Flame,
  ChefHat,
  Sparkles, 
  Palette, 
  Leaf, 
  BookOpen, 
  Trophy, 
  Gem, 
  Sprout, 
  LayoutGrid,
  Shirt,
  Headphones
} from 'lucide-react';

export function CircularCategories() {
  const categories = [
    {
      name: 'Milk',
      emoji: '🥛',
      href: '/products?category=Milk',
      bg: 'bg-emerald-50',
    },
    {
      name: 'Ghee',
      emoji: '🧈',
      href: '/products?category=Ghee',
      bg: 'bg-amber-50',
    },
    {
      name: 'Paneer',
      emoji: '🧀',
      href: '/products?category=Paneer',
      bg: 'bg-orange-50',
    },
    {
      name: 'Curd & Lassi',
      emoji: '🥣',
      href: '/products?category=Curd',
      bg: 'bg-emerald-50',
    },
    {
      name: 'Handicrafts',
      emoji: '🐘',
      href: '/products?category=Handicrafts',
      bg: 'bg-purple-50',
    },
    {
      name: 'Ayurveda',
      emoji: '🌿',
      href: '/products?category=Ayurveda',
      bg: 'bg-emerald-100/50',
    },
    {
      name: 'Oils & Spices',
      emoji: '🫒',
      href: '/products?category=Cold-Pressed%20Oils',
      bg: 'bg-amber-50',
    },
    {
      name: 'Fashion',
      emoji: '👗',
      href: '/products?category=Fashion',
      bg: 'bg-pink-50',
    },
    {
      name: 'Electronics',
      emoji: '🎧',
      href: '/products?category=Electronics',
      bg: 'bg-blue-50',
    },
    {
      name: 'Home & Kitchen',
      emoji: '🍳',
      href: '/products?category=Home%20%26%20Kitchen',
      bg: 'bg-amber-50',
    },
    {
      name: 'All Categories',
      emoji: '⊞',
      href: '/products',
      bg: 'bg-gray-100',
    },
  ];

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar pb-2 pt-1">
        {categories.map((cat) => (
          <Link
            key={cat.name}
            href={cat.href}
            className="flex flex-col items-center gap-2 group min-w-[72px] sm:min-w-[84px] text-center"
          >
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${cat.bg} border-2 border-transparent group-hover:border-[#c88a23] group-hover:shadow-md flex items-center justify-center text-2xl transition-all duration-200 group-hover:scale-105 group-active:scale-95`}>
              <span className="group-hover:rotate-6 transition-transform">{cat.emoji}</span>
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-gray-700 group-hover:text-[#0f3e26] transition-colors leading-tight line-clamp-1">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
