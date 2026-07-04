"use client";

import { Droplets, ShieldCheck, Leaf, Clock } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function TrustSection() {
  const { t } = useTranslation();

  const trustItems = [
    {
      icon: <Droplets className="w-6 h-6" />,
      title: 'Fresh Daily',
      description: 'Sourced every morning',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: 'Quality Checked',
      description: 'Rigorous 24-step testing',
      color: 'text-green-600',
      bg: 'bg-green-600/10'
    },
    {
      icon: <Leaf className="w-6 h-6" />,
      title: 'Farm Sourced',
      description: 'Directly from local farms',
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Reliable Delivery',
      description: 'Before 7 AM every day',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    }
  ];

  return (
    <section className="px-5 md:px-10 mb-12">
      <div className="bg-surface-container-low rounded-[24px] p-6 md:p-8">
        <h3 className="font-bold text-[18px] mb-6 text-center text-on-surface">Why Choose Gjanand Sarkar?</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {trustItems.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full ${item.bg} ${item.color} flex items-center justify-center mb-3`}>
                {item.icon}
              </div>
              <span className="text-[13px] font-bold text-on-surface mb-1 leading-tight">{item.title}</span>
              <span className="text-[11px] font-medium text-outline">{item.description}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
