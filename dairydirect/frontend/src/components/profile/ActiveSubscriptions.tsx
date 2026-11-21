"use client";

import Link from 'next/link';
import { CalendarDays, ChevronRight, PauseCircle, CheckCircle2 } from 'lucide-react';
import type { SubscriptionWithProduct } from '@/lib/api/subscriptions';

const LIQUID_CATEGORIES = new Set([
  'milk', 'buttermilk', 'lassi', 'dairy', 'cold-pressed oils', 'beverages',
]);

interface ActiveSubscriptionsProps {
  subscriptions: SubscriptionWithProduct[];
  hideHeader?: boolean;
}

export function ActiveSubscriptions({ subscriptions, hideHeader = false }: ActiveSubscriptionsProps) {
  const activeSubs = subscriptions.slice(0, 2);

  return (
    <div>
      {!hideHeader && (
<<<<<<< HEAD
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-dark tracking-wide">My Subscriptions</h2>
=======
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold text-foreground">My Subscriptions</h2>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
          {subscriptions.length > 0 && (
            <Link href="/subscribe" className="text-primary text-xs font-bold flex items-center hover:underline">
              Manage <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          )}
        </div>
      )}

      {activeSubs.length === 0 ? (
<<<<<<< HEAD
        <div className="bg-surface rounded-[24px] p-6 border border-sand/50 text-center shadow-sm">
          <CalendarDays className="w-10 h-10 text-muted mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-bold text-dark mb-1">No Active Subscriptions</h3>
          <p className="text-sm text-muted mb-4 font-medium">Get fresh milk delivered to your doorstep daily.</p>
          <Link href="/subscribe/new">
            <Button size="sm" className="shadow-active">Start Subscription</Button>
=======
        <div className="bg-surface rounded-xl p-6 border border-border text-center">
          <CalendarDays className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
          <h3 className="text-xs font-bold text-foreground mb-0.5">No Active Subscriptions</h3>
          <p className="text-[11px] text-muted mb-3">Get fresh milk delivered to your doorstep daily.</p>
          <Link href="/home" className="inline-block px-4 py-2 bg-primary text-foreground-inverse font-bold text-xs rounded-lg">
            Start Subscription
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {activeSubs.map(sub => {
            const isPaused = sub.status === 'paused';
            return (
<<<<<<< HEAD
              <div key={sub.id} className="bg-surface rounded-[20px] p-4 border border-sand/50 shadow-sm flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isPaused ? 'bg-sand/50 text-muted' : 'bg-mint/30 text-primary'}`}>
                  {isPaused ? <PauseCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
=======
              <div key={sub.id} className="bg-surface rounded-xl p-3.5 border border-border flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                  isPaused ? 'bg-surface-muted border-border text-muted' : 'bg-primary/10 border-primary/20 text-primary'
                }`}>
                  {isPaused ? <PauseCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-xs truncate">{sub.products?.name || 'Product'}</h3>
                  <p className="text-[11px] text-muted mt-0.5">
                    {sub.volume} {LIQUID_CATEGORIES.has((sub.products?.category ?? '').toLowerCase()) ? 'L' : 'kg'} / {sub.plan}
                  </p>
<<<<<<< HEAD
                  <p className={`text-xs font-bold uppercase tracking-wider mt-1.5 ${isPaused ? 'text-red-500' : 'text-primary'}`}>
=======
                  <span className={`inline-block text-[10px] font-bold uppercase tracking-wider mt-1 px-1.5 py-0.2 rounded ${
                    isPaused ? 'bg-rose-500/10 text-rose-600' : 'bg-primary/10 text-primary'
                  }`}>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                    {isPaused ? 'Paused' : 'Active'}
                  </span>
                </div>
                <Link href="/subscribe" className="shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-surface-muted flex items-center justify-center text-muted hover:text-foreground transition-colors">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
