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
      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Sparkles className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-xs font-bold text-foreground mb-0.5">Complete your profile</h3>
        <p className="text-[11px] text-muted">Add delivery preferences for personalized milk & grocery recommendations.</p>
      </div>
      <div className="w-7 h-7 rounded-lg bg-surface-muted flex items-center justify-center shrink-0 text-muted">
        <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </div>
  );
}
