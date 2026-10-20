'use client';

import React, { useState } from 'react';
import { IndianRupee, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import type { OrderWithItems } from '@/lib/api/orders';

interface ConfirmCodPaymentModalProps {
  order: OrderWithItems;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedOrder: Partial<OrderWithItems>) => void;
  endpoint?: string;
}

export function ConfirmCodPaymentModal({
  order,
  isOpen,
  onClose,
  onSuccess,
  endpoint,
}: ConfirmCodPaymentModalProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetEndpoint = endpoint || `/api/admin/orders/${order.id}/confirm-cod-payment`;

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(targetEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: order.total_amount }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok) {
        onSuccess({
          payment_status: 'paid',
          payment_confirmed_at: json.confirmed_at || new Date().toISOString(),
          payment_confirmed_by: json.confirmed_by,
          cod_collected_amount: json.amount || order.total_amount,
        });
        onClose();
      } else {
        setError(json.error || 'Failed to record cash payment confirmation.');
      }
    } catch (err: any) {
      setError('Network error: Could not confirm payment. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // Seller store attribution
  const sellerStore = (order.order_items || [])
    .map(i => i.products?.sellers?.store_name)
    .filter(Boolean)[0] || 'Direct Platform';

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="cod-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h3 id="cod-modal-title" className="text-base font-extrabold text-gray-900">
                Confirm Cash Collected
              </h3>
              <p className="text-xs text-gray-500">Order #{order.order_number || order.id.slice(0, 8)}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="p-1 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order & Payment Summary Card */}
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Customer:</span>
            <span className="font-bold text-gray-900">{order.profiles?.name || 'Customer'}</span>
          </div>
          {order.profiles?.phone && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Phone:</span>
              <span className="font-mono text-gray-700">+91 {order.profiles.phone}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Seller / Store:</span>
            <span className="font-bold text-purple-700">{sellerStore}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Order Status:</span>
            <span className="font-bold uppercase text-gray-800">{order.status.replace(/_/g, ' ')}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-gray-700 font-extrabold">Total Cash Amount:</span>
            <span className="text-base font-black text-[#0f3e26]">₹{order.total_amount}</span>
          </div>
        </div>

        {/* Verification Notice */}
        <p className="text-xs text-gray-600 leading-relaxed">
          Please confirm that the physical cash of <strong className="text-gray-900">₹{order.total_amount}</strong> has been collected from the customer. Once confirmed, this order&apos;s payment status will permanently change to <span className="font-bold text-emerald-700">Paid</span>.
        </p>

        {error && (
          <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2.5 justify-end pt-2">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleConfirm}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <CheckCircle2 className="w-4 h-4" />
            <span>{busy ? 'Confirming...' : 'Confirm Cash Collected'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
