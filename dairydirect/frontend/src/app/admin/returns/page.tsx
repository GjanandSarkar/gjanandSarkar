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
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';

type AdminRequestRecord = {
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
  // Joined fields
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
  seller_slug?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address?: string;
};

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  submitted:            { bg: '#fef3c7', text: '#92400e', label: 'Submitted' },
  under_review:         { bg: '#fef3c7', text: '#92400e', label: 'Under Review' },
  approved:             { bg: '#dcfce7', text: '#166534', label: 'Approved' },
  return_in_progress:   { bg: '#e0e7ff', text: '#3730a3', label: 'Return in Progress' },
  item_received:        { bg: '#e0e7ff', text: '#3730a3', label: 'Item Received' },
  inspection_completed: { bg: '#e0e7ff', text: '#3730a3', label: 'Inspection Done' },
  refund_pending:       { bg: '#fed7aa', text: '#9a3412', label: 'Refund Pending' },
  refunded:             { bg: '#dbeafe', text: '#1e40af', label: 'Refunded' },
  rejected:             { bg: '#fee2e2', text: '#991b1b', label: 'Rejected' },
};

export default function AdminReturnsPage() {
  const [requests, setRequests] = useState<AdminRequestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Action Modals
  const [selectedRequest, setSelectedRequest] = useState<AdminRequestRecord | null>(null);
  const [actionType, setActionType] = useState<string | null>(null);
  const [reasonInput, setReasonInput] = useState('');
  const [refundAmountInput, setRefundAmountInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // History / Timeline Modal
  const [historyModalRequest, setHistoryModalRequest] = useState<AdminRequestRecord | null>(null);

  // Lightbox Modal
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

      const res = await fetch(`/api/admin/returns?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      setRequests(data.returns || []);
    } catch (err: any) {
      console.error('Failed to fetch requests:', err);
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
      r.seller_name?.toLowerCase().includes(q) ||
      r.delivery_address?.toLowerCase().includes(q)
    );
  }, [requests, searchQuery]);

  // Metric counts
  const totalCount = requests.length;
  const cancellationsCount = requests.filter(r => r.request_type === 'cancellation').length;
  const returnsCount = requests.filter(r => r.request_type === 'return').length;
  const pendingCount = requests.filter(r => ['submitted', 'under_review', 'pending'].includes(r.status)).length;
  const refundedCount = requests.filter(r => r.status === 'refunded').length;

  // Handle Admin Action Confirmation
  const handleConfirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    if (['reject', 'override'].includes(actionType) && !reasonInput.trim()) {
      showToast('error', 'A recorded reason is mandatory for rejection or override.');
      return;
    }

    setIsProcessing(true);

    try {
      const res = await fetch('/api/admin/returns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          action: actionType,
          reason: reasonInput.trim() || undefined,
          adminNotes: reasonInput.trim() || undefined,
          refundAmount: refundAmountInput ? parseFloat(refundAmountInput) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process action');
      }

      showToast('success', `Action '${actionType}' completed successfully.`);
      setSelectedRequest(null);
      setActionType(null);
      setReasonInput('');
      setRefundAmountInput('');
      fetchRequests();
    } catch (err: any) {
      showToast('error', err.message || 'Operation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8]">
      {/* Top Header */}
      <div className="px-6 md:px-10 pt-8 pb-6 bg-white border-b border-gray-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center transition-colors shrink-0"
              title="Return to Admin"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                  Admin Global Desk
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-[#0f3e26] tracking-tight flex items-center gap-2 mt-0.5">
                <RotateCcw className="w-6 h-6 text-[#c88a23]" />
                <span>Returns & Cancellations Management</span>
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Global multi-seller request desk: review customer claims, inspect evidence, enforce policies, and authorize refunds.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchRequests}
              disabled={isLoading}
              className="p-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors shrink-0 cursor-pointer"
              title="Refresh Requests"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#0f3e26]' : ''}`} />
            </button>
          </div>
        </div>

        {/* KPI Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 mt-6">
          <div className="p-3.5 rounded-2xl border border-gray-200 bg-gray-50/50">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Total Requests</span>
            <span className="text-xl font-black text-gray-900 mt-1 block">{totalCount}</span>
          </div>

          <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/50">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">Under Review</span>
            <span className="text-xl font-black text-amber-900 mt-1 block">{pendingCount}</span>
          </div>

          <div className="p-3.5 rounded-2xl border border-orange-200 bg-orange-50/50">
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 block">Cancellations</span>
            <span className="text-xl font-black text-orange-900 mt-1 block">{cancellationsCount}</span>
          </div>

          <div className="p-3.5 rounded-2xl border border-blue-200 bg-blue-50/50">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block">Returns</span>
            <span className="text-xl font-black text-blue-900 mt-1 block">{returnsCount}</span>
          </div>

          <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/50">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">Refunds Finalized</span>
            <span className="text-xl font-black text-emerald-900 mt-1 block">{refundedCount}</span>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="px-6 md:px-10 py-6 space-y-6">

        {/* Feedback Toast */}
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-md ${
              toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />}
            <span>{toast.message}</span>
          </motion.div>
        )}

        {/* Filter Toolbar */}
        <div className="bg-white rounded-3xl border border-gray-200 p-5 space-y-4 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 md:max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by Request ID, Order #, Customer, or Product..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0f3e26]/20 focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Dropdown: Request Type */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Type Filter */}
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700">
                <span className="text-gray-400 text-[10px] uppercase">Type:</span>
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
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-gray-100">
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
                    ? 'bg-[#0f3e26] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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
            <Loader2 className="w-8 h-8 text-[#0f3e26] animate-spin" />
            <p className="text-xs font-semibold text-gray-500">Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <RotateCcw className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-base text-gray-900">No Requests Found</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                No cancellation or return requests match the active search and filter criteria.
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
                  className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-6 space-y-5 transition-all hover:border-gray-300"
                >
                  {/* Top Bar: Request ID, Type, Status, Submission Date */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-xs font-black text-gray-500">
                        REQ #{req.id.slice(0, 8).toUpperCase()}
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                        isCancellation ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
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

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>Submitted {format(new Date(req.created_at), 'MMM d, yyyy · h:mm a')}</span>
                      <button
                        onClick={() => setHistoryModalRequest(req)}
                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                        title="View Complete Request History"
                      >
                        <History className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Main Grid: Product & Item info, Customer info, Financials */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Column 1: Product & Order Item Details */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                        Target Product & Item
                      </span>
                      <div className="flex items-start gap-3">
                        <img
                          src={req.product_image || PLACEHOLDER_PRODUCT_IMAGE}
                          alt={req.product_name}
                          className="w-14 h-14 rounded-xl object-cover bg-gray-50 border border-gray-100 shrink-0"
                          onError={e => {
                            (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE;
                          }}
                        />
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-xs font-bold text-gray-900 leading-snug">{req.product_name}</p>
                          <p className="text-[11px] text-gray-500">
                            Qty: <strong className="text-gray-800">{req.item_quantity}</strong>
                            {req.variant_weight && ` • ${req.variant_weight}`}
                          </p>
                          <p className="text-xs font-black text-[#0f3e26]">
                            ₹{req.item_price * req.item_quantity}
                          </p>
                        </div>
                      </div>

                      <div className="text-[11px] text-gray-500 pt-1">
                        <span>Order: </span>
                        <Link
                          href={`/admin/orders`}
                          className="font-bold text-[#0f3e26] hover:underline"
                        >
                          #{req.order_number}
                        </Link>
                      </div>
                    </div>

                    {/* Column 2: Customer Information & Delivery Address */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                        Customer Contact & Address
                      </span>
                      <div className="space-y-1.5 text-xs text-gray-600">
                        <p className="font-bold text-gray-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{req.customer_name}</span>
                        </p>
                        {req.customer_phone && (
                          <p className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>+91 {req.customer_phone}</span>
                          </p>
                        )}
                        {req.customer_email && (
                          <p className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{req.customer_email}</span>
                          </p>
                        )}
                        {req.delivery_address && (
                          <div className="pt-1.5 mt-1 border-t border-gray-100 flex items-start gap-1.5 text-gray-700">
                            <MapPin className="w-3.5 h-3.5 text-[#0f3e26] shrink-0 mt-0.5" />
                            <p className="leading-snug text-[11px] font-medium text-gray-700">
                              {req.delivery_address}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Column 3: Payment & Refund Status */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                        Payment & Refund Status
                      </span>
                      <div className="space-y-1.5 text-xs text-gray-600">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Method:</span>
                          <span className="font-bold text-gray-900 uppercase">{req.payment_method}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Payment:</span>
                          <span className="font-semibold text-gray-800 uppercase">{req.payment_status}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Refund Target:</span>
                          <span className="font-black text-[#0f3e26]">
                            ₹{req.refund_amount || (req.item_price * req.item_quantity)}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Customer Reason & Description Box */}
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 text-xs space-y-2">
                    <div>
                      <span className="font-bold text-gray-700">Customer Reason: </span>
                      <span className="font-semibold text-gray-900">{req.reason}</span>
                    </div>

                    {req.description && (
                      <div>
                        <span className="font-bold text-gray-700">Customer Description: </span>
                        <span className="text-gray-600 leading-relaxed">{req.description}</span>
                      </div>
                    )}

                    {/* Seller Response / Seller Status */}
                    {req.seller_status && req.seller_status !== 'pending' && (
                      <div className="pt-2 border-t border-gray-200 flex items-start gap-2">
                        <Store className="w-3.5 h-3.5 text-gray-500 mt-0.5" />
                        <div>
                          <span className="font-bold text-gray-800">Seller Response: </span>
                          <span className={`font-bold uppercase ${req.seller_status === 'approved' ? 'text-emerald-700' : 'text-red-700'}`}>
                            {req.seller_status}
                          </span>
                          {req.seller_notes && <span className="ml-1 text-gray-600">({req.seller_notes})</span>}
                          {req.rejection_reason && <p className="text-red-700 font-bold mt-0.5">Rejection reason: {req.rejection_reason}</p>}
                        </div>
                      </div>
                    )}

                    {/* Uploaded Photos Gallery */}
                    {req.images && req.images.length > 0 && (
                      <div className="pt-2 border-t border-gray-200">
                        <span className="font-bold text-gray-700 block mb-1.5">
                          Uploaded Evidence Photos ({req.images.length}):
                        </span>
                        <div className="flex gap-2 flex-wrap">
                          {req.images.map((imgUrl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActiveLightboxImage(imgUrl)}
                              className="relative w-16 h-16 rounded-xl border border-gray-200 overflow-hidden hover:opacity-80 transition-opacity bg-white group"
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
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-[11px] text-gray-400">
                      {req.resolved_at ? `Resolved on ${format(new Date(req.resolved_at), 'MMM d, h:mm a')}` : 'Awaiting administrative or seller action'}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Action: Approve */}
                      {['submitted', 'under_review', 'pending'].includes(req.status) && (
                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setActionType('approve');
                            setReasonInput('');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve {req.request_type === 'cancellation' ? 'Cancellation' : 'Return'}</span>
                        </button>
                      )}

                      {/* Action: Reject */}
                      {['submitted', 'under_review', 'pending', 'approved'].includes(req.status) && (
                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setActionType('reject');
                            setReasonInput('');
                          }}
                          className="px-3.5 py-1.5 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      )}

                      {/* Action: Override Seller Decision */}
                      {req.seller_status && req.seller_status !== 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setActionType('override');
                            setReasonInput('');
                          }}
                          className="px-3.5 py-1.5 rounded-xl border border-amber-300 text-amber-800 hover:bg-amber-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                          <span>Override Seller Decision</span>
                        </button>
                      )}

                      {/* Return Operational Stages Progression */}
                      {req.request_type === 'return' && req.status === 'approved' && (
                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setActionType('return_in_progress');
                            setReasonInput('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold transition-colors"
                        >
                          Mark In Progress
                        </button>
                      )}

                      {req.request_type === 'return' && req.status === 'return_in_progress' && (
                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setActionType('item_received');
                            setReasonInput('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold transition-colors"
                        >
                          Mark Item Received
                        </button>
                      )}

                      {req.request_type === 'return' && req.status === 'item_received' && (
                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setActionType('inspection_completed');
                            setReasonInput('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold transition-colors"
                        >
                          Inspection Completed
                        </button>
                      )}

                      {/* Finalize Refund */}
                      {['approved', 'inspection_completed', 'refund_pending'].includes(req.status) && req.status !== 'refunded' && (
                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setActionType('refunded');
                            setRefundAmountInput(String(req.refund_amount || (req.item_price * req.item_quantity)));
                            setReasonInput('Refund authorized & processed');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#0f3e26] hover:bg-[#165a37] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <IndianRupee className="w-3.5 h-3.5 text-[#c88a23]" />
                          <span>Authorize & Finalize Refund</span>
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

      {/* ─── ACTION CONFIRMATION MODAL ───────────────────────── */}
      {selectedRequest && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gray-100 text-[#0f3e26]">
                  <RotateCcw className="w-5 h-5 text-[#c88a23]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900 capitalize">
                    {actionType.replace(/_/g, ' ')} Request
                  </h3>
                  <p className="text-xs text-gray-500">
                    Order #{selectedRequest.order_number} · {selectedRequest.product_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setActionType(null);
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {actionType === 'refunded' ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 leading-relaxed">
                    <p className="font-bold">Refund Execution Notice:</p>
                    <p className="mt-0.5">
                      For online payments (Razorpay), a verified refund API call will be executed. For COD orders, record cash/bank reimbursement.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Refund Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={refundAmountInput}
                      onChange={e => setRefundAmountInput(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-bold outline-none focus:ring-2 focus:ring-[#0f3e26]/20 bg-white"
                      placeholder="Enter refund amount..."
                      required
                    />
                  </div>
                </div>
              ) : ['reject', 'override'].includes(actionType) ? (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 leading-relaxed">
                  <p className="font-bold">Mandatory Reason Required:</p>
                  <p className="mt-0.5">
                    A documented reason is mandatory when {actionType === 'reject' ? 'rejecting' : 'overriding'} a request. This reason is logged in the permanent audit history.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 leading-relaxed">
                  <p className="font-bold">Confirmation:</p>
                  <p className="mt-0.5">
                    Are you sure you want to transition this request to <strong>'{actionType.replace(/_/g, ' ')}'</strong>?
                    {actionType === 'approve' && selectedRequest.request_type === 'cancellation' && ' Reserved product inventory will be restored to stock.'}
                  </p>
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  {['reject', 'override'].includes(actionType) ? 'Reason (Mandatory)' : 'Administrative Remarks (Optional)'}
                </label>
                <textarea
                  rows={3}
                  value={reasonInput}
                  onChange={e => setReasonInput(e.target.value)}
                  placeholder={
                    ['reject', 'override'].includes(actionType)
                      ? 'Enter detailed justification (mandatory)...'
                      : 'Add any optional notes for this administrative action...'
                  }
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs font-medium outline-none focus:ring-2 focus:ring-[#0f3e26]/20 resize-none"
                  required={['reject', 'override'].includes(actionType)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => {
                  setSelectedRequest(null);
                  setActionType(null);
                }}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing || (['reject', 'override'].includes(actionType) && !reasonInput.trim())}
                onClick={handleConfirmAction}
                className="px-5 py-2 text-xs font-bold bg-[#0f3e26] hover:bg-[#165a37] text-white rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
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
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#0f3e26]" />
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">Request Lifecycle History</h3>
                  <p className="text-xs text-gray-500">
                    REQ #{historyModalRequest.id.slice(0, 8).toUpperCase()} · Order #{historyModalRequest.order_number}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryModalRequest(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3 pr-1 text-xs">
              {(!historyModalRequest.history || historyModalRequest.history.length === 0) ? (
                <p className="text-gray-400 italic py-4 text-center">No action log recorded.</p>
              ) : (
                historyModalRequest.history.map((h, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                    <div className="flex items-center justify-between text-gray-500 text-[10px]">
                      <span className="font-bold uppercase tracking-wider text-[#0f3e26]">
                        {h.actor_type || 'system'}
                      </span>
                      <span>{format(new Date(h.timestamp), 'MMM d, yyyy · h:mm a')}</span>
                    </div>
                    <p className="font-bold text-gray-900 capitalize">
                      Action: {h.action?.replace(/_/g, ' ')}
                    </p>
                    {h.notes && (
                      <p className="text-gray-600 bg-white p-2 rounded-lg border border-gray-100 text-[11px]">
                        {h.notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 text-right border-t border-gray-100">
              <button
                onClick={() => setHistoryModalRequest(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl"
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
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
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
