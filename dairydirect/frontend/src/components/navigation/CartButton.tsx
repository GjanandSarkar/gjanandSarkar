"use client";

import React from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

interface CartButtonProps {
  className?: string;
}

export function CartButton({ className }: CartButtonProps) {
  const cart = useStore(state => state.cart);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link
      href="/cart"
      className={cn(
        "flex items-center gap-2 h-12 px-4 rounded-xl transition-all hover:opacity-90 active:scale-95",
        "bg-primary text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className
      )}
      aria-label="View cart"
    >
      <ShoppingCart className="w-5 h-5 shrink-0" />
      {totalItems > 0 ? (
        <div className="flex flex-col items-start leading-none ml-1">
          <span className="text-[12px] font-medium opacity-90">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
          <span className="text-[14px] font-bold">₹ --</span>
        </div>
      ) : (
        <span className="text-body-md font-bold ml-1">Cart</span>
      )}
    </Link>
  );
}
