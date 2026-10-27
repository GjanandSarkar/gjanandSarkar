"use client";

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/lib/i18n';
import { getUserOrders } from '@/lib/api/orders';
import { supabase } from '@/lib/supabase';
import type { OrderWithItems } from '@/lib/api/orders';
import { format } from 'date-fns';
import { ShoppingBag, ChevronDown, ArrowRight, Package, Truck, CheckCircle2, Clock, AlertCircle, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { BuyAgainCarousel } from '@/components/discovery/BuyAgainCarousel';
import { EmptyState } from '@/components/discovery/EmptyState';
import { CancelOrderButton } from '@/components/orders/CancelOrderButton';

const STATUS_STYLES: Record<string, { bg: string; color: string; dot: string; icon: typeof Clock }> = {
  'pending':          { bg: 'var(--warning-bg)', color: 'var(--warning)', dot: 'var(--warning)', icon: Clock },
  'confirmed':        { bg: 'var(--primary-fixed)', color: 'var(--primary)', dot: 'var(--primary)', icon: CheckCircle2 },
  'out_for_delivery': { bg: 'var(--warning-bg)', color: 'var(--warning)', dot: 'var(--warning)', icon: Truck },
  'delivered':        { bg: 'var(--success-bg)', color: 'var(--success)', dot: 'var(--success)', icon: CheckCircle2 },
  'cancelled':        { bg: 'var(--surface-muted)', color: 'var(--foreground-muted)', dot: 'var(--foreground-muted)', icon: AlertCircle },
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
    <div className="flex flex-col min-h-screen bg-background">
      {/* Sticky Header + Tabs */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border">
        <div className="page-medium px-5 md:px-10 pt-6 pb-2">
          <h1 className="font-semibold text-2xl tracking-tight mb-4 text-foreground">
            {t('myOrders')}
            <span className="ml-2 text-sm font-normal text-foreground-muted">
              ({filteredOrders.length})
            </span>
          </h1>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-4 py-2 min-h-[44px] rounded-full text-xs font-semibold transition-colors shrink-0 ${
                  activeTab === tab
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-muted text-foreground-muted hover:text-foreground'
                }`}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="page-medium px-5 md:px-10 py-5 flex flex-col gap-3">
        {filteredOrders.length > 0 && activeTab === 'All' && (
          <div className="mb-6 -mx-5 px-5 md:mx-0 md:px-0">
            <BuyAgainCarousel />
          </div>
        )}
        
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
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <EmptyState type="orders" />
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
              {filteredOrders.map((order, i) => {
                const ss = STATUS_STYLES[order.status] ?? STATUS_STYLES['pending'];
                const StatusIcon = ss.icon;
                const isExpanded = expandedId === order.id;
                return (
                  <motion.div key={order.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: i * 0.04 }}
                    className="rounded-lg overflow-hidden bg-surface border border-border">

                    {/* Row */}
                    <div className="flex items-center justify-between px-5 py-4 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-primary">{order.id}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            order.payment_status === 'paid' ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'
                          }`}>
                            {order.payment_status === 'paid'
                              ? 'Paid'
                              : (order.payment_method || '').toUpperCase() === 'COD'
                              ? 'Payment Pending'
                              : (order.payment_status || 'Pending')} ({(order.payment_method || 'COD').toUpperCase()})
                          </span>
                        </div>
                        <p className="text-xs text-foreground-muted mt-0.5">
                          {format(new Date(order.created_at), 'MMM d, hh:mm a')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-sm text-foreground">
                           {t('currency')}{order.total_amount}
                        </span>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{ background: ss.bg, color: ss.color }}>
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ss.dot }} />
                          <span className="capitalize whitespace-nowrap">
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <ChevronDown className={`w-4 h-4 shrink-0 text-foreground-muted transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`} />
                      </div>
                    </div>

                    {/* Expanded */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                          className="overflow-hidden border-t border-border"
                        >
                          <div className="px-5 py-4">
                            {/* Items */}
                            <div className="rounded-lg p-3 mb-4 bg-surface-muted">
                              {(order.order_items ?? []).map((item, j) => {
                                const pName = item.product_name || item.products?.name || (item.product_id ? `Product #${item.product_id.slice(0, 6)}` : 'Verified Product');
                                const pWeight = item.weight || item.product_variants?.weight || '';
                                return (
                                  <div key={j} className={`flex justify-between text-xs py-1.5 ${
                                    j > 0 ? 'border-t border-border' : ''
                                  }`}>
                                    <span className="text-foreground-muted">
                                      {item.quantity}× {pName}{pWeight ? ` (${pWeight})` : ''}
                                    </span>
                                    <span className="font-semibold text-foreground">
                                      {t('currency')}{item.price * item.quantity}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Payment Status & Details */}
                            <div className="p-3 mb-4 rounded-lg bg-surface border border-border text-xs space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-foreground-muted">Payment Method:</span>
                                <span className="font-semibold text-foreground">
                                  {(order.payment_method || '').toUpperCase() === 'COD' ? 'Cash on Delivery (COD)' : (order.payment_method || 'Online')}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-foreground-muted">Payment Status:</span>
                                <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${
                                  order.payment_status === 'paid' ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'
                                }`}>
                                  {order.payment_status === 'paid'
                                    ? 'Paid'
                                    : (order.payment_method || '').toUpperCase() === 'COD'
                                    ? 'Payment Pending'
                                    : (order.payment_status || 'Pending')}
                                </span>
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t border-border">
                                <span className="text-foreground-muted font-medium">Total Amount:</span>
                                <span className="font-semibold text-primary font-mono text-xs">
                                  {t('currency')}{order.total_amount}
                                </span>
                              </div>
                            </div>

                            {/* Track button */}
                            {(order.status === 'out_for_delivery' || order.status === 'confirmed') && (
                              <Link href={`/tracking/${order.id}`}
                                className="flex items-center justify-center gap-2 w-full py-2.5 min-h-[44px] rounded-lg font-semibold text-sm bg-primary text-on-primary hover:bg-primary-hover shadow-xs transition-colors">
                                <Truck className="w-4 h-4" />
                                {t('trackLive')}
                              </Link>
                            )}

                            {/* Cancel Order button */}
                            <CancelOrderButton
                              orderId={order.id}
                              status={order.status}
                              paymentMethod={order.payment_method}
                              totalAmount={order.total_amount}
                              onChanged={() => loadOrders()}
                              className="flex items-center justify-center gap-2 w-full py-2.5 min-h-[44px] mt-2 rounded-lg font-semibold text-xs text-error bg-error-bg hover:bg-error-bg border border-error/20 transition-colors cursor-pointer"
                            />

                            {/* Return claim button */}
                            {order.status === 'delivered' && (
                              <Link href={`/returns?orderId=${order.id}`}
                                className="flex items-center justify-center gap-2 w-full py-2.5 min-h-[44px] rounded-lg font-semibold text-xs text-primary bg-primary-fixed hover:bg-primary-fixed-dim transition-colors">
                                <RotateCcw className="w-3.5 h-3.5" />
                                Report Issue / Return Item
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
