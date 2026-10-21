"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { useStore } from '@/store/useStore';
import {
  getUserSubscriptions,
  pauseSubscription as pauseSub,
  cancelSubscription as cancelSub,
} from '@/lib/api/subscriptions';
import type { SubscriptionWithProduct } from '@/lib/api/subscriptions';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SubscriptionSkeleton } from '@/components/subscribe/SubscriptionSkeleton';
import { SubscriptionCard } from '@/components/subscribe/SubscriptionCard';
import { UpcomingDeliveries } from '@/components/subscribe/UpcomingDeliveries';
import { SubscriptionConfidence } from '@/components/trust/SubscriptionConfidence';
import { SubscriptionReminderCard } from '@/components/subscribe/SubscriptionReminderCard';
import { BuyAgainCarousel } from '@/components/discovery/BuyAgainCarousel';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';

export default function SubscriptionHubScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useStore((s) => s.user);

  const [subs, setSubs] = useState<SubscriptionWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSubs = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const data = await getUserSubscriptions(user.id);
    setSubs(data);
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => { loadSubs(); }, [loadSubs]);

  const handlePauseToggle = async (sub: SubscriptionWithProduct) => {
    const result = await pauseSub(sub.id, sub.status);
    if (result.success) {
      const newStatus = sub.status === 'paused' ? 'active' : 'paused';
      setSubs((prev) => prev.map((s) => s.id === sub.id ? { ...s, status: newStatus as any } : s));
    } else {
      alert(result.error || 'Failed to update subscription status.');
    }
  };

  const handleCancel = async (sub: SubscriptionWithProduct) => {
    const result = await cancelSub(sub.id);
    if (result.success) {
      setSubs((prev) => prev.filter((s) => s.id !== sub.id));
    } else {
      alert(result.error || 'Failed to cancel subscription.');
    }
  };

  if (isLoading) {
    return <SubscriptionSkeleton />;
  }

  const activeSubscriptions = subs.filter(s => s.status === 'active');

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-background text-foreground transition-colors duration-150">
      {/* Standardized Page Header */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 pt-6 pb-2 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <h1 className="font-extrabold text-2xl sm:text-3xl tracking-tight text-foreground">
              {t('mySubscriptions') || 'My Subscriptions'}
              <span className="ml-2.5 text-base sm:text-lg font-medium text-foreground-muted">
                ({subs.length})
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted mt-1">
              Manage recurring morning dairy deliveries and scheduled staples
            </p>
          </div>
          <Link href="/subscribe/new" className="self-start sm:self-auto">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white transition-all active:scale-95 bg-primary hover:bg-primary-hover shadow-xs cursor-pointer">
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span>New Plan</span>
            </button>
          </Link>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 space-y-6 w-full">
        {subs.length > 0 ? (
          <>
            <SubscriptionReminderCard />
            <UpcomingDeliveries activeSubscriptions={activeSubscriptions} />

            <div className="space-y-4">
              {subs.map((sub) => (
                <SubscriptionCard
                  key={sub.id}
                  subscription={sub}
                  onPauseToggle={handlePauseToggle}
                  onCancel={handleCancel}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-surface rounded-2xl border border-border shadow-xs max-w-xl mx-auto p-6 space-y-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-primary/10 text-primary border border-primary/20">
              <Plus className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              Never run out of morning essentials
            </h2>
            <p className="text-xs max-w-sm leading-relaxed text-foreground-muted">
              Subscribe once and your regulars arrive on schedule — pure A2 milk, bilona ghee, and farm-fresh staples.
            </p>
            <Link href="/products">
              <button className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer">
                Explore Subscription Products
              </button>
            </Link>
            
            <div className="w-full text-left pt-6 border-t border-border/60">
              <h3 className="text-sm font-bold text-foreground mb-3 px-1">Popular for Daily Delivery</h3>
              <BuyAgainCarousel />
            </div>
          </div>
        )}

        {/* Trust Module */}
        <SubscriptionConfidence />
      </div>
    </div>
  );
}
