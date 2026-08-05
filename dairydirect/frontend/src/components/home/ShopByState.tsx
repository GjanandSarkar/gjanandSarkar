"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin, Sparkles } from 'lucide-react';

export function ShopByState() {
  const [selectedState, setSelectedState] = useState('Gujarat');

  const states = [
    {
      name: 'Gujarat',
      specialties: 'Bandhani, Patola, Handicrafts, Dairy',
      badge: 'Gir & Saurashtra',
      emoji: '🦁',
      color: 'from-amber-500/10 to-orange-500/10 border-amber-200',
    },
    {
      name: 'Rajasthan',
      specialties: 'Marble, Blue Pottery, Textiles, Ghee',
      badge: 'Royal Heritage',
      emoji: '🏰',
      color: 'from-rose-500/10 to-amber-500/10 border-rose-200',
    },
    {
      name: 'Kerala',
      specialties: 'Spices, Coconut Products, Ayurveda',
      badge: "God's Own Country",
      emoji: '🌴',
      color: 'from-emerald-500/10 to-teal-500/10 border-emerald-200',
    },
    {
      name: 'Tamil Nadu',
      specialties: 'Silk, Bronze Handicrafts, Filter Coffee',
      badge: 'Temple Craft',
      emoji: '🛕',
      color: 'from-yellow-500/10 to-amber-500/10 border-yellow-200',
    },
    {
      name: 'Kashmir',
      specialties: 'Pashmina, Saffron, Walnuts, Dry Fruits',
      badge: 'Paradise of Earth',
      emoji: '🏔️',
      color: 'from-blue-500/10 to-cyan-500/10 border-blue-200',
    },
    {
      name: 'West Bengal',
      specialties: 'Tant Handloom, Terracotta, Sweets',
      badge: 'Cultural Capital',
      emoji: '🐯',
      color: 'from-red-500/10 to-yellow-500/10 border-red-200',
    },
  ];

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-[#c88a23]" />
            <span className="text-xs font-bold text-[#c88a23] uppercase tracking-wider">
              Geographical Indications & Traditions
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-[#0f3e26] tracking-tight">
            Shop by State
          </h2>
          <p className="text-xs md:text-sm text-gray-500 font-medium mt-0.5">
            Explore unique artisanal products from every corner of India.
          </p>
        </div>

        <Link
          href="/products"
          className="text-xs sm:text-sm font-bold text-[#c88a23] hover:text-[#0f3e26] flex items-center gap-1 transition-colors"
        >
          <span>View All States</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Grid: Left India Map Art + Right State Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left: Illustrated Stylized India Map Card (4 cols) */}
        <div className="lg:col-span-4 bg-gradient-to-b from-[#fbf8f2] to-[#f4ebe0] rounded-2xl p-6 border border-[#e9dfd0] shadow-xs flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[300px]">
          
          <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
            <svg viewBox="0 0 400 450" className="w-full h-full fill-[#0f3e26]">
              <path d="M 200,20 Q 240,60 260,110 Q 320,130 350,180 Q 310,230 290,280 Q 250,360 200,420 Q 150,360 110,280 Q 90,230 50,180 Q 80,130 140,110 Z" />
            </svg>
          </div>

          <div className="w-20 h-20 rounded-full bg-white shadow-md border-2 border-amber-300 flex items-center justify-center text-4xl mb-4 relative z-10">
            <span>🇮🇳</span>
          </div>

          <h3 className="text-xl font-black text-[#0f3e26] mb-1 relative z-10">
            Bharat Darshan
          </h3>
          <p className="text-xs text-gray-600 max-w-xs mb-4 relative z-10">
            Over 28 States & 8 Union Territories connected directly with millions of conscious Indian buyers.
          </p>

          <div className="inline-flex items-center gap-2 bg-[#0f3e26] text-white text-xs font-bold px-4 py-2 rounded-full relative z-10 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Discover State Specialties</span>
          </div>
        </div>

        {/* Right: 6 State Cards (8 cols) */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {states.map((st) => (
            <Link
              key={st.name}
              href={`/products?state=${encodeURIComponent(st.name.toLowerCase())}`}
              onClick={() => setSelectedState(st.name)}
              className={`bg-white rounded-xl p-4 border transition-all group hover:scale-[1.02] hover:shadow-md ${
                selectedState === st.name ? 'border-[#0f3e26] ring-1 ring-[#0f3e26]' : 'border-gray-200 hover:border-[#c88a23]'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                  <span>{st.emoji}</span>
                </div>
                <span className="text-[10px] font-bold text-[#c88a23] bg-amber-50 px-2 py-0.5 rounded-full">
                  {st.badge}
                </span>
              </div>

              <h4 className="text-sm font-black text-gray-900 group-hover:text-[#0f3e26] transition-colors">
                {st.name}
              </h4>
              <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-snug">
                {st.specialties}
              </p>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
