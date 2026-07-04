import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function EngagementBanner() {
  const router = useRouter();

  return (
    <div 
      className="relative overflow-hidden rounded-[24px] p-6 mb-6 cursor-pointer group"
      style={{
        background: 'linear-gradient(135deg, #c2efac, #a7d392)',
        boxShadow: '0 4px 12px rgba(63, 101, 48, 0.15)',
      }}
      onClick={() => router.push('/onboarding/profile')}
    >
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition-colors" />
      <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-white/20 rounded-full blur-xl group-hover:bg-white/30 transition-colors" />
      
      <div className="relative z-10 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-black text-dark mb-1 leading-tight">Complete your profile</h3>
          <p className="text-[12px] text-dark/80 font-medium">Add your preferences to get personalized dairy recommendations and exclusive offers.</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center shrink-0 group-hover:bg-white transition-colors">
          <ArrowRight className="w-4 h-4 text-dark" />
        </div>
      </div>
    </div>
  );
}
