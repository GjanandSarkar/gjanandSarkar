"use client";

import React from 'react';
import { ShieldCheck, RotateCcw, Building2, Users, Award } from 'lucide-react';

import { useTranslation } from '@/lib/i18n';

export function TrustBar() {
  const { t } = useTranslation();

  const values = [
    {
      icon: <Award className="w-5 h-5 text-secondary" />,
      title: t('madeInIndia') || "100% Made in India",
      desc: t('authenticOriginal') || "Authentic & Original Products",
    },
    {
      icon: <Users className="w-5 h-5 text-primary" />,
      title: t('directFromBusinesses') || "Direct from Businesses",
      desc: t('noMiddlemen') || "No Middlemen",
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-success" />,
      title: t('securePayments') || "Secure Payments",
      desc: t('safeReliable') || "100% Safe & Reliable",
    },
    {
      icon: <RotateCcw className="w-5 h-5 text-secondary" />,
      title: t('easyReturns') || "Easy Returns",
      desc: t('hassleFreeReturns') || "Hassle Free Returns",
    },
    {
      icon: <Building2 className="w-5 h-5 text-primary" />,
      title: t('supportIndianBusiness') || "Support Indian Business",
      desc: t('empoweringEconomy') || "Empowering Indian Economy",
    },
  ];

  return (
    <div className="hidden md:block w-full max-w-[1440px] mx-auto px-4 md:px-8 my-4 relative z-20">
      <div className="bg-surface rounded-lg shadow-xs border border-border py-4 px-4 md:px-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
        {values.map((item, idx) => (
          <div 
            key={item.title} 
            className={`flex items-center gap-3 ${idx !== 0 ? 'pt-3 sm:pt-0 sm:pl-4' : ''}`}
          >
            <div className="w-9 h-9 rounded-lg bg-surface-muted border border-border flex items-center justify-center shrink-0">
              {item.icon}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-foreground leading-snug line-clamp-1">
                {item.title}
              </span>
              <span className="text-xs text-foreground-muted font-normal line-clamp-1 mt-0.5">
                {item.desc}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
