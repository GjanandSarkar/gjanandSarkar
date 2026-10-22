"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  X, 
  AlertTriangle, 
  Clock, 
  Loader2, 
  RefreshCw, 
  Eye, 
  RotateCcw, 
  Ban, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  Package, 
  History, 
  Search,
  Check,
  Building2,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';

type SellerReturnRecord = {
  id: string;
  order_id: string;
  order_item_id?: string;
  product_id?: string;
  seller_id?: string;
  user_id: string;
  request_type: 'cancellation' | 'return';
  reason: string;
  description: string | null;
  images: string[];
  status: string;
  refund_amount: number | null;
  seller_notes: string | null;
  seller_status: string;
  admin_notes: string | null;
  rejection_reason: string | null;
  history: Array<{
    action: string;
    actor_id: string;
    actor_type: 'customer' | 'seller' | 'admin';
    timestamp: string;
    notes?: string;
  }>;
  created_at: string;
  resolved_at: string | null;
  updated_at?: string;
  order_number: string;
  order_total: number;
  order_status?: string;
  order_date?: string;
  payment_method: string;
  payment_status: string;
  product_name: string;
  product_image?: string;
  variant_weight?: string;
  item_quantity: number;
  item_price: number;
  item_status?: string;
  seller_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address?: string;
};

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  submitted:            { bg: '#fef3c7', text: '#92400e', label: 'Submitted' },
  under_review:         { bg: '#fef3c7', text: '#92400e', label: 'Under Review' },
  approved:             { bg: '#dcfce7', text: '#166534', label: 'Approved' },
  return_in_progress:   { bg: '#e0e7ff', text: '#3730a3', label: 'In Progress' },
  item_received:        { bg: '#e0e7ff', text: '#3730a3', label: 'Item Received' },
  inspection_completed: { bg: '#e0e7ff', text: '#3730a3', label: 'Inspection Done' },
  refund_pending:       { bg: '#fed7aa', text: '#9a3412', label: 'Refund Pending' },
  refunded:             { bg: '#dbeafe', text: '#1e40af', label: 'Refunded' },
  rejected:             { bg: '#fee2e2', text: '#991b1b', label: 'Rejected' },
};

export function SellerReturnsManager() {
  const [requests, setRequests] = useState<SellerReturnRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedRequest, setSelectedRequest] = useState<SellerReturnRecord | null>(null);
  const [actionType, setActionType] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // History & Lightbox
  const [historyModalRequest, setHistoryModalRequest] = useState<SellerReturnRecord | null>(null);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (typeFilter !== 'all') params.set('requestType', typeFilter);

      const res = await fetch(`/api/admin/returns?${params.toString()}`, { 
        cache: 'no-store',
        credentials: 'include'
      });
      const data = await res.json();
      setRequests(data.returns || []);
    } catch (err: any) {
      console.error('Failed to fetch seller returns:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Client-side search filtering
  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return requests;

    return requests.filter(r => 
      r.id.toLowerCase().includes(q) ||
      r.order_number?.toLowerCase().includes(q) ||
      r.customer_name?.toLowerCase().includes(q) ||
      r.customer_phone?.includes(q) ||
      r.product_name?.toLowerCase().includes(q) ||
      r.delivery_address?.toLowerCase().includes(q) ||
      r.reason?.toLowerCase().includes(q)
    );
  }, [requests, searchQuery]);

  // Metric counts
  const totalCount = requests.length;
  const cancellationsCount = requests.filter(r => r.request_type === 'cancellation').length;
  const returnsCount = requests.filter(r => r.request_type === 'return').length;
  const pendingCount = requests.filter(r => ['submitted', 'under_review', 'pending'].includes(r.status)).length;
  const resolvedCount = requests.filter(r => ['refunded', 'rejected'].includes(r.status)).length;

  const handleConfirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    if (actionType === 'reject' && !actionNotes.trim()) {
      showToast('error', 'A rejection reason is mandatory.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/returns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          requestId: selectedRequest.id,
          action: actionType,
          reason: actionNotes.trim() || undefined,
          notes: actionNotes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process return request');
      }

      showToast('success', `Request #${selectedRequest.id.slice(0, 8)} updated successfully.`);
      setSelectedRequest(null);
      setActionType(null);
      setActionNotes('');
      await fetchRequests();
    } catch (err: any) {
      showToast('error', err.message || 'Operation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner / Heading */}
      <div className="bg-surface rounded-3xl border border-border/90 shadow-2xs p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-success-bg text-success text-[10px] font-black uppercase tracking-wider">
                Store Claims Desk
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-black text-foreground tracking-tight flex items-center gap-2 mt-1">
              <RotateCcw className="w-5 h-5 text-[#c88a23]" />
              <span>Customer Returns & Cancellations</span>
            </h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              Manage return claims and order cancellations for products purchased from your store. Inspect evidence, approve, and track returns.
            </p>
          </div>

          <button
            onClick={fetchRequests}
            disabled={isLoading}
            className="p-2.5 border border-border text-foreground hover:bg-surface-muted rounded-xl transition-colors shrink-0 cursor-pointer self-start sm:self-center"
            title="Refresh Requests"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>

        {/* KPI Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 mt-6">
          <div className="p-3.5 rounded-2xl border border-border bg-surface-muted/50">
            <span className="text-[10px] font-black uppercase tracking-wider text-foreground-muted block">Total Claims</span>
            <span className="text-xl font-black text-foreground mt-1 block">{totalCount}</span>
          </div>

          <div className="p-3.5 rounded-2xl border border-warning/20 bg-warning-bg/50">
            <span className="text-[10px] font-black uppercase tracking-wider text-warning block">Action Needed</span>
            <span className="text-xl font-black text-warning mt-1 block">{pendingCount}</span>
          </div>

          <div className="p-3.5 rounded-2xl border border-orange-200 bg-orange-50/50">
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 block">Cancellations</span>
            <span className="text-xl font-black text-orange-900 mt-1 block">{cancellationsCount}</span>
          </div>

          <div className="p-3.5 rounded-2xl border border-info/20 bg-info-bg/50">
            <span className="text-[10px] font-black uppercase tracking-wider text-info block">Returns</span>
            <span className="text-xl font-black text-blue-900 mt-1 block">{returnsCount}</span>
          </div>

          <div className="p-3.5 rounded-2xl border border-success/20 bg-success-bg/50">
            <span className="text-[10px] font-black uppercase tracking-wider text-success block">Resolved</span>
            <span className="text-xl font-black text-success mt-1 block">{resolvedCount}</span>
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-md ${
            toast.type === 'success' 
              ? 'bg-success-bg text-success border border-success/20' 
              : 'bg-error-bg text-error border border-error/20'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-success shrink-0" /> : <AlertTriangle className="w-5 h-5 text-error shrink-0" />}
          <span>{toast.message}</span>
        </motion.div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-surface rounded-3xl border border-border p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative flex-1 md:max-w-md">
            <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Request ID, Order #, Customer, Product, or Address..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-muted border border-border rounded-xl text-xs font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:bg-surface"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground-muted"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdown: Request Type */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-surface-muted border border-border rounded-xl px-3 py-1.5 text-xs font-bold text-foreground">
              <span className="text-foreground-muted text-[10px] uppercase">Type:</span>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="bg-transparent outline-none cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="cancellation">Cancellations</option>
                <option value="return">Returns</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-border">
          {[
            { id: 'all', label: 'All Statuses' },
            { id: 'pending', label: 'Pending Review' },
            { id: 'approved', label: 'Approved' },
            { id: 'return_in_progress', label: 'In Progress' },
            { id: 'item_received', label: 'Item Received' },
            { id: 'inspection_completed', label: 'Inspection Done' },
            { id: 'refunded', label: 'Refunded' },
            { id: 'rejected', label: 'Rejected' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-foreground-muted hover:text-foreground hover:bg-surface-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 bg-surface rounded-3xl border border-border">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs font-semibold text-foreground-muted">Loading product return requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-surface rounded-3xl border border-border p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-muted text-foreground-muted flex items-center justify-center mx-auto">
            <RotateCcw className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-base text-foreground">No Return or Cancellation Claims</h4>
            <p className="text-xs text-foreground-muted max-w-sm mx-auto">
              There are no customer returns or cancellations matching the selected criteria for your store products.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map(req => {
            const statusBadge = STATUS_BADGES[req.status] || STATUS_BADGES.submitted;
            const isCancellation = req.request_type === 'cancellation';

            return (
              <div
                key={req.id}
                className="bg-surface rounded-3xl border border-border/90 shadow-2xs p-6 space-y-5 transition-all hover:border-border-hover"
              >
                {/* Top Bar: Request ID, Type, Status, Submission Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs font-black text-foreground-muted">
                      REQ #{req.id.slice(0, 8).toUpperCase()}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                      isCancellation ? 'bg-warning-bg text-warning' : 'bg-info-bg text-blue-900'
                    }`}>
                      {isCancellation ? <Ban className="w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
                      <span>{req.request_type}</span>
                    </span>

                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                      style={{ backgroundColor: statusBadge.bg, color: statusBadge.text }}
                    >
                      {statusBadge.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-foreground-muted">
                    <span>Submitted {format(new Date(req.created_at), 'MMM d, yyyy · h:mm a')}</span>
                    <button
                      onClick={() => setHistoryModalRequest(req)}
                      className="p-1 rounded-lg hover:bg-surface-muted text-foreground-muted hover:text-foreground transition-colors"
                      title="View Request History"
                    >
                      <History className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Main 3-Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  {/* Column 1: Target Product & Item Details */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted block">
                      Target Product & Item
                    </span>
                    <div className="flex items-start gap-3">
                      <img
                        src={req.product_image || PLACEHOLDER_PRODUCT_IMAGE}
                        alt={req.product_name}
                        className="w-14 h-14 rounded-xl object-cover bg-surface-muted border border-border shrink-0"
                        onError={e => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE;
                        }}
                      />
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs font-bold text-foreground leading-snug">{req.product_name}</p>
                        <p className="text-[11px] text-foreground-muted">
                          Qty: <strong className="text-foreground">{req.item_quantity}</strong>
                          {req.variant_weight && ` • ${req.variant_weight}`}
                        </p>
                        <p className="text-xs font-black text-primary">
                          ₹{req.item_price * req.item_quantity}
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] text-foreground-muted pt-1">
                      <span>Order: </span>
                      <span className="font-bold text-primary">#{req.order_number}</span>
                    </div>
                  </div>

                  {/* Column 2: Customer Contact & Delivery Address */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted block">
                      Customer Contact & Address
                    </span>
                    <div className="space-y-1.5 text-xs text-foreground-muted">
                      <p className="font-bold text-foreground flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                        <span>{req.customer_name}</span>
                      </p>
                      {req.customer_phone && (
                        <p className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                          <span>+91 {req.customer_phone}</span>
                        </p>
                      )}
                      {req.customer_email && (
                        <p className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                          <span>{req.customer_email}</span>
                        </p>
                      )}
                      {req.delivery_address && (
                        <div className="pt-1.5 mt-1 border-t border-border flex items-start gap-1.5 text-foreground">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <p className="leading-snug text-[11px] font-medium text-foreground">
                            {req.delivery_address}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Payment & Financial Summary */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted block">
                      Payment & Refund Target
                    </span>
                    <div className="space-y-1.5 text-xs text-foreground-muted">
                      <div className="flex justify-between items-center">
                        <span className="text-foreground-muted">Method:</span>
                        <span className="font-bold text-foreground uppercase">{req.payment_method}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-foreground-muted">Payment:</span>
                        <span className="font-semibold text-foreground uppercase">{req.payment_status}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-foreground-muted">Claim Amount:</span>
                        <span className="font-black text-primary">
                          ₹{req.refund_amount || (req.item_price * req.item_quantity)}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Customer Claim Reason & Description */}
                <div className="p-4 rounded-2xl bg-surface-muted border border-border/80 text-xs space-y-2">
                  <div>
                    <span className="font-bold text-foreground">Customer Reason: </span>
                    <span className="font-semibold text-foreground">{req.reason}</span>
                  </div>

                  {req.description && (
                    <div>
                      <span className="font-bold text-foreground">Customer Notes: </span>
                      <span className="text-foreground-muted leading-relaxed">{req.description}</span>
                    </div>
                  )}

                  {/* Uploaded Evidence Photos Gallery */}
                  {req.images && req.images.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <span className="font-bold text-foreground block mb-1.5">
                        Customer Photo Evidence ({req.images.length}):
                      </span>
                      <div className="flex gap-2 flex-wrap">
                        {req.images.map((imgUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveLightboxImage(imgUrl)}
                            className="relative w-16 h-16 rounded-xl border border-border overflow-hidden hover:opacity-80 transition-opacity bg-surface group cursor-pointer"
                          >
                            <img src={imgUrl} alt="Defect proof" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Seller Status Feedback */}
                  {req.seller_notes && (
                    <div className="pt-2 border-t border-border text-foreground-muted">
                      <span className="font-bold text-foreground">Your Response Note: </span>
                      <span>{req.seller_notes}</span>
                    </div>
                  )}
                </div>

                {/* Seller Actions Bar */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border">
                  <div className="text-[11px] text-foreground-muted">
                    {req.resolved_at 
                      ? `Resolved on ${format(new Date(req.resolved_at), 'MMM d, h:mm a')}` 
                      : 'Awaiting your review or physical return receipt'}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Approve / Reject when pending */}
                    {['submitted', 'under_review', 'pending'].includes(req.status) && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setActionType('approve');
                            setActionNotes('');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-success hover:bg-success text-on-success text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve {req.request_type === 'cancellation' ? 'Cancellation' : 'Return'}</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setActionType('reject');
                            setActionNotes('');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-error-bg hover:bg-error-bg text-error border border-error/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Reject Claim</span>
                        </button>
                      </>
                    )}

                    {/* Operational Return Fulfillment Steps */}
                    {req.request_type === 'return' && req.status === 'approved' && (
                      <button
                        onClick={() => {
                          setSelectedRequest(req);
                          setActionType('return_in_progress');
                          setActionNotes('Return pickup/shipment in transit to store warehouse');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-info-bg hover:bg-info-bg text-info border border-info-bg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Mark Return In Progress
                      </button>
                    )}

                    {req.request_type === 'return' && req.status === 'return_in_progress' && (
                      <button
                        onClick={() => {
                          setSelectedRequest(req);
                          setActionType('item_received');
                          setActionNotes('Return parcel received at seller facility');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-info-bg hover:bg-info-bg text-info border border-info-bg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Mark Item Received
                      </button>
                    )}

                    {req.request_type === 'return' && req.status === 'item_received' && (
                      <button
                        onClick={() => {
                          setSelectedRequest(req);
                          setActionType('inspection_completed');
                          setActionNotes('Physical return condition verified & approved for refund');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-info-bg hover:bg-info-bg text-info border border-info-bg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Complete Inspection
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ─── ACTION CONFIRMATION MODAL ───────────────────────── */}
      {selectedRequest && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-surface-muted text-primary">
                  <RotateCcw className="w-5 h-5 text-[#c88a23]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-foreground capitalize">
                    {actionType.replace(/_/g, ' ')} Request
                  </h3>
                  <p className="text-xs text-foreground-muted">
                    Order #{selectedRequest.order_number} · {selectedRequest.product_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setActionType(null);
                }}
                className="p-1 rounded-lg text-foreground-muted hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {actionType === 'approve' && (
                <div className="p-3 rounded-xl bg-success-bg border border-success/20 text-success leading-relaxed">
                  <p className="font-bold">Approval Notice:</p>
                  <p className="mt-0.5">
                    {selectedRequest.request_type === 'cancellation'
                      ? 'Approving will cancel this item and automatically restore inventory stock back to your active store catalog.'
                      : 'Approving authorizes the customer to return the package for inspection.'}
                  </p>
                </div>
              )}

              {actionType === 'reject' && (
                <div className="p-3 rounded-xl bg-error-bg border border-error/20 text-error leading-relaxed">
                  <p className="font-bold">Rejection Warning:</p>
                  <p className="mt-0.5">
                    Please provide an honest and clear reason explaining why this return or cancellation is not eligible under store policy.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-bold text-foreground mb-1">
                  {actionType === 'reject' ? 'Reason for Rejection *' : 'Seller Notes (Optional)'}
                </label>
                <textarea
                  rows={3}
                  value={actionNotes}
                  onChange={e => setActionNotes(e.target.value)}
                  placeholder={actionType === 'reject' ? 'e.g. Item was delivered in good condition, seal was intact...' : 'Add any helpful notes...'}
                  className="w-full p-2.5 rounded-xl border border-border text-xs font-medium outline-none focus:ring-2 focus:ring-[var(--primary)]/20 bg-surface"
                  required={actionType === 'reject'}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setSelectedRequest(null);
                  setActionType(null);
                }}
                className="px-4 py-2 text-xs font-bold text-foreground-muted hover:text-foreground rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing || (actionType === 'reject' && !actionNotes.trim())}
                onClick={handleConfirmAction}
                className="px-5 py-2 text-xs font-bold bg-primary hover:bg-[#165a37] text-on-primary rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm {actionType.replace(/_/g, ' ')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── AUDIT HISTORY / TIMELINE MODAL ───────────────────── */}
      {historyModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4">
          <div className="bg-surface rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-extrabold text-base text-foreground">Request Lifecycle History</h3>
                  <p className="text-xs text-foreground-muted">
                    REQ #{historyModalRequest.id.slice(0, 8).toUpperCase()} · Order #{historyModalRequest.order_number}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryModalRequest(null)}
                className="p-1 rounded-lg text-foreground-muted hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3 pr-1 text-xs">
              {(!historyModalRequest.history || historyModalRequest.history.length === 0) ? (
                <p className="text-foreground-muted italic py-4 text-center">No audit log recorded.</p>
              ) : (
                historyModalRequest.history.map((h, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-surface-muted border border-border space-y-1">
                    <div className="flex items-center justify-between text-foreground-muted text-[10px]">
                      <span className="font-bold uppercase tracking-wider text-primary">
                        {h.actor_type || 'system'}
                      </span>
                      <span>{format(new Date(h.timestamp), 'MMM d, yyyy · h:mm a')}</span>
                    </div>
                    <p className="font-bold text-foreground capitalize">
                      Action: {h.action?.replace(/_/g, ' ')}
                    </p>
                    {h.notes && (
                      <p className="text-foreground-muted bg-surface p-2 rounded-lg border border-border text-[11px]">
                        {h.notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 text-right border-t border-border">
              <button
                onClick={() => setHistoryModalRequest(null)}
                className="px-4 py-2 bg-surface-muted hover:bg-border text-foreground text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── EVIDENCE PHOTO LIGHTBOX ──────────────────────────── */}
      {activeLightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 cursor-pointer"
          onClick={() => setActiveLightboxImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-black rounded-2xl overflow-hidden shadow-2xl p-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setActiveLightboxImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
              title="Close image"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={activeLightboxImage}
              alt="Defect proof"
              className="max-h-[80vh] w-auto mx-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
