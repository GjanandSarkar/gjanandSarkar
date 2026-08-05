"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, X, AlertTriangle, Clock, Loader2, ArrowLeft, Filter, RefreshCw, Eye } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

type ReturnRequest = {
  id: string;
  order_id: string;
  order_number: string;
  order_total: number;
  reason: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
  refund_amount: number | null;
  admin_notes: string | null;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_method: string;
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending:  { bg: '#fff8e6', text: '#7d5200', label: 'Pending Review' },
  approved: { bg: '#c2efac', text: '#2d5a27', label: 'Approved' },
  rejected: { bg: '#ffdcc7', text: '#774117', label: 'Rejected' },
  refunded: { bg: '#dce8ff', text: '#4a6fa5', label: 'Refunded' },
};

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selected, setSelected] = useState<ReturnRequest | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState('');

  const fetchReturns = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/returns?status=${statusFilter}`);
      const data = await res.json();
      setReturns(data.returns || []);
    } catch { } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchReturns(); }, [statusFilter]);

  const handleProcess = async (action: 'approve' | 'reject') => {
    if (!selected) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/returns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnId: selected.id,
          action,
          refundAmount: refundAmount ? parseFloat(refundAmount) : undefined,
          adminNotes: adminNotes || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      setToast(action === 'approve' ? 'Return approved & customer notified ✅' : 'Return rejected & customer notified');
      setSelected(null);
      setRefundAmount('');
      setAdminNotes('');
      fetchReturns();
    } catch {
      setToast('Failed to process return. Try again.');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setToast(''), 4000);
    }
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-background)' }}>
      {/* Header */}
      <div className="px-6 md:px-10 pt-8 pb-6" style={{ background: 'var(--color-surface-container-lowest)', borderBottom: '1px solid rgba(195,201,187,0.2)' }}>
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin" className="p-1.5 rounded-[8px] hover:opacity-70 transition-opacity" style={{ background: 'var(--color-surface-container-low)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--color-on-surface)' }} />
          </Link>
          <div>
            <h1 className="font-extrabold text-[24px]" style={{ color: 'var(--color-on-surface)' }}>Return Requests</h1>
            <p className="text-[12px]" style={{ color: 'var(--color-outline)' }}>Review and process customer return requests</p>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-10 py-5 flex flex-col gap-5">
        {/* Toast */}
        {toast && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="px-4 py-3 rounded-[10px] flex items-center gap-2 text-[13px] font-medium"
            style={{ background: toast.includes('✅') ? '#c2efac' : '#ffdcc7', color: toast.includes('✅') ? '#2d5a27' : '#774117' }}>
            {toast.includes('✅') ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {toast}
          </motion.div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3">
          {(['pending', 'approved', 'rejected', 'refunded'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-3 py-2 rounded-[10px] text-[12px] font-semibold transition-all"
              style={{
                background: statusFilter === s ? 'var(--color-primary)' : 'var(--color-surface-container-low)',
                color: statusFilter === s ? '#fff' : 'var(--color-on-surface)',
              }}>
              {STATUS_STYLES[s].label}
            </button>
          ))}
          <button onClick={fetchReturns} className="p-2 rounded-[10px]" style={{ background: 'var(--color-surface-container-low)' }}>
            <RefreshCw className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
        ) : (
          <div className="flex flex-col gap-3">
            {returns.length === 0 ? (
              <div className="text-center py-16 rounded-[16px]" style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(195,201,187,0.25)' }}>
                <CheckCircle2 className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--color-primary)' }} strokeWidth={1.5} />
                <p className="font-semibold" style={{ color: 'var(--color-on-surface)' }}>No {statusFilter} returns</p>
              </div>
            ) : returns.map((r, i) => {
              const ss = STATUS_STYLES[r.status];
              return (
                <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="rounded-[16px] p-5"
                  style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(195,201,187,0.25)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[14px]" style={{ color: 'var(--color-primary)' }}>#{r.order_number}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: ss.bg, color: ss.text }}>{ss.label}</span>
                      </div>
                      <p className="font-semibold text-[13px]" style={{ color: 'var(--color-on-surface)' }}>
                        {r.customer_name} · {r.customer_phone}
                      </p>
                      <p className="text-[12px]" style={{ color: 'var(--color-outline)' }}>
                        Reason: <strong>{r.reason.replace(/_/g, ' ')}</strong>
                        {r.description && ` — ${r.description}`}
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--color-outline)' }}>
                        Order value: ₹{r.order_total} · Payment: {r.payment_method} · Submitted {format(new Date(r.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>

                    {r.status === 'pending' && (
                      <button onClick={() => { setSelected(r); setRefundAmount(r.order_total?.toString() || ''); }}
                        className="px-4 py-2 rounded-[10px] text-[12px] font-semibold flex items-center gap-2 shrink-0"
                        style={{ background: 'var(--color-primary)', color: '#fff' }}>
                        <Eye className="w-4 h-4" /> Review
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Process Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-[20px] overflow-hidden shadow-2xl"
            style={{ background: 'var(--color-surface-container-lowest)' }}>
            <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(195,201,187,0.2)' }}>
              <h3 className="font-extrabold text-[18px]" style={{ color: 'var(--color-on-surface)' }}>Process Return</h3>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-outline)' }}>Order #{selected.order_number} — {selected.customer_name}</p>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--color-outline)' }}>Refund Amount (₹)</label>
                <input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-[10px] text-[14px] outline-none"
                  style={{ background: 'var(--color-surface-container)', border: '1.5px solid rgba(195,201,187,0.4)', color: 'var(--color-on-surface)' }}
                  placeholder={`Max: ₹${selected.order_total}`} />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--color-outline)' }}>Admin Notes (optional)</label>
                <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={3}
                  className="w-full px-3 py-2.5 rounded-[10px] text-[13px] outline-none resize-none"
                  style={{ background: 'var(--color-surface-container)', border: '1.5px solid rgba(195,201,187,0.4)', color: 'var(--color-on-surface)' }}
                  placeholder="Notes to send to customer..." />
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={() => setSelected(null)} className="flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold"
                style={{ background: 'var(--color-surface-container-low)', color: 'var(--color-on-surface)' }}>Cancel</button>
              <button onClick={() => handleProcess('reject')} disabled={isProcessing}
                className="flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold"
                style={{ background: '#ffdcc7', color: '#774117' }}>
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Reject'}
              </button>
              <button onClick={() => handleProcess('approve')} disabled={isProcessing}
                className="flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold"
                style={{ background: 'var(--color-primary)', color: '#fff' }}>
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Approve'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
