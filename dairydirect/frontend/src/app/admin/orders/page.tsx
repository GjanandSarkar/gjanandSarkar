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
  RefreshCw,
  IndianRupee 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllOrders, updateOrderStatus } from '@/lib/api/orders';
import type { OrderWithItems } from '@/lib/api/orders';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';
import { ConfirmCodPaymentModal } from '@/components/admin/ConfirmCodPaymentModal';

const STATUS_STYLES: Record<string, { bg: string; color: string; dot: string }> = {
  'pending':          { bg: '#ffdcc7', color: '#774117', dot: '#d4712a' },
  'confirmed':        { bg: '#c2efac', color: '#042100', dot: '#3f6530' },
  'out_for_delivery': { bg: '#fff8e6', color: '#7d5200', dot: '#c78c2e' },
  'delivered':        { bg: '#eaf4e2', color: '#2a4f1d', dot: '#3f6530' },
  'cancelled':        { bg: '#e3e3dc', color: '#43493e', dot: '#73796d' },
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
  const [codConfirmOrder, setCodConfirmOrder] = useState<OrderWithItems | null>(null);

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
      let res: Response;
      if (status === 'cancelled') {
        res = await fetch(`/api/admin/orders/${orderId}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Cancelled by administrator on behalf' }),
        });
      } else {
        res = await fetch(`/api/admin/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: status }),
        });
      }

      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status } : o)));
      } else {
        setUpdateError({
          orderId,
          message: json.error || 'Could not update this order status. Please try again.',
        });
      }
    } catch (err: any) {
      setUpdateError({
        orderId,
        message: err.message || 'Network error updating order status.',
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const filtered = activeTab === 'all'
    ? orders
    : activeTab === 'cod_pending'
      ? orders.filter(o => o.payment_method?.toUpperCase() === 'COD' && o.payment_status !== 'paid')
      : orders.filter(o => o.status === activeTab);

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-success-bg text-success text-[10px] font-black uppercase tracking-wider">
                  Admin Platform Inventory
                </span>
              </div>
              <h1 className="font-extrabold text-[24px] tracking-tight mt-1"
                style={{ color: 'var(--color-on-surface)' }}>
                Admin Product Orders
                <span className="ml-2 text-[15px] font-normal" style={{ color: 'var(--color-on-surface-variant)' }}>
                  ({filtered.length})
                </span>
              </h1>
              <p className="text-[12px] text-foreground-muted mt-0.5">
                Orders containing direct platform & admin products. For external vendor products, manage under All Seller Orders List.
              </p>
            </div>

            <div className="flex items-center gap-2">

              <button
                onClick={() => {
                  setIsLoading(true);
                  fetchOrders();
                }}
                title="Refresh Orders"
                className="p-2 rounded-xl border border-border hover:bg-surface-muted text-foreground-muted transition-colors cursor-pointer shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-6 px-6 pb-1">
            {['all', 'cod_pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'].map(tab => (
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
                {tab === 'cod_pending' ? 'COD Payment Pending' : tab.replace(/_/g, ' ')}
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
                <ShoppingBag className="w-7 h-7" style={{ color: 'var(--color-on-surface-variant)' }} strokeWidth={1.5} />
              </div>
              <p className="font-bold text-[18px]" style={{ color: 'var(--color-on-surface)' }}>No orders</p>
              <p className="text-[13px] mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
                Orders will appear when customers place them.
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
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: i * 0.04 }}
                    className="rounded-[16px] overflow-hidden"
                    style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(195,201,187,0.3)' }}>

                    <div className="flex items-center justify-between px-5 py-4 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-[14px]" style={{ color: 'var(--color-primary)' }}>
                              {order.order_number || order.id}
                            </p>

                            {/* Seller Store Tag */}
                            {sellerStores.length > 0 ? (
                              sellerStores.map(storeName => (
                                <span
                                  key={storeName}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 flex items-center gap-1"
                                >
                                  <Store className="w-3 h-3 text-purple-600" />
                                  <span>{storeName}</span>
                                </span>
                              ))
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface-muted text-foreground-muted">
                                Direct Platform
                              </span>
                            )}

                            {/* Payment Status */}
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              order.payment_status === 'paid' ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'
                            }`}>
                              {order.payment_status === 'paid' ? 'Paid' : `Payment: ${order.payment_status || 'Pending'}`} ({order.payment_method || 'COD'})
                            </span>
                          </div>

                          <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-on-surface-variant)' }}>
                            {order.profiles?.name || 'Customer'} {order.profiles?.phone ? `(${order.profiles.phone})` : ''} · {format(new Date(order.created_at), 'MMM d, hh:mm a')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-[15px]" style={{ color: 'var(--color-primary)' }}>
                          {t('currency')}{order.total_amount}
                        </span>
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
                          style={{ background: statusStyle.bg, color: statusStyle.color }}>
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusStyle.dot }} />
                          <span className="text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <ChevronDown className="w-4 h-4 shrink-0 transition-transform duration-200"
                          style={{
                            color: 'var(--color-on-surface-variant)',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          }} />
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          style={{ overflow: 'hidden', borderTop: '1px solid rgba(195, 201, 187, 0.3)' }}>
                          <div className="px-5 py-4 space-y-4">

                            {/* Customer Delivery Details Box */}
                            <div className="p-3.5 rounded-xl border border-border/80 bg-surface-muted/70 text-xs grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted block">Customer Information</span>
                                <p className="font-bold text-foreground mt-0.5">{order.profiles?.name || 'Customer'}</p>
                                <p className="text-foreground-muted">{order.profiles?.email || 'N/A'}</p>
                                {order.profiles?.phone && (
                                  <p className="text-foreground flex items-center gap-1 mt-0.5 font-medium">
                                    <Phone className="w-3 h-3 text-foreground-muted" />
                                    <span>+91 {order.profiles.phone}</span>
                                  </p>
                                )}
                              </div>

                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted block">Shipping Address</span>
                                <p className="text-foreground mt-0.5 leading-relaxed font-medium">
                                  {order.user_addresses?.address || order.shipping_address || 'Address on file'}
                                </p>
                                {order.user_addresses?.apartment && (
                                  <p className="text-foreground-muted text-[11px]">Apt/Flat: {order.user_addresses.apartment}</p>
                                )}
                                {order.delivery_slot && (
                                  <p className="text-success font-semibold mt-1 text-[11px]">Slot: {order.delivery_slot}</p>
                                )}
                              </div>
                            </div>

                            {/* Ordered Items with Seller Attribution */}
                            <div className="rounded-[10px] p-3 mb-2"
                              style={{ background: 'var(--color-surface-container-low)' }}>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted block mb-2">Order Products & Sellers</span>
                              {order.order_items?.map((item, j) => {
                                const pName = item.product_name || item.products?.name || (item.product_id ? `Product #${item.product_id.slice(0, 6)}` : 'Dairy Product');
                                const pWeight = item.weight || item.product_variants?.weight || '';
                                const storeName = item.products?.sellers?.store_name;
                                const img = item.products?.image_url || item.product_image || PLACEHOLDER_PRODUCT_IMAGE;

                                return (
                                  <div key={j} className="flex items-center justify-between text-[13px] py-2"
                                    style={{ borderTop: j > 0 ? '1px solid rgba(195, 201, 187, 0.25)' : undefined }}>
                                    <div className="flex items-center gap-2.5">
                                      <img
                                        src={img}
                                        alt={pName}
                                        className="w-9 h-9 rounded-lg object-cover bg-surface border border-border shrink-0"
                                        onError={e => {
                                          (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE;
                                        }}
                                      />
                                      <div>
                                        <span className="font-semibold" style={{ color: 'var(--color-on-surface-variant)' }}>
                                          {item.quantity}× {pName}{pWeight ? ` (${pWeight})` : ''}
                                        </span>
                                        {storeName && (
                                          <div className="flex items-center gap-1 mt-0.5">
                                            <Store className="w-3 h-3 text-purple-600" />
                                            <span className="text-[11px] font-bold text-purple-700">Store: {storeName}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <span className="font-bold" style={{ color: 'var(--color-on-surface)' }}>
                                      {t('currency')}{item.price * item.quantity}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Cancellation Reason / History Display */}
                            {order.status === 'cancelled' && (
                              <div className="p-3 rounded-xl bg-surface-muted border border-border text-xs text-foreground space-y-1">
                                <span className="font-bold text-foreground block flex items-center gap-1">
                                  <Ban className="w-3.5 h-3.5 text-foreground-muted" />
                                  <span>Cancellation History & Audit Note:</span>
                                </span>
                                <p className="text-foreground-muted font-mono text-[11px]">
                                  {order.notes || 'Order cancelled and stock inventory restored.'}
                                </p>
                              </div>
                            )}

                            {/* COD Payment Tracking & Confirmation Card */}
                            {order.payment_method?.toUpperCase() === 'COD' && (
                              <div className="p-4 rounded-2xl border border-border/90 bg-surface-muted/80 space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-warning-bg text-warning flex items-center justify-center shrink-0">
                                      <IndianRupee className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted block">Payment Method</span>
                                      <span className="font-extrabold text-sm text-foreground">Cash on Delivery (COD)</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-foreground-muted">Collection Status:</span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                                      order.payment_status === 'paid' ? 'bg-success-bg text-success border border-success/20' : 'bg-warning-bg text-warning border border-warning/20'
                                    }`}>
                                      {order.payment_status === 'paid' ? '✓ Paid (Cash Collected)' : 'Pending Cash Collection'}
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-foreground-muted">
                                  <div>
                                    <span className="text-[10px] text-foreground-muted font-bold uppercase tracking-wider block">Order Amount</span>
                                    <span className="font-extrabold text-sm text-primary">₹{order.total_amount}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-foreground-muted font-bold uppercase tracking-wider block">Order Status</span>
                                    <span className="font-bold text-foreground uppercase">{order.status.replace(/_/g, ' ')}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-foreground-muted font-bold uppercase tracking-wider block">Cash Confirmed At</span>
                                    <span className="font-medium text-foreground">
                                      {order.payment_confirmed_at 
                                        ? format(new Date(order.payment_confirmed_at), 'MMM d, hh:mm a') 
                                        : 'Not yet recorded'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-foreground-muted font-bold uppercase tracking-wider block">Confirmed By</span>
                                    <span className="font-medium text-foreground">
                                      {order.payment_confirmed_at ? 'Authorized Admin' : 'Pending'}
                                    </span>
                                  </div>
                                </div>

                                {order.payment_status !== 'paid' && order.status !== 'cancelled' && (
                                  <div className="pt-2 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => setCodConfirmOrder(order)}
                                      className="px-4 py-2 rounded-xl text-xs font-bold text-on-success bg-success hover:bg-success transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                                    >
                                      <IndianRupee className="w-3.5 h-3.5" />
                                      <span>Confirm Cash Collected (₹{order.total_amount})</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="relative pt-2">
                              {isUpdating === order.id && (
                                <div className="absolute inset-0 bg-surface/50 flex items-center justify-center z-10">
                                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                </div>
                              )}
                              <p className="text-[11px] font-bold uppercase tracking-wider mb-4"
                                style={{ color: 'var(--color-on-surface-variant)' }}>Order Timeline & Fulfillment</p>
                              
                              <div className="flex items-center gap-2 mb-6 w-full max-w-xl">
                                {['pending', 'confirmed', 'out_for_delivery', 'delivered'].map((status, idx, arr) => {
                                  const isActive = order.status === status || (arr.indexOf(order.status as any) > idx && order.status !== 'cancelled');
                                  const isCurrent = order.status === status;
                                  return (
                                    <div key={status} className="flex items-center flex-1 last:flex-none">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-primary text-white' : 'bg-surface text-on-surface-variant border border-outline/30'}`}
                                           style={{ boxShadow: isCurrent ? '0 0 0 3px rgba(12, 60, 38, 0.20)' : 'none' }}>
                                        {idx + 1}
                                      </div>
                                      {idx < arr.length - 1 && (
                                        <div className={`flex-1 h-1 mx-2 rounded-full transition-colors ${isActive && !isCurrent ? 'bg-primary' : 'bg-outline/20'}`} />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <span className="text-xs font-bold text-foreground-muted self-center mr-1">Actions:</span>
                                {ORDER_STATUSES.map(status => {
                                  const sStyle = STATUS_STYLES[status];
                                  const isCurrentStatus = order.status === status;
                                  const blockedReason = transitionBlockedReason(order.status, status);
                                  const isBlocked = blockedReason !== null;
                                  const isBusy = isUpdating === order.id;
                                  return (
                                    <button key={status}
                                      onClick={() => handleUpdateStatus(order.id, status, order.user_id)}
                                      disabled={isBusy || isBlocked || isCurrentStatus}
                                      title={blockedReason ?? (isCurrentStatus ? 'Current status' : `Mark as ${status.replace(/_/g, ' ')}`)}
                                      aria-current={isCurrentStatus ? 'true' : undefined}
                                      className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                        isBlocked
                                          ? 'opacity-40 cursor-not-allowed line-through'
                                          : isCurrentStatus
                                            ? 'cursor-default'
                                            : 'active:scale-95 pressable'
                                      } disabled:opacity-50`}
                                      style={isCurrentStatus ? {
                                        background: sStyle.bg,
                                        color: sStyle.color,
                                        outline: `2px solid ${sStyle.dot}`,
                                      } : {
                                        background: 'var(--color-surface-container)',
                                        color: 'var(--color-on-surface-variant)',
                                      }}>
                                      <span className="capitalize">{status === 'cancelled' ? 'Cancel Order' : status.replace(/_/g, ' ')}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {ALLOWED_TRANSITIONS[order.status]?.length === 0 && (
                                <p className="mt-2 text-[11px]" style={{ color: 'var(--color-on-surface-variant)' }}>
                                  {order.status === 'delivered'
                                    ? 'This order is fulfilled. To reverse it, raise a return or refund rather than a cancellation.'
                                    : 'This order is cancelled and its stock has been restored.'}
                                </p>
                              )}

                              {updateError?.orderId === order.id && (
                                <div role="alert"
                                  className="mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-[12px]"
                                  style={{ background: '#ffdad6', color: '#410002' }}>
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

      {codConfirmOrder && (
        <ConfirmCodPaymentModal
          order={codConfirmOrder}
          isOpen={!!codConfirmOrder}
          onClose={() => setCodConfirmOrder(null)}
          onSuccess={(updated) => {
            setOrders(prev => prev.map(o => o.id === codConfirmOrder.id ? { ...o, ...updated } : o));
          }}
        />
      )}
    </div>
  );
}
