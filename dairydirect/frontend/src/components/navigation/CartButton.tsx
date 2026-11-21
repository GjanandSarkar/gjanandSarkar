"use client";

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useCartDetails } from '@/hooks/useCartDetails';
import { cn } from '@/lib/utils';

interface CartButtonProps {
  className?: string;
}

export function CartButton({ className }: CartButtonProps) {
  const setCartDrawerOpen = useStore((state) => state.setCartDrawerOpen);
  const { totalItems, subtotal } = useCartDetails();

  return (
    <button
      type="button"
      onClick={() => setCartDrawerOpen(true)}
      className={cn(
<<<<<<< HEAD
        "flex items-center gap-2 h-12 px-4 rounded-xl transition-all hover:opacity-90 active:scale-95",
        "bg-primary text-on-primary shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
=======
        "h-11 relative flex items-center justify-center px-4 rounded-[var(--radius-md)] bg-primary text-on-primary transition-all duration-[var(--dur-state)] ease-[var(--ease-standard)] shadow-xs hover:bg-primary-hover active:scale-[0.97] active:duration-[var(--dur-press)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ink)] focus-visible:ring-offset-2 cursor-pointer select-none shrink-0 font-semibold",
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
        className
      )}
      aria-label={`Cart with ${totalItems} items`}
      title="Open cart drawer"
    >
      <div className="relative flex items-center justify-center">
        <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
        {totalItems > 0 && (
          <span className="absolute -top-2.5 -right-2.5 min-w-4.5 h-4.5 px-1 rounded-full bg-error text-foreground-inverse text-[10px] font-bold flex items-center justify-center border-2 border-surface leading-none tabular">
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </div>
      <span className="hidden sm:inline text-body-sm font-semibold ml-2 tabular">
        Cart {totalItems > 0 ? `(₹${subtotal})` : ''}
      </span>
    </button>
  );
}
