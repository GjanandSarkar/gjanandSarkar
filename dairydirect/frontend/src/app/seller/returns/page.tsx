'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  RotateCcw,
  RefreshCw,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Loader2,
  Search,
  Filter,
  MapPin,
  X,
  IndianRupee,
} from 'lucide-react';

export default function SellerReturnsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Dispatch Replacement Modal
  const [dispatchModalReq, setDispatchModalReq] = useState<any | null>(null);
  const [courier, setCourier] = useState('');
  const [trackingNo, setTrackingNo] = useState('');
  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState(false);

  // Processing state for row actions
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/sellers/returns');
      if (res.ok) {
        const json = await res.json();
        setRequests(json.requests || []);
      }
    } catch (e) {
      console.error('Failed to load seller returns:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAction = async (id: string, to: string, extra: Record<string, any> = {}) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/sellers/returns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, ...extra }),
      });
      const json = await res.json();
      if (res.ok) {
        showToast('success', `Request updated to ${to.replace(/_/g, ' ')}`);
        await loadRequests();
      } else {
        showToast('error', json.error || 'Failed to update request');
      }
    } catch (e) {
      showToast('error', 'Network error updating request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDispatchReplacementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchModalReq || !trackingNo.trim()) return;

    setIsSubmittingDispatch(true);
    try {
      await handleAction(dispatchModalReq.id, 'completed', {
        courier: courier.trim(),
        trackingNo: trackingNo.trim(),
      });
      setDispatchModalReq(null);
      setCourier('');
      setTrackingNo('');
    } finally {
      setIsSubmittingDispatch(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filterType !== 'all' && r.request_type !== filterType) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const orderNo = (r.orders?.order_number || '').toLowerCase();
      const prodName = (r.order_items?.product_name || '').toLowerCase();
      return orderNo.includes(term) || prodName.includes(term);
    }
    return true;
  });

  return (
    <div className="w-full bg-background min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 pt-12 md:pt-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
              Returns & Replacement Queue
            </h1>
            <p className="text-xs md:text-sm text-foreground-muted mt-1">
              Fulfill pickups, mark received items, and dispatch customer replacements
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/seller/orders"
              className="px-4 py-2.5 bg-surface border border-border text-foreground hover:bg-surface-muted text-xs font-bold rounded-xl transition-colors shadow-2xs"
            >
              Back to Orders
            </Link>
          </div>
        </div>

        {/* Toast Alert */}
        {toast && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-2 text-xs font-semibold shadow-md ${
              toast.type === 'success'
                ? 'bg-success-bg text-emerald-800 border border-success/20'
                : 'bg-error-bg text-rose-800 border border-error/20'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-error shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="bg-surface rounded-3xl border border-border/80 shadow-2xs p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by order # or product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border text-xs text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground bg-surface"
            >
              <option value="all">All Request Types</option>
              <option value="return">Returns Only</option>
              <option value="replacement">Replacements Only</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground bg-surface"
            >
              <option value="all">All Statuses</option>
              <option value="initiated">Initiated (Need Pickup)</option>
              <option value="picked_up">Picked Up (In Transit)</option>
              <option value="received">Received</option>
              <option value="refund_initiated">Refund Initiated</option>
              <option value="refunded">Refunded</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-surface rounded-3xl border border-border/80 shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="p-16 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-success mb-2" />
              <p className="text-xs text-foreground-muted">Loading return queue...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-16 text-center text-xs text-foreground-muted">
              No return or replacement requests match your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-muted/60 text-foreground-muted uppercase tracking-wider text-[10px] font-extrabold">
                    <th className="py-4 px-6">Order & Product</th>
                    <th className="py-4 px-6">Type & Reason</th>
                    <th className="py-4 px-6">Pickup Details</th>
                    <th className="py-4 px-6">Status & Age</th>
                    <th className="py-4 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRequests.map((r) => {
                    const isBusy = processingId === r.id;
                    const address = r.user_addresses;
                    const ageDays = Math.floor(
                      (Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)
                    );

                    return (
                      <tr key={r.id} className="hover:bg-surface-muted/50 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-mono text-[11px] font-bold text-foreground block">
                            #{r.orders?.order_number || r.order_id?.slice(0, 8)}
                          </span>
                          <span className="text-xs font-semibold text-foreground block mt-0.5">
                            {r.order_items?.product_name || 'Product'}
                          </span>
                          <span className="text-[11px] text-foreground-muted">
                            Qty: {r.order_items?.quantity} · ₹{Number(r.refund_amount || 0).toFixed(2)}
                          </span>
                        </td>

                        <td className="py-4 px-6 max-w-xs">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1 ${
                              r.request_type === 'replacement'
                                ? 'bg-info-bg text-blue-800'
                                : 'bg-success-bg text-emerald-800'
                            }`}
                          >
                            {r.request_type}
                          </span>
                          <p className="text-xs font-semibold text-foreground line-clamp-1">{r.reason}</p>
                          {r.description && (
                            <p className="text-[11px] text-foreground-muted line-clamp-2 mt-0.5">{r.description}</p>
                          )}
                          {r.images && r.images.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-2">
                              {r.images.map((url: string, idx: number) => (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-7 h-7 rounded border border-border overflow-hidden block"
                                >
                                  <img src={url} alt="" className="w-full h-full object-cover" />
                                </a>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-6 max-w-xs">
                          {address ? (
                            <div className="text-foreground-muted space-y-0.5">
                              <p className="font-semibold text-foreground">{address.label || 'Customer'}</p>
                              <p className="text-[11px] leading-tight">
                                {address.street_address}, {address.city} - {address.postal_code}
                              </p>
                              {address.phone && (
                                <p className="text-[11px] text-foreground-muted">Ph: {address.phone}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-foreground-muted">Standard address on file</span>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-muted text-foreground">
                            {r.status.replace(/_/g, ' ')}
                          </span>
                          <span className="block text-[11px] text-foreground-muted mt-1">
                            {ageDays === 0 ? 'Today' : `${ageDays} days ago`}
                          </span>
                          {r.request_type === 'replacement' && r.replacement_tracking_no && (
                            <span className="block text-[10px] font-mono text-info mt-0.5">
                              Tracking: {r.replacement_tracking_no}
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-right space-y-1.5">
                          {/* Valid action progression */}
                          {r.status === 'initiated' && (
                            <button
                              onClick={() => handleAction(r.id, 'picked_up')}
                              disabled={isBusy}
                              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs transition-colors disabled:opacity-50"
                            >
                              {isBusy ? 'Saving...' : 'Mark Picked Up'}
                            </button>
                          )}

                          {r.status === 'picked_up' && (
                            <button
                              onClick={() => handleAction(r.id, 'received')}
                              disabled={isBusy}
                              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-2xs transition-colors disabled:opacity-50"
                            >
                              {isBusy ? 'Saving...' : 'Mark Received'}
                            </button>
                          )}

                          {r.status === 'received' && r.request_type === 'replacement' && (
                            <button
                              onClick={() => setDispatchModalReq(r)}
                              disabled={isBusy}
                              className="px-3 py-1.5 rounded-xl bg-primary hover:bg-[#165a37] text-white font-bold text-xs shadow-2xs transition-colors disabled:opacity-50"
                            >
                              Dispatch Replacement
                            </button>
                          )}

                          {(r.status === 'received' || r.status === 'refund_initiated' || r.status === 'refunded') &&
                            r.request_type === 'return' && (
                              <span className="text-[11px] font-bold text-success block">
                                {r.status === 'refunded' ? 'Refund Complete ✓' : 'Refund Initiated'}
                              </span>
                            )}

                          {r.status === 'completed' && (
                            <span className="text-[11px] font-bold text-foreground-muted block">Fulfilled ✓</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Dispatch Replacement Modal */}
      {dispatchModalReq && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-success" />
                <h3 className="text-base font-black text-foreground tracking-tight">
                  Dispatch Replacement
                </h3>
              </div>
              <button
                onClick={() => setDispatchModalReq(null)}
                className="p-1 rounded-full text-foreground-muted hover:bg-surface-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-foreground-muted mb-4 leading-relaxed">
              Enter courier partner details and tracking number. Stock for{' '}
              <span className="font-bold text-foreground">
                {dispatchModalReq.order_items?.product_name}
              </span>{' '}
              will be deducted atomically.
            </p>

            <form onSubmit={handleDispatchReplacementSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                  Courier / Driver Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. DairyDirect Express or BlueDart"
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                  Tracking Number / Waybill ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TRK-984210"
                  value={trackingNo}
                  onChange={(e) => setTrackingNo(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setDispatchModalReq(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border-hover text-xs font-bold text-foreground hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDispatch || !trackingNo.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-[#165a37] text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingDispatch ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
