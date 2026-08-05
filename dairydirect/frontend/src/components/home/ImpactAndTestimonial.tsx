"use client";

import React, { useState } from 'react';
import { 
  Star, 
  ShieldCheck, 
  Users, 
  Store, 
  MapPin, 
  Sparkles, 
  Quote, 
  CheckCircle2, 
  Award, 
  HeartHandshake,
  Check
} from 'lucide-react';

const stats = [
  {
    value: '50K+',
    label: 'Happy Families',
    sublabel: 'Across Bharat',
    icon: Users,
    iconBg: 'bg-emerald-500/10 text-emerald-700 border-emerald-200/60',
    badge: '100% Pure',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    glow: 'from-emerald-500/5 to-transparent',
  },
  {
    value: '15K+',
    label: 'Kisan & Artisans',
    sublabel: 'Directly Empowered',
    icon: Store,
    iconBg: 'bg-amber-500/10 text-[#c88a23] border-amber-200/60',
    badge: 'Fair Price',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    glow: 'from-amber-500/5 to-transparent',
  },
  {
    value: '10K+',
    label: 'Pincodes Reached',
    sublabel: 'Cold-Chain Delivery',
    icon: MapPin,
    iconBg: 'bg-blue-500/10 text-blue-700 border-blue-200/60',
    badge: 'Pan-India',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    glow: 'from-blue-500/5 to-transparent',
  },
  {
    value: '4.9★',
    label: 'Customer Rating',
    sublabel: '12,000+ Reviews',
    icon: Award,
    iconBg: 'bg-purple-500/10 text-purple-700 border-purple-200/60',
    badge: 'Top Rated',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    glow: 'from-purple-500/5 to-transparent',
  },
];

const reviews = [
  {
    id: 0,
    name: 'Amit Sharma',
    location: 'Ahmedabad, Gujarat',
    initials: 'AS',
    avatarGradient: 'from-[#0f3e26] via-[#144f31] to-[#1e6f46]',
    text: '“Unmatched freshness & authentic aroma. The A2 Gir cow bilona ghee reminds me of my village home in Saurashtra!”',
    verified: 'Verified Ghee Buyer',
  },
  {
    id: 1,
    name: 'Pooja Verma',
    location: 'Jaipur, Rajasthan',
    initials: 'PV',
    avatarGradient: 'from-[#c88a23] via-[#b67a18] to-[#915e0e]',
    text: '“Prompt 7 AM doorstep delivery in sterile glass bottles. 100% lab tested, zero adulteration & super delicious.”',
    verified: 'Verified Dairy Subscriber',
  },
  {
    id: 2,
    name: 'Dr. Rajesh Iyer',
    location: 'Bengaluru, Karnataka',
    initials: 'RI',
    avatarGradient: 'from-indigo-800 via-indigo-600 to-blue-600',
    text: '“Direct connection with genuine regional artisans and farmers. Premium Ayurvedic products with prompt customer service.”',
    verified: 'Verified Ayurveda Buyer',
  },
];

export function ImpactAndTestimonial() {
  const [activeReview, setActiveReview] = useState(0);
  const currentReview = reviews[activeReview];

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-6">
      
      {/* ── Main Container with Subtle Premium Styling ── */}
      <div className="relative bg-white rounded-3xl border border-gray-200/90 shadow-sm overflow-hidden">
        
        {/* Subtle Decorative Gradient Glow behind */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-100/40 via-emerald-100/20 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-100/40 via-blue-100/20 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 p-6 md:p-8 space-y-6">

          {/* ── 1. STATS GRID: Rich, Visual & Modern Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {stats.map((item) => {
              const IconComponent = item.icon;
              return (
                <div 
                  key={item.label}
                  className="group relative bg-gradient-to-b from-gray-50/80 to-white hover:from-white hover:to-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 hover:border-[#c88a23]/60 hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  {/* Top Bar: Icon + Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${item.iconBg} shadow-2xs group-hover:scale-110 transition-transform`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  </div>

                  {/* Stat Value & Label */}
                  <div>
                    <div className="text-2xl sm:text-3xl font-black text-[#0f3e26] tracking-tight group-hover:text-[#c88a23] transition-colors">
                      {item.value}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-gray-900 mt-0.5 leading-snug">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-gray-500 font-medium mt-0.5">
                      {item.sublabel}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── 2. VERIFIED CUSTOMER TESTIMONIAL SPOTLIGHT ── */}
          <div className="bg-gradient-to-r from-emerald-950 via-[#0f3e26] to-emerald-950 text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
            
            {/* Subtle Indian motif watermark background */}
            <div className="absolute right-0 top-0 bottom-0 w-80 opacity-5 pointer-events-none flex items-center justify-center">
              <Quote className="w-64 h-64 text-white" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              {/* Left Customer Info & Quote */}
              <div className="flex items-start sm:items-center gap-4 flex-1">
                {/* Dynamic Avatar with Initials */}
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr ${currentReview.avatarGradient} p-0.5 shadow-md shrink-0 flex items-center justify-center`}>
                  <div className="w-full h-full rounded-[14px] bg-black/20 backdrop-blur-xs flex items-center justify-center text-white font-black text-base sm:text-lg tracking-wider">
                    {currentReview.initials}
                  </div>
                </div>

                {/* Quote + Name */}
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-[10px] font-bold">
                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                      <span>{currentReview.verified}</span>
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-emerald-50/95 font-medium italic leading-relaxed line-clamp-2">
                    {currentReview.text}
                  </p>

                  <div className="text-xs text-amber-300 font-bold flex items-center gap-1.5 pt-0.5">
                    <span>{currentReview.name}</span>
                    <span className="text-emerald-300/60">•</span>
                    <span className="text-emerald-200/80 font-medium text-[11px]">{currentReview.location}</span>
                  </div>
                </div>
              </div>

              {/* Right Review Switcher Tabs */}
              <div className="flex md:flex-col items-center gap-1.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-white/10 md:pl-6 justify-center">
                <span className="text-[10px] font-bold text-emerald-200/70 uppercase tracking-wider hidden md:block">
                  Verified Reviews
                </span>
                <div className="flex gap-1.5">
                  {reviews.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setActiveReview(r.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeReview === r.id
                          ? 'bg-amber-400 text-gray-950 shadow-xs scale-105'
                          : 'bg-white/10 text-white/80 hover:bg-white/20'
                      }`}
                    >
                      {r.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* ── 3. TRUST & CERTIFICATION FOOTER BAR ── */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <span className="inline-flex items-center gap-1.5 font-bold text-[#0f3e26]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>100% Lab Tested &amp; FSSAI Certified</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-bold text-[#0f3e26]">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>MSME Registered Enterprise</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-bold text-[#0f3e26]">
                <HeartHandshake className="w-4 h-4 text-[#c88a23]" />
                <span>Fair Price Direct to Indian Kisans</span>
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#c88a23]">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Authentic Bharat Guarantee</span>
            </div>
          </div>

        </div>

      </div>

    </section>
  );
}
