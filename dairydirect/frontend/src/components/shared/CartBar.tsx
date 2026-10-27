"use client";

import React, { useState } from 'react';
import { FloatingCartBar } from '@/components/cart/FloatingCartBar';
import { CartDrawer } from '@/components/cart/CartDrawer';

/**
 * Consolidated CartBar component that delegates directly to the standard FloatingCartBar
 * and CartDrawer to eliminate duplicate product polling and styling fragmentation.
 */
export function CartBar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <FloatingCartBar onOpen={() => setIsOpen(true)} />
      <CartDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
