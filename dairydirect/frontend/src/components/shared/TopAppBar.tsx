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
        
        {/* ── Brand Logo ── */}
        <Link href="/home" className="flex items-center gap-2 shrink-0 group active:scale-95 transition-transform">
          <div className="relative flex items-center">
            <img
              src="/application logo/gjanand sarkar logo.png"
              alt="Gjanand Sarkar"
              className="h-10 md:h-14 w-auto object-contain drop-shadow-xs"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="flex flex-col">
              <span className="text-lg md:text-2xl font-black tracking-tight leading-none">
                <span className="text-[#0f3e26]">Gjanand</span>
              </span>
              <span className="text-[9px] md:text-[11px] tracking-[0.2em] font-black text-[#c88a23] uppercase text-right leading-none mt-0.5">
                SARKAR
              </span>
            </div>
          </div>
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
