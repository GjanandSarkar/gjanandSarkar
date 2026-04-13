"use client";

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = useStore(state => state.user);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.replace('/home');
    }
  }, [user, pathname, router]);

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
      <main className="flex-1 md:ml-[260px] min-h-screen overflow-x-hidden">
        <div className="max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
