import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function EngagementBanner() {
  const router = useRouter();

  return (
    <div 
      className="bg-surface rounded-xl border border-border p-4 cursor-pointer hover:border-primary/50 transition-colors flex items-center gap-3.5"
      onClick={() => router.push('/onboarding/profile')}
    >
<<<<<<< HEAD
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-surface/20 rounded-full blur-2xl group-hover:bg-surface/30 transition-colors" />
      <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-surface/20 rounded-full blur-xl group-hover:bg-surface/30 transition-colors" />
      
      <div className="relative z-10 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center shrink-0 shadow-sm">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-dark mb-1 leading-tight">Complete your profile</h3>
          <p className="text-[12px] text-dark/80 font-medium">Add your preferences to get personalized dairy recommendations and exclusive offers.</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-surface/40 flex items-center justify-center shrink-0 group-hover:bg-surface transition-colors">
          <ArrowRight className="w-4 h-4 text-dark" />
        </div>
=======
      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Sparkles className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-xs font-bold text-foreground mb-0.5">Complete your profile</h3>
        <p className="text-[11px] text-muted">Add delivery preferences for personalized milk & grocery recommendations.</p>
      </div>
      <div className="w-7 h-7 rounded-lg bg-surface-muted flex items-center justify-center shrink-0 text-muted">
        <ArrowRight className="w-3.5 h-3.5" />
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
      </div>
    </div>
  );
}
