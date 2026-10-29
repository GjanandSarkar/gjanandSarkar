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
      <div className="bg-surface rounded-xl max-w-md w-full p-6 shadow-2xl border border-border space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-success-bg text-success flex items-center justify-center shrink-0">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h3 id="cod-modal-title" className="text-base font-semibold text-foreground">
                Confirm Cash Collected
              </h3>
              <p className="text-xs text-foreground-muted">Order #{order.order_number || order.id.slice(0, 8)}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="p-1 rounded-xl text-foreground-muted hover:text-foreground-muted hover:bg-surface-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order & Payment Summary Card */}
        <div className="p-4 rounded-2xl bg-surface-muted border border-border/80 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-foreground-muted">Customer:</span>
            <span className="font-bold text-foreground">{order.profiles?.name || 'Customer'}</span>
          </div>
          {order.profiles?.phone && (
            <div className="flex justify-between items-center">
              <span className="text-foreground-muted">Phone:</span>
              <span className="font-mono text-foreground">+91 {order.profiles.phone}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-foreground-muted">Seller / Store:</span>
            <span className="font-bold text-purple-700">{sellerStore}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-foreground-muted">Order Status:</span>
            <span className="font-bold uppercase text-foreground">{order.status.replace(/_/g, ' ')}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-foreground font-semibold">Total Cash Amount:</span>
            <span className="text-base font-semibold text-primary">₹{order.total_amount}</span>
          </div>
        </div>

        {/* Verification Notice */}
        <p className="text-xs text-foreground-muted leading-relaxed">
          Please confirm that the physical cash of <strong className="text-foreground">₹{order.total_amount}</strong> has been collected from the customer. Once confirmed, this order&apos;s payment status will permanently change to <span className="font-bold text-success">Paid</span>.
        </p>

        {error && (
          <div role="alert" className="p-3 rounded-xl bg-error-bg border border-error/20 text-error text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-error" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2.5 justify-end pt-2">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-foreground bg-surface-muted hover:bg-border transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleConfirm}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-on-success bg-success hover:bg-success transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
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
