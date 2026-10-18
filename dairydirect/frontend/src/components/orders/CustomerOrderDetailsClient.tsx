"use client";

import React, { useState } from 'react';
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
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { submitOrderRequest } from '@/lib/api/orders';
import type { OrderWithItems, DBReturnRequest } from '@/lib/api/orders';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';

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

    if (returnImages.length + files.length > 3) {
      showToast('error', 'You can upload up to 3 defect photos.');
      return;
    }

    setIsUploadingPhoto(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        showToast('error', 'Only JPG, PNG, and WebP images are allowed.');
        continue;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('error', 'Image size cannot exceed 5MB.');
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
          body: JSON.stringify({
            file: base64Data,
            fileName: `return_${order.id}_${Date.now()}.png`,
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
    <div className="w-full bg-[#fafaf8] min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6 pt-16 md:pt-20">

        {/* Toast Alert */}
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold shadow-md ${
              toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
            <span>{toast.message}</span>
          </motion.div>
        )}

        {/* Top Header Card */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/orders"
              className="p-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center transition-colors shrink-0"
              title="Back to Orders"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order Reference</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                  order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                  order.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                  order.status === 'out_for_delivery' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight mt-0.5">
                {order.order_number || `Order #${order.id.slice(0, 8)}`}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Placed on {format(new Date(order.created_at), 'MMMM d, yyyy · h:mm a')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/tracking/${order.id}`}
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              <Truck className="w-4 h-4 text-primary-foreground" />
              <span>Track Live Delivery</span>
            </Link>
          </div>
        </div>

        {/* 100% Freshness Promise Notice */}
        <div className="p-4 rounded-2xl bg-primary-fixed/60 border border-primary/20 flex items-start sm:items-center gap-3 text-xs text-foreground">
          <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1">
            <span className="font-extrabold text-foreground">Gjanand Sarkar Freshness & Quality Guarantee:</span>
            <span className="ml-1 text-muted-foreground">
              Orders can be cancelled before fulfillment. Delivered items are backed by our 7-day hassle-free replacement or return warranty.
            </span>
          </div>
        </div>

        {/* Purchased Products / Order Items Section */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold text-gray-900">Order Items & Return Actions</h2>
            </div>
            <span className="text-xs font-bold text-gray-400">
              {order.order_items?.length || 0} Products
            </span>
          </div>

          <div className="divide-y divide-gray-100">
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
                <div key={item.id} className="p-6 transition-colors hover:bg-gray-50/50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                    {/* Product & Seller Details */}
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-gray-100 border border-gray-200/70 overflow-hidden shrink-0 flex items-center justify-center">
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
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border" style={{
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.text,
                            borderColor: statusStyle.border,
                          }}>
                            {statusStyle.label}
                          </span>

                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-bold">
                            <Store className="w-3 h-3 text-gray-500" />
                            <span>{sellerName}</span>
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-gray-900 leading-snug">
                          {item.product_name}
                        </h3>

                        <p className="text-xs text-gray-500">
                          Qty: <span className="font-semibold text-gray-800">{item.quantity}</span>
                          {item.weight && ` • ${item.weight}`}
                          {item.variant_weight && ` • ${item.variant_weight}`}
                        </p>

                        <p className="text-sm font-black text-primary">
                          ₹{Number(item.price) * Number(item.quantity)}
                          <span className="text-xs font-normal text-gray-400 ml-1">
                            (₹{item.price} each)
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Request Status & Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center md:flex-col md:items-end gap-3 shrink-0">

                      {/* Active Cancellation Request Badge */}
                      {activeCancelReq && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-right space-y-0.5">
                          <div className="flex items-center gap-1.5 justify-end">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-xs font-black text-amber-900">
                              Cancellation: {REQUEST_STATUS_BADGES[activeCancelReq.status]?.label || activeCancelReq.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-700 max-w-xs">
                            Reason: {activeCancelReq.reason}
                          </p>
                          {activeCancelReq.rejection_reason && (
                            <p className="text-[11px] text-red-600 font-bold">
                              Seller Rejection Note: {activeCancelReq.rejection_reason}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Active Return Request Badge */}
                      {activeReturnReq && (
                        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-right space-y-0.5">
                          <div className="flex items-center gap-1.5 justify-end">
                            <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-xs font-black text-blue-900">
                              Return: {REQUEST_STATUS_BADGES[activeReturnReq.status]?.label || activeReturnReq.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-blue-700 max-w-xs">
                            Reason: {activeReturnReq.reason}
                          </p>
                          {activeReturnReq.status === 'refunded' && (
                            <p className="text-[11px] text-emerald-700 font-black">
                              ₹{activeReturnReq.refund_amount} Refunded Successfully
                            </p>
                          )}
                          {activeReturnReq.rejection_reason && (
                            <p className="text-[11px] text-red-600 font-bold">
                              Rejection: {activeReturnReq.rejection_reason}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Buttons */}
                      <div className="flex items-center gap-2">
                        {canCancelItem && (
                          <button
                            onClick={() => setCancelModalItem(item)}
                            className="px-3.5 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <Ban className="w-3.5 h-3.5 text-red-600" />
                            <span>Cancel Item</span>
                          </button>
                        )}

                        {canReturnItem && (
                          <button
                            onClick={() => {
                              setReturnModalItem(item);
                              setReturnImages([]);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Return Product</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pricing Breakdown Footer */}
          <div className="bg-gray-50/70 p-6 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-gray-500">
              Need help with this order? Our support team is available 24/7.
            </div>
            <div className="flex items-center gap-6 self-end sm:self-auto">
              <div className="text-right">
                <span className="text-xs text-gray-400 block font-bold uppercase">Order Total</span>
                <span className="text-xl font-black text-primary">
                  ₹{order.total_amount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping & Payment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shipping Details */}
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs p-6 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <MapPin className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-700">Delivery Address</h3>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p className="font-bold text-gray-900 text-sm">{order.profiles?.name || 'Customer'}</p>
              <p className="flex items-center gap-1.5 text-gray-500">
                <Phone className="w-3 h-3 text-gray-400" />
                {order.profiles?.phone || 'No phone number'}
              </p>
              <p className="pt-1 text-gray-700">
                {order.user_addresses?.address || order.shipping_address || 'Delivery address registered with order'}
              </p>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs p-6 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <CreditCard className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-700">Payment & Refund Status</h3>
            </div>
            <div className="text-xs text-gray-600 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Payment Method:</span>
                <span className="font-bold text-gray-900 uppercase">{order.payment_method || 'Online'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Payment Status:</span>
                <span className={`font-bold uppercase px-2 py-0.5 rounded-full text-[10px] ${
                  order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                  order.payment_status === 'refunded' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {order.payment_status || 'pending'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Refund Guarantee:</span>
                <span className="font-semibold text-emerald-700">Verified Seller Protection</span>
              </div>
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
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-100 text-red-700">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Cancel Order Item</h3>
                  <p className="text-xs text-gray-500">Request item cancellation before dispatch</p>
                </div>
              </div>
              <button
                onClick={() => setCancelModalItem(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCancellation} className="p-6 space-y-4">
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-200 overflow-hidden shrink-0">
                  <img
                    src={cancelModalItem.product_image || cancelModalItem.products?.image_url || PLACEHOLDER_PRODUCT_IMAGE}
                    alt={cancelModalItem.product_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">{cancelModalItem.product_name}</p>
                  <p className="text-[11px] text-gray-500">
                    Qty: {cancelModalItem.quantity} • ₹{Number(cancelModalItem.price) * Number(cancelModalItem.quantity)}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Select Reason for Cancellation
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {CANCELLATION_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={customCancelNotes}
                  onChange={(e) => setCustomCancelNotes(e.target.value)}
                  placeholder="Share any additional details with the seller..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-[11px] leading-relaxed">
                <strong>Policy note:</strong> Cancellation requests are sent directly to the seller for approval. If approved, reserved inventory is restored and eligible payments are refunded.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalItem(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
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
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 my-8"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary-fixed text-primary">
                  <RotateCcw className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Return Product</h3>
                  <p className="text-xs text-gray-500">Submit a claim under our 7-day Freshness Warranty</p>
                </div>
              </div>
              <button
                onClick={() => setReturnModalItem(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="p-6 space-y-4">
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-200 overflow-hidden shrink-0">
                  <img
                    src={returnModalItem.product_image || returnModalItem.products?.image_url || PLACEHOLDER_PRODUCT_IMAGE}
                    alt={returnModalItem.product_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-900 truncate">{returnModalItem.product_name}</p>
                  <p className="text-[11px] text-gray-500">
                    Seller: {returnModalItem.products?.sellers?.store_name || 'Direct Seller'} • Qty: {returnModalItem.quantity}
                  </p>
                  <p className="text-xs font-bold text-primary mt-0.5">
                    Refund Value: ₹{Number(returnModalItem.price) * Number(returnModalItem.quantity)}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Reason for Return
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {RETURN_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Detailed Description
                </label>
                <textarea
                  value={returnDescription}
                  onChange={(e) => setReturnDescription(e.target.value)}
                  placeholder="Explain the defect, spoilage, or discrepancy in detail..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  required
                />
              </div>

              {/* Upload Defect Photos */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    Upload Defect / Condition Photos (Max 3)
                  </label>
                  <span className="text-[11px] text-gray-400">{returnImages.length}/3 photos</span>
                </div>

                <div className="space-y-2">
                  {/* Photo Previews */}
                  {returnImages.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {returnImages.map((imgUrl, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-xl border border-gray-200 overflow-hidden group">
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

                  {returnImages.length < 3 && (
                    <label className="border-2 border-dashed border-gray-300 hover:border-primary rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50/50">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handlePhotoUpload}
                        disabled={isUploadingPhoto}
                        className="hidden"
                      />
                      {isUploadingPhoto ? (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span>Processing photo...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                          <Upload className="w-4 h-4 text-primary" />
                          <span>Attach photos of product defect / issue</span>
                        </div>
                      )}
                      <span className="text-[10px] text-gray-400 mt-0.5">JPG, PNG, or WebP up to 5MB</span>
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnModalItem(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReturn || !returnDescription.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isSubmittingReturn ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Return Request'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
