"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';

export function AuthGuard() {
  const user = useStore((state) => state.user);
  const isAuthLoading = useStore((state) => state.isAuthLoading);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isAuthLoading) return;

    /* Redirecting to the page we are already on re-runs this effect and
       re-fetches the route, which is half of any redirect loop. Guard every
       redirect centrally so no individual branch has to remember. */
    const go = (target: string) => {
      if (target.split('?')[0] === pathname) return;
      router.replace(target);
    };

    const isAuthRoute = 
      pathname === '/login' || 
      pathname === '/auth/login' ||
      pathname === '/' ||
      pathname === '/auth/callback';

    const isProtectedRoute = 
      pathname === '/checkout' ||
      pathname === '/orders' ||
      pathname === '/profile' ||
      pathname === '/profile/saved-addresses' ||
      pathname.startsWith('/seller/dashboard');

    // `/` is rewritten to the storefront, so an admin landing there should be
    // moved to their console — but only AFTER the storefront has already
    // painted, which is the opposite of the old blocking blank-page redirect.
    if (user && user.role === 'admin' && pathname === '/') {
      go('/admin');
      return;
    }

    // Not logged in -> go to login if on protected route
    if (!user && isProtectedRoute) {
      go('/auth/login?redirect=' + encodeURIComponent(pathname));
      return;
    }

    // Logged in seller -> automatically redirect to seller dashboard if accessing general customer pages
    if (user && user.role === 'seller') {
      const isSellerAllowedPage = 
        pathname.startsWith('/seller') || 
        pathname.startsWith('/api') || 
        pathname.startsWith('/admin') ||
        pathname === '/profile';

      if (!isSellerAllowedPage) {
        go('/seller/dashboard');
        return;
      }
    }

    // Already logged in -> leave login page
    if (user && (pathname === '/login' || pathname === '/auth/login')) {
      if (user.role === 'admin') {
        go('/admin');
      } else if (user.role === 'seller') {
        go('/seller/dashboard');
      } else {
        go('/home');
      }
    }
  }, [user, pathname, router, isAuthLoading]);

  return null;
}
