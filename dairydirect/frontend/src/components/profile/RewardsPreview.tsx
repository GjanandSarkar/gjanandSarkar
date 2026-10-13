"use client";

import React from 'react';
import { Trophy, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useStore } from '@/store/useStore';

const REWARD_THRESHOLD = 200;

/**
 * Had 150 points, a 75%-wide progress bar and "50 pts to Free Delivery" all
 * hardcoded, so every account looked identical. Reads the real
 * `profiles.loyalty_points` balance now, matching the profile screen.
 */
export function RewardsPreview() {
  const router = useRouter();
  const user = useStore((s) => s.user);

  const points = user?.loyalty_points ?? 0;
  const pointsToReward = Math.max(0, REWARD_THRESHOLD - points);
  const progressPct = Math.min(100, Math.round((points / REWARD_THRESHOLD) * 100));

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
          <span className="text-2xl font-black text-dark tracking-tight tabular-nums">{points}</span>
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Points</span>
        </div>
        <span className="text-[11px] font-medium text-primary tabular-nums">
          {pointsToReward > 0 ? `${pointsToReward} pts to your next reward` : 'Reward unlocked'}
        </span>
      </div>
      
      <div className="h-2 w-full bg-sand rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary rounded-full transition-[width] duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}
