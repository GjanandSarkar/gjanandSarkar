"use client";

import React from 'react';
import { ShieldCheck, RotateCcw, Building2, Users, Award } from 'lucide-react';

export function TrustBar() {
  const values = [
    {
      icon: <Award className="w-5 h-5 text-[#c88a23]" />,
      flag: "🇮🇳",
      title: "100% Made in India",
      desc: "Authentic & Original Products",
    },
    {
      icon: <Users className="w-5 h-5 text-[#0f3e26]" />,
      title: "Direct from Businesses",
      desc: "No Middlemen",
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      title: "Secure Payments",
      desc: "100% Safe & Reliable",
    },
    {
      icon: <RotateCcw className="w-5 h-5 text-[#c88a23]" />,
      title: "Easy Returns",
      desc: "Hassle Free Returns",
    },
    {
      icon: <Building2 className="w-5 h-5 text-[#0f3e26]" />,
      title: "Support Indian Business",
      desc: "Empowering Indian Economy",
    },
  ];

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 -mt-5 relative z-20">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/90 py-3.5 px-4 md:px-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
        {values.map((item, idx) => (
          <div 
            key={item.title} 
            className={`flex items-center gap-3 ${idx !== 0 ? 'pt-3 sm:pt-0 sm:pl-4' : ''} group`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50/80 border border-amber-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              {item.flag ? (
                <span className="text-xl leading-none">{item.flag}</span>
              ) : (
                item.icon
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-gray-900 leading-snug line-clamp-1">
                {item.title}
              </span>
              <span className="text-[11px] text-gray-500 font-medium line-clamp-1">
                {item.desc}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
