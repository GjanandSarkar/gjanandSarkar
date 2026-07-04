"use client";

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function TrackingSkeleton() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-surface-container animate-pulse">
      {/* Header Over Map */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6 pt-12 flex justify-between items-center bg-gradient-to-b from-black/20 to-transparent pointer-events-none">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center text-white pointer-events-auto"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-32 h-8 rounded-full bg-white/50 backdrop-blur-md pointer-events-auto" />
      </div>

      {/* Map Segment Skeleton */}
      <div className="relative w-full bg-sand/30" style={{ height: '55vh' }} />

      {/* Tracking Details Card Skeleton */}
      <div className="bg-white rounded-t-[32px] p-6 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] z-20 -mt-8 relative flex-1">
        <div className="w-12 h-1.5 bg-sand rounded-full mx-auto mb-6" />

        <div className="flex justify-between items-end mb-6 border-b border-sand pb-6">
          <div className="space-y-2">
            <div className="h-8 w-40 bg-sand/50 rounded-lg" />
            <div className="h-4 w-24 bg-sand/30 rounded-md" />
          </div>
          <div className="h-6 w-20 bg-sand/40 rounded-xl" />
        </div>

        {/* Timeline skeleton */}
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-sand/50 shrink-0" />
              <div className="pt-1.5 space-y-2 flex-1">
                <div className="h-4 w-32 bg-sand/50 rounded-md" />
                <div className="h-3 w-48 bg-sand/30 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
