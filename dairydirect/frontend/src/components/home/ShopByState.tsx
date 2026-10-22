"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin, Globe } from 'lucide-react';

// State accent colours — no emojis, just subtle colour-coded state pills
const states = [
  {
    name: 'Gujarat',
    specialties: 'Bandhani, Patola, Handicrafts, Dairy',
    badge: 'Gir & Saurashtra',
    abbr: 'GJ',
    color: 'from-amber-500/10 to-orange-500/10 border-warning/20',
    abbrColor: 'bg-warning-bg text-warning',
  },
  {
    name: 'Rajasthan',
    specialties: 'Marble, Blue Pottery, Textiles, Ghee',
    badge: 'Royal Heritage',
    abbr: 'RJ',
    color: 'from-rose-500/10 to-amber-500/10 border-error/20',
    abbrColor: 'bg-error-bg text-error',
  },
  {
    name: 'Kerala',
    specialties: 'Spices, Coconut Products, Ayurveda',
    badge: "God's Own Country",
    abbr: 'KL',
    color: 'from-emerald-500/10 to-teal-500/10 border-success/20',
    abbrColor: 'bg-success-bg text-success',
  },
  {
    name: 'Tamil Nadu',
    specialties: 'Silk, Bronze Handicrafts, Filter Coffee',
    badge: 'Temple Craft',
    abbr: 'TN',
    color: 'from-yellow-500/10 to-amber-500/10 border-yellow-200',
    abbrColor: 'bg-warning-bg text-yellow-800',
  },
  {
    name: 'Kashmir',
    specialties: 'Pashmina, Saffron, Walnuts, Dry Fruits',
    badge: 'Paradise of Earth',
    abbr: 'JK',
    color: 'from-blue-500/10 to-cyan-500/10 border-info/20',
    abbrColor: 'bg-info-bg text-blue-800',
  },
  {
    name: 'West Bengal',
    specialties: 'Tant Handloom, Terracotta, Sweets',
    badge: 'Cultural Capital',
    abbr: 'WB',
    color: 'from-red-500/10 to-yellow-500/10 border-error/20',
    abbrColor: 'bg-error-bg text-error',
  },
];

export function ShopByState() {
  const [selectedState, setSelectedState] = useState('Gujarat');

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-[#c88a23]" />
            <span className="text-xs font-bold text-[#c88a23] uppercase tracking-wider">
              Geographical Indications &amp; Traditions
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-primary tracking-tight">
            Shop by State
          </h2>
          <p className="text-xs md:text-sm text-foreground-muted font-medium mt-0.5">
            Explore unique artisanal products from every corner of India.
          </p>
        </div>

        <Link
          href="/products"
          className="text-xs sm:text-sm font-bold text-[#c88a23] hover:text-primary flex items-center gap-1 transition-colors"
        >
          <span>View All States</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left: India Info Card */}
        <div className="lg:col-span-4 bg-gradient-to-b from-[#fbf8f2] to-[#f4ebe0] rounded-2xl p-6 border border-[#e9dfd0] shadow-xs flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[300px]">
          
          <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
            <svg viewBox="0 0 400 450" className="w-full h-full fill-[var(--primary)]">
              <path d="M 200,20 Q 240,60 260,110 Q 320,130 350,180 Q 310,230 290,280 Q 250,360 200,420 Q 150,360 110,280 Q 90,230 50,180 Q 80,130 140,110 Z" />
            </svg>
          </div>

          <div className="w-20 h-20 rounded-full bg-surface shadow-md border-2 border-warning flex items-center justify-center mb-4 relative z-10">
            <Globe className="w-9 h-9 text-primary" />
          </div>

          <h3 className="text-xl font-black text-primary mb-1 relative z-10">
            Bharat Darshan
          </h3>
          <p className="text-xs text-foreground-muted max-w-xs mb-4 relative z-10">
            Over 28 States &amp; 8 Union Territories connected directly with millions of conscious Indian buyers.
          </p>

          <div className="inline-flex items-center gap-2 bg-primary text-on-primary text-xs font-bold px-4 py-2 rounded-full relative z-10 shadow-xs">
            <MapPin className="w-3.5 h-3.5 text-warning" />
            <span>Discover State Specialties</span>
          </div>
        </div>

        {/* Right: 6 State Cards */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {states.map((st) => (
            <Link
              key={st.name}
              href={`/products?state=${encodeURIComponent(st.name.toLowerCase())}`}
              onClick={() => setSelectedState(st.name)}
              className={`bg-surface rounded-xl p-4 border transition-all group hover:scale-[1.02] hover:shadow-md ${
                selectedState === st.name ? 'border-primary ring-1 ring-[var(--primary)]' : 'border-border hover:border-[#c88a23]'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                {/* State abbreviation badge instead of emoji */}
                <div className={`w-10 h-10 rounded-lg font-black text-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${st.abbrColor}`}>
                  {st.abbr}
                </div>
                <span className="text-[10px] font-bold text-[#c88a23] bg-warning-bg px-2 py-0.5 rounded-full">
                  {st.badge}
                </span>
              </div>

              <h4 className="text-sm font-black text-foreground group-hover:text-primary transition-colors">
                {st.name}
              </h4>
              <p className="text-[11px] text-foreground-muted line-clamp-2 mt-1 leading-snug">
                {st.specialties}
              </p>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
