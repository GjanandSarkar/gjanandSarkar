import React from 'react';
import { Header } from '@/components/navigation/Header';
import { BottomNav } from '@/components/shared/BottomNav';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CartContainer } from '@/components/cart/CartContainer';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="flex min-h-screen bg-surface" suppressHydrationWarning>
      <div className="flex-1 flex flex-col min-h-screen relative w-full">
        <AuthGuard />
        <Header />

        <main className="flex-1 overflow-x-hidden"
          style={{
            paddingBottom: 'max(80px, calc(64px + env(safe-area-inset-bottom, 0px)))',
          }}>
          <div className="w-full max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>

        <CartContainer />

        <BottomNav />
      </div>
    </div>
  );
}
