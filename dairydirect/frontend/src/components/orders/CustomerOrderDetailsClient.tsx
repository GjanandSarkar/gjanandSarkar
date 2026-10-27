"use client";

import React, { useState } from 'react';
import { SmartImage } from '@/components/ui/SmartImage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Truck, 
  RotateCcw, 
  Ban, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Store, 
  CreditCard, 
  MapPin, 
  Phone, 
  Upload, 
  X, 
  Loader2, 
  ShieldCheck,
  ChevronRight,
  IndianRupee,
  Package,
  Image as ImageIcon,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { submitOrderRequest } from '@/lib/api/orders';
import type { OrderWithItems, DBReturnRequest } from '@/lib/api/orders';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';
import { StatusBar, ORDER_STEPS, CANCELLED_STEPS } from './StatusBar';
import { canCancelOrder } from '@/lib/orders/cancel-rules';

const ITEM_STATUS_BADGES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  pending:          { bg: '#fff7ed', text: '#c2410c', border: '#ffedd5', label: 'Pending' },
  confirmed:        { bg: '#f0fdf4', text: '#15803d', border: '#dcfce7', label: 'Confirmed' },
  out_for_delivery: { bg: '#fefce8', text: '#a16207', border: '#fef9c3', label: 'Out for Delivery' },
  delivered:        { bg: '#ecfdf5', text: '#047857', border: '#d1fae5', label: 'Delivered' },
  cancelled:        { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb', label: 'Cancelled' },
  returned:         { bg: '#eff6ff', text: '#1d4ed8', border: '#dbeafe', label: 'Returned' },
};

const REQUEST_STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  submitted:            { bg: '#fef3c7', text: '#92400e', label: 'Submitted (Under Review)' },
  under_review:         { bg: '#fef3c7', text: '#92400e', label: 'Under Review' },
  approved:             { bg: '#dcfce7', text: '#166534', label: 'Approved' },
  return_in_progress:   { bg: '#e0e7ff', text: '#3730a3', label: 'Return in Progress' },
  item_received:        { bg: '#e0e7ff', text: '#3730a3', label: 'Item Received at Hub' },
  inspection_completed: { bg: '#e0e7ff', text: '#3730a3', label: 'Inspection Completed' },
  refund_pending:       { bg: '#fed7aa', text: '#9a3412', label: 'Refund Processing' },
  refunded:             { bg: '#dbeafe', text: '#1e40af', label: 'Refunded' },
  rejected:             { bg: '#fee2e2', text: '#991b1b', label: 'Rejected' },
};

const CANCELLATION_REASONS = [
  'Found a better price elsewhere',
  'Ordered by mistake / wrong quantity',
  'Expected delivery date is too late',
  'Item no longer needed',
  'Other reason',
];

const RETURN_REASONS = [
  'Product is defective or faulty',
  'Product is damaged',
  'Wrong product received',
  'Missing parts or accessories',
  'Product does not match the description',
  'Other issue',
];

interface CustomerOrderDetailsClientProps {
  initialOrder: OrderWithItems;
}

export function CustomerOrderDetailsClient({ initialOrder }: CustomerOrderDetailsClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderWithItems>(initialOrder);

  // Cancellation Modal State
  const [cancelModalItem, setCancelModalItem] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState(CANCELLATION_REASONS[0]);
  const [customCancelNotes, setCustomCancelNotes] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // Entire Order Cancellation State
  const [isCancelOrderModalOpen, setIsCancelOrderModalOpen] = useState(false);
  const [orderCancelReason, setOrderCancelReason] = useState('Changed my mind');
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);

  const canCancelEntireOrder = canCancelOrder(order.status);

  const handleCancelEntireOrder = async () => {
    setIsCancellingOrder(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: orderCancelReason }),
      });
      const json = await res.json();
      if (res.ok) {
        showToast('success', 'Order has been successfully cancelled.');
        setIsCancelOrderModalOpen(false);
        await reloadOrder();
      } else {
        showToast('error', json.error || 'Failed to cancel order.');
      }
    } catch (err) {
      showToast('error', 'Network error. Could not cancel order.');
    } finally {
      setIsCancellingOrder(false);
    }
  };

  // Return Modal State
  const [returnModalItem, setReturnModalItem] = useState<any | null>(null);
  const [returnReason, setReturnReason] = useState(RETURN_REASONS[0]);
  const [returnDescription, setReturnDescription] = useState('');
  const [returnImages, setReturnImages] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // Feedback Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const reloadOrder = async () => {
    try {
      const res = await fetch(`/api/orders?id=${order.id}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.order) {
        setOrder(data.order);
      }
    } catch (e) {
      console.error('Failed to reload order:', e);
    }
  };

  // ─── Image Upload for Defect Photos ────────────────────────
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 6 - returnImages.length;
    if (remainingSlots <= 0) {
      showToast('error', 'Maximum limit of 6 photos reached.');
      return;
    }

    if (files.length > remainingSlots) {
      showToast('error', `You can only add ${remainingSlots} more photo(s). Maximum 6 photos allowed.`);
    }

    setIsUploadingPhoto(true);

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast('error', `${file.name}: Only image files (JPG, PNG, WebP) are allowed.`);
        continue;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showToast('error', `${file.name}: Image size cannot exceed 10MB.`);
        continue;
      }

      try {
        // Convert to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const base64Data = await base64Promise;

        // Try uploading via ImageKit endpoint
        const uploadRes = await fetch('/api/upload/imagekit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            file: base64Data,
            fileName: `return_${order.id}_${Date.now()}_${i}.png`,
            folder: '/returns_evidence',
          }),
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.url) {
            setReturnImages(prev => [...prev, uploadData.url]);
            continue;
          }
        }

        // Fallback: use base64 data directly if ImageKit is unconfigured
        setReturnImages(prev => [...prev, base64Data]);
      } catch (err) {
        console.warn('Image upload error:', err);
      }
    }

    setIsUploadingPhoto(false);
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setReturnImages(prev => prev.filter((_, i) => i !== index));
  };

  // ─── Submit Cancellation Request ───────────────────────────
  const handleSubmitCancellation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalItem) return;

    setIsSubmittingCancel(true);

    const fullReason = customCancelNotes.trim()
      ? `${cancelReason}: ${customCancelNotes.trim()}`
      : cancelReason;

    const result = await submitOrderRequest({
      orderId: order.id,
      orderItemId: cancelModalItem.id,
      requestType: 'cancellation',
      reason: fullReason,
      description: customCancelNotes.trim() || undefined,
    });

    setIsSubmittingCancel(false);

    if (result.success) {
      showToast('success', result.message || 'Cancellation request submitted for seller review.');
      setCancelModalItem(null);
      setCustomCancelNotes('');
      await reloadOrder();
    } else {
      showToast('error', result.error || 'Failed to submit cancellation request.');
    }
  };

  // ─── Submit Product Return Request ─────────────────────────
  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalItem) return;

    setIsSubmittingReturn(true);

    const result = await submitOrderRequest({
      orderId: order.id,
      orderItemId: returnModalItem.id,
      requestType: 'return',
      reason: returnReason,
      description: returnDescription.trim() || undefined,
      images: returnImages,
    });

    setIsSubmittingReturn(false);

    if (result.success) {
      showToast('success', result.message || 'Return request submitted. Our team and seller will inspect it.');
      setReturnModalItem(null);
      setReturnDescription('');
      setReturnImages([]);
      await reloadOrder();
    } else {
      showToast('error', result.error || 'Failed to submit return request.');
    }
  };

  return (
    <div className="w-full bg-background min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6 pt-16 md:pt-20">

        {/* Toast Alert */}
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold shadow-md ${
              toast.type === 'success' ? 'bg-success-bg text-success border border-success/20' : 'bg-error-bg text-error border border-error/20'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-success shrink-0" /> : <AlertCircle className="w-5 h-5 text-error shrink-0" />}
            <span>{toast.message}</span>
          </motion.div>
        )}

        {/* Top Header Card */}
        <div className="bg-surface rounded-xl border border-border/80 shadow-2xs p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/orders"
              className="p-2.5 rounded-xl border border-border text-foreground hover:bg-surface-muted flex items-center justify-center transition-colors shrink-0"
              title="Back to Orders"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground-muted uppercase tracking-wider">Order Reference</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  order.status === 'delivered' ? 'bg-success-bg text-success' :
                  order.status === 'cancelled' ? 'bg-surface-muted text-foreground' :
                  order.status === 'out_for_delivery' ? 'bg-warning-bg text-warning' : 'bg-info-bg text-blue-800'
                }`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight mt-0.5">
                {order.order_number || `Order #${order.id.slice(0, 8)}`}
              </h1>
              <p className="text-xs text-foreground-muted mt-0.5">
                Placed on {format(new Date(order.created_at), 'MMMM d, yyyy · h:mm a')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canCancelEntireOrder && (
              <button
                onClick={() => setIsCancelOrderModalOpen(true)}
                className="px-4 py-2.5 border border-error text-error hover:bg-error-bg text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Ban className="w-3.5 h-3.5 text-error" />
                <span>Cancel Order</span>
              </button>
            )}

            <Link
              href={`/tracking/${order.id}`}
              className="px-5 py-2.5 bg-primary hover:bg-primary-light text-on-primary text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              <Truck className="w-4 h-4 text-secondary" />
              <span>Track Live Delivery</span>
            </Link>
          </div>
        </div>

        {/* Order Lifecycle Status Bar Card */}
        <div className="bg-surface rounded-xl border border-border/80 shadow-2xs p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-bold text-foreground-muted uppercase tracking-wider">
              Order Lifecycle Progress
            </span>
            {order.status === 'cancelled' && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-error-bg text-error border border-error/20">
                Order Cancelled
              </span>
            )}
          </div>
          <div className="py-2">
            <StatusBar
              steps={order.status === 'cancelled' ? CANCELLED_STEPS : ORDER_STEPS}
              current={order.status}
              times={(order as any).times || {}}
              failed={order.status === 'cancelled'}
            />
          </div>
        </div>

        {/* 100% Freshness Promise Notice */}
        <div className="p-4 rounded-2xl bg-success-bg/70 border border-success/20/80 flex items-start sm:items-center gap-3 text-xs text-success">
          <ShieldCheck className="w-6 h-6 text-success shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1">
            <span className="font-semibold text-success">Gjanand Sarkar Freshness & Quality Guarantee:</span>
            <span className="ml-1 text-success">
              Orders can be cancelled before fulfillment. Delivered items are backed by our 7-day hassle-free replacement or return warranty.
            </span>
          </div>
        </div>

        {/* Purchased Products / Order Items Section */}
        <div className="bg-surface rounded-xl border border-border/80 shadow-2xs overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-secondary" />
              <h2 className="text-base font-bold text-foreground">Order Items & Return Actions</h2>
            </div>
            <span className="text-xs font-bold text-foreground-muted">
              {order.order_items?.length || 0} Products
            </span>
          </div>

          <div className="divide-y divide-border">
            {order.order_items?.map((item: any) => {
              const itemStatus = item.status || order.status;
              const statusStyle = ITEM_STATUS_BADGES[itemStatus] || ITEM_STATUS_BADGES.pending;
              const sellerName = item.products?.sellers?.store_name || item.sellers?.store_name || 'Gjanand Direct';

              // Check for active requests on this item
              const requests: DBReturnRequest[] = item.return_requests || [];
              const activeCancelReq = requests.find(r => r.request_type === 'cancellation' && r.status !== 'rejected');
              const activeReturnReq = requests.find(r => r.request_type === 'return' && r.status !== 'rejected');
              const latestReq = requests[0];

              const canCancelItem = itemStatus !== 'delivered' && itemStatus !== 'cancelled' && !activeCancelReq;
              const canReturnItem = itemStatus === 'delivered' && !activeReturnReq;

              return (
                <div key={item.id} className="p-6 transition-colors hover:bg-surface-muted/50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                    {/* Product & Seller Details */}
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-surface-muted border border-border/70 overflow-hidden shrink-0 flex items-center justify-center">
                        <img
                          src={item.product_image || item.products?.image_url || PLACEHOLDER_PRODUCT_IMAGE}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE;
                          }}
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold border" style={{
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.text,
                            borderColor: statusStyle.border,
                          }}>
                            {statusStyle.label}
                          </span>

                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-muted text-foreground text-xs font-bold">
                            <Store className="w-3 h-3 text-foreground-muted" />
                            <span>{sellerName}</span>
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-foreground leading-snug">
                          {item.product_name}
                        </h3>

                        <p className="text-xs text-foreground-muted">
                          Qty: <span className="font-semibold text-foreground">{item.quantity}</span>
                          {item.weight && ` • ${item.weight}`}
                          {item.variant_weight && ` • ${item.variant_weight}`}
                        </p>

                        <p className="text-sm font-semibold text-primary">
                          ₹{Number(item.price) * Number(item.quantity)}
                          <span className="text-xs font-normal text-foreground-muted ml-1">
                            (₹{item.price} each)
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Request Status & Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center md:flex-col md:items-end gap-3 shrink-0">

                      {/* Active Cancellation Request Badge */}
                      {activeCancelReq && (
                        <div className="p-3 rounded-xl bg-warning-bg border border-warning/20 text-right space-y-0.5">
                          <div className="flex items-center gap-1.5 justify-end">
                            <Clock className="w-3.5 h-3.5 text-warning" />
                            <span className="text-xs font-semibold text-warning">
                              Cancellation: {REQUEST_STATUS_BADGES[activeCancelReq.status]?.label || activeCancelReq.status}
                            </span>
                          </div>
                          <p className="text-xs text-warning max-w-xs">
                            Reason: {activeCancelReq.reason}
                          </p>
                          {activeCancelReq.rejection_reason && (
                            <p className="text-xs text-error font-bold">
                              Seller Rejection Note: {activeCancelReq.rejection_reason}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Active Return Request Badge */}
                      {activeReturnReq && (
                        <div className="p-3 rounded-xl bg-info-bg border border-info/20 text-right space-y-0.5">
                          <div className="flex items-center gap-1.5 justify-end">
                            <RotateCcw className="w-3.5 h-3.5 text-info" />
                            <span className="text-xs font-semibold text-blue-900">
                              Return: {REQUEST_STATUS_BADGES[activeReturnReq.status]?.label || activeReturnReq.status}
                            </span>
                          </div>
                          <p className="text-xs text-info max-w-xs">
                            Reason: {activeReturnReq.reason}
                          </p>
                          {activeReturnReq.status === 'refunded' && (
                            <p className="text-xs text-success font-semibold">
                              ₹{activeReturnReq.refund_amount} Refunded Successfully
                            </p>
                          )}
                          {activeReturnReq.rejection_reason && (
                            <p className="text-xs text-error font-bold">
                              Rejection: {activeReturnReq.rejection_reason}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Buttons */}
                      <div className="flex items-center gap-2">
                        {activeReturnReq ? (
                          <Link
                            href={`/returns/${activeReturnReq.id}`}
                            className="px-3.5 py-2 rounded-xl bg-success-bg hover:bg-success-bg text-success text-xs font-bold flex items-center gap-1.5 border border-success/20 transition-colors shadow-2xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-success" />
                            <span>View Request</span>
                          </Link>
                        ) : (order.status === 'delivered' || item.status === 'delivered') ? (
                          <>
                            <Link
                              href={`/returns?orderItemId=${item.id}&type=return`}
                              className="px-3 py-1.5 rounded-xl border border-success text-success hover:bg-success-bg text-xs font-bold flex items-center gap-1 transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-success" />
                              <span>Return</span>
                            </Link>
                            <Link
                              href={`/returns?orderItemId=${item.id}&type=replacement`}
                              className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-light text-on-primary text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs"
                            >
                              <RefreshCw className="w-3.5 h-3.5 text-secondary" />
                              <span>Replace</span>
                            </Link>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pricing Breakdown Footer */}
          <div className="bg-surface-muted/70 p-6 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-foreground-muted">
              Need help with this order? Our support team is available 24/7.
            </div>
            <div className="flex items-center gap-6 self-end sm:self-auto">
              <div className="text-right">
                <span className="text-xs text-foreground-muted block font-bold uppercase">Order Total</span>
                <span className="text-xl font-semibold text-primary">
                  ₹{order.total_amount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping & Payment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shipping Details */}
          <div className="bg-surface rounded-xl border border-border/80 shadow-2xs p-6 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <MapPin className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">Delivery Address</h3>
            </div>
            <div className="text-xs text-foreground-muted space-y-1">
              <p className="font-bold text-foreground text-sm">{order.profiles?.name || 'Customer'}</p>
              <p className="flex items-center gap-1.5 text-foreground-muted">
                <Phone className="w-3 h-3 text-foreground-muted" />
                {order.profiles?.phone || 'No phone number'}
              </p>
              <p className="pt-1 text-foreground">
                {order.user_addresses?.address || order.shipping_address || 'Delivery address registered with order'}
              </p>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-surface rounded-xl border border-border/80 shadow-2xs p-6 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <CreditCard className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">Payment & Refund Status</h3>
            </div>
            <div className="text-xs text-foreground-muted space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-foreground-muted">Payment Method:</span>
                <span className="font-bold text-foreground uppercase">
                  {(order.payment_method || '').toUpperCase() === 'COD' ? 'Cash on Delivery (COD)' : (order.payment_method || 'Online')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground-muted">Payment Status:</span>
                <span className={`font-bold uppercase px-2.5 py-0.5 rounded-full text-xs ${
                  order.payment_status === 'paid'
                    ? 'bg-success-bg text-success border border-success/20'
                    : order.payment_status === 'refunded'
                    ? 'bg-info-bg text-blue-800 border border-info/20'
                    : 'bg-warning-bg text-warning border border-warning/20'
                }`}>
                  {order.payment_status === 'paid'
                    ? 'Paid'
                    : (order.payment_method || '').toUpperCase() === 'COD'
                    ? 'Payment Pending'
                    : (order.payment_status || 'Pending')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground-muted">Order Total:</span>
                <span className="font-semibold text-foreground font-mono">₹{order.total_amount}</span>
              </div>
              {order.payment_status === 'paid' && order.payment_confirmed_at && (
                <div className="flex justify-between items-center pt-1 text-xs text-success">
                  <span className="text-foreground-muted">Cash Confirmed At:</span>
                  <span>{format(new Date(order.payment_confirmed_at), 'dd MMM yyyy, hh:mm a')}</span>
                </div>
              )}
              {(order.payment_method || '').toUpperCase() === 'COD' && order.payment_status !== 'paid' && (
                <p className="text-xs text-warning bg-warning-bg p-2.5 rounded-xl border border-warning/20/60 mt-1">
                  Cash payment will be collected in person upon delivery and verified by Gjanand Sarkar.
                </p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ─── CANCELLATION MODAL ───────────────────────────────── */}
      {cancelModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-surface rounded-xl shadow-2xl overflow-hidden border border-border"
          >
            <div className="p-6 border-b border-border flex items-center justify-between bg-surface-muted/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-error-bg text-error">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Cancel Order Item</h3>
                  <p className="text-xs text-foreground-muted">Request item cancellation before dispatch</p>
                </div>
              </div>
              <button
                onClick={() => setCancelModalItem(null)}
                className="p-1 rounded-lg text-foreground-muted hover:text-foreground-muted hover:bg-surface-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCancellation} className="p-6 space-y-4">
              <div className="p-3 rounded-2xl bg-surface-muted border border-border flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-border overflow-hidden shrink-0">
                  <SmartImage
                    src={cancelModalItem.product_image || cancelModalItem.products?.image_url}
                    alt={cancelModalItem.product_name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{cancelModalItem.product_name}</p>
                  <p className="text-xs text-foreground-muted">
                    Qty: {cancelModalItem.quantity} • ₹{Number(cancelModalItem.price) * Number(cancelModalItem.quantity)}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Select Reason for Cancellation
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-hover text-xs bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  {CANCELLATION_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={customCancelNotes}
                  onChange={(e) => setCustomCancelNotes(e.target.value)}
                  placeholder="Share any additional details with the seller..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-hover text-xs text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-warning-bg text-warning text-xs leading-relaxed">
                <strong>Policy note:</strong> Cancellation requests are sent directly to the seller for approval. If approved, reserved inventory is restored and eligible payments are refunded.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalItem(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border-hover text-xs font-bold text-foreground hover:bg-surface-muted transition-colors"
                >
                  Keep Item
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCancel}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isSubmittingCancel ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ─── PRODUCT RETURN REQUEST MODAL ─────────────────────── */}
      {returnModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-surface rounded-xl shadow-2xl overflow-hidden border border-border my-8"
          >
            <div className="p-6 border-b border-border flex items-center justify-between bg-surface-muted/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-success-bg text-success">
                  <RotateCcw className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Return Product</h3>
                  <p className="text-xs text-foreground-muted">Submit a claim under our 7-day Freshness Warranty</p>
                </div>
              </div>
              <button
                onClick={() => setReturnModalItem(null)}
                className="p-1 rounded-lg text-foreground-muted hover:text-foreground-muted hover:bg-surface-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="p-6 space-y-4">
              <div className="p-3 rounded-2xl bg-surface-muted border border-border flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-border overflow-hidden shrink-0">
                  <SmartImage
                    src={returnModalItem.product_image || returnModalItem.products?.image_url}
                    alt={returnModalItem.product_name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate">{returnModalItem.product_name}</p>
                  <p className="text-xs text-foreground-muted">
                    Seller: {returnModalItem.products?.sellers?.store_name || 'Direct Seller'} • Qty: {returnModalItem.quantity}
                  </p>
                  <p className="text-xs font-semibold text-success mt-0.5">
                    Refund Value: ₹{Number(returnModalItem.price) * Number(returnModalItem.quantity)}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Reason for Return
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-hover text-xs bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  {RETURN_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Detailed Description
                </label>
                <textarea
                  value={returnDescription}
                  onChange={(e) => setReturnDescription(e.target.value)}
                  placeholder="Explain the defect, spoilage, or discrepancy in detail..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-hover text-xs text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                  required
                />
              </div>

              {/* Upload Defect Photos */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Upload Defect / Condition Photos (Max 6)
                  </label>
                  <span className="text-xs text-foreground-muted">{returnImages.length}/6 photos</span>
                </div>

                <div className="space-y-2">
                  {/* Photo Previews */}
                  {returnImages.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {returnImages.map((imgUrl, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-xl border border-border overflow-hidden group">
                          <img src={imgUrl} alt="Defect evidence" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePhoto(idx)}
                            className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {returnImages.length < 6 && (
                    <label className="border-2 border-dashed border-border-hover hover:border-primary rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-surface-muted/50">
                      <input
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/webp,image/jpg"
                        onChange={handlePhotoUpload}
                        disabled={isUploadingPhoto}
                        className="hidden"
                      />
                      {isUploadingPhoto ? (
                        <div className="flex items-center gap-2 text-xs text-foreground-muted">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span>Uploading photo(s)...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs font-semibold text-foreground-muted">
                          <Upload className="w-4 h-4 text-secondary" />
                          <span>Attach multiple photos of product defect / issue</span>
                        </div>
                      )}
                      <span className="text-xs text-foreground-muted mt-0.5">JPG, PNG, or WebP up to 10MB (select multiple)</span>
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnModalItem(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border-hover text-xs font-bold text-foreground hover:bg-surface-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReturn || !returnDescription.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-light text-on-primary text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isSubmittingReturn ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Return Request'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Entire Order Cancellation Confirmation Modal */}
      {isCancelOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-surface rounded-xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-error" />
                <h3 className="text-lg font-semibold text-foreground tracking-tight">Cancel this order?</h3>
              </div>
              <button
                onClick={() => setIsCancelOrderModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-surface-muted text-foreground-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-foreground-muted mb-4 leading-relaxed">
              If your payment was already captured, an automatic refund will be issued to your original payment method. Inventory reservations will be restored immediately.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
                  Reason for Cancellation
                </label>
                <select
                  value={orderCancelReason}
                  onChange={(e) => setOrderCancelReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-hover text-xs bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option>Changed my mind</option>
                  <option>Ordered by mistake</option>
                  <option>Delivery is taking too long</option>
                  <option>Found a better price</option>
                  <option>Need to change delivery address</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCancelOrderModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border-hover text-xs font-bold text-foreground hover:bg-surface-muted transition-colors"
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  onClick={handleCancelEntireOrder}
                  disabled={isCancellingOrder}
                  className="flex-1 py-2.5 rounded-xl bg-error hover:bg-error text-on-error text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isCancellingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Cancel Order'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
