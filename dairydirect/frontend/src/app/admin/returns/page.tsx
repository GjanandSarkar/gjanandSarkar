"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  X, 
  AlertTriangle, 
  Clock, 
  Loader2, 
  ArrowLeft, 
  Filter, 
  RefreshCw, 
  Eye, 
  RotateCcw, 
  Ban, 
  Store, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  IndianRupee, 
  CreditCard, 
  Package, 
  History, 
  ShieldAlert, 
  Search,
  ExternalLink,
  ChevronDown,
  Repeat,
  Copy,
  Check,
  Truck
} from 'lucide-react';
import Link from 'next/link';
import { format, differenceInHours } from 'date-fns';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';

type AdminRequestRecord = {
  id: string;
  order_id: string;
  order_item_id?: string;
  product_id?: string;
  seller_id?: string;
  user_id: string;
  request_type: 'return' | 'replacement';
  reason: string;
  description: string | null;
  images: string[];
  status: string;
  refund_amount: number | null;
  seller_notes: string | null;
  seller_status: string;
  admin_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at?: string;
  resolved_at: string | null;
  pickup_address_id?: string;
  picked_up_at?: string;
  received_at?: string;
  refund_initiated_at?: string;
  completed_at?: string;
  replacement_tracking_no?: string;
  replacement_dispatched_at?: string;
  refund?: {
    id: string;
    amount: number;
    method: 'razorpay' | 'manual_upi';
    status: 'initiated' | 'completed' | 'failed';
    razorpay_refund_id?: string;
    destination?: { upi_id?: string };
    failure_reason?: string;
    speed_requested?: string;
    speed_processed?: string;
    created_at: string;
    completed_at?: string;
  } | null;
  history?: Array<{
    action: string;
    actor_id: string;
    actor_type: 'customer' | 'seller' | 'admin' | 'system';
    timestamp: string;
    notes?: string;
  }>;
  // Joined fields
  order_number: string;
  order_total: number;
  order_status?: string;
  order_date?: string;
  payment_method: string;
  payment_status: string;
  razorpay_payment_id?: string;
  delivery_address?: string;
  product_name: string;
  product_image?: string;
  variant_weight?: string;
  item_quantity: number;
  item_price: number;
  item_status?: string;
  seller_name: string;
  seller_slug?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
};

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  initiated:        { bg: '#fef3c7', text: '#92400e', label: 'Initiated' },
  picked_up:        { bg: '#e0e7ff', text: '#3730a3', label: 'Picked Up' },
  received:         { bg: '#dbeafe', text: '#1e40af', label: 'Received' },
  refund_initiated: { bg: '#fed7aa', text: '#9a3412', label: 'Refund Initiated' },
  refunded:         { bg: '#dcfce7', text: '#166534', label: 'Refunded' },
  completed:        { bg: '#dcfce7', text: '#166534', label: 'Completed' },
  rejected:         { bg: '#fee2e2', text: '#991b1b', label: 'Rejected' },
};

export default function AdminReturnsPage() {
  const [requests, setRequests] = useState<AdminRequestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [tabFilter, setTabFilter] = useState<'all' | 'returns' | 'replacements' | 'refund_pending' | 'failed_refunds' | 'cod_awaiting' | 'stuck'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Action Modals
  const [overrideModal, setOverrideModal] = useState<{
    request: AdminRequestRecord;
    toStatus: string;
    note: string;
  } | null>(null);

  const [refundActionModal, setRefundActionModal] = useState<{
    request: AdminRequestRecord;
    action: 'retry_refund' | 'mark_cod_paid';
    note: string;
  } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState<string | null>(null);

  // History / Lightbox
  const [historyModalRequest, setHistoryModalRequest] = useState<AdminRequestRecord | null>(null);
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

      const res = await fetch(`/api/admin/returns?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      setRequests(data.returns || []);
    } catch (err: any) {
      console.error('Failed to fetch requests:', err);
      showToast('error', 'Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Derived Stuck calculation (> 3 days in same status)
  const isStuck = (r: AdminRequestRecord) => {
    if (['refunded', 'completed', 'rejected'].includes(r.status)) return false;
    const lastChange = r.updated_at || r.created_at;
    return differenceInHours(new Date(), new Date(lastChange)) >= 72;
  };

  // Filtered requests
  const filteredRequests = useMemo(() => {
    let result = requests;

    if (tabFilter === 'returns') {
      result = result.filter(r => r.request_type === 'return');
    } else if (tabFilter === 'replacements') {
      result = result.filter(r => r.request_type === 'replacement');
    } else if (tabFilter === 'refund_pending') {
      result = result.filter(r => r.status === 'refund_initiated' || (r.refund && r.refund.status === 'initiated'));
    } else if (tabFilter === 'failed_refunds') {
      result = result.filter(r => r.refund?.status === 'failed');
    } else if (tabFilter === 'cod_awaiting') {
      result = result.filter(r => r.refund?.method === 'manual_upi' && r.refund?.status !== 'completed');
    } else if (tabFilter === 'stuck') {
      result = result.filter(isStuck);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(r => 
        r.id.toLowerCase().includes(q) ||
        r.order_number?.toLowerCase().includes(q) ||
        r.customer_name?.toLowerCase().includes(q) ||
        r.customer_phone?.includes(q) ||
        r.product_name?.toLowerCase().includes(q) ||
        r.seller_name?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [requests, tabFilter, searchQuery]);

  // Metric counts
  const totalCount = requests.length;
  const openReturnsCount = requests.filter(r => r.request_type === 'return' && !['refunded', 'rejected'].includes(r.status)).length;
  const openReplacementsCount = requests.filter(r => r.request_type === 'replacement' && !['completed', 'rejected'].includes(r.status)).length;
  const refundsPendingCount = requests.filter(r => r.status === 'refund_initiated' || (r.refund && r.refund.status === 'initiated')).length;
  const failedRefundsCount = requests.filter(r => r.refund?.status === 'failed').length;
  const codAwaitingCount = requests.filter(r => r.refund?.method === 'manual_upi' && r.refund?.status !== 'completed').length;
  const stuckCount = requests.filter(isStuck).length;

  // Handle Advance / Override
  const handleConfirmOverride = async () => {
    if (!overrideModal || !overrideModal.note.trim()) {
      showToast('error', 'A recorded note is mandatory for admin status overrides.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/returns/${overrideModal.request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'advance',
          to: overrideModal.toStatus,
          note: overrideModal.note.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to advance status');

      showToast('success', `Status advanced to ${overrideModal.toStatus.replace(/_/g, ' ')}`);
      setOverrideModal(null);
      fetchRequests();
    } catch (err: any) {
      showToast('error', err.message || 'Operation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Retry Refund or Mark COD Paid
  const handleConfirmRefundAction = async () => {
    if (!refundActionModal || !refundActionModal.note.trim()) {
      showToast('error', 'A recorded note is required.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/returns/${refundActionModal.request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: refundActionModal.action,
          note: refundActionModal.note.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process refund action');

      showToast('success', refundActionModal.action === 'retry_refund' ? 'Refund retry triggered' : 'COD refund marked paid');
      setRefundActionModal(null);
      fetchRequests();
    } catch (err: any) {
      showToast('error', err.message || 'Operation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUpi(text);
    setTimeout(() => setCopiedUpi(null), 2500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Header */}
      <div className="px-6 md:px-10 pt-8 pb-6 bg-surface border-b border-border/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2.5 rounded-xl border border-border text-foreground hover:bg-surface-muted flex items-center justify-center transition-colors shrink-0"
              title="Return to Admin"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-success-bg text-success text-xs font-semibold uppercase tracking-wider">
                  Admin Global Operations
                </span>
                {stuckCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-error-bg text-error text-xs font-semibold uppercase tracking-wider flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{stuckCount} Stuck &gt;3d</span>
                  </span>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-semibold text-primary tracking-tight flex items-center gap-2 mt-0.5">
                <RotateCcw className="w-6 h-6 text-secondary" />
                <span>Returns & Replacements Monitoring Desk</span>
              </h1>
              <p className="text-xs text-foreground-muted mt-0.5">
                Monitor fulfillment progression, enforce policy compliance, oversee Razorpay refunds, and execute COD payouts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchRequests}
              disabled={isLoading}
              className="p-2.5 border border-border text-foreground hover:bg-surface-muted rounded-xl transition-colors shrink-0 cursor-pointer"
              title="Refresh Requests"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
            </button>
          </div>
        </div>

        {/* Metric Badges Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          <button
            onClick={() => setTabFilter('all')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              tabFilter === 'all' ? 'bg-primary text-white border-primary shadow-sm' : 'bg-surface-muted border-border/80 text-foreground hover:bg-surface-muted'
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wider opacity-80">Total</p>
            <p className="text-xl font-semibold">{totalCount}</p>
          </button>

          <button
            onClick={() => setTabFilter('returns')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              tabFilter === 'returns' ? 'bg-blue-900 text-white border-blue-900 shadow-sm' : 'bg-info-bg/50 border-blue-100 text-blue-900 hover:bg-info-bg'
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wider opacity-80">Open Returns</p>
            <p className="text-xl font-semibold text-blue-800">{openReturnsCount}</p>
          </button>

          <button
            onClick={() => setTabFilter('replacements')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              tabFilter === 'replacements' ? 'bg-warning text-white border-warning shadow-sm' : 'bg-warning-bg/50 border-warning-bg text-warning hover:bg-warning-bg'
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wider opacity-80">Open Replacements</p>
            <p className="text-xl font-semibold text-warning">{openReplacementsCount}</p>
          </button>

          <button
            onClick={() => setTabFilter('refund_pending')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              tabFilter === 'refund_pending' ? 'bg-orange-900 text-white border-orange-900 shadow-sm' : 'bg-orange-50/50 border-orange-100 text-orange-900 hover:bg-orange-50'
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wider opacity-80">Refunds Pending</p>
            <p className="text-xl font-semibold text-orange-800">{refundsPendingCount}</p>
          </button>

          <button
            onClick={() => setTabFilter('failed_refunds')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              tabFilter === 'failed_refunds' ? 'bg-red-800 text-white border-red-800 shadow-sm' : 'bg-error-bg/60 border-red-100 text-red-900 hover:bg-error-bg'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider opacity-80">Refunds Failed</p>
              {failedRefundsCount > 0 && <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />}
            </div>
            <p className="text-xl font-semibold text-error">{failedRefundsCount}</p>
          </button>

          <button
            onClick={() => setTabFilter('cod_awaiting')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              tabFilter === 'cod_awaiting' ? 'bg-success text-white border-success shadow-sm' : 'bg-success-bg/50 border-success-bg text-success hover:bg-success-bg'
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wider opacity-80">COD Awaiting Payout</p>
            <p className="text-xl font-semibold text-success">{codAwaitingCount}</p>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-6 md:px-10 py-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* Search & Status Filters */}
        <div className="bg-surface rounded-xl border border-border/90 shadow-2xs p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by order #, customer, phone, seller..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-muted border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Statuses' },
              { id: 'initiated', label: 'Initiated' },
              { id: 'picked_up', label: 'Picked Up' },
              { id: 'received', label: 'Received' },
              { id: 'refund_initiated', label: 'Refund Initiated' },
              { id: 'refunded', label: 'Refunded' },
              { id: 'completed', label: 'Completed' },
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
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs font-semibold text-foreground-muted">Loading returns & replacements...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-surface rounded-xl border border-border p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-muted text-foreground-muted flex items-center justify-center mx-auto">
              <RotateCcw className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-base text-foreground">No Requests Found</h4>
              <p className="text-xs text-foreground-muted max-w-sm mx-auto">
                No return or replacement records match the active search and queue criteria.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map(req => {
              const statusBadge = STATUS_BADGES[req.status] || STATUS_BADGES.initiated;
              const isReplacement = req.request_type === 'replacement';
              const stuck = isStuck(req);
              const isCod = req.payment_method === 'COD';
              const upiId = req.refund?.destination?.upi_id;

              return (
                <div
                  key={req.id}
                  className={`bg-surface rounded-xl border p-6 space-y-5 transition-all shadow-2xs ${
                    stuck ? 'border-warning/80 ring-2 ring-amber-100' : 'border-border/90 hover:border-border-hover'
                  }`}
                >
                  {/* Top Bar: ID, Type, Status, Stuck Warning, Dates */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-foreground-muted">
                        REQ #{req.id.slice(0, 8).toUpperCase()}
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1 ${
                        isReplacement ? 'bg-purple-100 text-purple-900' : 'bg-info-bg text-blue-900'
                      }`}>
                        {isReplacement ? <Repeat className="w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
                        <span>{req.request_type}</span>
                      </span>

                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider"
                        style={{ backgroundColor: statusBadge.bg, color: statusBadge.text }}
                      >
                        {statusBadge.label}
                      </span>

                      {stuck && (
                        <span className="px-2 py-0.5 rounded-full bg-warning-bg text-warning text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                          <Clock className="w-3 h-3 text-warning" />
                          <span>Stuck &gt; 3 Days</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-foreground-muted">
                      <span>Submitted {format(new Date(req.created_at), 'MMM d, yyyy · h:mm a')}</span>
                      <button
                        onClick={() => setHistoryModalRequest(req)}
                        className="p-1 rounded-lg hover:bg-surface-muted text-foreground-muted hover:text-foreground transition-colors"
                        title="View Complete Request History"
                      >
                        <History className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Main Grid: Item details, Customer & Seller, Financials & Refunds */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Column 1: Product & Order */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted block">
                        Item & Order Information
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
                          <p className="text-xs text-foreground-muted">
                            {req.variant_weight && <span className="font-medium mr-2">{req.variant_weight}</span>}
                            <span>Qty: <strong className="text-foreground">{req.item_quantity}</strong></span>
                            <span className="mx-1">·</span>
                            <span>Price: <strong className="text-foreground">₹{req.item_price}</strong></span>
                          </p>
                          <p className="text-xs text-foreground-muted">
                            Order: <Link href={`/orders/${req.order_id}`} className="font-mono font-bold text-primary hover:underline" target="_blank">
                              #{req.order_number}
                            </Link>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Customer & Seller */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted block">
                        Customer & Fulfillment
                      </span>
                      <div className="space-y-1 text-xs text-foreground-muted">
                        <div className="flex items-center gap-1.5 font-bold text-foreground">
                          <User className="w-3.5 h-3.5 text-foreground-muted" />
                          <span>{req.customer_name}</span>
                        </div>
                        {req.customer_phone && (
                          <div className="flex items-center gap-1.5 text-foreground-muted">
                            <Phone className="w-3.5 h-3.5 text-foreground-muted" />
                            <span>{req.customer_phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-foreground-muted">
                          <Store className="w-3.5 h-3.5 text-foreground-muted" />
                          <span>Seller: <strong className="text-foreground">{req.seller_name}</strong></span>
                        </div>
                        {req.replacement_tracking_no && (
                          <div className="flex items-center gap-1.5 text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                            <Truck className="w-3.5 h-3.5" />
                            <span>Dispatch Tracking: {req.replacement_tracking_no}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Column 3: Payment & Refund Status */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted block">
                        Payment & Refund Lifecycle
                      </span>
                      <div className="space-y-1.5 text-xs text-foreground-muted">
                        <div className="flex justify-between items-center">
                          <span className="text-foreground-muted">Order Payment:</span>
                          <span className="font-bold text-foreground uppercase">{req.payment_method} · {req.payment_status}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-foreground-muted">Target Refund:</span>
                          <span className="font-semibold text-primary">
                            ₹{req.refund_amount || (req.item_price * req.item_quantity)}
                          </span>
                        </div>

                        {req.refund && (
                          <div className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                            req.refund.status === 'failed'
                              ? 'bg-error-bg border-error/20 text-red-900'
                              : req.refund.status === 'completed'
                              ? 'bg-success-bg border-success/20 text-success'
                              : 'bg-orange-50 border-orange-200 text-orange-900'
                          }`}>
                            <div className="flex justify-between items-center font-bold">
                              <span>Refund ({req.refund.method === 'manual_upi' ? 'Manual UPI' : 'Razorpay'}):</span>
                              <span className="uppercase">{req.refund.status}</span>
                            </div>

                            {req.refund.razorpay_refund_id && (
                              <div className="font-mono text-xs truncate text-foreground-muted">
                                Rzp ID: {req.refund.razorpay_refund_id}
                              </div>
                            )}

                            {req.refund.failure_reason && (
                              <p className="text-error font-medium">Error: {req.refund.failure_reason}</p>
                            )}

                            {upiId && (
                              <div className="flex items-center justify-between gap-1 pt-1 font-mono">
                                <span>UPI: {upiId}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(upiId)}
                                  className="p-1 hover:bg-black/5 rounded text-foreground"
                                  title="Copy UPI ID"
                                >
                                  {copiedUpi === upiId ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Customer Reason & Evidence Photos */}
                  <div className="p-4 rounded-2xl bg-surface-muted border border-border/80 text-xs space-y-2">
                    <div>
                      <span className="font-bold text-foreground">Reason: </span>
                      <span className="font-semibold text-foreground">{req.reason}</span>
                    </div>

                    {req.description && (
                      <div>
                        <span className="font-bold text-foreground">Description: </span>
                        <span className="text-foreground-muted leading-relaxed">{req.description}</span>
                      </div>
                    )}

                    {req.images && req.images.length > 0 && (
                      <div className="pt-2 border-t border-border">
                        <span className="font-bold text-foreground block mb-1.5">
                          Evidence Photos ({req.images.length}):
                        </span>
                        <div className="flex gap-2 flex-wrap">
                          {req.images.map((imgUrl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActiveLightboxImage(imgUrl)}
                              className="relative w-16 h-16 rounded-xl border border-border overflow-hidden hover:opacity-80 transition-opacity bg-surface group"
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
                  </div>

                  {/* Admin Actions Bar */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border">
                    <div className="text-xs text-foreground-muted flex items-center gap-2">
                      <span className="font-medium">Lifecycle Milestones:</span>
                      {req.picked_up_at && <span>Picked up: {format(new Date(req.picked_up_at), 'MMM d, h:mm a')} ·</span>}
                      {req.received_at && <span>Received: {format(new Date(req.received_at), 'MMM d, h:mm a')} ·</span>}
                      {req.completed_at && <span>Finalized: {format(new Date(req.completed_at), 'MMM d, h:mm a')}</span>}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Action: Retry Refund if Razorpay failed */}
                      {req.refund?.status === 'failed' && (
                        <button
                          onClick={() => setRefundActionModal({
                            request: req,
                            action: 'retry_refund',
                            note: 'Admin retrying failed Razorpay refund',
                          })}
                          className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Retry Refund</span>
                        </button>
                      )}

                      {/* Action: Mark COD Refund Paid */}
                      {req.refund?.method === 'manual_upi' && req.refund?.status !== 'completed' && (
                        <button
                          onClick={() => setRefundActionModal({
                            request: req,
                            action: 'mark_cod_paid',
                            note: `COD refund of ₹${req.refund_amount} paid via manual UPI`,
                          })}
                          className="px-3.5 py-1.5 rounded-xl bg-success hover:bg-success text-on-success text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark COD Refund Paid</span>
                        </button>
                      )}

                      {/* Action: Advance / Override Status */}
                      {!['refunded', 'completed', 'rejected'].includes(req.status) && (
                        <button
                          onClick={() => {
                            const nextOptions = req.request_type === 'return' 
                              ? (req.status === 'initiated' ? 'picked_up' : req.status === 'picked_up' ? 'received' : 'refund_initiated')
                              : (req.status === 'initiated' ? 'picked_up' : req.status === 'picked_up' ? 'received' : 'completed');
                            setOverrideModal({
                              request: req,
                              toStatus: nextOptions,
                              note: '',
                            });
                          }}
                          className="px-3.5 py-1.5 rounded-xl border border-border-hover hover:bg-surface-muted text-foreground text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-warning" />
                          <span>Override / Advance Status</span>
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Override / Advance Modal */}
      {overrideModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-xl bg-surface p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-warning" />
                <span>Admin Status Override</span>
              </h3>
              <button onClick={() => setOverrideModal(null)} className="p-1 rounded-lg hover:bg-surface-muted text-foreground-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-foreground-muted">
              Request #{overrideModal.request.id.slice(0, 8)} ({overrideModal.request.request_type}) · Current status: <strong className="uppercase">{overrideModal.request.status}</strong>
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Target Next Status</label>
              <select
                value={overrideModal.toStatus}
                onChange={e => setOverrideModal({ ...overrideModal, toStatus: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-border-hover text-xs font-semibold"
              >
                {overrideModal.request.request_type === 'return' ? (
                  <>
                    <option value="picked_up">Picked Up</option>
                    <option value="received">Received</option>
                    <option value="refund_initiated">Refund Initiated</option>
                    <option value="refunded">Refunded</option>
                  </>
                ) : (
                  <>
                    <option value="picked_up">Picked Up and On the Way Back</option>
                    <option value="received">Item Received</option>
                    <option value="completed">Replacement Complete</option>
                  </>
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Audit Log Note (Mandatory)</label>
              <textarea
                rows={3}
                placeholder="State the justification or inspection findings for this override..."
                value={overrideModal.note}
                onChange={e => setOverrideModal({ ...overrideModal, note: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-border-hover text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setOverrideModal(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                disabled={isProcessing || !overrideModal.note.trim()}
                onClick={handleConfirmOverride}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-light text-on-primary text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
              >
                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Override</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Refund Action Modal (Retry or COD paid) */}
      {refundActionModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-xl bg-surface p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <span>{refundActionModal.action === 'retry_refund' ? 'Retry Failed Razorpay Refund' : 'Mark COD Refund Paid'}</span>
              </h3>
              <button onClick={() => setRefundActionModal(null)} className="p-1 rounded-lg hover:bg-surface-muted text-foreground-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-surface-muted rounded-2xl border text-xs space-y-1">
              <p>Order: <strong>#{refundActionModal.request.order_number}</strong></p>
              <p>Refund Amount: <strong className="text-primary">₹{refundActionModal.request.refund_amount}</strong></p>
              {refundActionModal.request.refund?.destination?.upi_id && (
                <p>Customer UPI ID: <strong className="font-mono text-blue-900">{refundActionModal.request.refund.destination.upi_id}</strong></p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Audit Note</label>
              <textarea
                rows={2}
                value={refundActionModal.note}
                onChange={e => setRefundActionModal({ ...refundActionModal, note: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-border-hover text-xs text-foreground"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRefundActionModal(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                disabled={isProcessing || !refundActionModal.note.trim()}
                onClick={handleConfirmRefundAction}
                className="px-4 py-2 rounded-xl bg-success hover:bg-success text-on-success text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
              >
                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Execute Action</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Lightbox for Evidence Images */}
      {activeLightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setActiveLightboxImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-transparent" onClick={e => e.stopPropagation()}>
            <img
              src={activeLightboxImage}
              alt="Evidence preview"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setActiveLightboxImage(null)}
              className="absolute -top-3 -right-3 p-2 bg-surface rounded-full shadow-lg text-foreground hover:bg-surface-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold ${
              toast.type === 'success' ? 'bg-primary text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
