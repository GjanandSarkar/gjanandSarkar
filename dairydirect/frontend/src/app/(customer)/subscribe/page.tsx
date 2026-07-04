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

export default function SubscriptionHubScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useStore((s) => s.user);

  const [subs, setSubs] = useState<SubscriptionWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSubs = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const data = await getUserSubscriptions(user.id);
    setSubs(data);
    setIsLoading(false);
  }, [user]);

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
    <div className="flex flex-col min-h-screen pb-24 bg-surface-container">
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-5 md:px-10 pt-6 pb-4 bg-surface-container-lowest border-b border-sand/30 shadow-sm">
        <h1 className="font-extrabold text-[24px] tracking-tight text-dark">
          {t('mySubscriptions')}
          <span className="ml-2 text-[15px] font-normal text-muted">
            ({subs.length})
          </span>
        </h1>
        <Link href="/subscribe/new">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] font-bold text-[13px] text-white transition-all active:scale-95 bg-primary shadow-[0_4px_12px_rgba(63,101,48,0.25)] hover:bg-primary/90">
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            New
          </button>
        </Link>
      </div>

      <div className="px-5 md:px-10 py-5">
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
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[24px] border border-sand/50 shadow-sm">
            <div className="w-24 h-24 rounded-[20px] flex items-center justify-center mb-6 bg-sky-50 shadow-inner">
              <img src="/milk.png" alt="No Subscriptions" className="w-16 h-16 object-contain opacity-60 grayscale" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-dark">
              Wake up to fresh milk
            </h2>
            <p className="text-sm max-w-[250px] mb-8 leading-relaxed text-muted">
              Never run out of essentials. Subscribe once and get fresh dairy delivered every morning before 7 AM.
            </p>
            <Link href="/products">
              <Button size="lg" className="px-8 shadow-active shadow-primary/20 bg-primary hover:bg-primary/90 text-white font-bold rounded-full mb-8">
                Explore Products
              </Button>
            </Link>
            
            <div className="w-full text-left pt-6 border-t border-sand">
              <h3 className="text-lg font-black text-dark mb-4 px-4">Popular for Subscription</h3>
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
