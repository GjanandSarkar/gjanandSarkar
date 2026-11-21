"use client";

import React, { Suspense } from 'react';
import { HeaderBar } from './HeaderBar';

export function Header() {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 w-full z-40 bg-surface border-b border-border shadow-xs h-[104px] md:h-[72px]" />
      }
    >
      <HeaderBar />
    </Suspense>
  );
}

export { HeaderBar };
