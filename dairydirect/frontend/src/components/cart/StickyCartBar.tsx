"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ShoppingBag } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useCartDetails } from '@/hooks/useCartDetails';
import { cn } from '@/lib/utils';

export function StickyCartBar() {
  const pathname = usePathname();
  const setCartDrawerOpen = useStore((s) => s.setCartDrawerOpen);
  const { totalItems, subtotal } = useCartDetails();

  // Hide on checkout, cart, or confirmation routes
  const hideOn = ['/checkout', '/cart', '/order-confirmed', '/login', '/onboarding'];
  const isHidden = hideOn.some((p) => pathname?.startsWith(p)) || totalItems === 0;

  return (
    <AnimatePresence>
      {!isHidden && (
        <motion.div
          key="sticky-cart-bar"
          initial={{ y: '140%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '140%', opacity: 0 }}
          transition={{
            duration: 0.3,
            ease: [0.22, 1, 0.36, 1.4], // var(--ease-spring)
          }}
          className={cn(
            "fixed bottom-[calc(var(--h-bottomnav)+8px)] left-3 right-3 z-40 md:hidden",
            "bg-primary text-on-primary rounded-[var(--radius-lg)] h-14 px-4 shadow-lg",
            "flex items-center justify-between cursor-pointer select-none"
          )}
          onClick={() => setCartDrawerOpen(true)}
          role="status"
          aria-live="polite"
        >
          {/* Left summary */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-on-primary/10 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4 text-on-primary" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-body-sm font-bold leading-tight tabular">
                {totalItems} item{totalItems !== 1 ? 's' : ''} · ₹{subtotal}
              </span>
              <span className="text-[10px] opacity-80 leading-tight">
                Extra items can be added
              </span>
            </div>
          </div>

          {/* Right action */}
          <div className="flex items-center gap-1 font-bold text-xs uppercase tracking-wider">
            <span>View cart</span>
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

