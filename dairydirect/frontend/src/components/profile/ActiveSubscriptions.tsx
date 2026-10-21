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
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold text-foreground">My Subscriptions</h2>
          {subscriptions.length > 0 && (
            <Link href="/subscribe" className="text-primary text-xs font-bold flex items-center hover:underline">
              Manage <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          )}
        </div>
      )}

      {activeSubs.length === 0 ? (
        <div className="bg-surface rounded-xl p-6 border border-border text-center">
          <CalendarDays className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
          <h3 className="text-xs font-bold text-foreground mb-0.5">No Active Subscriptions</h3>
          <p className="text-[11px] text-muted mb-3">Get fresh milk delivered to your doorstep daily.</p>
          <Link href="/home" className="inline-block px-4 py-2 bg-primary text-foreground-inverse font-bold text-xs rounded-lg">
            Start Subscription
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {activeSubs.map(sub => {
            const isPaused = sub.status === 'paused';
            return (
              <div key={sub.id} className="bg-surface rounded-xl p-3.5 border border-border flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                  isPaused ? 'bg-surface-muted border-border text-muted' : 'bg-primary/10 border-primary/20 text-primary'
                }`}>
                  {isPaused ? <PauseCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-xs truncate">{sub.products?.name || 'Product'}</h3>
                  <p className="text-[11px] text-muted mt-0.5">
                    {sub.volume} {LIQUID_CATEGORIES.has((sub.products?.category ?? '').toLowerCase()) ? 'L' : 'kg'} / {sub.plan}
                  </p>
                  <span className={`inline-block text-[10px] font-bold uppercase tracking-wider mt-1 px-1.5 py-0.2 rounded ${
                    isPaused ? 'bg-rose-500/10 text-rose-600' : 'bg-primary/10 text-primary'
                  }`}>
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
