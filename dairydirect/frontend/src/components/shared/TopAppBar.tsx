"use client";

import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { Search, ShoppingCart } from 'lucide-react';
import { NotificationBell } from './NotificationPanel';

export function TopAppBar() {
  const cart = useStore(state => state.cart);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 w-full z-40 md:hidden" 
      style={{ background: 'rgba(250, 250, 243, 0.88)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <div className="flex justify-between items-center px-5 py-3.5 w-full">
        
        <Link href="/home" className="flex items-center gap-2">
          <img src="/logo.svg" alt="Gjanand Sarkar Logo" className="w-8 h-8 object-contain" />
          <span className="font-extrabold text-[17px] tracking-tight" 
            style={{ color: 'var(--color-on-surface)' }}>
            Gjanand <span style={{ color: 'var(--color-primary)' }}>Sarkar</span>
          </span>
        </Link>
        
        <div className="flex items-center gap-1.5">
          <button className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-all active:scale-95"
            style={{ background: 'var(--color-surface-container-low)', color: 'var(--color-on-surface-variant)' }}>
            <Search className="w-4.5 h-4.5" strokeWidth={2} />
          </button>
          
          {/* Notification Bell — mobile bottom sheet */}
          <NotificationBell variant="mobile" />

          <Link href="/cart" 
            className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-all active:scale-95 relative"
            style={{ background: 'var(--color-primary)', color: 'white' }}>
            <ShoppingCart className="w-4.5 h-4.5" strokeWidth={2} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 text-[9px] font-bold rounded-full flex items-center justify-center"
                style={{ background: 'var(--color-secondary)', color: 'white', width: '18px', height: '18px', fontSize: '9px' }}>
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Tonal separator — no hard border */}
      <div className="h-[1px] opacity-20 mx-5" style={{ background: 'var(--color-outline-variant)' }} />
    </header>
  );
}
