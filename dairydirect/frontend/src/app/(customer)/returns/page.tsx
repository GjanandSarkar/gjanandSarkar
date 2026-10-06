"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  RotateCcw, Package, AlertCircle, CheckCircle2,
  Clock, ArrowLeft, Loader2, IndianRupee, ShieldCheck, X
} from 'lucide-react';
import Link from 'next/link';

export default function CustomerReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('spoiled_sour');
  const [customReason, setCustomReason] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [retRes, ordRes] = await Promise.all([
        fetch('/api/admin/returns'), // returns for user
        fetch('/api/orders'),
      ]);
      const [retData, ordData] = await Promise.all([retRes.json(), ordRes.json()]);
      if (retData.returns) setReturns(retData.returns);
      if (ordData.orders) setOrders(ordData.orders.filter((o: any) => o.status === 'delivered'));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !selectedProductId) {
      setToast({ type: 'error', message: 'Please select an order and item.' });
      return;
    }

    setIsSubmitting(true);
    setToast(null);

    try {
      const res = await fetch('/api/admin/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrderId,
          productId: selectedProductId,
          quantity: Number(quantity),
          reason: customReason ? `${reason}: ${customReason}` : reason,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to submit return request');

      setToast({ type: 'success', message: 'Return request submitted! Our team will inspect and process it.' });
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-background)' }}>
      {/* Header */}
      <div className="sticky top-0 z-30 glass-surface px-5 md:px-10 pt-6 pb-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(195,201,187,0.25)' }}>
        <div className="flex items-center gap-3">
          <Link href="/profile" className="p-2 rounded-full hover:bg-black/5 text-on-surface">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-extrabold text-[20px] md:text-[24px]" style={{ color: 'var(--color-on-surface)' }}>
              Returns & Freshness Claims
            </h1>
            <p className="text-[12px]" style={{ color: 'var(--color-outline)' }}>
              100% Freshness Guarantee Replacement Policy
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-[12px] text-white shadow-sm"
          style={{ background: 'var(--cta-gradient)' }}
        >
          <RotateCcw className="w-3.5 h-3.5" /> Request Return
        </button>
      </div>

      <div className="px-5 md:px-10 py-6 max-w-4xl">
        {toast && (
          <div className="mb-6 p-4 rounded-[12px] flex items-center gap-3" style={{
            background: toast.type === 'success' ? '#c2efac' : '#ffdad6',
            color: toast.type === 'success' ? '#2d5a27' : '#93000a',
          }}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-[13px] font-semibold">{toast.message}</span>
          </div>
        )}

        {/* Freshness Promise Banner */}
        <div className="p-4 rounded-[16px] mb-6 flex items-center gap-4" style={{ background: '#eaf4e2', border: '1px solid #c2efac' }}>
          <ShieldCheck className="w-8 h-8 shrink-0 text-[#2d5a27]" />
          <div>
            <p className="font-bold text-[14px] text-[#2d5a27]">Gjanand Sarkar Freshness Promise</p>
            <p className="text-[12px] text-[#43493e]">
              If a perishable item arrives spoiled, damaged or not fresh, report it within
              24 hours for an instant replacement or refund.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
        ) : returns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="w-12 h-12 mb-3 text-gray-400" strokeWidth={1.5} />
            <p className="font-bold text-[16px]" style={{ color: 'var(--color-on-surface)' }}>No return requests</p>
            <p className="text-[12px] text-gray-500 max-w-xs mt-1">
              You haven't submitted any return or replacement claims.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {returns.map(ret => (
              <div key={ret.id} className="rounded-[16px] p-5 flex flex-col gap-3"
                style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(195,201,187,0.3)' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase">Return #{ret.id.slice(0, 8)}</span>
                    <h3 className="font-bold text-[15px] mt-0.5" style={{ color: 'var(--color-on-surface)' }}>
                      {ret.product_name || 'Product'} ({ret.quantity} units)
                    </h3>
                    <p className="text-[12px] text-gray-500 mt-1">Reason: {ret.reason}</p>
                  </div>
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase ${
                    ret.status === 'approved' ? 'bg-green-100 text-green-800' :
                    ret.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    ret.status === 'refunded' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {ret.status}
                  </span>
                </div>
                {ret.admin_notes && (
                  <div className="p-3 rounded-[10px] bg-gray-50 text-[12px] text-gray-600">
                    <span className="font-bold">Admin response:</span> {ret.admin_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Return Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="w-full max-w-md bg-white rounded-[20px] shadow-2xl p-6 flex flex-col gap-5"
          >
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h2 className="font-extrabold text-[18px]" style={{ color: 'var(--color-on-surface)' }}>
                Submit Freshness Claim
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Select Delivered Order */}
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1">Select Delivered Order</label>
                <select
                  value={selectedOrderId}
                  onChange={e => {
                    setSelectedOrderId(e.target.value);
                    setSelectedProductId('');
                  }}
                  className="w-full px-3 py-2 rounded-[10px] border text-[13px] bg-gray-50"
                  required
                >
                  <option value="">-- Select an order --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      Order #{o.order_number || o.id.slice(0, 8)} (₹{o.total_amount})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Product in Order */}
              {selectedOrder && (
                <div>
                  <label className="block text-[12px] font-bold text-gray-700 mb-1">Select Item</label>
                  <select
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2 rounded-[10px] border text-[13px] bg-gray-50"
                    required
                  >
                    <option value="">-- Select product --</option>
                    {(selectedOrder.order_items || []).map((item: any) => (
                      <option key={item.product_id} value={item.product_id}>
                        {item.product_name || item.product_id} ({item.quantity} qty)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1">Reason for Claim</label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-[10px] border text-[13px] bg-gray-50"
                >
                  <option value="spoiled_sour">Perishable item is spoiled</option>
                  <option value="damaged_seal">Seal broken or packet leaking</option>
                  <option value="wrong_item">Wrong item delivered</option>
                  <option value="expired">Near or past expiry date</option>
                  <option value="other">Other issue</option>
                </select>
              </div>

              {/* Additional Comments */}
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1">Details (Optional)</label>
                <textarea
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  placeholder="Describe the issue with the delivered item..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-[10px] border text-[13px] bg-gray-50"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !selectedOrderId || !selectedProductId}
                className="w-full py-3 rounded-[12px] font-bold text-white text-[14px] shadow-md transition-opacity"
                style={{ background: 'var(--color-primary)', opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Claim'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
