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
  IndianRupee,
  Search,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllOrders, updateOrderStatus } from '@/lib/api/orders';
import type { OrderWithItems } from '@/lib/api/orders';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';
import { ConfirmCodPaymentModal } from '@/components/admin/ConfirmCodPaymentModal';
import { AdminHeader } from '@/components/admin/AdminHeader';

<<<<<<< HEAD
const STATUS_STYLES: Record<string, { bg: string; color: string; dot: string }> = {
  'pending':          { bg: '#ffdcc7', color: 'var(--warning)', dot: '#d4712a' },
  'confirmed':        { bg: '#c2efac', color: '#042100', dot: '#3f6530' },
  'out_for_delivery': { bg: '#fff8e6', color: 'var(--warning)', dot: '#c78c2e' },
  'delivered':        { bg: '#eaf4e2', color: '#2a4f1d', dot: '#3f6530' },
  'cancelled':        { bg: '#e3e3dc', color: 'var(--foreground-muted)', dot: '#73796d' },
=======
const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  'pending':          { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  'confirmed':        { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'out_for_delivery': { bg: 'bg-blue-50 border-blue-200', text: 'text-info', dot: 'bg-blue-500' },
  'delivered':        { bg: 'bg-primary-fixed/80 border-primary/20', text: 'text-primary', dot: 'bg-primary' },
  'cancelled':        { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400' },
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
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

  const [searchQuery, setSearchQuery] = useState('');

  const filtered = orders.filter(o => {
    const matchesTab = activeTab === 'all'
      ? true
      : activeTab === 'cod_pending'
        ? o.payment_method?.toUpperCase() === 'COD' && o.payment_status !== 'paid'
        : o.status === activeTab;
    if (!matchesTab) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const orderNo = (o.order_number || o.id).toLowerCase();
    const customer = ((o as any).customer_name || o.profiles?.name || o.profiles?.email || '').toLowerCase();
    const phone = (o.profiles?.phone || '').toLowerCase();
    return orderNo.includes(q) || customer.includes(q) || phone.includes(q);
  });

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center pt-20 px-6 bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="flex flex-col min-h-screen">
      {/* Standard Admin Header */}
      <AdminHeader
        title={
          <div className="flex items-center gap-3">
            <span>Admin Orders</span>
            <span className="text-[14px] font-normal text-foreground-muted">
              ({filtered.length})
            </span>
=======
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
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
          </div>
        }
        subtitle="Manage platform-fulfilled orders, status lifecycle, and COD payment collections"
        onRefresh={() => {
          setIsLoading(true);
          fetchOrders();
        }}
        isRefreshing={isLoading}
      />

<<<<<<< HEAD
      <div className="px-6 md:px-10 py-5 flex flex-col gap-4">
        {/* Search & Filter Toolbar */}
        <div className="bg-surface rounded-2xl border border-border p-3.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'cod_pending', label: 'COD Pending' },
              { id: 'confirmed', label: 'Confirmed' },
              { id: 'out_for_delivery', label: 'Out for Delivery' },
              { id: 'delivered', label: 'Delivered' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap h-8 px-3.5 rounded-full text-[12px] font-bold transition-all shrink-0 cursor-pointer flex items-center border ${
                  activeTab === tab.id
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-surface border-border text-foreground-muted hover:text-foreground hover:bg-surface-muted'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search order #, customer, phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-8 rounded-xl border border-border bg-surface text-xs font-medium text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
=======
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
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
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
<<<<<<< HEAD
                                  className="px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-purple-100 text-purple-800 flex items-center gap-1"
=======
                                  className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1"
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                                >
                                  <Store className="w-3 h-3 text-purple-600" />
                                  <span>{storeName}</span>
                                </span>
                              ))
                            ) : (
<<<<<<< HEAD
                              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-surface-muted text-foreground-muted">
=======
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface-muted text-foreground-muted border border-border">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                                Direct Platform
                              </span>
                            )}

                            {/* Payment Status */}
<<<<<<< HEAD
                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${
                              order.payment_status === 'paid' ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'
=======
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                              order.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                            }`}>
                              {order.payment_status === 'paid' ? 'Paid' : `Payment: ${order.payment_status || 'Pending'}`} ({order.payment_method || 'COD'})
                            </span>
                          </div>

<<<<<<< HEAD
                          <p className="text-xs mt-0.5" style={{ color: 'var(--color-on-surface-variant)' }}>
=======
                          <p className="text-[11px] text-foreground-muted mt-1">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                            {order.profiles?.name || 'Customer'} {order.profiles?.phone ? `(${order.profiles.phone})` : ''} · {format(new Date(order.created_at), 'MMM d, hh:mm a')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
<<<<<<< HEAD
                        <span className="font-semibold text-[15px]" style={{ color: 'var(--color-primary)' }}>
                          {t('currency')}{order.total_amount}
                        </span>
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
                          style={{ background: statusStyle.bg, color: statusStyle.color }}>
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusStyle.dot }} />
                          <span className="text-xs font-bold uppercase tracking-wide whitespace-nowrap">
                            {order.status.replace(/_/g, ' ')}
                          </span>
=======
                        <span className="font-bold text-sm text-foreground">
                          ₹{order.total_amount}
                        </span>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${statusStyle.bg} ${statusStyle.text}`}>
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusStyle.dot}`} />
                          <span>{order.status.replace(/_/g, ' ')}</span>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
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
                            <div className="p-3.5 rounded-xl border border-border/80 bg-surface-muted/70 text-xs grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted block">Customer Information</span>
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
                                <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted block">Shipping Address</span>
                                <p className="text-foreground mt-0.5 leading-relaxed font-medium">
                                  {order.user_addresses?.address || order.shipping_address || 'Address on file'}
                                </p>
                                {order.user_addresses?.apartment && (
                                  <p className="text-foreground-muted text-xs">Apt/Flat: {order.user_addresses.apartment}</p>
                                )}
                                {order.delivery_slot && (
                                  <p className="text-success font-semibold mt-1 text-xs">Slot: {order.delivery_slot}</p>
                                )}
                              </div>
                            </div>

                            {/* Ordered Items with Seller Attribution */}
<<<<<<< HEAD
                            <div className="rounded-[10px] p-3 mb-2"
                              style={{ background: 'var(--color-surface-container-low)' }}>
                              <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted block mb-2">Order Products & Sellers</span>
=======
                            <div className="rounded-xl p-3 bg-surface-muted/50 border border-border">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted block mb-2">Order Products</span>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
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
<<<<<<< HEAD
                                        className="w-9 h-9 rounded-lg object-cover bg-surface border border-border shrink-0"
=======
                                        className="w-9 h-9 rounded-lg object-contain bg-surface border border-border shrink-0 p-1"
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
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
<<<<<<< HEAD
                                            <span className="text-xs font-bold text-purple-700">Store: {storeName}</span>
=======
                                            <span className="text-[10px] font-bold text-purple-700">Store: {storeName}</span>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
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
<<<<<<< HEAD
                              <div className="p-3 rounded-xl bg-surface-muted border border-border text-xs text-foreground space-y-1">
                                <span className="font-bold text-foreground block flex items-center gap-1">
                                  <Ban className="w-3.5 h-3.5 text-foreground-muted" />
                                  <span>Cancellation History & Audit Note:</span>
                                </span>
                                <p className="text-foreground-muted font-mono text-xs">
=======
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                                <span className="font-bold text-slate-900 flex items-center gap-1">
                                  <Ban className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Cancellation History & Audit Note:</span>
                                </span>
                                <p className="text-slate-600 font-mono text-[11px]">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
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
                                      <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted block">Payment Method</span>
                                      <span className="font-semibold text-sm text-foreground">Cash on Delivery (COD)</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-foreground-muted">Collection Status:</span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                      order.payment_status === 'paid' ? 'bg-success-bg text-success border border-success/20' : 'bg-warning-bg text-warning border border-warning/20'
                                    }`}>
                                      {order.payment_status === 'paid' ? '✓ Paid (Cash Collected)' : 'Pending Cash Collection'}
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-foreground-muted">
                                  <div>
                                    <span className="text-xs text-foreground-muted font-bold uppercase tracking-wider block">Order Amount</span>
                                    <span className="font-semibold text-sm text-primary">₹{order.total_amount}</span>
                                  </div>
                                  <div>
                                    <span className="text-xs text-foreground-muted font-bold uppercase tracking-wider block">Order Status</span>
                                    <span className="font-bold text-foreground uppercase">{order.status.replace(/_/g, ' ')}</span>
                                  </div>
                                  <div>
                                    <span className="text-xs text-foreground-muted font-bold uppercase tracking-wider block">Cash Confirmed At</span>
                                    <span className="font-medium text-foreground">
                                      {order.payment_confirmed_at 
                                        ? format(new Date(order.payment_confirmed_at), 'MMM d, hh:mm a') 
                                        : 'Not yet recorded'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-xs text-foreground-muted font-bold uppercase tracking-wider block">Confirmed By</span>
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
<<<<<<< HEAD
                                <div className="absolute inset-0 bg-surface/50 flex items-center justify-center z-10">
                                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                </div>
                              )}
                              <p className="text-xs font-bold uppercase tracking-wider mb-4"
                                style={{ color: 'var(--color-on-surface-variant)' }}>Order Timeline & Fulfillment</p>
=======
                                <div className="absolute inset-0 bg-surface/70 backdrop-blur-xs flex items-center justify-center z-10">
                                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                </div>
                              )}
                              <p className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-3">
                                Order Fulfillment Lifecycle
                              </p>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                              
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

<<<<<<< HEAD
                              <div className="flex flex-wrap gap-2">
                                <span className="text-xs font-bold text-foreground-muted self-center mr-1">Actions:</span>
=======
                              <div className="flex flex-wrap gap-2 items-center">
                                <span className="text-xs font-semibold text-foreground-muted mr-1">Update Status:</span>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
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
<<<<<<< HEAD
                                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
=======
                                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
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
<<<<<<< HEAD
                                <p className="mt-2 text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
=======
                                <p className="mt-2 text-xs text-foreground-muted">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                                  {order.status === 'delivered'
                                    ? 'This order is fulfilled. To reverse it, raise a return or refund rather than a cancellation.'
                                    : 'This order is cancelled and its stock has been restored.'}
                                </p>
                              )}

                              {updateError?.orderId === order.id && (
                                <div role="alert"
<<<<<<< HEAD
                                  className="mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-[12px]"
                                  style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>
=======
                                  className="mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-xs bg-rose-50 border border-rose-200 text-rose-700">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
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
