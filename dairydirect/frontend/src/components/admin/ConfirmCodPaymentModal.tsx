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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-surface rounded-t-[24px] sm:rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border space-y-4 max-h-[85vh] overflow-y-auto">
        {/* Mobile Swipe Grab Handle (Edit #40) */}
        <div className="sm:hidden w-10 h-1.5 rounded-full bg-border mx-auto -mt-2 mb-3" />

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
            className="p-1 rounded-xl text-foreground-muted hover:text-foreground-muted hover:bg-surface-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order & Payment Summary Card */}
        <div className="p-4 rounded-2xl bg-surface-muted border border-border/80 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-foreground-muted">Customer:</span>
            <span className="font-semibold text-foreground">{order.profiles?.name || 'Customer'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-foreground-muted">Store Attribution:</span>
            <span className="font-semibold text-primary">{sellerStore}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-foreground-muted">Payment Mode:</span>
            <span className="font-semibold uppercase text-warning">Cash on Delivery (COD)</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="font-bold text-foreground">Amount to Confirm:</span>
            <span className="text-base font-bold text-success">₹{order.total_amount}</span>
          </div>
        </div>

        {/* Audit Warning */}
        <div className="p-3 rounded-xl bg-info-bg border border-info/20 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-info shrink-0 mt-0.5" />
          <span>
            Marking this as paid records a permanent payment confirmation timestamp on the order ledger. Only confirm if cash has been physically received.
          </span>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-error-bg border border-error/20 text-error text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl bg-success hover:bg-success text-on-success text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {busy ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Confirming...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm Received</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
