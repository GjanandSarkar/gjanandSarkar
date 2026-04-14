"use client";

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/lib/i18n';
import { getUserOrders } from '@/lib/api/orders';
import { supabase } from '@/lib/supabase';
import type { OrderWithItems } from '@/lib/api/orders';
import { format } from 'date-fns';
import { ShoppingBag, ChevronDown, ArrowRight, Package, Truck, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const STATUS_STYLES: Record<string, { bg: string; color: string; dot: string; icon: typeof Clock }> = {
  'pending':          { bg: '#ffdcc7', color: '#774117', dot: '#d4712a', icon: Clock },
  'confirmed':        { bg: '#c2efac', color: '#042100', dot: '#3f6530', icon: CheckCircle2 },
  'preparing':        { bg: '#bfedce', color: '#002111', dot: '#3b644c', icon: Package },
  'out_for_delivery': { bg: '#fff8e6', color: '#7d5200', dot: '#c78c2e', icon: Truck },
  'delivered':        { bg: '#eaf4e2', color: '#2a4f1d', dot: '#3f6530', icon: CheckCircle2 },
  'cancelled':        { bg: '#e3e3dc', color: '#43493e', dot: '#73796d', icon: AlertCircle },
};

const TABS = ['All', 'Active', 'Delivered', 'Cancelled'];

export default function OrdersScreen() {
  const { t } = useTranslation();
  const user = useStore(state => state.user);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const filteredOrders = (() => {
    switch (activeTab) {
      case 'Active':
        return orders.filter(o => ['pending', 'confirmed', 'preparing', 'out_for_delivery'].includes(o.status));
      case 'Delivered':
        return orders.filter(o => o.status === 'delivered');
      case 'Cancelled':
        return orders.filter(o => o.status === 'cancelled');
      default:
        return orders;
    }
  })();

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const data = await getUserOrders(user.id);
    setOrders(data);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Realtime: listen for status updates on MY orders
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`orders:user:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          const updated = payload.new as OrderWithItems;
          setOrders(prev =>
            prev.map(o => o.id === updated.id ? { ...o, ...updated } : o)
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky Header + Tabs */}
      <div className="sticky top-0 z-30 glass-surface">
        <div className="px-5 md:px-10 pt-6 pb-0">
          <h1 className="font-extrabold text-[24px] tracking-tight mb-4"
            style={{ color: 'var(--color-on-surface)' }}>
            {t('myOrders')}
            <span className="ml-2 text-[15px] font-normal" style={{ color: 'var(--color-outline)' }}>
              ({filteredOrders.length})
            </span>
          </h1>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="whitespace-nowrap px-4 py-2 rounded-full text-[12px] font-semibold transition-all duration-200 shrink-0"
                style={activeTab === tab ? {
                  background: 'linear-gradient(135deg, #3f6530, #577f46)',
                  color: 'white',
                  boxShadow: '0 3px 10px rgba(63, 101, 48, 0.25)',
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

      <div className="px-5 md:px-10 py-5 flex flex-col gap-3">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[72px] rounded-[16px] animate-pulse"
                  style={{ background: 'var(--color-surface-container-low)' }} />
              ))}
            </motion.div>
          ) : filteredOrders.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'var(--color-surface-container-low)' }}>
                <ShoppingBag className="w-7 h-7" style={{ color: 'var(--color-outline)' }} strokeWidth={1.5} />
              </div>
              <p className="font-bold text-[18px]" style={{ color: 'var(--color-on-surface)' }}>
                {t('noOrders')}
              </p>
              <p className="text-[13px] mt-1" style={{ color: 'var(--color-outline)' }}>
                {t('noOrdersSub')}
              </p>
              <Link href="/products"
                className="mt-6 flex items-center gap-2 px-6 py-3 rounded-[12px] font-bold text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #3f6530, #577f46)' }}>
                {t('browseProducts')} <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
              {filteredOrders.map((order, i) => {
                const ss = STATUS_STYLES[order.status.toLowerCase()] ?? STATUS_STYLES['pending'];
                const StatusIcon = ss.icon;
                const isExpanded = expandedId === order.id;
                return (
                  <motion.div key={order.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: i * 0.04 }}
                    className="rounded-[16px] overflow-hidden"
                    style={{ background: 'var(--color-surface-container-lowest)' }}>

                    {/* Row */}
                    <div className="flex items-center justify-between px-5 py-4 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                      <div>
                        <p className="font-bold text-[14px]" style={{ color: 'var(--color-primary)' }}>{order.id}</p>
                        <p className="text-[11px]" style={{ color: 'var(--color-outline)' }}>
                          {format(new Date(order.created_at), 'MMM d, hh:mm a')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-[15px]" style={{ color: 'var(--color-primary)' }}>
                          {t('currency')}{order.total}
                        </span>
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
                          style={{ background: ss.bg, color: ss.color }}>
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ss.dot }} />
                          <span className="text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">
                            {order.status}
                          </span>
                        </div>
                        <ChevronDown className="w-4 h-4 shrink-0 transition-transform duration-200"
                          style={{
                            color: 'var(--color-outline)',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          }} />
                      </div>
                    </div>

                    {/* Expanded */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                          style={{ overflow: 'hidden', borderTop: '1px solid rgba(195, 201, 187, 0.3)' }}
                        >
                          <div className="px-5 py-4">
                            {/* Items */}
                            <div className="rounded-[10px] p-3 mb-4"
                              style={{ background: 'var(--color-surface-container-low)' }}>
                              {(order.order_items ?? []).map((item, j) => (
                                <div key={j} className="flex justify-between text-[13px] py-1"
                                  style={{ borderTop: j > 0 ? '1px solid rgba(195, 201, 187, 0.25)' : undefined }}>
                                  <span style={{ color: 'var(--color-on-surface-variant)' }}>
                                    {item.quantity}× {item.product_name} ({item.variant_weight})
                                  </span>
                                  <span className="font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                                    {t('currency')}{item.price * item.quantity}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Track button */}
                            {(order.status === 'out_for_delivery' || order.status === 'confirmed') && (
                              <Link href={`/tracking/${order.id}`}
                                className="flex items-center justify-center gap-2 w-full py-3 rounded-[12px] font-bold text-sm text-white"
                                style={{ background: 'linear-gradient(135deg, #3f6530, #577f46)' }}>
                                <Truck className="w-4 h-4" />
                                {t('trackLive')}
                              </Link>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
