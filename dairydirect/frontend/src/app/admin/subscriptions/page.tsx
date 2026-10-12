"use client";

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { format } from 'date-fns';
import { Repeat, Loader2, CheckCircle2, PauseCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllSubscriptions, pauseSubscription, cancelSubscription } from '@/lib/api/subscriptions';

const STATUS_STYLES: Record<string, { bg: string; color: string; icon: any }> = {
  'active': { bg: '#eaf4e2', color: '#2a4f1d', icon: CheckCircle2 },
  'paused': { bg: '#fff8e6', color: '#7d5200', icon: PauseCircle },
  'cancelled': { bg: '#e3e3dc', color: '#43493e', icon: XCircle },
};

export default function AdminSubscriptionsPage() {
  const { t } = useTranslation();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    const data = await getAllSubscriptions();
    setSubscriptions(data);
    setIsLoading(false);
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    setIsUpdating(id);
    const result = await pauseSubscription(id, currentStatus);
    if (result.success) {
      setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, status: currentStatus === 'paused' ? 'active' : 'paused' } : s));
    }
    setIsUpdating(null);
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;
    setIsUpdating(id);
    const result = await cancelSubscription(id);
    if (result.success) {
      setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, status: 'cancelled' } : s));
    }
    setIsUpdating(null);
  };

  const filtered = activeTab === 'all' ? subscriptions : subscriptions.filter(s => s.status === activeTab);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center pt-20 px-6" style={{ background: 'var(--color-surface)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-30 glass-surface">
        <div className="px-6 md:px-10 pt-6 pb-0">
          <h1 className="font-extrabold text-[24px] tracking-tight mb-4"
            style={{ color: 'var(--color-on-surface)' }}>
            Subscriptions
            <span className="ml-2 text-[15px] font-normal" style={{ color: 'var(--color-outline)' }}>
              ({filtered.length})
            </span>
          </h1>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-6 px-6 pb-1">
            {['all', 'active', 'paused', 'cancelled'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="whitespace-nowrap px-4 py-2 rounded-full text-[12px] font-semibold transition-all duration-200 shrink-0 capitalize"
                style={activeTab === tab ? {
                  background: 'var(--cta-gradient)',
                  color: 'white',
                  boxShadow: '0 3px 10px rgba(12, 60, 38, 0.25)',
                } : {
                  background: 'var(--color-surface-container-low)',
                  color: 'var(--color-on-surface-variant)',
                }}>
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="h-px mt-2 opacity-25" style={{ background: 'var(--color-outline-variant)' }} />
      </div>

      <div className="px-6 md:px-10 py-5 flex flex-col gap-3">
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'var(--color-surface-container-low)' }}>
                <Repeat className="w-7 h-7" style={{ color: 'var(--color-outline)' }} strokeWidth={1.5} />
              </div>
              <p className="font-bold text-[18px]" style={{ color: 'var(--color-on-surface)' }}>No subscriptions</p>
              <p className="text-[13px] mt-1" style={{ color: 'var(--color-outline)' }}>
                Subscriptions will appear when customers subscribe to products.
              </p>
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((sub, i) => {
                const statusStyle = STATUS_STYLES[sub.status] || STATUS_STYLES['cancelled'];
                const Icon = statusStyle.icon;
                return (
                  <motion.div key={sub.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: i * 0.04 }}
                    className="rounded-[16px] overflow-hidden p-5 flex flex-col"
                    style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(195,201,187,0.3)' }}>
                    
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-bold text-[15px]" style={{ color: 'var(--color-on-surface)' }}>
                          {sub.products?.name || 'Product'} ({sub.volume} {t('volume_unit')})
                        </p>
                        <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-outline)' }}>
                          {sub.plan === 'weekly' ? 'Weekly Delivery' : 'Monthly Delivery'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0"
                        style={{ background: statusStyle.bg, color: statusStyle.color }}>
                        <Icon className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wide">
                          {sub.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2 mb-5">
                      <div className="flex justify-between text-[13px]">
                        <span style={{ color: 'var(--color-outline)' }}>Customer</span>
                        <span className="font-medium truncate max-w-[120px]" style={{ color: 'var(--color-on-surface)' }}>
                          {sub.profiles?.name || sub.user_id?.slice(0,8)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span style={{ color: 'var(--color-outline)' }}>Start Date</span>
                        <span className="font-medium" style={{ color: 'var(--color-on-surface)' }}>
                          {format(new Date(sub.start_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {sub.next_delivery_date && (
                        <div className="flex justify-between text-[13px]">
                          <span style={{ color: 'var(--color-outline)' }}>Next Delivery</span>
                          <span className="font-medium" style={{ color: 'var(--color-on-surface)' }}>
                            {format(new Date(sub.next_delivery_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-auto pt-4" style={{ borderTop: '1px solid rgba(195,201,187,0.3)' }}>
                      {sub.status !== 'cancelled' && (
                        <>
                          <button 
                            onClick={() => handleToggleStatus(sub.id, sub.status)}
                            disabled={isUpdating === sub.id}
                            className="flex-1 h-9 rounded-[10px] text-[13px] font-bold transition-all hover:opacity-80 active:scale-95 disabled:opacity-50"
                            style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface)' }}>
                            {sub.status === 'paused' ? 'Resume' : 'Pause'}
                          </button>
                          <button 
                            onClick={() => handleCancel(sub.id)}
                            disabled={isUpdating === sub.id}
                            className="flex-1 h-9 rounded-[10px] text-[13px] font-bold transition-all hover:bg-red-50 active:scale-95 disabled:opacity-50"
                            style={{ background: 'transparent', color: 'var(--color-error)', border: '1px solid var(--color-error)' }}>
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
