"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Milk,
  Flame,
  ChefHat,
  Leaf,
  Hammer,
  FlaskConical,
  Droplets,
  Shirt,
  Headphones,
  LayoutGrid,
  Wheat,
} from 'lucide-react';

const categories = [
  {
    name: 'Milk',
    icon: <Milk className="w-6 h-6 text-emerald-700" />,
    href: '/products?category=Milk',
    bg: 'bg-emerald-50',
  },
  {
    name: 'Ghee',
    icon: <Flame className="w-6 h-6 text-amber-600" />,
    href: '/products?category=Ghee',
    bg: 'bg-amber-50',
  },
  {
    name: 'Paneer',
    icon: <ChefHat className="w-6 h-6 text-orange-600" />,
    href: '/products?category=Paneer',
    bg: 'bg-orange-50',
  },
  {
    name: 'Curd & Lassi',
    icon: <Droplets className="w-6 h-6 text-teal-600" />,
    href: '/products?category=Curd',
    bg: 'bg-teal-50',
  },
  {
    name: 'Handicrafts',
    icon: <Hammer className="w-6 h-6 text-purple-600" />,
    href: '/products?category=Handicrafts',
    bg: 'bg-purple-50',
  },
  {
    name: 'Ayurveda',
    icon: <FlaskConical className="w-6 h-6 text-emerald-700" />,
    href: '/products?category=Ayurveda',
    bg: 'bg-emerald-100/60',
  },
  {
    name: 'Oils & Spices',
    icon: <Leaf className="w-6 h-6 text-lime-700" />,
    href: '/products?category=Cold-Pressed%20Oils',
    bg: 'bg-lime-50',
  },
  {
    name: 'Fashion',
    icon: <Shirt className="w-6 h-6 text-pink-600" />,
    href: '/products?category=Fashion',
    bg: 'bg-pink-50',
  },
  {
    name: 'Electronics',
    icon: <Headphones className="w-6 h-6 text-blue-600" />,
    href: '/products?category=Electronics',
    bg: 'bg-blue-50',
  },
  {
    name: 'Home & Kitchen',
    icon: <Wheat className="w-6 h-6 text-amber-700" />,
    href: '/products?category=Home%20%26%20Kitchen',
    bg: 'bg-amber-50',
  },
  {
    name: 'All',
    icon: <LayoutGrid className="w-6 h-6 text-gray-600" />,
    href: '/products',
    bg: 'bg-gray-100',
  },
];

export function CircularCategories() {
  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar pb-2 pt-1">
        {categories.map((cat) => (
          <Link
            key={cat.name}
            href={cat.href}
            className="flex flex-col items-center gap-2 group min-w-[72px] sm:min-w-[84px] text-center"
          >
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${cat.bg} border-2 border-transparent group-hover:border-[#c88a23] group-hover:shadow-md flex items-center justify-center transition-all duration-200 group-hover:scale-105 group-active:scale-95`}>
              {cat.icon}
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
