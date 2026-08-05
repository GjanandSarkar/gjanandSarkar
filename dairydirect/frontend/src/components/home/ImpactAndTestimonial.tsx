"use client";

import React from 'react';
import { 
  CheckCircle2, 
  Users, 
  Store, 
  MapPin, 
  IndianRupee, 
  Star, 
  Quote, 
  ShieldCheck, 
  Leaf, 
  Award,
  Sparkles
} from 'lucide-react';

export function ImpactAndTestimonial() {
  const whyChoose = [
    { text: 'Support Indian Economy & Artisans', icon: <Award className="w-4 h-4 text-[#c88a23]" /> },
    { text: 'Direct from Verified Businesses', icon: <Store className="w-4 h-4 text-[#0f3e26]" /> },
    { text: '100% Premium Quality Guaranteed', icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" /> },
    { text: 'Secure & Easy UPI / Card Payments', icon: <ShieldCheck className="w-4 h-4 text-blue-600" /> },
    { text: 'Eco-Friendly & Sustainable Packaging', icon: <Leaf className="w-4 h-4 text-emerald-700" /> },
  ];

  const stats = [
    { label: 'Happy Customers', value: '50K+', icon: <Users className="w-5 h-5 text-[#0f3e26]" /> },
    { label: 'Indian Sellers', value: '15K+', icon: <Store className="w-5 h-5 text-[#c88a23]" /> },
    { label: 'Pincodes Covered', value: '10K+', icon: <MapPin className="w-5 h-5 text-emerald-600" /> },
    { label: 'Paid to Businesses', value: '₹2.5Cr+', icon: <IndianRupee className="w-5 h-5 text-amber-600" /> },
  ];

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* ── CARD 1: Why Choose Gjanand Sarkar? ── */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🪔</span>
              <h3 className="text-lg font-black text-[#0f3e26] tracking-tight">
                Why Choose Gjanand Sarkar?
              </h3>
            </div>
            <p className="text-xs text-gray-500 mb-5">
              Built with love for Bharat to deliver unadulterated goodness directly to your home.
            </p>

            <ul className="space-y-3">
              {whyChoose.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-xs font-semibold text-gray-800">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span className="font-bold text-[#0f3e26]">Certified FSSAI & MSME</span>
            <span className="font-bold text-[#c88a23]">100% Authentic</span>
          </div>
        </div>

        {/* ── CARD 2: Empowering Indian Businesses ── */}
        <div className="bg-gradient-to-br from-[#0f3e26] to-[#072415] text-white rounded-2xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden">
          
          <div className="absolute -right-8 -bottom-8 w-40 h-40 opacity-10 pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-full h-full fill-white">
              <circle cx="50" cy="50" r="45" />
            </svg>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-emerald-200 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>National Impact</span>
            </div>

            <h3 className="text-lg font-black text-white mb-2 tracking-tight">
              Empowering Indian Businesses
            </h3>
            <p className="text-xs text-emerald-100/80 mb-6">
              Connecting regional farms, artisans, and family-owned enterprises with buyers across India.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                  <div className="text-xl sm:text-2xl font-black text-amber-300">
                    {s.value}
                  </div>
                  <div className="text-[11px] font-medium text-emerald-100 mt-0.5">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 text-[11px] text-emerald-200/90 font-medium">
            Join 15,000+ local sellers on Gjanand Sarkar today.
          </div>
        </div>

        {/* ── CARD 3: What Our Customers Say ── */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Quote className="w-5 h-5 text-[#c88a23]" />
                <h3 className="text-lg font-black text-[#0f3e26] tracking-tight">
                  What Our Customers Say
                </h3>
              </div>
              <div className="flex items-center gap-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
            </div>

            <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100 mb-4">
              <p className="text-xs sm:text-sm text-gray-700 italic leading-relaxed">
                “Great quality products and fast delivery. Happy to support Made in India! The freshness and packaging are unmatched.”
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0f3e26] text-white font-bold flex items-center justify-center text-sm shadow-xs">
                AS
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">
                  Amit Sharma
                </h4>
                <span className="text-[11px] text-gray-500">
                  Verified Buyer • Ahmedabad, Gujarat
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span className="text-emerald-700 font-bold">4.9 / 5.0 Star Rating</span>
            <span>Over 12,000+ Reviews</span>
          </div>
        </div>

      </div>
    </section>
  );
}
