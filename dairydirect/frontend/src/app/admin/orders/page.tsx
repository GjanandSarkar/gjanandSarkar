"use client";

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { format } from 'date-fns';
import { 
  ShoppingBag, 
  ChevronDown, 
  Loader2, 
  AlertCircle, 
  Store, 
  MapPin, 
  Phone, 
  CreditCard, 
  CheckCircle2, 
  Ban, 
  RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllOrders, updateOrderStatus } from '@/lib/api/orders';
import type { OrderWithItems } from '@/lib/api/orders';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  'pending':          { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  'confirmed':        { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'out_for_delivery': { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
  'delivered':        { bg: 'bg-primary-fixed/80 border-primary/20', text: 'text-primary', dot: 'bg-primary' },
  'cancelled':        { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400' },
};

const ORDER_STATUSES: OrderWithItems['status'][] = ['confirmed', 'out_for_delivery', 'delivered', 'cancelled'];

type OrderStatus = OrderWithItems['status'];

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:          ['confirmed', 'cancelled'],
  confirmed:        ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered:        [],
  cancelled:        [],
};

function transitionBlockedReason(from: OrderStatus, to: OrderStatus): string | null {
  if (from === to) return null;
  if (ALLOWED_TRANSITIONS[from]?.includes(to)) return null;

  if (from === 'delivered') {
    return to === 'cancelled'
      ? 'This order has already been delivered, so it cannot be cancelled. Raise a return or refund instead.'
      : 'Delivered is the final step of the order lifecycle.';
  }
  if (from === 'cancelled') {
    return 'This order was cancelled and its stock has been restored. Cancelled orders cannot be reopened.';
  }
  return `An order that is ${from.replace(/_/g, ' ')} cannot move straight to ${to.replace(/_/g, ' ')}.`;
}

export default function AdminOrdersPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<{ orderId: string; message: string } | null>(null);

  const fetchOrders = () => {
    getAllOrders({ type: 'admin' }).then(data => {
      // Filter orders where products do not belong to external sellers (Admin product orders only)
      const adminOnly = data.filter(order =>
        (order.order_items || []).every(item => !item.products?.seller_id && !item.products?.sellers)
      );
      setOrders(adminOnly);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    fetchOrders();

    // Realtime Supabase listener on orders table so status changes sync immediately
    let isCancelled = false;
    let activeChannel: any = null;
    import('@/lib/supabase/lazy').then(({ getSupabaseLazy }) => {
      getSupabaseLazy().then(supabase => {
        if (isCancelled) return;
        const channelName = `admin-orders-live-sync-${Math.random().toString(36).slice(2, 9)}`;
        activeChannel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            () => {
              getAllOrders({ type: 'admin' }).then(data => {
                const adminOnly = data.filter(order =>
                  (order.order_items || []).every(item => !item.products?.seller_id && !item.products?.sellers)
                );
                setOrders(adminOnly);
              });
            }
          )
          .subscribe();

        if (isCancelled) {
          supabase.removeChannel(activeChannel);
        }
      });
    });

    return () => {
      isCancelled = true;
      if (activeChannel) {
        import('@/lib/supabase/lazy').then(({ getSupabaseLazy }) => {
          getSupabaseLazy().then(supabase => {
            supabase.removeChannel(activeChannel);
          });
        });
      }
    };
  }, []);

  const handleUpdateStatus = async (orderId: string, status: OrderStatus, userId: string | null) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const blocked = transitionBlockedReason(order.status, status);
    if (blocked) {
      setUpdateError({ orderId, message: blocked });
      return;
    }

    setUpdateError(null);
    setIsUpdating(orderId);
    try {
      const result = await updateOrderStatus(orderId, status, userId || undefined);
      if (result.success) {
        setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status } : o)));
      } else {
        setUpdateError({
          orderId,
          message: result.error || 'Could not update this order. Please try again.',
        });
      }
    } finally {
      setIsUpdating(null);
    }
  };

  const filtered = activeTab === 'all' ? orders : orders.filter(o => o.status === activeTab);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center pt-20 px-6" style={{ background: 'var(--color-surface)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border">
        <div className="px-5 sm:px-8 pt-5 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-md bg-primary-fixed text-primary text-[10px] font-bold uppercase tracking-wider">
                  Platform Inventory
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Orders Management
                <span className="ml-2 text-sm font-normal text-foreground-muted">
                  ({filtered.length})
                </span>
              </h1>
              <p className="text-xs text-foreground-muted mt-0.5">
                Direct platform orders. Live sync enabled with inventory reservations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  fetchOrders();
                }}
                title="Refresh Orders"
                className="p-2 rounded-lg border border-border bg-surface hover:bg-surface-muted text-foreground-muted hover:text-foreground transition-colors cursor-pointer shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {['all', 'pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'].map(tab => (
              <button 
                key={tab} 
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 capitalize border cursor-pointer ${
                  activeTab === tab
                    ? 'bg-primary text-white border-primary shadow-2xs font-bold'
                    : 'bg-surface text-foreground-muted border-border hover:text-foreground hover:bg-surface-muted'
                }`}
              >
                {tab.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 sm:px-8 py-5 flex flex-col gap-3">
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center bg-surface border border-border rounded-xl">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-surface-muted">
                <ShoppingBag className="w-6 h-6 text-foreground-muted opacity-50" strokeWidth={1.5} />
              </div>
              <p className="font-bold text-sm text-foreground">No orders in this view</p>
              <p className="text-xs text-foreground-muted mt-0.5">
                Orders will appear automatically when placed by customers.
              </p>
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col gap-3">
              {filtered.map((order, i) => {
                const statusStyle = STATUS_STYLES[order.status] || STATUS_STYLES['cancelled'];
                const isExpanded = expandedId === order.id;

                // Extract all distinct sellers from order items
                const sellerStores = Array.from(
                  new Set(
                    (order.order_items || [])
                      .map(item => item.products?.sellers?.store_name)
                      .filter(Boolean)
                  )
                );

                return (
                  <motion.div key={order.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                    className="rounded-xl overflow-hidden bg-surface border border-border shadow-2xs hover:border-primary/40 transition-colors"
                  >
                    <div 
                      className="flex items-center justify-between px-4 sm:px-5 py-3.5 cursor-pointer hover:bg-surface-muted/30 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-xs sm:text-sm text-foreground">
                              {order.order_number || order.id.slice(0, 8).toUpperCase()}
                            </p>

                            {/* Seller Store Tag */}
                            {sellerStores.length > 0 ? (
                              sellerStores.map(storeName => (
                                <span
                                  key={storeName}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1"
                                >
                                  <Store className="w-3 h-3 text-purple-600" />
                                  <span>{storeName}</span>
                                </span>
                              ))
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface-muted text-foreground-muted border border-border">
                                Direct Platform
                              </span>
                            )}

                            {/* Payment Status */}
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                              order.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {order.payment_status === 'paid' ? 'Paid' : `Payment: ${order.payment_status || 'Pending'}`} ({order.payment_method || 'COD'})
                            </span>
                          </div>

                          <p className="text-[11px] text-foreground-muted mt-1">
                            {order.profiles?.name || 'Customer'} {order.profiles?.phone ? `(${order.profiles.phone})` : ''} · {format(new Date(order.created_at), 'MMM d, hh:mm a')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-foreground">
                          ₹{order.total_amount}
                        </span>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${statusStyle.bg} ${statusStyle.text}`}>
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusStyle.dot}`} />
                          <span>{order.status.replace(/_/g, ' ')}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-foreground-muted shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden border-t border-border"
                        >
                          <div className="px-5 py-4 space-y-4">

                            {/* Customer Delivery Details Box */}
                            <div className="p-3.5 rounded-xl border border-gray-200/80 bg-gray-50/70 text-xs grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Customer Information</span>
                                <p className="font-bold text-gray-900 mt-0.5">{order.profiles?.name || 'Customer'}</p>
                                <p className="text-gray-600">{order.profiles?.email || 'N/A'}</p>
                                {order.profiles?.phone && (
                                  <p className="text-gray-700 flex items-center gap-1 mt-0.5 font-medium">
                                    <Phone className="w-3 h-3 text-gray-400" />
                                    <span>+91 {order.profiles.phone}</span>
                                  </p>
                                )}
                              </div>

                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Shipping Address</span>
                                <p className="text-gray-800 mt-0.5 leading-relaxed font-medium">
                                  {order.user_addresses?.address || order.shipping_address || 'Address on file'}
                                </p>
                                {order.user_addresses?.apartment && (
                                  <p className="text-gray-500 text-[11px]">Apt/Flat: {order.user_addresses.apartment}</p>
                                )}
                                {order.delivery_slot && (
                                  <p className="text-emerald-700 font-semibold mt-1 text-[11px]">Slot: {order.delivery_slot}</p>
                                )}
                              </div>
                            </div>

                            {/* Ordered Items with Seller Attribution */}
                            <div className="rounded-xl p-3 bg-surface-muted/50 border border-border">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted block mb-2">Order Products</span>
                              {order.order_items?.map((item, j) => {
                                const pName = item.product_name || item.products?.name || (item.product_id ? `Product #${item.product_id.slice(0, 6)}` : 'Dairy Product');
                                const pWeight = item.weight || item.product_variants?.weight || '';
                                const storeName = item.products?.sellers?.store_name;
                                const img = item.products?.image_url || item.product_image || PLACEHOLDER_PRODUCT_IMAGE;

                                return (
                                  <div key={j} className={`flex items-center justify-between text-xs py-2 ${j > 0 ? 'border-t border-border' : ''}`}>
                                    <div className="flex items-center gap-2.5">
                                      <img
                                        src={img}
                                        alt={pName}
                                        className="w-9 h-9 rounded-lg object-contain bg-surface border border-border shrink-0 p-1"
                                        onError={e => {
                                          (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE;
                                        }}
                                      />
                                      <div>
                                        <span className="font-semibold text-foreground">
                                          {item.quantity}× {pName}{pWeight ? ` (${pWeight})` : ''}
                                        </span>
                                        {storeName && (
                                          <div className="flex items-center gap-1 mt-0.5">
                                            <Store className="w-3 h-3 text-purple-600" />
                                            <span className="text-[10px] font-bold text-purple-700">Store: {storeName}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <span className="font-bold text-foreground">
                                      ₹{item.price * item.quantity}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Cancellation Reason / History Display */}
                            {order.status === 'cancelled' && (
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                                <span className="font-bold text-slate-900 flex items-center gap-1">
                                  <Ban className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Cancellation History & Audit Note:</span>
                                </span>
                                <p className="text-slate-600 font-mono text-[11px]">
                                  {order.notes || 'Order cancelled and stock inventory restored.'}
                                </p>
                              </div>
                            )}

                            <div className="relative pt-2">
                              {isUpdating === order.id && (
                                <div className="absolute inset-0 bg-surface/70 backdrop-blur-xs flex items-center justify-center z-10">
                                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                </div>
                              )}
                              <p className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-3">
                                Order Fulfillment Lifecycle
                              </p>
                              
                              <div className="flex items-center gap-2 mb-5 w-full max-w-md">
                                {['pending', 'confirmed', 'out_for_delivery', 'delivered'].map((status, idx, arr) => {
                                  const isActive = order.status === status || (arr.indexOf(order.status as any) > idx && order.status !== 'cancelled');
                                  const isCurrent = order.status === status;
                                  return (
                                    <div key={status} className="flex items-center flex-1 last:flex-none">
                                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                        isActive ? 'bg-primary text-white shadow-xs' : 'bg-surface-muted text-foreground-muted border border-border'
                                      }`}>
                                        {idx + 1}
                                      </div>
                                      {idx < arr.length - 1 && (
                                        <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${isActive && !isCurrent ? 'bg-primary' : 'bg-border'}`} />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="flex flex-wrap gap-2 items-center">
                                <span className="text-xs font-semibold text-foreground-muted mr-1">Update Status:</span>
                                {ORDER_STATUSES.map(status => {
                                  const sStyle = STATUS_STYLES[status];
                                  const isCurrentStatus = order.status === status;
                                  const blockedReason = transitionBlockedReason(order.status, status);
                                  const isBlocked = blockedReason !== null;
                                  const isBusy = isUpdating === order.id;
                                  return (
                                    <button key={status}
                                      type="button"
                                      onClick={() => handleUpdateStatus(order.id, status, order.user_id)}
                                      disabled={isBusy || isBlocked || isCurrentStatus}
                                      title={blockedReason ?? (isCurrentStatus ? 'Current status' : `Mark as ${status.replace(/_/g, ' ')}`)}
                                      aria-current={isCurrentStatus ? 'true' : undefined}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                                        isBlocked
                                          ? 'opacity-40 cursor-not-allowed line-through bg-surface border-border text-foreground-muted'
                                          : isCurrentStatus
                                            ? `${sStyle.bg} ${sStyle.text} font-bold ring-2 ring-primary cursor-default`
                                            : 'bg-surface border-border text-foreground hover:bg-surface-muted active:scale-95'
                                      } disabled:opacity-50`}
                                    >
                                      <span className="capitalize">{status === 'cancelled' ? 'Cancel Order' : status.replace(/_/g, ' ')}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {ALLOWED_TRANSITIONS[order.status]?.length === 0 && (
                                <p className="mt-2 text-xs text-foreground-muted">
                                  {order.status === 'delivered'
                                    ? 'This order is fulfilled. To reverse it, raise a return or refund rather than a cancellation.'
                                    : 'This order is cancelled and its stock has been restored.'}
                                </p>
                              )}

                              {updateError?.orderId === order.id && (
                                <div role="alert"
                                  className="mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-xs bg-rose-50 border border-rose-200 text-rose-700">
                                  <AlertCircle className="w-4 h-4 shrink-0 mt-[1px]" />
                                  <span>{updateError.message}</span>
                                </div>
                              )}
                            </div>
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
