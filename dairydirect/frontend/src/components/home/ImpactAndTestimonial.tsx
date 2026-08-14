"use client";

import React, { useState } from 'react';
import { 
  Star, 
  ShieldCheck, 
  Users, 
  Store, 
  MapPin, 
  Award, 
  Quote, 
  CheckCircle2, 
  HeartHandshake
} from 'lucide-react';

const stats = [
  {
    value: '50K+',
    label: 'Happy Families',
    icon: Users,
    bg: 'bg-emerald-50 text-emerald-800',
  },
  {
    value: '15K+',
    label: 'Farmers Sourced',
    icon: Store,
    bg: 'bg-amber-50 text-amber-800',
  },
  {
    value: '10K+',
    label: 'Pincodes Reached',
    icon: MapPin,
    bg: 'bg-blue-50 text-blue-800',
  },
  {
    value: '4.9★',
    label: 'Customer Rating',
    icon: Award,
    bg: 'bg-purple-50 text-purple-800',
  },
];

const reviews = [
  {
    id: 0,
    name: 'Amit Sharma',
    location: 'Ahmedabad',
    initials: 'AS',
    text: '“Unmatched freshness & authentic aroma. The A2 Gir cow ghee reminds me of my village home!”',
  },
  {
    id: 1,
    name: 'Pooja Verma',
    location: 'Jaipur',
    initials: 'PV',
    text: '“Prompt 7 AM doorstep delivery in sterile glass bottles. Extremely fresh and delicious.”',
  },
  {
    id: 2,
    name: 'Dr. Rajesh Iyer',
    location: 'Bengaluru',
    initials: 'RI',
    text: '“Direct connection with genuine regional farmers. High quality products and great service.”',
  },
];

export function ImpactAndTestimonial() {
  const [activeReview, setActiveReview] = useState(0);
  const currentReview = reviews[activeReview];

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-4">
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 md:p-8 space-y-6">
        
        {/* 1. Clean borderless stats layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          {stats.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.label}
                className={`flex items-center gap-4 ${idx > 0 ? 'pt-4 md:pt-0 md:pl-6' : ''}`}
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${item.bg}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-black text-gray-900 leading-tight">
                    {item.value}
                  </div>
                  <div className="text-xs font-bold text-gray-500">
                    {item.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. Premium Testimonial Card */}
        <div className="bg-gradient-to-b from-[#fdfbf7] to-[#fbf9f4] rounded-2xl p-5 md:p-6 border border-sand flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute right-4 top-2 text-sand/15 pointer-events-none">
            <Quote className="w-20 h-20 rotate-180" />
          </div>

          <div className="flex items-center gap-4 flex-1 z-10">
            {/* Initials circle */}
            <div className="w-12 h-12 rounded-full bg-[#0f3e26] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
              {currentReview.initials}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100/60 px-2 py-0.2 rounded">
                  Verified Buyer
                </span>
              </div>

              <p className="text-sm font-extrabold text-[#0f3e26] italic leading-relaxed">
                {currentReview.text}
              </p>

              <div className="text-xs text-gray-500 font-bold">
                <span>{currentReview.name}</span>
                <span className="text-gray-300 mx-1.5">•</span>
                <span className="font-semibold text-gray-400">{currentReview.location}</span>
              </div>
            </div>
          </div>

          {/* Right switcher buttons */}
          <div className="flex md:flex-col gap-1.5 shrink-0 z-10 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-sand/70 md:pl-6 w-full md:w-auto justify-center">
            {reviews.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveReview(r.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeReview === r.id
                    ? 'bg-[#0f3e26] text-white shadow-2xs'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {r.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Simplified trust footer */}
        <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 text-[11px] font-bold text-gray-500">
          <div className="flex flex-wrap items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Lab Tested &amp; FSSAI Certified</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>MSME Registered Enterprise</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-emerald-700" />
              <span>Direct Sourcing from Kisans</span>
            </span>
          </div>
          <span className="text-[#c88a23]">Authentic Bharat Guarantee</span>
        </div>

      </div>
    </section>
  );
}
