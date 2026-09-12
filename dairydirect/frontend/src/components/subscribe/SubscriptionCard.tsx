"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarCheck, Droplets, Pause, Play, Settings2, MoreHorizontal, AlertTriangle, Loader2 } from 'lucide-react';
import type { SubscriptionWithProduct } from '@/lib/api/subscriptions';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubscriptionCardProps {
  subscription: SubscriptionWithProduct;
  onPauseToggle: (sub: SubscriptionWithProduct) => Promise<void>;
  onCancel: (sub: SubscriptionWithProduct) => Promise<void>;
}

export function SubscriptionCard({ subscription, onPauseToggle, onCancel }: SubscriptionCardProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const product = subscription.products;
  const isPaused = subscription.status === 'paused';
  const isPending = subscription.status === 'pending_review';

  function formatDeliveryDate(dateStr: string | null): string {
    if (!dateStr) return 'Tomorrow';
    const date = new Date(dateStr);
    // eslint-disable-next-line react-hooks/purity
    const tomorrow = new Date(Date.now() + 86400000);
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow, 7:00 – 9:00 AM';
    return date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  const handlePause = async () => {
    setIsProcessing(true);
    await onPauseToggle(subscription);
    setIsProcessing(false);
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;
    setIsProcessing(true);
    await onCancel(subscription);
    setIsProcessing(false);
  };

  return (
    <div className="bg-white rounded-[24px] overflow-hidden border border-sand/50 shadow-sm relative">
      {/* Pending Review Banner */}
      {isPending && (
        <div className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest text-center py-1.5 flex items-center justify-center gap-1.5">
          <AlertTriangle className="w-3 h-3" /> Modification Pending Approval
        </div>
      )}

      <div className={`p-5 ${isPending ? 'pt-4' : ''}`}>
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
            isPaused ? 'bg-amber-100 text-amber-700' : 'bg-mint/30 text-primary'
          }`}>
            {isPaused ? 'Paused' : 'Active'}
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 flex items-center justify-center rounded-full text-muted hover:bg-sand/30 hover:text-dark transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-10 w-48 bg-white rounded-2xl shadow-xl border border-sand/50 z-50 py-2 overflow-hidden"
                  >
                    <button
                      onClick={handleCancel}
                      disabled={isProcessing}
                      className="w-full px-4 py-2.5 text-left text-sm font-bold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Cancel Subscription
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Product Details */}
        <div className="flex gap-4 mb-5">
          <div className="w-20 h-20 rounded-[18px] bg-sky-50 border border-sand/50 shrink-0 flex items-center justify-center overflow-hidden p-2">
            <img 
              src={product?.image_url || '/milk.png'} 
              alt={product?.name} 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1">
            <h3 className="font-black text-lg text-dark leading-tight mb-1">
              {product?.name || 'A2 Milk'}
            </h3>
            <p className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
              {subscription.plan === 'daily' ? 'Daily' : subscription.plan === 'alternate' ? 'Alternate Days' : 'Custom'} Delivery
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-mint/20 text-primary">
              <Droplets className="w-3 h-3" />
              <span className="text-[12px] font-black">
                {subscription.volume}L
              </span>
            </div>
          </div>
        </div>

        {/* Next Delivery Info */}
        {!isPaused && (
          <div className="bg-surface-container/50 rounded-[16px] p-4 flex items-center gap-3 border border-sand/30 mb-5">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">Next Delivery</p>
              <p className="text-sm font-bold text-dark">{formatDeliveryDate(subscription.next_delivery_date)}</p>
            </div>
          </div>
        )}

        {/* Primary Actions (Retention Focus) */}
        <div className="flex gap-2">
          <button
            onClick={handlePause}
            disabled={isProcessing || isPending}
            className={`flex-1 h-12 flex items-center justify-center gap-2 rounded-xl font-bold text-sm transition-all shadow-sm ${
              isPaused 
                ? 'bg-primary text-white shadow-active hover:bg-primary/90' 
                : 'bg-white border-2 border-sand text-dark hover:border-dark'
            } disabled:opacity-50`}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPaused ? (
              <><Play className="w-4 h-4 fill-current" /> Resume</>
            ) : (
              <><Pause className="w-4 h-4 fill-current" /> Pause</>
            )}
          </button>
          
          <button
            onClick={() => !isPending && router.push(`/subscribe/new?edit=${subscription.id}`)}
            disabled={isPending || isProcessing}
            className="flex-1 h-12 flex items-center justify-center gap-2 bg-white border-2 border-sand text-dark rounded-xl font-bold text-sm hover:border-dark transition-all shadow-sm disabled:opacity-50"
          >
            <Settings2 className="w-4 h-4" /> 
            {isPending ? 'Pending' : 'Modify'}
          </button>
        </div>
      </div>
    </div>
  );
}
