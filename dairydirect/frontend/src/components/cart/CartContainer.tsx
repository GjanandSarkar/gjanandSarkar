"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FloatingCartBar } from './FloatingCartBar';
import { useStore } from '@/store/useStore';

const CartDrawer = dynamic(() => import('./CartDrawer').then(mod => mod.CartDrawer), {
  ssr: false,
});

export function CartContainer() {
  const isCartDrawerOpen = useStore((s) => s.isCartDrawerOpen);
  const setCartDrawerOpen = useStore((s) => s.setCartDrawerOpen);
  const [hasOpened, setHasOpened] = useState(false);

  useEffect(() => {
    if (isCartDrawerOpen) {
      setHasOpened(true);
    }
  }, [isCartDrawerOpen]);

  const handleOpen = () => {
    setCartDrawerOpen(true);
  };

  return (
    <>
      <FloatingCartBar onOpen={handleOpen} />
      {hasOpened && (
        <CartDrawer
          isOpen={isCartDrawerOpen}
          onClose={() => setCartDrawerOpen(false)}
        />
      )}
    </>
  );
}
