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

    // Not logged in -> go to login if on protected route
    if (!user && isProtectedRoute) {
      router.replace('/auth/login?redirect=' + encodeURIComponent(pathname));
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
        router.replace('/seller/dashboard');
        return;
      }
    }

    // Already logged in -> leave login page
    if (user && (pathname === '/login' || pathname === '/auth/login')) {
      if (user.role === 'admin') {
        router.replace('/admin');
      } else if (user.role === 'seller') {
        router.replace('/seller/dashboard');
      } else {
        router.replace('/home');
      }
    }
  }, [user, pathname, router, isAuthLoading]);

  return null;
}
