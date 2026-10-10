"use client";

import Link from 'next/link';
import { CalendarDays, ChevronRight, PauseCircle, CheckCircle2 } from 'lucide-react';
import type { SubscriptionWithProduct } from '@/lib/api/subscriptions';
import { Button } from '@/components/ui/Button';

// Units for subscription volume. Previously an inline check for exactly
// 'Milk' or 'Buttermilk', so every other liquid subscription displayed in kg.
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-black text-dark tracking-wide">My Subscriptions</h2>
          {subscriptions.length > 0 && (
            <Link href="/subscribe" className="text-primary text-sm font-bold flex items-center hover:opacity-80 transition-opacity">
              Manage <ChevronRight className="w-4 h-4 ml-0.5" />
            </Link>
          )}
        </div>
      )}

      {activeSubs.length === 0 ? (
        <div className="bg-white rounded-[24px] p-6 border border-sand/50 text-center shadow-sm">
          <CalendarDays className="w-10 h-10 text-muted mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-bold text-dark mb-1">No Active Subscriptions</h3>
          <p className="text-sm text-muted mb-4 font-medium">Get fresh milk delivered to your doorstep daily.</p>
          <Link href="/home">
            <Button size="sm" className="shadow-active">Start Subscription</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeSubs.map(sub => {
            const isPaused = sub.status === 'paused';
            return (
              <div key={sub.id} className="bg-white rounded-[20px] p-4 border border-sand/50 shadow-sm flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isPaused ? 'bg-sand/50 text-muted' : 'bg-mint/30 text-primary'}`}>
                  {isPaused ? <PauseCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-dark text-sm truncate">{sub.products?.name || 'Product'}</h3>
                  <p className="text-xs font-medium text-muted mt-0.5">
                    {sub.volume} {LIQUID_CATEGORIES.has((sub.products?.category ?? '').toLowerCase()) ? 'L' : 'kg'} / {sub.plan}
                  </p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider mt-1.5 ${isPaused ? 'text-red-500' : 'text-primary'}`}>
                    {isPaused ? 'Paused' : 'Active'}
                  </p>
                </div>
                <Link href="/subscribe" className="shrink-0">
                  <div className="w-8 h-8 rounded-full bg-sand/30 flex items-center justify-center text-dark hover:bg-sand/50 transition-colors">
                    <ChevronRight className="w-4 h-4" />
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
