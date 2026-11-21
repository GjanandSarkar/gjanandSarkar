"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Store, RotateCcw } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { SellerOrdersManager } from '@/components/seller/SellerOrdersManager';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default function SellerOrdersDedicatedPage() {
  const router = useRouter();
  const user = useStore(s => s.user);
  const isAuthLoading = useStore(s => s.isAuthLoading);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/login?redirect=/seller/orders');
    }
  }, [isAuthLoading, user, router]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Standard Admin Header */}
      <AdminHeader
        title={
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <span>Seller Order Management</span>
          </div>
        }
        subtitle="Track incoming customer purchases, advance fulfillment milestones (Confirmed → Out for Delivery → Delivered), and manage cancellations"
        actions={
          <div className="flex items-center gap-2.5">
            <Link
              href="/seller/returns"
              className="px-3.5 py-2 bg-surface hover:bg-surface-muted text-foreground border border-border text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-warning" />
              <span>Returns & Claims</span>
            </Link>
            <Link
              href="/seller/dashboard"
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          </div>
        }
      />

      {/* Orders Manager Component */}
      <div className="px-6 md:px-10 py-6">
        <SellerOrdersManager />
      </div>
    </div>
  );
}
