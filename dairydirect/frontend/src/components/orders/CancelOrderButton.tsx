'use client';

import { useState } from 'react';
import { canCancelOrder } from '@/lib/orders/cancel-rules';
import { Ban, Loader2, AlertCircle } from 'lucide-react';

type Props = {
  orderId: string;
  status: string;              // the status already present in your order list data
  paymentMethod?: string;      // e.g. 'COD' or 'online' / 'razorpay'
  totalAmount?: number;        // order total amount
  onChanged: () => void;       // refetch or router.refresh(), called after success and after a 409
  className?: string;          // pass your existing button class so the styling stays unchanged
};

export function CancelOrderButton({ 
  orderId, 
  status, 
  onChanged, 
  className 
}: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  if (!canCancelOrder(status)) return done ? <p role="status" className="text-xs font-semibold text-foreground-muted">{done}</p> : null;

  async function confirmCancel() {
    if (busy) return;                                     // blocks duplicate requests
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() || 'Cancelled by customer' }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        if (json.refund === 'initiated') {
          setDone('Order cancelled. Refund initiated to your original payment method.');
        } else if (json.refund === 'not_needed') {
          setDone('Order cancelled.');
        } else if (json.refund === 'queued_for_admin') {
          setDone('Order cancelled. Refund queued for admin processing.');
        } else {
          setDone('Order cancelled.');
        }
        setOpen(false);
        onChanged();
      } else {
        setError(json.error ?? 'Could not cancel the order.');
        if (res.status === 409) onChanged();              // status changed meanwhile: load the real status
      }
    } catch {
      setError('Network problem. Your order was not changed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const defaultButtonClass = "px-3.5 py-2 border border-error text-error hover:bg-error-bg text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs";

  return (
    <>
      <button 
        type="button" 
        className={className || defaultButtonClass} 
        onClick={() => { setError(''); setReason(''); setOpen(true); }}
      >
        <Ban className="w-3.5 h-3.5" />
        <span>Cancel Order</span>
      </button>

      {open && (
        <div 
          role="alertdialog" 
          aria-modal="true" 
          aria-labelledby="cancel-title"
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
        >
          <div className="bg-surface rounded-2xl max-w-sm w-full p-6 shadow-xl border border-border space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-error-bg text-error flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 id="cancel-title" className="text-base font-bold text-foreground">
                  Cancel this order?
                </h3>
                <p className="text-xs text-foreground-muted">Order #{orderId.slice(0, 8)}</p>
              </div>
            </div>

            {/* User Input Field for Cancellation Reason */}
            <div>
              <label 
                htmlFor={`cancel-reason-${orderId}`} 
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                Reason for cancellation <span className="text-foreground-muted font-normal">(optional)</span>
              </label>
              <textarea
                id={`cancel-reason-${orderId}`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Ordered by mistake, wrong quantity, change of mind..."
                rows={3}
                maxLength={255}
                disabled={busy}
                className="w-full text-xs p-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-error resize-none transition-all placeholder:text-foreground-muted disabled:bg-surface-muted"
              />
            </div>

            <p className="text-[11px] text-foreground-muted">
              This action cannot be undone.
            </p>

            {error && (
              <div role="alert" className="p-3 rounded-xl bg-error-bg border border-error/20 text-error text-xs font-medium">
                {error}
              </div>
            )}

            <div className="flex gap-2.5 justify-end pt-2">
              <button 
                type="button" 
                disabled={busy} 
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-foreground bg-surface-muted hover:bg-border transition-colors disabled:opacity-50"
              >
                Keep order
              </button>
              <button 
                type="button" 
                disabled={busy} 
                onClick={confirmCancel}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-error hover:bg-error transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{busy ? 'Cancelling...' : 'Yes, cancel order'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
