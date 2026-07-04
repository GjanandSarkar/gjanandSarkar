"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { getUserAddresses } from '@/lib/api/addresses';

export function AuthGuard() {
  const user = useStore(state => state.user);
  const isAuthLoading = useStore(state => state.isAuthLoading);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isAuthLoading) return;

    const isAuthRoute = pathname === '/login' || pathname === '/'
      || pathname === '/onboarding'
      || pathname === '/onboarding/address'
      || pathname === '/onboarding/profile';

    const isGuestRoute = 
      pathname === '/home' || 
      pathname === '/products' || 
      pathname.startsWith('/products/') ||
      pathname === '/categories' || 
      pathname.startsWith('/categories/') ||
      pathname === '/search' || 
      pathname === '/cart' || 
      pathname.startsWith('/tracking/');
    
    // Not logged in -> go to login with return URL
    if (!user && !isAuthRoute && !isGuestRoute) {
      router.replace('/login?next=' + encodeURIComponent(pathname));
      return;
    }

    // Already logged in -> leave login page, optionally preserving a return URL
    if (user && pathname === '/login') {
      router.replace('/home');
      return;
    }

    if (user && !isAuthRoute) {
      const needsProfileSetup = !user.name || user.name.trim() === '';
      if (needsProfileSetup && pathname !== '/onboarding/profile') {
        router.replace('/onboarding/profile');
        return;
      }

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

    if (user?.role === 'admin' && !pathname.startsWith('/admin')) {
      router.replace('/admin');
    }
  }, [user, pathname, router, isAuthLoading]);

  return null;
}
