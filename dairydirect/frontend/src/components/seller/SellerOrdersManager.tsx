"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  RefreshCw, 
  Loader2, 
  MapPin, 
  Phone, 
  User, 
  IndianRupee, 
  ChevronDown, 
  ChevronUp, 
  Ban, 
  Check, 
  X,
  CreditCard,
  ShoppingBag,
  ExternalLink,
  RotateCcw,
  Eye,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { getSellerOrders, updateOrderStatus, processOrderRequest } from '@/lib/api/orders';
import type { OrderWithItems, OrderStatus } from '@/lib/api/orders';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';
import { ConfirmCodPaymentModal } from '@/components/admin/ConfirmCodPaymentModal';

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; dot: string; label: string }> = {
  'pending':          { bg: '#fff7ed', color: '#9a3412', border: '#fdba74', dot: '#ea580c', label: 'Pending Confirmation' },
  'confirmed':        { bg: '#f0fdf4', color: '#166534', border: '#86efac', dot: '#16a34a', label: 'Confirmed' },
  'out_for_delivery': { bg: '#fefce8', color: '#854d0e', border: '#fde047', dot: '#ca8a04', label: 'Out for Delivery' },
  'delivered':        { bg: '#ecfdf5', color: '#065f46', border: '#6ee7b7', dot: '#059669', label: 'Delivered' },
  'cancelled':        { bg: '#f3f4f6', color: '#374151', border: '#d1d5db', dot: '#6b7280', label: 'Cancelled' },
};

const ORDER_ACTION_STEPS: OrderStatus[] = ['confirmed', 'out_for_delivery', 'delivered'];

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending:          ['confirmed', 'cancelled'],
  confirmed:        ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered:        [],
  cancelled:        [],
};

function transitionBlockedReason(from: string, to: string): string | null {
  if (from === to) return null;
  if (ALLOWED_TRANSITIONS[from]?.includes(to)) return null;

  if (from === 'delivered') {
    return to === 'cancelled'
      ? 'This order has already been delivered, so it cannot be cancelled through the normal cancellation action. Handle returns and refunds through their appropriate workflows.'
      : 'Delivered is the final fulfillment status.';
  }
  if (from === 'cancelled') {
    return 'This order is cancelled and inventory has been restored. Cancelled orders cannot be reopened.';
  }
  if (from === 'pending' && (to === 'out_for_delivery' || to === 'delivered')) {
    return `An order must be Confirmed before moving to ${to.replace(/_/g, ' ')}.`;
  }
  if (from === 'confirmed' && to === 'delivered') {
    return 'An order must be Out for Delivery before marking as Delivered.';
  }
  return `Cannot transition directly from ${from.replace(/_/g, ' ')} to ${to.replace(/_/g, ' ')}.`;
}

interface SellerOrdersManagerProps {
  initialStatusFilter?: string;
}

export function SellerOrdersManager({ initialStatusFilter = 'all' }: SellerOrdersManagerProps) {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialStatusFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  // Status update tracking
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<{ orderId: string; message: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState<{ orderId: string; message: string } | null>(null);

  // Cancellation Modal State
  const [cancelModalOrder, setCancelModalOrder] = useState<OrderWithItems | null>(null);
  const [cancelReason, setCancelReason] = useState('Out of stock');
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // Request Decision Modal State (Approve / Reject customer cancellation or return requests)
  const [decisionModal, setDecisionModal] = useState<{
    requestId: string;
    action: 'approve' | 'reject';
    requestType: 'cancellation' | 'return';
    productName: string;
  } | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);
  const [codConfirmOrder, setCodConfirmOrder] = useState<OrderWithItems | null>(null);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSellerOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load seller orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();

    // Setup realtime Supabase listener on orders table
    let isCancelled = false;
    let activeChannel: any = null;
    import('@/lib/supabase/lazy').then(({ getSupabaseLazy }) => {
      getSupabaseLazy().then((supabase) => {
        if (isCancelled) return;
        const channelName = `seller-orders-live-sync-${Math.random().toString(36).slice(2, 9)}`;
        activeChannel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            () => {
              // Silently refresh orders when orders change
              getSellerOrders().then(updated => setOrders(updated));
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
          getSupabaseLazy().then((supabase) => {
            supabase.removeChannel(activeChannel);
          });
        });
      }
    };
  }, [loadOrders]);

  const handleUpdateItemAction = async (orderId: string, itemId: string, action: 'pack' | 'dispatch') => {
    setIsUpdating(orderId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(`/api/seller/orders/${orderId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update item milestone');
      setSuccessMessage({
        orderId,
        message: action === 'pack' ? 'Item marked as Packed' : 'Item marked as Handed to Dispatch',
      });
      loadOrders();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (e: any) {
      setErrorMessage({ orderId, message: e.message || 'Operation failed' });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleUpdateStatus = async (orderId: string, targetStatus: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const blocked = transitionBlockedReason(order.status, targetStatus);
    if (blocked) {
      setErrorMessage({ orderId, message: blocked });
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsUpdating(orderId);

    try {
      const result = await updateOrderStatus(orderId, targetStatus);
      if (result.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: targetStatus } : o));
        setSuccessMessage({
          orderId,
          message: `Order status successfully updated to ${targetStatus.replace(/_/g, ' ').toUpperCase()}`,
        });
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage({
          orderId,
          message: result.error || 'Failed to update order status. Please try again.',
        });
      }
    } catch (err: any) {
      setErrorMessage({
        orderId,
        message: err.message || 'Network error occurred while updating order status.',
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleConfirmCancelOrder = async () => {
    if (!cancelModalOrder) return;
    const finalReason = cancelReason === 'Other' ? (customCancelReason || 'Cancelled by seller') : cancelReason;

    setIsSubmittingCancel(true);
    setErrorMessage(null);

    try {
      const result = await updateOrderStatus(cancelModalOrder.id, 'cancelled', undefined, finalReason);
      if (result.success) {
        setOrders(prev => prev.map(o => o.id === cancelModalOrder.id ? { ...o, status: 'cancelled' } : o));
        setSuccessMessage({
          orderId: cancelModalOrder.id,
          message: 'Order cancelled successfully and reserved inventory was restored.',
        });
        setCancelModalOrder(null);
        setCustomCancelReason('');
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage({
          orderId: cancelModalOrder.id,
          message: result.error || 'Failed to cancel order.',
        });
      }
    } catch (err: any) {
      setErrorMessage({
        orderId: cancelModalOrder.id,
        message: err.message || 'An error occurred during cancellation.',
      });
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  // ─── Process Customer Request (Approve / Reject) ─────────
  const handleDecisionConfirm = async () => {
    if (!decisionModal) return;
    if (decisionModal.action === 'reject' && !decisionReason.trim()) {
      setErrorMessage({ orderId: '', message: 'A recorded rejection reason is mandatory when rejecting a customer request.' });
      return;
    }

    setIsSubmittingDecision(true);
    setErrorMessage(null);

    try {
      const res = await processOrderRequest({
        requestId: decisionModal.requestId,
        action: decisionModal.action,
        reason: decisionReason.trim() || undefined,
      });

      if (res.success) {
        setSuccessMessage({
          orderId: '',
          message: `${decisionModal.requestType === 'cancellation' ? 'Cancellation' : 'Return'} request has been ${decisionModal.action === 'approve' ? 'approved' : 'rejected'} successfully.`,
        });
        setDecisionModal(null);
        setDecisionReason('');
        await loadOrders();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage({ orderId: '', message: res.error || 'Failed to process request.' });
      }
    } catch (err: any) {
      setErrorMessage({ orderId: '', message: err.message || 'Network error occurred.' });
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  // ─── Update Individual Item Fulfillment Status ────────────
  const handleUpdateItemStatus = async (orderId: string, orderItemId: string, targetStatus: OrderStatus) => {
    setIsUpdating(orderId);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await updateOrderStatus(orderId, targetStatus, undefined, undefined, orderItemId);
      if (res.success) {
        setSuccessMessage({ orderId, message: `Item status updated to ${targetStatus.replace(/_/g, ' ').toUpperCase()}` });
        await loadOrders();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage({ orderId, message: res.error || 'Failed to update item status' });
      }
    } catch (e: any) {
      setErrorMessage({ orderId, message: e.message || 'Error updating item' });
    } finally {
      setIsUpdating(null);
    }
  };

  // Metric counts
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const confirmedCount = orders.filter(o => o.status === 'confirmed').length;
  const outForDeliveryCount = orders.filter(o => o.status === 'out_for_delivery').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;
  const requestsCount = orders.reduce((sum, o) => {
    return sum + (o.order_items || []).filter(item => 
      (item.return_requests || []).some(r => ['submitted', 'under_review', 'pending'].includes(r.status))
    ).length;
  }, 0);

  // Filtered orders
  const filteredOrders = orders.filter(order => {
    const matchesTab = (() => {
      if (activeTab === 'all') return true;
      if (activeTab === 'requests') {
        return (order.order_items || []).some(item => (item.return_requests || []).length > 0);
      }
      return order.status === activeTab;
    })();

    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesTab;

    const matchesId = order.id.toLowerCase().includes(query) || (order.order_number && order.order_number.toLowerCase().includes(query));
    const matchesCustomer = order.profiles?.name?.toLowerCase().includes(query) || order.profiles?.phone?.includes(query);
    const matchesProduct = (order.order_items || []).some(item => 
      item.product_name?.toLowerCase().includes(query) || 
      item.products?.name?.toLowerCase().includes(query)
    );

    return matchesTab && (matchesId || matchesCustomer || matchesProduct);
  });

  return (
    <div className="space-y-6">
      {/* ─── Metric Summary Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <button
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-primary text-white border-primary shadow-sm'
              : 'bg-surface hover:bg-surface-muted border-border text-foreground'
          }`}
        >
          <span className={`text-[11px] font-bold uppercase tracking-wider block ${activeTab === 'all' ? 'text-emerald-200' : 'text-foreground-muted'}`}>
            Total Orders
          </span>
          <span className="text-2xl font-black mt-1 block">{orders.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'requests'
              ? 'bg-[#c88a23] text-white border-[#c88a23] shadow-sm'
              : 'bg-surface hover:bg-warning-bg/40 border-border text-foreground'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${activeTab === 'requests' ? 'text-amber-100' : 'text-[#c88a23]'}`}>
              Requests
            </span>
            <RotateCcw className={`w-3.5 h-3.5 ${activeTab === 'requests' ? 'text-white' : 'text-[#c88a23]'}`} />
          </div>
          <span className="text-2xl font-black mt-1 block">{requestsCount}</span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-surface hover:bg-warning-bg/40 border-border text-foreground'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${activeTab === 'pending' ? 'text-amber-100' : 'text-warning'}`}>
              Pending
            </span>
            <Clock className={`w-3.5 h-3.5 ${activeTab === 'pending' ? 'text-white' : 'text-amber-500'}`} />
          </div>
          <span className="text-2xl font-black mt-1 block">{pendingCount}</span>
        </button>

        <button
          onClick={() => setActiveTab('confirmed')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'confirmed'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
              : 'bg-surface hover:bg-success-bg/40 border-border text-foreground'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${activeTab === 'confirmed' ? 'text-emerald-100' : 'text-success'}`}>
              Confirmed
            </span>
            <CheckCircle2 className={`w-3.5 h-3.5 ${activeTab === 'confirmed' ? 'text-white' : 'text-success'}`} />
          </div>
          <span className="text-2xl font-black mt-1 block">{confirmedCount}</span>
        </button>

        <button
          onClick={() => setActiveTab('out_for_delivery')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'out_for_delivery'
              ? 'bg-yellow-600 text-white border-yellow-600 shadow-sm'
              : 'bg-surface hover:bg-warning-bg/40 border-border text-foreground'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${activeTab === 'out_for_delivery' ? 'text-yellow-100' : 'text-warning'}`}>
              In Transit
            </span>
            <Truck className={`w-3.5 h-3.5 ${activeTab === 'out_for_delivery' ? 'text-white' : 'text-yellow-600'}`} />
          </div>
          <span className="text-2xl font-black mt-1 block">{outForDeliveryCount}</span>
        </button>

        <button
          onClick={() => setActiveTab('delivered')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'delivered'
              ? 'bg-primary text-white border-primary shadow-sm'
              : 'bg-surface hover:bg-success-bg/40 border-border text-foreground'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${activeTab === 'delivered' ? 'text-emerald-200' : 'text-primary'}`}>
              Delivered
            </span>
            <Check className={`w-3.5 h-3.5 ${activeTab === 'delivered' ? 'text-white' : 'text-primary'}`} />
          </div>
          <span className="text-2xl font-black mt-1 block">{deliveredCount}</span>
        </button>
      </div>

      {/* ─── Search Bar and Status Filter Tabs ─── */}
      <div className="bg-surface rounded-2xl border border-border/90 shadow-2xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          {[
            { id: 'all', label: `All (${orders.length})` },
            { id: 'requests', label: `Requests (${requestsCount})` },
            { id: 'pending', label: `Pending (${pendingCount})` },
            { id: 'confirmed', label: `Confirmed (${confirmedCount})` },
            { id: 'out_for_delivery', label: `Out for Delivery (${outForDeliveryCount})` },
            { id: 'delivered', label: `Delivered (${deliveredCount})` },
            { id: 'cancelled', label: `Cancelled (${cancelledCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-foreground-muted hover:text-foreground hover:bg-surface-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search and Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search order ID, product, phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface-muted border border-border rounded-xl text-xs font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:bg-surface"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground-muted"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={loadOrders}
            disabled={isLoading}
            title="Refresh Orders"
            className="p-2 border border-border text-foreground hover:bg-surface-muted rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Orders List ─── */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs font-semibold text-foreground-muted">Loading your store orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-surface rounded-3xl border border-border p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-muted text-foreground-muted flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-base text-foreground">No Orders Found</h4>
            <p className="text-xs text-foreground-muted max-w-sm mx-auto">
              {searchQuery
                ? `No orders matching "${searchQuery}". Try a different keyword.`
                : activeTab !== 'all'
                  ? `No orders currently in "${activeTab.replace(/_/g, ' ')}" status.`
                  : 'Customer orders containing your products will appear here once placed.'}
            </p>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-surface-muted hover:bg-border text-foreground text-xs font-bold rounded-xl transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const statusStyle = STATUS_STYLES[order.status] || STATUS_STYLES['cancelled'];
            const isExpanded = expandedOrderId === order.id;
            const items = order.order_items || [];
            const isBusy = isUpdating === order.id;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface rounded-2xl border border-border/90 shadow-2xs overflow-hidden transition-all"
              >
                {/* Order Summary Bar */}
                <div
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-surface-muted/50 transition-colors"
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                >
                  {/* Left: ID, Date, Customer */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-black text-sm text-primary">
                        {order.order_number || `ORD-${order.id.slice(0, 8).toUpperCase()}`}
                      </span>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
                        style={{
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                          border: `1px solid ${statusStyle.border}`,
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusStyle.dot }} />
                        <span>{statusStyle.label}</span>
                      </span>

                      {/* Payment Status Badge */}
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                        order.payment_status === 'paid'
                          ? 'bg-success-bg text-emerald-800'
                          : 'bg-warning-bg text-amber-800'
                      }`}>
                        <CreditCard className="w-3 h-3" />
                        <span>{order.payment_status === 'paid' ? 'Paid' : `Payment: ${order.payment_status || 'Pending'}`} ({order.payment_method || 'COD'})</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-foreground-muted flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-foreground-muted" />
                        <span>{format(new Date(order.created_at), 'dd MMM yyyy, hh:mm a')}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-foreground font-medium">
                        <User className="w-3.5 h-3.5 text-foreground-muted" />
                        <span>{order.profiles?.name || 'Customer'}</span>
                        {order.profiles?.phone && (
                          <span className="text-foreground-muted font-mono">({order.profiles.phone})</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Right: Amount & Collapse Toggle */}
                  <div className="flex items-center justify-between md:justify-end gap-5">
                    <div className="text-left md:text-right">
                      <div className="text-base font-black text-foreground">
                        ₹{order.total_amount}
                      </div>
                      <div className="text-[11px] text-foreground-muted">
                        {items.length} {items.length === 1 ? 'item' : 'items'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-foreground-muted hover:text-foreground-muted p-1">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Messages */}
                {errorMessage?.orderId === order.id && (
                  <div className="mx-5 mb-3 p-3 rounded-xl bg-error-bg border border-error/20 text-rose-800 text-xs font-semibold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                    <span>{errorMessage.message}</span>
                  </div>
                )}

                {successMessage?.orderId === order.id && (
                  <div className="mx-5 mb-3 p-3 rounded-xl bg-success-bg border border-success/20 text-emerald-800 text-xs font-semibold flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span>{successMessage.message}</span>
                  </div>
                )}

                {/* Expanded Details Section */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border bg-background/60 p-5 space-y-6"
                    >
                      {/* Products & Delivery Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Ordered Products (2 cols) */}
                        <div className="lg:col-span-2 space-y-3">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                            <Package className="w-4 h-4 text-primary" />
                            <span>Ordered Items ({items.length})</span>
                          </h5>

                          <div className="bg-surface rounded-xl border border-border divide-y divide-border overflow-hidden">
                            {items.map((item, idx) => {
                              const prod = item.products;
                              const variant = item.product_variants;
                              const img = prod?.image_url || item.product_image || PLACEHOLDER_PRODUCT_IMAGE;
                              const name = item.product_name || prod?.name || 'Dairy Product';
                              const weight = item.variant_weight || item.weight || variant?.weight || '';
                              const itemStatus: string = (item.status as any) || order.status;
                              const itemStatusStyle = STATUS_STYLES[itemStatus] || STATUS_STYLES.pending;
                              const itemRequests = item.return_requests || [];

                              return (
                                <div key={idx} className="p-4 space-y-3">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                      <img
                                        src={img}
                                        alt={name}
                                        className="w-14 h-14 rounded-xl object-cover bg-surface-muted border border-border shrink-0"
                                        onError={e => {
                                          (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE;
                                        }}
                                      />
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <p className="text-xs font-bold text-foreground">{name}</p>
                                          <span
                                            className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider"
                                            style={{
                                              backgroundColor: itemStatusStyle.bg,
                                              color: itemStatusStyle.color,
                                              border: `1px solid ${itemStatusStyle.border}`,
                                            }}
                                          >
                                            {itemStatus.replace(/_/g, ' ')}
                                          </span>
                                        </div>

                                        {weight && (
                                          <p className="text-[11px] text-foreground-muted font-medium">
                                            Variant: {weight}
                                          </p>
                                        )}
                                        <div className="text-[11px] text-foreground-muted">
                                          Qty: <strong className="text-foreground">{item.quantity}</strong> × ₹{item.price}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="text-right">
                                      <div className="font-black text-xs text-foreground">
                                        ₹{item.price * item.quantity}
                                      </div>

                                      {/* Item-level fulfillment milestones: Pack & Hand Over */}
                                      {order.status !== 'cancelled' && itemStatus !== 'cancelled' && (
                                        <div className="flex items-center gap-1.5 mt-2 justify-end">
                                          {['pending', 'confirmed'].includes(itemStatus) && (
                                            <button
                                              onClick={() => handleUpdateItemAction(order.id, item.id, 'pack')}
                                              disabled={isBusy}
                                              className="px-2.5 py-1 rounded-lg bg-info-bg hover:bg-info-bg text-blue-800 border border-info/20 text-[10px] font-bold transition-colors flex items-center gap-1"
                                              title="Mark this item as packed and ready for dispatch"
                                            >
                                              <Package className="w-3 h-3" />
                                              <span>Mark Packed</span>
                                            </button>
                                          )}
                                          {itemStatus === 'packed' && (
                                            <button
                                              onClick={() => handleUpdateItemAction(order.id, item.id, 'dispatch')}
                                              disabled={isBusy}
                                              className="px-2.5 py-1 rounded-lg bg-warning-bg hover:bg-warning-bg text-amber-900 border border-warning/20 text-[10px] font-bold transition-colors flex items-center gap-1"
                                              title="Hand over to dispatch / delivery partner"
                                            >
                                              <Truck className="w-3 h-3" />
                                              <span>Hand to Dispatch</span>
                                            </button>
                                          )}
                                          {itemStatus === 'handed_to_dispatch' && (
                                            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold">
                                              With Dispatch
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* ─── Item Requests Section (Cancellation / Returns) ─── */}
                                  {itemRequests.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-border space-y-2">
                                      {itemRequests.map((req: any) => {
                                        const isCancellation = req.request_type === 'cancellation';
                                        const isActionable = ['submitted', 'under_review', 'pending'].includes(req.status);

                                        return (
                                          <div
                                            key={req.id}
                                            className={`p-3 rounded-xl border text-xs space-y-2 ${
                                              isCancellation
                                                ? 'bg-warning-bg/80 border-warning/20 text-amber-950'
                                                : 'bg-info-bg/80 border-info/20 text-blue-950'
                                            }`}
                                          >
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                              <div className="flex items-center gap-1.5">
                                                {isCancellation ? (
                                                  <Ban className="w-4 h-4 text-warning" />
                                                ) : (
                                                  <RotateCcw className="w-4 h-4 text-info" />
                                                )}
                                                <span className="font-extrabold uppercase tracking-wider text-[11px]">
                                                  {isCancellation ? 'Cancellation Request' : 'Product Return Request'}
                                                </span>
                                              </div>

                                              <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                  req.status === 'approved' ? 'bg-success-bg text-emerald-800' :
                                                  req.status === 'rejected' ? 'bg-error-bg text-error' :
                                                  req.status === 'refunded' ? 'bg-info-bg text-blue-800' : 'bg-amber-200 text-amber-900'
                                                }`}>
                                                  {req.status}
                                                </span>
                                                <span className="text-[10px] text-foreground-muted">
                                                  {format(new Date(req.created_at), 'MMM d, h:mm a')}
                                                </span>
                                              </div>
                                            </div>

                                            <div className="text-[11px] space-y-0.5">
                                              <p>
                                                <strong>Reason:</strong> {req.reason}
                                              </p>
                                              {req.description && (
                                                <p className="text-foreground-muted">
                                                  <strong>Customer Notes:</strong> {req.description}
                                                </p>
                                              )}
                                              {req.rejection_reason && (
                                                <p className="text-error font-bold">
                                                  <strong>Recorded Rejection Reason:</strong> {req.rejection_reason}
                                                </p>
                                              )}
                                            </div>

                                            {/* Photo Evidence Gallery */}
                                            {req.images && req.images.length > 0 && (
                                              <div>
                                                <span className="text-[10px] font-bold text-foreground-muted block mb-1">
                                                  Customer Uploaded Evidence ({req.images.length}):
                                                </span>
                                                <div className="flex gap-2 flex-wrap">
                                                  {req.images.map((imgUrl: string, imgIdx: number) => (
                                                    <button
                                                      key={imgIdx}
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveLightboxImage(imgUrl);
                                                      }}
                                                      className="relative w-12 h-12 rounded-lg border border-border overflow-hidden hover:opacity-80 transition-opacity bg-surface shrink-0 group"
                                                      title="Click to view full photo"
                                                    >
                                                      <img src={imgUrl} alt="Evidence" className="w-full h-full object-cover" />
                                                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <Eye className="w-3.5 h-3.5 text-white" />
                                                      </div>
                                                    </button>
                                                  ))}
                                                </div>
                                              </div>
                                            )}

                                            {/* Action Buttons for Seller */}
                                            {isActionable && (
                                              <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDecisionModal({
                                                      requestId: req.id,
                                                      action: 'approve',
                                                      requestType: req.request_type,
                                                      productName: name,
                                                    });
                                                  }}
                                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                                                >
                                                  <Check className="w-3.5 h-3.5" />
                                                  <span>Approve {isCancellation ? 'Cancellation' : 'Return'}</span>
                                                </button>

                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDecisionModal({
                                                      requestId: req.id,
                                                      action: 'reject',
                                                      requestType: req.request_type,
                                                      productName: name,
                                                    });
                                                    setDecisionReason('');
                                                  }}
                                                  className="px-3 py-1.5 rounded-lg border border-red-300 text-error hover:bg-error-bg text-xs font-bold flex items-center gap-1 transition-colors"
                                                >
                                                  <X className="w-3.5 h-3.5" />
                                                  <span>Reject with Reason</span>
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Customer & Delivery Address (1 col) */}
                        <div className="space-y-3">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span>Delivery Destination</span>
                          </h5>

                          <div className="bg-surface rounded-xl border border-border p-4 space-y-3 text-xs">
                            <div>
                              <span className="text-foreground-muted block text-[10px] font-bold uppercase">Customer</span>
                              <p className="font-bold text-foreground mt-0.5">{order.profiles?.name || 'Customer'}</p>
                              {order.profiles?.phone && (
                                <p className="text-foreground-muted flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3 text-foreground-muted" />
                                  <span>+91 {order.profiles.phone}</span>
                                </p>
                              )}
                            </div>

                            <div className="border-t border-border pt-2.5">
                              <span className="text-foreground-muted block text-[10px] font-bold uppercase">Shipping Address</span>
                              <p className="text-foreground mt-0.5 leading-relaxed font-medium">
                                {order.user_addresses?.address || order.shipping_address || 'Address provided at checkout'}
                              </p>
                              {order.user_addresses?.apartment && (
                                <p className="text-foreground-muted mt-0.5 font-medium">
                                  Apt/Flat: {order.user_addresses.apartment}
                                </p>
                              )}
                            </div>

                            {order.delivery_slot && (
                              <div className="border-t border-border pt-2.5">
                                <span className="text-foreground-muted block text-[10px] font-bold uppercase">Scheduled Slot</span>
                                <span className="font-semibold text-emerald-800 block mt-0.5">
                                  {order.delivery_slot}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* COD Payment Tracking & Confirmation Card for Seller's Own Product Order */}
                          {((order.payment_method || '').toUpperCase() === 'COD') ? (
                            <div className="bg-surface rounded-2xl border border-border/90 p-4 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-warning-bg text-amber-900 flex items-center justify-center font-bold text-sm shrink-0">
                                    ₹
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted block">PAYMENT METHOD</span>
                                    <span className="font-extrabold text-sm text-foreground">Cash on Delivery (COD)</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-foreground-muted">Collection Status:</span>
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                                    order.payment_status === 'paid'
                                      ? 'bg-success-bg text-emerald-800 border border-success/20'
                                      : 'bg-warning-bg text-amber-900 border border-warning/20'
                                  }`}>
                                    {order.payment_status === 'paid' ? '✓ PAID (CASH COLLECTED)' : 'PENDING CASH COLLECTION'}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-foreground-muted pt-1">
                                <div>
                                  <span className="text-[10px] text-foreground-muted font-bold uppercase tracking-wider block">ORDER AMOUNT</span>
                                  <span className="font-extrabold text-sm text-primary">₹{order.total_amount}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-foreground-muted font-bold uppercase tracking-wider block">ORDER STATUS</span>
                                  <span className="font-bold text-foreground uppercase">{order.status.replace(/_/g, ' ')}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-foreground-muted font-bold uppercase tracking-wider block">CASH CONFIRMED AT</span>
                                  <span className="font-medium text-foreground">
                                    {order.payment_confirmed_at 
                                      ? format(new Date(order.payment_confirmed_at), 'dd MMM yyyy, hh:mm a') 
                                      : 'Not yet recorded'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-foreground-muted font-bold uppercase tracking-wider block">CONFIRMED BY</span>
                                  <span className="font-medium text-foreground">
                                    {order.payment_status === 'paid' ? 'Seller Verified' : 'Pending'}
                                  </span>
                                </div>
                              </div>

                              {/* Seller Action Button: Confirm Cash Collected for eligible orders */}
                              {order.payment_status !== 'paid' && order.status !== 'cancelled' && (
                                <div className="pt-2 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCodConfirmOrder(order);
                                    }}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                                  >
                                    <IndianRupee className="w-3.5 h-3.5" />
                                    <span>Confirm Cash Collected (₹{order.total_amount})</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            /* Non-COD Payment summary */
                            <div className="bg-surface rounded-xl border border-border p-4 space-y-2 text-xs">
                              <span className="text-foreground-muted block text-[10px] font-bold uppercase tracking-wider">Payment Information</span>
                              <div className="flex justify-between items-center">
                                <span className="text-foreground-muted">Method:</span>
                                <span className="font-bold uppercase text-foreground">{order.payment_method || 'Online'}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-foreground-muted">Status:</span>
                                <span className="font-bold uppercase text-success">{order.payment_status || 'Paid'}</span>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* ─── Fulfillment Action Bar ─── */}
                      <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                          <div>
                            <h5 className="text-xs font-black uppercase tracking-wider text-foreground">
                              Order Fulfillment Workflow
                            </h5>
                            <p className="text-[11px] text-foreground-muted">
                              Advance order through required fulfillment milestones or cancel if permitted.
                            </p>
                          </div>

                          {/* Cancellation Note / History */}
                          {order.status === 'cancelled' && (
                            <div className="px-3 py-1 rounded-lg bg-surface-muted text-foreground text-xs font-medium">
                              {order.notes ? `Reason: ${order.notes}` : 'Order was cancelled'}
                            </div>
                          )}
                        </div>

                        {/* Order Timeline Visualizer */}
                        <div className="flex items-center gap-2 w-full max-w-2xl py-1">
                          {['pending', 'confirmed', 'out_for_delivery', 'delivered'].map((stepStatus, idx, arr) => {
                            const stepStyles = STATUS_STYLES[stepStatus];
                            const isCurrent = order.status === stepStatus;
                            const isPassed = arr.indexOf(order.status) > idx && order.status !== 'cancelled';
                            const isCancelled = order.status === 'cancelled';

                            return (
                              <div key={stepStatus} className="flex items-center flex-1 last:flex-none">
                                <div className="flex flex-col items-center">
                                  <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                      isCancelled
                                        ? 'bg-surface-muted text-foreground-muted border border-border-hover'
                                        : isCurrent
                                          ? 'bg-primary text-white shadow-md ring-4 ring-[var(--primary)]/10'
                                          : isPassed
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-surface-muted text-foreground-muted border border-border'
                                    }`}
                                  >
                                    {isPassed ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                                  </div>
                                  <span className={`text-[10px] mt-1 font-bold whitespace-nowrap capitalize ${
                                    isCurrent ? 'text-primary' : 'text-foreground-muted'
                                  }`}>
                                    {stepStatus.replace(/_/g, ' ')}
                                  </span>
                                </div>
                                {idx < arr.length - 1 && (
                                  <div
                                    className={`flex-1 h-1 mx-2 rounded-full transition-colors ${
                                      isPassed && !isCancelled ? 'bg-emerald-500' : 'bg-border'
                                    }`}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Available Action Buttons (Matching Admin Format) */}
                        <div className="flex flex-wrap items-center gap-2.5 pt-2">
                          <span className="text-xs font-bold text-foreground-muted mr-1">Available Actions:</span>

                          {/* 1. Confirmed Button */}
                          {(() => {
                            const isCurrent = order.status === 'confirmed';
                            const blockedReason = transitionBlockedReason(order.status, 'confirmed');
                            const isBlocked = blockedReason !== null;

                            return (
                              <button
                                key="btn-confirmed"
                                onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                                disabled={isBusy || isBlocked || isCurrent}
                                title={blockedReason ?? (isCurrent ? 'Current Status' : 'Confirm Order and prepare for dispatch')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                  isCurrent
                                    ? 'bg-success-bg text-emerald-900 border-2 border-emerald-500 shadow-2xs cursor-default'
                                    : isBlocked
                                      ? 'bg-surface-muted text-foreground-muted border border-border cursor-not-allowed line-through opacity-50'
                                      : 'bg-primary hover:bg-primary-hover text-white shadow-xs active:scale-95'
                                }`}
                              >
                                {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                <span>Confirmed</span>
                              </button>
                            );
                          })()}

                          {/* 2. Out for Delivery Button */}
                          {(() => {
                            const isCurrent = order.status === 'out_for_delivery';
                            const blockedReason = transitionBlockedReason(order.status, 'out_for_delivery');
                            const isBlocked = blockedReason !== null;

                            return (
                              <button
                                key="btn-out-for-delivery"
                                onClick={() => handleUpdateStatus(order.id, 'out_for_delivery')}
                                disabled={isBusy || isBlocked || isCurrent}
                                title={blockedReason ?? (isCurrent ? 'Current Status' : 'Mark Out for Delivery')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                  isCurrent
                                    ? 'bg-warning-bg text-yellow-900 border-2 border-yellow-500 shadow-2xs cursor-default'
                                    : isBlocked
                                      ? 'bg-surface-muted text-foreground-muted border border-border cursor-not-allowed line-through opacity-50'
                                      : 'bg-[#c88a23] hover:bg-[#ad7418] text-white shadow-xs active:scale-95'
                                }`}
                              >
                                {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                                <span>Out for Delivery</span>
                              </button>
                            );
                          })()}

                          {/* 3. Delivered Button */}
                          {(() => {
                            const isCurrent = order.status === 'delivered';
                            const blockedReason = transitionBlockedReason(order.status, 'delivered');
                            const isBlocked = blockedReason !== null;

                            return (
                              <button
                                key="btn-delivered"
                                onClick={() => handleUpdateStatus(order.id, 'delivered')}
                                disabled={isBusy || isBlocked || isCurrent}
                                title={blockedReason ?? (isCurrent ? 'Current Status' : 'Mark as Delivered to customer')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                  isCurrent
                                    ? 'bg-success-bg text-emerald-900 border-2 border-emerald-500 shadow-2xs cursor-default'
                                    : isBlocked
                                      ? 'bg-surface-muted text-foreground-muted border border-border cursor-not-allowed line-through opacity-50'
                                      : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs active:scale-95'
                                }`}
                              >
                                {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                <span>Delivered</span>
                              </button>
                            );
                          })()}

                          {/* 4. Cancel Order Button (Alternative action from eligible order status) */}
                          {(() => {
                            const isDelivered = order.status === 'delivered';
                            const isCancelled = order.status === 'cancelled';
                            const canCancel = ['pending', 'confirmed', 'out_for_delivery'].includes(order.status);

                            return (
                              <button
                                key="btn-cancel"
                                onClick={() => setCancelModalOrder(order)}
                                disabled={isBusy || !canCancel}
                                title={
                                  isDelivered
                                    ? 'Delivered orders cannot be cancelled through the normal cancellation action. Handle returns/refunds through customer support.'
                                    : isCancelled
                                      ? 'This order is already cancelled'
                                      : 'Cancel this order and return items to stock'
                                }
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                  isCancelled
                                    ? 'bg-surface-muted text-foreground-muted border border-border cursor-default'
                                    : !canCancel
                                      ? 'bg-surface-muted text-foreground-muted border border-border cursor-not-allowed line-through opacity-50'
                                      : 'bg-error-bg hover:bg-error-bg text-error border border-error/20 shadow-2xs active:scale-95'
                                }`}
                              >
                                <Ban className="w-3.5 h-3.5 text-error" />
                                <span>{isCancelled ? 'Order Cancelled' : 'Cancel Order'}</span>
                              </button>
                            );
                          })()}
                        </div>

                        {/* Post-Delivered Clarification Notice */}
                        {order.status === 'delivered' && (
                          <div className="p-3 bg-success-bg border border-success/20 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                            <span>
                              This order has been fulfilled and delivered. Cancellation is closed. Any issues or damages must be raised by the customer via the Return & Freshness Guarantee portal.
                            </span>
                          </div>
                        )}
                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ─── Cancel Order Modal ─── */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-error">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-extrabold text-base text-foreground">Cancel Order</h3>
              </div>
              <button
                onClick={() => setCancelModalOrder(null)}
                className="p-1 rounded-lg text-foreground-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-foreground-muted">
                Are you sure you want to cancel order <strong className="font-mono text-foreground">{cancelModalOrder.order_number || cancelModalOrder.id}</strong>?
              </p>
              <div className="p-3 rounded-xl bg-warning-bg border border-warning/20 text-amber-900">
                <p className="font-bold">Important:</p>
                <p className="mt-0.5">Cancelling will immediately restore all reserved product stock to your store inventory and notify the customer.</p>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Reason for Cancellation</label>
                <select
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border text-xs font-semibold outline-none focus:ring-2 focus:ring-[var(--primary)]/20 bg-surface"
                >
                  <option value="Out of stock">Product Out of Stock</option>
                  <option value="Quality check failed">Freshness / Quality Standards Not Met</option>
                  <option value="Customer requested cancellation">Customer Requested Cancellation</option>
                  <option value="Delivery address unreachable">Delivery Location Unreachable</option>
                  <option value="Other">Other Reason</option>
                </select>
              </div>

              {cancelReason === 'Other' && (
                <div>
                  <label className="block font-bold text-foreground mb-1">Specify Reason</label>
                  <textarea
                    rows={2}
                    value={customCancelReason}
                    onChange={e => setCustomCancelReason(e.target.value)}
                    placeholder="Enter details..."
                    className="w-full p-2.5 rounded-xl border border-border text-xs font-medium outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isSubmittingCancel}
                onClick={() => setCancelModalOrder(null)}
                className="px-4 py-2 text-xs font-bold text-foreground-muted hover:bg-surface-muted rounded-xl"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={isSubmittingCancel}
                onClick={handleConfirmCancelOrder}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmittingCancel && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Cancellation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Request Decision Modal (Seller Approve / Reject) ─── */}
      {decisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                {decisionModal.action === 'approve' ? (
                  <div className="p-2 rounded-xl bg-success-bg text-emerald-800">
                    <Check className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-error-bg text-error">
                    <X className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <h3 className="font-extrabold text-base text-foreground">
                    {decisionModal.action === 'approve' ? 'Approve' : 'Reject'}{' '}
                    {decisionModal.requestType === 'cancellation' ? 'Cancellation' : 'Return'}
                  </h3>
                  <p className="text-xs text-foreground-muted truncate max-w-[260px]">
                    {decisionModal.productName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDecisionModal(null)}
                className="p-1 rounded-lg text-foreground-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {decisionModal.action === 'approve' ? (
                <div className="p-3 rounded-xl bg-success-bg border border-success/20 text-emerald-900 leading-relaxed">
                  <p className="font-bold">Approval Notice:</p>
                  <p className="mt-0.5">
                    {decisionModal.requestType === 'cancellation'
                      ? 'Approving will immediately cancel this order item, restore inventory to stock, and update the customer order status.'
                      : 'Approving confirms customer return eligibility. Our logistics and admin team will track item return and inspection.'}
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-error-bg border border-error/20 text-red-900 leading-relaxed">
                  <p className="font-bold">Rejection Notice:</p>
                  <p className="mt-0.5">
                    A recorded reason is mandatory when rejecting a customer request. This reason will be logged and visible to the customer and admin.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-bold text-foreground mb-1">
                  {decisionModal.action === 'reject' ? 'Rejection Reason (Required)' : 'Notes / Remarks (Optional)'}
                </label>
                <textarea
                  rows={3}
                  value={decisionReason}
                  onChange={e => setDecisionReason(e.target.value)}
                  placeholder={
                    decisionModal.action === 'reject'
                      ? 'Explain why this request is being rejected (mandatory)...'
                      : 'Add any optional notes for the customer and audit log...'
                  }
                  className="w-full p-2.5 rounded-xl border border-border text-xs font-medium outline-none focus:ring-2 focus:ring-[var(--primary)]/20 resize-none"
                  required={decisionModal.action === 'reject'}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isSubmittingDecision}
                onClick={() => setDecisionModal(null)}
                className="px-4 py-2 text-xs font-bold text-foreground-muted hover:bg-surface-muted rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingDecision || (decisionModal.action === 'reject' && !decisionReason.trim())}
                onClick={handleDecisionConfirm}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5 ${
                  decisionModal.action === 'approve' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isSubmittingDecision && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {decisionModal.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Evidence Photo Lightbox Modal ─── */}
      {activeLightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 cursor-pointer"
          onClick={() => setActiveLightboxImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-black rounded-2xl overflow-hidden shadow-2xl p-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setActiveLightboxImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
              title="Close image"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={activeLightboxImage}
              alt="Customer evidence"
              className="max-h-[80vh] w-auto mx-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* ─── Confirm COD Payment Modal for Seller ─── */}
      {codConfirmOrder && (
        <ConfirmCodPaymentModal
          order={codConfirmOrder}
          isOpen={!!codConfirmOrder}
          endpoint={`/api/seller/orders/${codConfirmOrder.id}/confirm-cod-payment`}
          onClose={() => setCodConfirmOrder(null)}
          onSuccess={(updated) => {
            setOrders(prev => prev.map(o => o.id === codConfirmOrder.id ? { ...o, ...updated } : o));
            setCodConfirmOrder(null);
          }}
        />
      )}
    </div>
  );
}
