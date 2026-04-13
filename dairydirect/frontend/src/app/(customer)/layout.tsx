"use client";

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { TopAppBar } from '@/components/shared/TopAppBar';
import { BottomNav } from '@/components/shared/BottomNav';
import { Sidebar } from '@/components/shared/Sidebar';
import { CartBar } from '@/components/shared/CartBar';
import { useStore } from '@/store/useStore';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const user = useStore(state => state.user);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isAuthRoute = pathname === '/login' || pathname === '/verify'
      || pathname === '/' || pathname === '/onboarding';

    if (!user && !isAuthRoute) {
      router.replace('/login');
      return;
    }

    // Admin users get redirected to admin dashboard
    if (user?.role === 'admin' && !pathname.startsWith('/admin')) {
      router.replace('/admin');
    }
  }, [user, pathname, router]);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-surface)' }} suppressHydrationWarning>
      <Sidebar />

      <div className="flex-1 flex flex-col md:ml-[260px] min-h-screen relative">
        <TopAppBar />

        <main className="flex-1 overflow-x-hidden"
          style={{
            paddingBottom: 'max(80px, calc(64px + env(safe-area-inset-bottom, 0px)))',
          }}>
          <div className="w-full max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>

        {/* Global Swiggy-style cart bar — visible on all non-cart pages */}
        <CartBar />

        <BottomNav />
      </div>
    </div>
  );
}
