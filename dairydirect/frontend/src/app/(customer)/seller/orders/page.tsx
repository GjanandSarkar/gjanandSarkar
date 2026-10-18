"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Store } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { SellerOrdersManager } from '@/components/seller/SellerOrdersManager';

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
    <div className="min-h-screen bg-background text-foreground transition-colors duration-150 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb / Header */}
        <div className="bg-surface rounded-3xl border border-border shadow-2xs p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-primary text-[10px] font-bold uppercase tracking-wider">
                  Seller Orders Portal
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <span>Seller Order Management</span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Track incoming customer purchases, advance fulfillment milestones (Confirmed → Out for Delivery → Delivered), and manage cancellations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/seller/dashboard"
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Store className="w-4 h-4 text-gray-600" />
              <span>Seller Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Orders Manager Component */}
        <SellerOrdersManager />
      </div>
    </div>
  );
}
