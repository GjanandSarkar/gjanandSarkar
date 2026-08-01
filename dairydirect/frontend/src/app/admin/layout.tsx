"use client";

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Loader2, Menu } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = useStore(state => state.user);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthLoading = useStore(state => state.isAuthLoading);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.replace('/home');
    }
  }, [user, pathname, router, isAuthLoading]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-surface-container-low)' }}>
      <AdminSidebar />
      <main className="flex-1 md:ml-[260px] min-h-screen overflow-x-hidden flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-sand z-40 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary text-white">
              <span className="font-bold text-xs">GS</span>
            </div>
            <h1 className="font-bold text-sm">Operations</h1>
          </div>
          <Link href="/home" className="text-xs font-semibold text-primary">Exit</Link>
        </header>

        <div className="max-w-[1400px] mx-auto w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
