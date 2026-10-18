import React from 'react';
import { getFreeDeliveryThreshold } from '@/lib/api/settings';
import { TopBarBanner } from './TopBarBanner';

/**
 * Sitewide announcement bar.
 * Reads real threshold on the server and renders client banner with dismissal support.
 */
export async function TopBar() {
  const freeDeliveryThreshold = await getFreeDeliveryThreshold();

  return <TopBarBanner freeDeliveryThreshold={freeDeliveryThreshold} />;
}
