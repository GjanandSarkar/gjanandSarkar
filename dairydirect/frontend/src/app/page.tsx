"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';

export default function RootRoute() {
  const router = useRouter();
  const user = useStore(state => state.user);
  const isAuthLoading = useStore(state => state.isAuthLoading);

  useEffect(() => {
    if (isAuthLoading) return;
    
    if (user && user.role === 'admin') {
      router.replace('/admin');
    } else {
      router.replace('/home');
    }
  }, [router, user, isAuthLoading]);

  // Return a minimal loading state just in case redirect takes a few ms
  return (
    <div className="min-h-screen bg-surface" />
  );
}
