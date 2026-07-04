"use client";

import { Heart } from 'lucide-react';

export function SocialProof() {
  return (
    <section className="px-5 md:px-10 mb-10 pb-6 border-b border-outline-variant/30">
      <div className="flex flex-col items-center justify-center text-center opacity-80">
        <div className="flex -space-x-2 mb-4">
          <div className="w-8 h-8 rounded-full border-2 border-surface bg-surface-container-highest" />
          <div className="w-8 h-8 rounded-full border-2 border-surface bg-primary/20" />
          <div className="w-8 h-8 rounded-full border-2 border-surface bg-secondary/20" />
          <div className="w-8 h-8 rounded-full border-2 border-surface bg-tertiary/20 flex items-center justify-center">
            <span className="text-[10px] font-bold text-on-surface">+</span>
          </div>
        </div>
        
        <p className="text-[13px] font-semibold text-on-surface flex items-center gap-1.5 flex-wrap justify-center">
          Trusted by families across Gujarat
          <Heart className="w-3.5 h-3.5 text-primary fill-primary" />
        </p>
        <p className="text-[11px] font-medium text-outline mt-1 max-w-[280px]">
          Delivering fresh, unadulterated dairy products straight to your doorstep.
        </p>
      </div>
    </section>
  );
}
