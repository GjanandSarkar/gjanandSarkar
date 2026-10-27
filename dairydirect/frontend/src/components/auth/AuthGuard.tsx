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
      pathname.startsWith('/seller');

    // Not logged in -> go to login if on protected route, admin, or seller console
    if (!user && (isProtectedRoute || pathname.startsWith('/admin') || pathname.startsWith('/seller'))) {
      go('/auth/login?redirect=' + encodeURIComponent(pathname));
      return;
    }

    // Strict Role-Based Route Partitioning:
    // 1. Admin users are strictly restricted to /admin/* (and auth/api routes). Block customer storefront.
    if (user && user.role === 'admin') {
      const isAdminAllowedPage = 
        pathname.startsWith('/admin') || 
        pathname.startsWith('/api') || 
        pathname.startsWith('/auth') || 
        pathname === '/login';

      if (!isAdminAllowedPage) {
        go('/admin');
        return;
      }
    }

    // 2. Seller users are strictly restricted to /seller/* (and auth/api routes). Block customer storefront.
    if (user && user.role === 'seller') {
      const isSellerAllowedPage = 
        pathname.startsWith('/seller') || 
        pathname.startsWith('/api') || 
        pathname.startsWith('/auth') || 
        pathname === '/login';

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
