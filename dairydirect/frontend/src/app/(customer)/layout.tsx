"use client";

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { TopAppBar } from '@/components/shared/TopAppBar';
import { BottomNav } from '@/components/shared/BottomNav';
import { Sidebar } from '@/components/shared/Sidebar';
import { CartBar } from '@/components/shared/CartBar';
import { useStore } from '@/store/useStore';
import { getUserAddresses } from '@/lib/api/addresses';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const user = useStore(state => state.user);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthLoading = useStore(state => state.isAuthLoading);

  useEffect(() => {
    if (isAuthLoading) return; // Wait until Supabase finishes the initial auth check

    const isAuthRoute = pathname === '/login' || pathname === '/'
      || pathname === '/onboarding'
      || pathname === '/onboarding/address'
      || pathname === '/onboarding/profile';

    // Not logged in -> go to login
    if (!user && !isAuthRoute) {
      router.replace('/login');
      return;
    }

    // Already logged in -> leave login pages
    if (user && (pathname === '/login')) {
      router.replace('/home');
      return;
    }

    // New users without addresses should complete onboarding
    if (user && !isAuthRoute) {
      // Check for profile completion - if name is empty or missing, redirect to profile setup
      const needsProfileSetup = !user.name || user.name.trim() === '';
      if (needsProfileSetup && pathname !== '/onboarding/profile') {
        router.replace('/onboarding/profile');
        return;
      }

      // Check for address completion
      if (pathname !== '/onboarding/address') {
        const checkAddresses = async () => {
          const addresses = await getUserAddresses(user.id);
          if (addresses.length === 0) {
            router.replace('/onboarding/address');
          }
        };
        checkAddresses();
      }
    }

    // Admin users get redirected to admin dashboard
    if (user?.role === 'admin' && !pathname.startsWith('/admin')) {
      router.replace('/admin');
    }
  }, [user, pathname, router, isAuthLoading]);

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
