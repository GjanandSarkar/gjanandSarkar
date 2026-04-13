"use client";

import dynamic from 'next/dynamic';
import React from 'react';
import type { MapComponentProps } from './MapComponent';

// Dynamically import the map to prevent Server-Side Rendering (SSR) issues
// since mapbox-gl requires the window object which is not available during SSR.
const OrderTrackingMapCore = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div 
      className="flex items-center justify-center bg-surface-container-low rounded-2xl w-full"
      style={{ height: '400px', minHeight: '400px' }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-bold text-muted uppercase tracking-widest">Loading Map...</span>
      </div>
    </div>
  )
});

export default function OrderTrackingMap(props: MapComponentProps) {
  return <OrderTrackingMapCore {...props} />;
}
