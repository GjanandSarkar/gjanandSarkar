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
import { Plus, Settings2, CalendarCheck, MoreVertical, Droplets } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';

function formatDeliveryDate(dateStr: string | null): string {
  if (!dateStr) return 'Tomorrow Morning';
  const date = new Date(dateStr);
  const tomorrow = new Date(Date.now() + 86400000);
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow, 7:00 – 9:00 AM';
  return date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
}

const STATUS_STYLES: Record<string, string> = {
  'Active':         'bg-primary/10 text-primary',
  'Paused':         'bg-amber-100 text-amber-600',
  'Pending Review': 'bg-amber-100 text-amber-600',
  'Cancelled':      'bg-red-100 text-red-500',
};

export default function MySubscriptionsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useStore((s) => s.user);

  const [subs, setSubs] = useState<SubscriptionWithProduct[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const loadSubs = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const data = await getUserSubscriptions(user.id);
    setSubs(data);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { loadSubs(); }, [loadSubs]);

  const handlePause = async (sub: SubscriptionWithProduct) => {
    setBusy(sub.id);
    setActiveMenu(null);
    const result = await pauseSub(sub.id, sub.status);
    if (result.success) {
      const newStatus = sub.status === 'Paused' ? 'Active' : 'Paused';
      setSubs((prev) => prev.map((s) => s.id === sub.id ? { ...s, status: newStatus as any } : s));
    }
    setBusy(null);
  };

  const handleCancel = async (sub: SubscriptionWithProduct) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;
    setBusy(sub.id);
    setActiveMenu(null);
    const result = await cancelSub(sub.id);
    if (result.success) {
      setSubs((prev) => prev.filter((s) => s.id !== sub.id));
    }
    setBusy(null);
  };

  return (
    <div className="flex flex-col min-h-full pb-20" onClick={() => setActiveMenu(null)}>
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-5 md:px-10 pt-6 pb-4"
        style={{ background: 'var(--color-surface-container-lowest)' }}>
        <h1 className="font-extrabold text-[24px] tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
          {t('mySubscriptions')}
          <span className="ml-2 text-[15px] font-normal" style={{ color: 'var(--color-outline)' }}>
            ({subs.length})
          </span>
        </h1>
        <Link href="/subscribe/new">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] font-bold text-[13px] text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #3f6530, #577f46)', boxShadow: '0 4px 12px rgba(63, 101, 48, 0.25)' }}>
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            New
          </button>
        </Link>
      </div>

      <div className="px-5 md:px-10 py-5">
        {/* Active delivery alert */}
        {subs.some((s) => s.status === 'Active') && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-[12px] p-3 mb-6 flex items-center shadow-sm"
            style={{ background: 'var(--color-primary-fixed)', border: '1px solid rgba(63,101,48,0.15)' }}>
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 mr-3 shadow-sm overflow-hidden">
              <img src="/milk.png" alt="Milk" className="w-full h-full object-cover" />
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
              Your milk delivers tomorrow, 7:00 – 9:00 AM
            </p>
          </motion.div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-[220px] rounded-[24px] animate-pulse"
                style={{ background: 'var(--color-surface-container-low)' }} />
            ))}
          </div>
        ) : subs.length > 0 ? (
          <div className="space-y-4">
            {subs.map((sub) => {
              const product = sub.products;
              const isPending = sub.status === 'Pending Review';

              return (
                <div key={sub.id} className="rounded-[24px] overflow-hidden relative"
                  style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(195,201,187,0.3)' }}>
                  
                  {/* Pending Review Banner */}
                  {isPending && (
                    <div className="absolute top-0 left-0 right-0 text-center py-1 text-[10px] font-black uppercase tracking-widest z-10"
                      style={{ background: '#f59e0b', color: 'white' }}>
                      Modification Request Pending
                    </div>
                  )}

                  <div className={`p-5 ${isPending ? 'pt-8' : ''}`}>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full ${STATUS_STYLES[sub.status] ?? ''}`}>
                        {sub.status}
                      </span>
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveMenu(activeMenu === sub.id ? null : sub.id)}
                          disabled={busy === sub.id}
                          className="w-8 h-8 flex items-center justify-center rounded-full transition-colors disabled:opacity-40"
                          style={{ color: 'var(--color-on-surface-variant)' }}>
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        <AnimatePresence>
                          {activeMenu === sub.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -10 }}
                              className="absolute right-0 top-10 w-52 rounded-2xl shadow-xl z-50 py-2 overflow-hidden"
                              style={{ background: 'var(--color-surface)', border: '1px solid rgba(195,201,187,0.3)' }}>
                              <button
                                onClick={() => handlePause(sub)}
                                className="w-full px-4 py-3 text-left text-[13px] font-bold transition-colors"
                                style={{ color: 'var(--color-on-surface)' }}>
                                {sub.status === 'Paused' ? 'Resume Subscription' : 'Pause Subscription'}
                              </button>
                              <div className="h-px mx-2" style={{ background: 'var(--color-outline-variant)' }} />
                              <button
                                onClick={() => handleCancel(sub)}
                                className="w-full px-4 py-3 text-left text-[13px] font-bold text-red-500">
                                Cancel Subscription
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex gap-4 mb-5">
                      <div className="w-20 h-20 rounded-[18px] overflow-hidden shrink-0"
                        style={{ background: '#e8f4fd', border: '1px solid rgba(195,201,187,0.3)' }}>
                        <img src={product?.image_url ?? '/milk.png'} alt={product?.name}
                          className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-[17px] mb-1 leading-tight"
                          style={{ color: 'var(--color-on-surface)' }}>
                          {product?.name ?? 'A2 Milk'}
                        </h3>
                        <p className="text-[11px] font-bold uppercase tracking-wide mb-2"
                          style={{ color: 'var(--color-outline)' }}>
                          {sub.plan === 'monthly' ? 'Monthly' : 'Weekly'} Delivery
                        </p>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                          style={{ background: 'var(--color-primary-fixed)' }}>
                          <Droplets className="w-3 h-3" style={{ color: 'var(--color-primary)' }} />
                          <span className="text-[12px] font-black" style={{ color: 'var(--color-primary)' }}>
                            {sub.volume}L {t('daily')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Next Delivery */}
                    <div className="rounded-[18px] p-4"
                      style={{ background: 'var(--color-surface-container-low)', border: '1px solid rgba(195,201,187,0.3)' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm"
                            style={{ color: 'var(--color-primary)' }}>
                            <CalendarCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest"
                              style={{ color: 'var(--color-outline)' }}>{t('nextDelivery')}</p>
                            <p className="text-[13px] font-bold" style={{ color: 'var(--color-on-surface)' }}>
                              {formatDeliveryDate(sub.next_delivery_date)}
                            </p>
                          </div>
                        </div>
                        <button
                          className="text-[11px] font-black uppercase tracking-widest px-3 py-2 rounded-xl shadow-sm active:scale-95 transition-all"
                          style={{ background: 'white', color: 'var(--color-primary)', border: '1px solid rgba(195,201,187,0.5)' }}>
                          {t('skip')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-4 flex justify-between items-center"
                    style={{ background: 'var(--color-surface-container-low)', borderTop: '1px solid rgba(195,201,187,0.3)' }}>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--color-outline)' }}>
                        Subscription ID
                      </p>
                      <p className="text-[11px] font-bold" style={{ color: 'var(--color-on-surface)' }}>{sub.id}</p>
                    </div>
                    <button
                      onClick={() => !isPending && router.push(`/subscribe/new?edit=${sub.id}`)}
                      disabled={isPending}
                      className="text-[12px] font-black uppercase tracking-widest flex items-center gap-2 py-2 px-4 rounded-full shadow-sm active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: 'white', color: 'var(--color-primary)', border: '1px solid rgba(195,201,187,0.5)' }}>
                      {isPending ? 'Report Submitted' : 'Modify'} <Settings2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 overflow-hidden"
              style={{ background: 'var(--color-surface-container-low)' }}>
              <img src="/milk.png" alt="No Subscriptions" className="w-full h-full object-cover opacity-60 grayscale" />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-on-surface)' }}>
              No active subscriptions
            </h2>
            <p className="text-sm max-w-[220px] mb-8 leading-relaxed" style={{ color: 'var(--color-outline)' }}>
              Subscribe to get fresh milk delivered to your door every morning.
            </p>
            <Link href="/subscribe/new">
              <Button>Start a Subscription</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
