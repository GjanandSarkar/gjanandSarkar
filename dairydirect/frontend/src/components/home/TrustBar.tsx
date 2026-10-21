"use client";

import React from 'react';
import { ShieldCheck, RotateCcw, Building2, Users, Award } from 'lucide-react';

export function TrustBar() {
  const values = [
    {
      icon: <Award className="w-5 h-5 text-primary" />,
      title: "Direct Farm Sourcing",
      desc: "No middlemen, certified Goshalas",
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-primary" />,
      title: "70+ Quality Tests",
      desc: "Zero adulteration guaranteed",
    },
    {
      icon: <Users className="w-5 h-5 text-primary" />,
      title: "Cold-Chain Fresh",
      desc: "Maintained below 4°C to doorstep",
    },
    {
      icon: <RotateCcw className="w-5 h-5 text-primary" />,
      title: "100% Safe Payments",
      desc: "UPI, Cards & Cash on Delivery",
    },
  ];

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-4">
      <div className="bg-surface rounded-xl border border-border py-4 px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
        {values.map((item, idx) => (
          <div 
            key={item.title} 
            className={`flex items-center gap-3 ${idx !== 0 ? 'pt-3 sm:pt-0 sm:pl-4' : ''}`}
          >
            <div className="w-10 h-10 rounded-lg bg-primary-fixed text-primary flex items-center justify-center shrink-0 border border-primary/20">
              {item.icon}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-foreground leading-snug line-clamp-1">
                {item.title}
              </span>
              <span className="text-[11px] text-foreground-muted font-normal line-clamp-1">
                {item.desc}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
