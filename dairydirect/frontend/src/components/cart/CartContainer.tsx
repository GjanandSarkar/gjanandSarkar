"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { FloatingCartBar } from './FloatingCartBar';

const CartDrawer = dynamic(() => import('./CartDrawer').then(mod => mod.CartDrawer), {
  ssr: false,
});

export function CartContainer() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  const handleOpen = () => {
    setIsDrawerOpen(true);
    setHasOpened(true);
  };

  return (
    <>
      <FloatingCartBar onOpen={handleOpen} />
      {hasOpened && <CartDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />}
    </>
  );
}
