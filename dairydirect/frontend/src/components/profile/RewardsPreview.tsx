import React from 'react';
import { Trophy, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function RewardsPreview() {
  const router = useRouter();

  return (
    <div 
      className="bg-white rounded-[24px] p-5 mb-6 border border-sand shadow-sm cursor-pointer hover:shadow-md transition-shadow group"
      onClick={() => router.push('/profile')}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-orange-600" />
          </div>
          <h3 className="text-sm font-black text-dark">GjanandSarkar Rewards</h3>
        </div>
        <ChevronRight className="w-5 h-5 text-muted group-hover:text-dark transition-colors" />
      </div>
      
      <div className="flex items-end justify-between mb-2">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-dark tracking-tight">150</span>
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Points</span>
        </div>
        <span className="text-[11px] font-medium text-primary">50 pts to Free Delivery</span>
      </div>
      
      <div className="h-2 w-full bg-sand rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary rounded-full"
          style={{ width: '75%' }}
        />
      </div>
    </div>
  );
}
