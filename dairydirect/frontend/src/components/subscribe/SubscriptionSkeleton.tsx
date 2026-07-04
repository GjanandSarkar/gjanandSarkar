export function SubscriptionSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-container pb-20 animate-pulse">
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-5 md:px-10 pt-6 pb-4 bg-surface-container-lowest">
        <div className="h-8 w-48 bg-sand/30 rounded-lg" />
        <div className="h-10 w-24 bg-sand/30 rounded-xl" />
      </div>

      <div className="px-5 md:px-10 py-5 space-y-6">
        {/* Upcoming Deliveries Skeleton */}
        <div className="bg-sand/10 rounded-[24px] p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-sand/30" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-sand/30 rounded" />
              <div className="h-3 w-20 bg-sand/30 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white/50 rounded-[16px] border border-sand/50" />
            ))}
          </div>
        </div>

        {/* Subscription Cards Skeletons */}
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-[24px] overflow-hidden border border-sand/50 p-5">
              <div className="flex justify-between items-start mb-5">
                <div className="h-5 w-16 bg-sand/30 rounded-full" />
                <div className="h-8 w-8 bg-sand/30 rounded-full" />
              </div>
              <div className="flex gap-4 mb-5">
                <div className="w-20 h-20 bg-sand/30 rounded-[18px]" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-5 w-3/4 bg-sand/30 rounded" />
                  <div className="h-3 w-1/2 bg-sand/30 rounded" />
                  <div className="h-6 w-24 bg-sand/30 rounded-lg mt-2" />
                </div>
              </div>
              <div className="h-14 bg-sand/30 rounded-[16px] mb-5" />
              <div className="flex gap-2">
                <div className="flex-1 h-12 bg-sand/30 rounded-xl" />
                <div className="flex-1 h-12 bg-sand/30 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
