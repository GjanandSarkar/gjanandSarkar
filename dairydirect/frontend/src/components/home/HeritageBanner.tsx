"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight, Leaf, Shirt, Sprout, Hammer, Heart, BadgeCheck } from 'lucide-react';

export function HeritageBanner() {
  const collections = [
    {
      title: 'Handmade',
      subtitle: 'Crafted with Love',
      icon: <Hammer className="w-7 h-7 text-amber-600" />,
      href: '/categories/handicrafts',
      bg: 'bg-amber-50',
    },
    {
      title: 'Ayurveda',
      subtitle: 'Natural & Pure',
      icon: <Leaf className="w-7 h-7 text-emerald-600" />,
      href: '/categories/ayurveda',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Handloom',
      subtitle: 'Woven with Pride',
      icon: <Shirt className="w-7 h-7 text-indigo-600" />,
      href: '/categories/fashion',
      bg: 'bg-indigo-50',
    },
    {
      title: 'Organic',
      subtitle: 'Good for You',
      icon: <Sprout className="w-7 h-7 text-green-600" />,
      href: '/categories/organic',
      bg: 'bg-green-50',
    },
    {
      title: 'Village Products',
      subtitle: 'Support Local Artisans',
      icon: <Heart className="w-7 h-7 text-red-600" />,
      href: '/categories/handicrafts',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6">
      <div className="w-full bg-gradient-to-r from-[#0d3b24] via-[#0b331f] to-[#072415] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg">
        
        {/* Decorative background */}
        <div className="absolute -left-10 -bottom-10 w-64 h-64 opacity-10 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-white">
            <path d="M50 10 C65 25 80 45 70 70 C60 90 40 95 30 75 C20 55 35 25 50 10 Z" />
          </svg>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
          
          {/* Left: Title & CTA */}
          <div className="max-w-md text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-3">
              <BadgeCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>Authentic Bharat Heritage</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight mb-3 tracking-tight">
              Explore India's Rich <br className="hidden sm:inline" />
              Heritage &amp; Culture
            </h2>

            <p className="text-emerald-100/90 text-sm mb-6 leading-relaxed">
              Handpicked collections from every corner of India, crafted by master artisans and local organic cultivators.
            </p>

            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-amber-50 text-[#0d3b24] font-black text-sm rounded-full shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <span>Explore Collections</span>
              <ArrowRight className="w-4 h-4 text-[#0d3b24]" />
            </Link>
          </div>

          {/* Right: Showcase Cards */}
          <div className="flex-1 w-full flex items-center gap-3 md:gap-4 overflow-x-auto no-scrollbar py-2">
            {collections.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="min-w-[130px] sm:min-w-[150px] bg-white rounded-2xl p-3.5 flex flex-col items-center text-center text-gray-900 group hover:scale-105 transition-all shadow-md shrink-0"
              >
                <div className={`w-16 h-16 rounded-xl ${item.bg} flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform`}>
                  {item.icon}
                </div>
                <h3 className="text-xs sm:text-sm font-black text-[#0d3b24] line-clamp-1">
                  {item.title}
                </h3>
                <span className="text-[10px] text-gray-500 font-medium line-clamp-1 mt-0.5">
                  {item.subtitle}
                </span>
              </Link>
            ))}

            <Link
              href="/products"
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white text-white hover:text-[#0d3b24] flex items-center justify-center shrink-0 transition-colors ml-1"
              aria-label="View more collections"
            >
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}
