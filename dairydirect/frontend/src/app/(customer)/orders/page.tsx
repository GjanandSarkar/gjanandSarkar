"use client";

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/lib/i18n';
import { getUserOrders } from '@/lib/api/orders';
import { supabase } from '@/lib/supabase';
import type { OrderWithItems } from '@/lib/api/orders';
import { format } from 'date-fns';
import { ChevronDown, Truck, CheckCircle2, Clock, AlertCircle, RotateCcw, Package, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { BuyAgainCarousel } from '@/components/discovery/BuyAgainCarousel';
<<<<<<< HEAD
import { EmptyState } from '@/components/discovery/EmptyState';
import { CancelOrderButton } from '@/components/orders/CancelOrderButton';

const STATUS_STYLES: Record<string, { bg: string; color: string; dot: string; icon: typeof Clock }> = {
  'pending':          { bg: 'var(--warning-bg)', color: 'var(--warning)', dot: 'var(--warning)', icon: Clock },
  'confirmed':        { bg: 'var(--primary-fixed)', color: 'var(--primary)', dot: 'var(--primary)', icon: CheckCircle2 },
  'out_for_delivery': { bg: 'var(--warning-bg)', color: 'var(--warning)', dot: 'var(--warning)', icon: Truck },
  'delivered':        { bg: 'var(--success-bg)', color: 'var(--success)', dot: 'var(--success)', icon: CheckCircle2 },
  'cancelled':        { bg: 'var(--surface-muted)', color: 'var(--foreground-muted)', dot: 'var(--foreground-muted)', icon: AlertCircle },
=======

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string; icon: typeof Clock }> = {
  'pending':          { label: 'Order Placed', badgeClass: 'bg-amber-500/10 text-amber-700 border-amber-500/20', icon: Clock },
  'confirmed':        { label: 'Confirmed', badgeClass: 'bg-primary/10 text-primary border-primary/20', icon: CheckCircle2 },
  'preparing':        { label: 'Packing', badgeClass: 'bg-primary/10 text-primary border-primary/20', icon: Clock },
  'out_for_delivery': { label: 'Out for Delivery', badgeClass: 'bg-primary text-white border-primary', icon: Truck },
  'delivered':        { label: 'Delivered', badgeClass: 'bg-primary/10 text-primary border-primary/20', icon: CheckCircle2 },
  'cancelled':        { label: 'Cancelled', badgeClass: 'bg-rose-500/10 text-rose-600 border-rose-500/20', icon: AlertCircle },
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
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
    if (!user?.id) return;
    setIsLoading(true);
    const data = await getUserOrders(user.id);
    setOrders(data);
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Realtime: listen for status updates on MY orders
  useEffect(() => {
    if (!user?.id) return;
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
  }, [user?.id]);

  return (
<<<<<<< HEAD
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
=======
    <div className="flex flex-col min-h-screen bg-background pb-16 transition-colors duration-150">
      {/* Standardized Page Header + Tabs */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 pt-6 pb-2 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <h1 className="font-extrabold text-2xl sm:text-3xl tracking-tight text-foreground">
              {t('myOrders') || 'My Orders'}
              <span className="ml-2.5 text-base sm:text-lg font-medium text-foreground-muted">
                ({filteredOrders.length})
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted mt-1">
              Track live delivery status, view invoices and reorder favorites
            </p>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {TABS.map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                  activeTab === tab
                    ? 'bg-primary text-white shadow-2xs'
                    : 'bg-surface border border-border text-foreground-muted hover:text-foreground hover:bg-surface-muted'
                }`}
              >
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 flex flex-col gap-4 w-full">
        {filteredOrders.length > 0 && activeTab === 'All' && (
          <div className="mb-2">
            <BuyAgainCarousel />
          </div>
        )}
        
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col gap-2.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 rounded-xl bg-surface-muted animate-pulse border border-border" />
              ))}
            </motion.div>
          ) : filteredOrders.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-8">
              <div className="bg-surface rounded-2xl border border-border p-8 sm:p-12 text-center max-w-md mx-auto space-y-4 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-surface-muted flex items-center justify-center mx-auto text-foreground-muted border border-border">
                  <Package className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground">
                  {activeTab === 'All' ? 'No orders yet' : `No ${activeTab.toLowerCase()} orders`}
                </h3>
                <p className="text-xs text-foreground-muted max-w-sm mx-auto leading-relaxed">
                  {activeTab === 'All'
                    ? "You haven't placed any orders with us yet. Start shopping fresh items directly from verified farms."
                    : `You don't have any ${activeTab.toLowerCase()} orders at the moment.`}
                </p>
                <div className="pt-2">
                  <Link 
                    href="/products"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white transition-all active:scale-95 shadow-xs cursor-pointer"
                  >
                    <span>Browse Products</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-2.5">
              {filteredOrders.map((order, i) => {
<<<<<<< HEAD
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
=======
                const conf = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['pending'];
                const isExpanded = expandedId === order.id;

                return (
                  <motion.div 
                    key={order.id}
                    initial={{ opacity: 0, y: 8 }} 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className="bg-surface rounded-xl border border-border overflow-hidden"
                  >
                    {/* Header Row */}
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-muted/30 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-xs text-foreground">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${conf.badgeClass}`}>
                            {conf.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted">
                          {format(new Date(order.created_at), 'dd MMM yyyy, hh:mm a')}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-extrabold text-sm sm:text-base text-primary tabular-nums">
                          {t('currency')}{order.total_amount}
                        </span>
                        <ChevronDown 
                          className={`w-4 h-4 text-muted transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : 'rotate-0'
                          }`} 
                        />
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
<<<<<<< HEAD
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                          className="overflow-hidden border-t border-border"
                        >
                          <div className="px-5 py-4">
                            {/* Items */}
                            <div className="rounded-lg p-3 mb-4 bg-surface-muted">
=======
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} 
                          transition={{ duration: 0.2 }}
                          className="border-t border-border bg-surface-muted/30"
                        >
                          <div className="p-4 space-y-3">
                            {/* Items List */}
                            <div className="bg-surface rounded-lg p-3 border border-border/60 divide-y divide-border/40">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                              {(order.order_items ?? []).map((item, j) => {
                                const pName = item.product_name || item.products?.name || (item.product_id ? `Product #${item.product_id.slice(0, 6)}` : 'Verified Product');
                                const pWeight = item.weight || item.product_variants?.weight || '';
                                return (
<<<<<<< HEAD
                                  <div key={j} className={`flex justify-between text-xs py-1.5 ${
                                    j > 0 ? 'border-t border-border' : ''
                                  }`}>
                                    <span className="text-foreground-muted">
                                      {item.quantity}× {pName}{pWeight ? ` (${pWeight})` : ''}
                                    </span>
                                    <span className="font-semibold text-foreground">
=======
                                  <div key={j} className="flex justify-between text-xs py-1.5 first:pt-0 last:pb-0">
                                    <span className="text-foreground font-medium truncate pr-2">
                                      {item.quantity}× {pName}{pWeight ? ` (${pWeight})` : ''}
                                    </span>
                                    <span className="font-semibold text-foreground shrink-0 tabular-nums">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                                      {t('currency')}{item.price * item.quantity}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

<<<<<<< HEAD
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
=======
                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-2 pt-1">
                              {(order.status === 'out_for_delivery' || order.status === 'confirmed') && (
                                <Link 
                                  href={`/tracking/${order.id}`}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-bold text-xs text-foreground-inverse bg-primary hover:bg-primary-hover transition-colors shadow-xs"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  <span>{t('trackLive')}</span>
                                </Link>
                              )}

                              {order.status === 'delivered' && (
                                <Link 
                                  href={`/returns?orderId=${order.id}`}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-bold text-xs text-primary bg-primary/10 hover:bg-primary/20 transition-colors border border-primary/20"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Report an Issue</span>
                                </Link>
                              )}
                            </div>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
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
