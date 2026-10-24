"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Store, RotateCcw } from 'lucide-react';
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
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb / Header */}
        <div className="bg-surface rounded-3xl border border-border/90 shadow-2xs p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/seller/dashboard"
              className="p-2.5 rounded-xl border border-border text-foreground hover:bg-surface-muted flex items-center justify-center transition-colors shrink-0"
              title="Return to Seller Dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-success-bg text-success text-[10px] font-black uppercase tracking-wider">
                  Seller Orders Portal
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-primary tracking-tight flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-secondary" />
                <span>Seller Order Management</span>
              </h1>
              <p className="text-xs text-foreground-muted">
                Track incoming customer purchases, advance fulfillment milestones (Confirmed → Out for Delivery → Delivered), and manage cancellations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/seller/returns"
              className="px-4 py-2.5 bg-warning-bg hover:bg-warning-bg text-warning border border-warning/20 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-warning" />
              <span>Returns & Replacements</span>
            </Link>
            <Link
              href="/seller/dashboard"
              className="px-4 py-2.5 bg-surface-muted hover:bg-border text-foreground text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Store className="w-4 h-4 text-foreground-muted" />
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
