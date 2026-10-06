import { PageSkeleton } from '@/components/shared/Skeletons';

/**
 * Route-level loading UI for the whole customer storefront.
 *
 * This was a centred spinner with "Loading..." underneath. It told the user
 * nothing about what was coming, reserved no space, and let the page jump
 * when content arrived. A layout-matched skeleton reads as faster at the same
 * actual latency, and removes the layout shift.
 */
export default function Loading() {
  return <PageSkeleton />;
}
