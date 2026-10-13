import { ProductGridSkeleton, SkeletonBlock } from '@/components/shared/Skeletons';

/**
 * Search is `force-dynamic`, so it waits on a database round trip on every
 * request. Without a route-level loading UI the user sat on the previous
 * page with no feedback until the query returned.
 */
export default function Loading() {
  return (
    <div className="w-full bg-[#fafaf8] min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 pt-24 md:pt-32">
        <SkeletonBlock className="h-8 w-64 mb-2" />
        <SkeletonBlock className="h-3 w-24 mb-6" />
        <ProductGridSkeleton count={10} />
      </div>
    </div>
  );
}
