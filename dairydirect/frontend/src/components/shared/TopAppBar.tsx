"use client";

import { Header } from '@/components/navigation/Header';

/**
 * Consolidated TopAppBar - delegates to Header to avoid duplicate nav header implementations.
 */
export function TopAppBar() {
  return <Header />;
}
