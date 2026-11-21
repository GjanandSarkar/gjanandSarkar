"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { SellerSidebar } from '@/components/seller/SellerSidebar';
import { AdminMobileNav } from '@/components/admin/AdminMobileNav';
import { Loader2 } from 'lucide-react';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const user = useStore((state) => state.user);
  const sellerStore = useStore((state) => state.sellerStore);
  const router = useRouter();
  const pathname = usePathname();
  const isAuthLoading = useStore((state) => state.isAuthLoading);

  // Mobile Slide-In Sidebar Drawer State (Edit #40)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    // Only sellers and admins can access the seller hub
    if (user.role !== 'seller' && user.role !== 'admin') {
      router.replace('/become-seller');
    }
  }, [user, pathname, router, isAuthLoading]);

  // Close mobile sidebar on route transition
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  if (isAuthLoading || !user || (user.role !== 'seller' && user.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6F5] dark:bg-black text-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F5F6F5] dark:bg-black text-foreground">
      {/* Viewport-Pinned Desktop Sidebar + Slide-in Mobile Drawer */}
      <SellerSidebar
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <main className="flex-1 md:ml-[260px] min-h-screen overflow-x-hidden flex flex-col bg-[#F5F6F5] dark:bg-black text-foreground">
        {/* Floating Rounded Frosted Mobile Top Bar (Edit #40) */}
        <AdminMobileNav
          portalType="seller"
          onOpenSidebar={() => setIsMobileSidebarOpen(true)}
        />

        <div className="w-full flex-1 flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
