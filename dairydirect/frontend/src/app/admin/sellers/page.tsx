"use client";

import React, { useState, useEffect } from 'react';
import {
  Store,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  History,
  AlertCircle,
  Eye,
  ArrowRight,
  IndianRupee,
  Layers,
  FileText,
  BadgeAlert,
  Ban,
  Check,
  Loader2,
  Lock,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import {
  getAdminSellersList,
  getSellerLifecycleDetails,
  executeSellerLifecycleAction,
  getSellerLifecycleMetadata,
  SellerLifecycleRecord,
  SellerStatusHistoryItem,
} from '@/lib/api/sellers';

// Status filter options required by specification
const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'active', label: 'Active' },
  { id: 'under_review', label: 'Under Review' },
  { id: 'deactivated', label: 'Deactivated' },
  { id: 'permanently_deactivated', label: 'Permanently Deactivated' },
  { id: 'reactivation_requested', label: 'Reactivation Requested' },
  { id: 'rejected', label: 'Rejected' },
];

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<SellerLifecycleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected seller drawer & history
  const [selectedSeller, setSelectedSeller] = useState<SellerLifecycleRecord | null>(null);
  const [sellerHistory, setSellerHistory] = useState<SellerStatusHistoryItem[]>([]);
  const [activeReview, setActiveReview] = useState<SellerStatusHistoryItem | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Action modal state
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<string>('');
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [reviewDuration, setReviewDuration] = useState('7');
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Metadata
  const [metadata, setMetadata] = useState<{
    reviewReasons: string[];
    deactivationReasons: string[];
    validTransitions: Record<string, string[]>;
  }>({
    reviewReasons: [],
    deactivationReasons: [],
    validTransitions: {},
  });

  // Load metadata once
  useEffect(() => {
    getSellerLifecycleMetadata().then(setMetadata);
  }, []);

  // Load sellers list
  const loadSellers = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminSellersList(selectedStatus === 'all' ? undefined : selectedStatus);
      setSellers(data);
      // If a seller is already selected, refresh their record
      if (selectedSeller) {
        const updated = data.find((s) => s.id === selectedSeller.id);
        if (updated) setSelectedSeller(updated);
        else if (data.length > 0) handleSelectSeller(data[0]);
        else setSelectedSeller(null);
      } else if (data.length > 0) {
        handleSelectSeller(data[0]);
      }
    } catch (err) {
      console.error('Failed to load sellers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSellers();
  }, [selectedStatus]);

  // Load detailed seller history when selected
  const handleSelectSeller = async (seller: SellerLifecycleRecord) => {
    setSelectedSeller(seller);
    setIsLoadingDetails(true);
    try {
      const details = await getSellerLifecycleDetails(seller.id);
      setSelectedSeller(details.seller);
      setSellerHistory(details.history || []);
      setActiveReview(details.activeReview || null);
    } catch (err) {
      console.error('Failed to load seller details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Open action modal
  const openActionModal = (action: string) => {
    setModalAction(action);
    setActionReason('');
    setActionNotes('');
    setReviewDuration('7');
    setCustomStartDate(new Date().toISOString().split('T')[0]);
    setCustomEndDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    setActionMessage(null);
    setActionModalOpen(true);
  };

  // Submit lifecycle action
  const handleExecuteAction = async () => {
    if (!selectedSeller) return;
    setIsSubmitting(true);
    setActionMessage(null);

    try {
      const payload: any = {
        sellerId: selectedSeller.id,
        action: modalAction,
        reason: actionReason,
        notes: actionNotes,
      };

      if (modalAction === 'start_temporary_review') {
        payload.duration = reviewDuration;
        if (reviewDuration === 'custom') {
          payload.customStartDate = new Date(customStartDate).toISOString();
          payload.customEndDate = new Date(customEndDate).toISOString();
        }
      } else if (modalAction === 'extend_review') {
        payload.duration = reviewDuration;
        if (reviewDuration === 'custom') {
          payload.customEndDate = new Date(customEndDate).toISOString();
        }
      }

      const res = await executeSellerLifecycleAction(payload);
      setActionMessage({ type: 'success', text: res.message || 'Action executed successfully' });

      // Refresh seller details & list
      await loadSellers();
      if (selectedSeller) {
        const details = await getSellerLifecycleDetails(selectedSeller.id);
        setSelectedSeller(details.seller);
        setSellerHistory(details.history || []);
        setActiveReview(details.activeReview || null);
      }

      setTimeout(() => {
        setActionModalOpen(false);
        setActionMessage(null);
      }, 1500);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Operation failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter sellers by search query
  const filteredSellers = sellers.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.store_name?.toLowerCase().includes(q) ||
      s.slug?.toLowerCase().includes(q) ||
      s.state?.toLowerCase().includes(q) ||
      s.profiles?.name?.toLowerCase().includes(q) ||
      s.profiles?.email?.toLowerCase().includes(q) ||
      s.profiles?.phone?.includes(q) ||
      s.status?.toLowerCase().includes(q)
    );
  });

  // KPI Metrics
  const activeCount = sellers.filter((s) => s.status === 'active').length;
  const underReviewCount = sellers.filter((s) => s.status === 'under_review').length;
  const deactivatedCount = sellers.filter((s) => s.status === 'deactivated').length;
  const permanentCount = sellers.filter((s) => s.status === 'permanently_deactivated').length;
  const reactivationRequestedCount = sellers.filter((s) => s.status === 'reactivation_requested').length;

  // Status Badge Component (Edit #22: High-contrast, semantic colors)
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            Active
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            Under Review
          </span>
        );
      case 'deactivated':
        return (
<<<<<<< HEAD
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-red-900 border border-red-200 dark:bg-red-950/30 dark:text-red-300">
            <Ban className="w-3.5 h-3.5 text-red-600" />
=======
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-red-100 text-danger border border-red-200">
            <Ban className="w-3.5 h-3.5 text-danger" />
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
            Deactivated
          </span>
        );
      case 'permanently_deactivated':
        return (
<<<<<<< HEAD
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-900 border border-red-300 dark:bg-red-950/50 dark:text-red-300">
            <Lock className="w-3.5 h-3.5 text-red-700" />
=======
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-gray-900 text-danger border border-gray-700">
            <Lock className="w-3.5 h-3.5 text-danger" />
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
            Permanently Deactivated
          </span>
        );
      case 'reactivation_requested':
        return (
<<<<<<< HEAD
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950/40 dark:text-blue-300">
            <BadgeAlert className="w-3.5 h-3.5 text-blue-700" />
=======
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-100 text-info border border-blue-300">
            <BadgeAlert className="w-3.5 h-3.5 text-info" />
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
            Reactivation Requested
          </span>
        );
      case 'pending':
      case 'pending_kyc':
      case 'pending_inquiry':
        return (
<<<<<<< HEAD
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
=======
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-yellow-100 text-warning border border-yellow-200">
            <Clock className="w-3.5 h-3.5 text-warning" />
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
            Pending Onboarding
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300">
            <XCircle className="w-3.5 h-3.5 text-zinc-600" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-surface-muted text-foreground border border-border">
            {status}
          </span>
        );
    }
  };

  // Helper: Review time remaining
  const getReviewTimeRemaining = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Review period expired';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h remaining`;
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m remaining`;
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Standard Admin Header */}
      <AdminHeader
        title={
          <div className="flex items-center gap-3">
            <span>Seller Lifecycle Management</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-success-bg text-success">
              Admin Control
            </span>
          </div>
        }
        subtitle="Supervise seller operational lifecycle states, manage review periods, and process reactivation requests"
        onRefresh={loadSellers}
        isRefreshing={isLoading}
      />

<<<<<<< HEAD
      <div className="px-6 md:px-10 py-6 space-y-6">
=======
        <button
          onClick={loadSellers}
          disabled={isLoading}
          className="self-start md:self-auto px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-primary' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-surface p-4 rounded-2xl border border-border shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Active Sellers</p>
          <p className="text-2xl font-semibold text-success mt-1">{activeCount}</p>
        </div>
        <div className="bg-surface p-4 rounded-2xl border border-warning/20 shadow-2xs bg-warning-bg/20">
          <p className="text-xs font-semibold uppercase tracking-wider text-warning">Under Review</p>
          <p className="text-2xl font-semibold text-warning mt-1">{underReviewCount}</p>
        </div>
<<<<<<< HEAD
        <div className="bg-surface p-4 rounded-2xl border border-info/20 shadow-2xs bg-info-bg/20">
          <p className="text-xs font-semibold uppercase tracking-wider text-info">Reactivation Requested</p>
          <p className="text-2xl font-semibold text-info mt-1">{reactivationRequestedCount}</p>
        </div>
        <div className="bg-surface p-4 rounded-2xl border border-error/20 shadow-2xs bg-error-bg/20">
          <p className="text-xs font-semibold uppercase tracking-wider text-error">Deactivated</p>
          <p className="text-2xl font-semibold text-error mt-1">{deactivatedCount}</p>
        </div>
        <div className="bg-red-50/70 p-4 rounded-2xl border border-red-200/80 shadow-2xs text-red-900">
          <p className="text-xs font-bold uppercase tracking-wider text-red-800/80">Permanently Banned</p>
          <p className="text-2xl font-bold text-red-800 mt-1">{permanentCount}</p>
=======
        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs bg-blue-50/20">
          <p className="text-[10px] font-black uppercase tracking-wider text-info">Reactivation Requested</p>
          <p className="text-2xl font-black text-info mt-1">{reactivationRequestedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-red-200 shadow-2xs bg-red-50/20">
          <p className="text-[10px] font-black uppercase tracking-wider text-danger">Deactivated</p>
          <p className="text-2xl font-black text-danger mt-1">{deactivatedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-700 shadow-2xs bg-gray-900 text-white">
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Permanently Banned</p>
          <p className="text-2xl font-black text-danger mt-1">{permanentCount}</p>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
        </div>
      </div>

      {/* Status Filter Tabs (Edit #22 & #24: Standard h-8 pill styling) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {STATUS_FILTERS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedStatus(tab.id)}
            className={`h-8 px-3.5 text-xs font-bold rounded-full whitespace-nowrap transition-all cursor-pointer flex items-center justify-center border ${
              selectedStatus === tab.id
<<<<<<< HEAD
                ? 'bg-primary text-white border-primary shadow-xs'
                : 'bg-surface border-border/80 text-foreground-muted hover:text-foreground hover:border-border-hover'
=======
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Layout: List on Left, Detail & Actions Drawer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-6">
        
        {/* Left: Sellers Table & Search */}
        <div className="bg-surface rounded-2xl border border-border shadow-2xs overflow-hidden flex flex-col">
          {/* Search bar with crisp border and standard h-10 height */}
          <div className="p-3.5 border-b border-border bg-surface-muted/30">
            <div className="relative">
              <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by store name, slug, owner, state, status..."
<<<<<<< HEAD
                className="w-full pl-9 pr-4 h-10 bg-surface rounded-xl border border-border/90 text-xs text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-2xs"
=======
                className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-gray-200 text-xs text-gray-900 focus:border-primary outline-none"
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
              />
            </div>
          </div>

          {/* List items */}
          <div className="divide-y divide-border overflow-y-auto max-h-[700px]">
            {isLoading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
<<<<<<< HEAD
                <p className="text-xs text-foreground-muted mt-2">Loading sellers...</p>
=======
                <p className="text-xs text-gray-500 mt-2">Loading sellers...</p>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
              </div>
            ) : filteredSellers.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Store className="w-8 h-8 text-foreground-muted mx-auto" />
                <p className="text-sm font-bold text-foreground">No sellers found</p>
                <p className="text-xs text-foreground-muted">Try changing status filter or search query</p>
              </div>
            ) : (
              filteredSellers.map((seller) => {
                const isSelected = selectedSeller?.id === seller.id;
                const hasReviewExpiry = seller.status === 'under_review' && seller.review_expires_at;

                return (
                  <div
                    key={seller.id}
                    onClick={() => handleSelectSeller(seller)}
                    className={`p-4 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
<<<<<<< HEAD
                        ? 'bg-surface-muted border-l-4 border-l-primary shadow-2xs font-medium'
                        : 'hover:bg-surface-muted/60 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
=======
                        ? 'bg-emerald-50/60 border-l-4 border-l-primary'
                        : 'hover:bg-gray-50/80 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center font-bold text-sm shrink-0">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                        {seller.store_name?.charAt(0) || 'S'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {seller.store_name}
                          </p>
                          <span className="text-xs text-foreground-muted font-mono">
                            /{seller.slug}
                          </span>
                        </div>
                        <p className="text-xs text-foreground-muted truncate mt-0.5">
                          {seller.profiles?.name ? `${seller.profiles.name} • ` : ''}
                          {seller.state} • Total Sales: ₹{(Number(seller.total_sales) || 0).toLocaleString('en-IN')}
                        </p>

                        {/* Review expiry countdown banner if applicable */}
                        {hasReviewExpiry && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-warning bg-warning-bg px-2 py-0.5 rounded-md border border-warning/20 w-fit">
                            <Clock className="w-3 h-3 text-warning" />
                            <span>{getReviewTimeRemaining(seller.review_expires_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {getStatusBadge(seller.status)}
                      <ChevronRight className="w-4 h-4 text-foreground-muted" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Seller Details, Lifecycle Controls & History Drawer */}
        <div className="space-y-6">
          {selectedSeller ? (
            <div className="bg-surface rounded-2xl border border-border shadow-2xs overflow-hidden p-6 space-y-6">
              
              {/* Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Seller Record</span>
                  <h2 className="text-xl font-semibold text-foreground mt-0.5">{selectedSeller.store_name}</h2>
                  <p className="text-xs text-foreground-muted font-mono mt-0.5">ID: {selectedSeller.id}</p>
                </div>
                <div className="text-right">
                  {getStatusBadge(selectedSeller.status)}
                </div>
              </div>

              {/* Status Specific Alerts */}
              {selectedSeller.status === 'under_review' && (
                <div className="bg-warning-bg border border-warning/20 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-warning font-bold">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <span>Account Is Currently Under Review</span>
                  </div>
                  {selectedSeller.review_reason && (
                    <p className="text-warning">
                      <strong>Reason:</strong> {selectedSeller.review_reason}
                    </p>
                  )}
                  {selectedSeller.review_expires_at && (
                    <div className="pt-1 flex items-center justify-between text-warning font-bold border-t border-warning/20/60">
                      <span>Temporary Review Expiry:</span>
                      <span className="font-mono">
                        {new Date(selectedSeller.review_expires_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}{' '}
                        ({getReviewTimeRemaining(selectedSeller.review_expires_at)})
                      </span>
                    </div>
                  )}
                </div>
              )}

              {selectedSeller.status === 'reactivation_requested' && (
<<<<<<< HEAD
                <div className="bg-info-bg border border-info/20 rounded-xl p-4 space-y-2 text-xs text-blue-900">
                  <div className="flex items-center gap-2 font-bold text-blue-900">
=======
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2 text-xs text-info">
                  <div className="flex items-center gap-2 font-bold text-info">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                    <BadgeAlert className="w-4 h-4 text-info" />
                    <span>Seller Requested Reactivation</span>
                  </div>
                  <p>
                    <strong>Reason submitted:</strong> {selectedSeller.reactivation_reason || 'Reactivation request'}
                  </p>
                </div>
              )}

              {selectedSeller.status === 'deactivated' && (
<<<<<<< HEAD
                <div className="bg-error-bg border border-error/20 rounded-xl p-4 space-y-2 text-xs text-red-900">
                  <div className="flex items-center gap-2 font-bold text-red-900">
                    <Ban className="w-4 h-4 text-error" />
=======
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2 text-xs text-danger">
                  <div className="flex items-center gap-2 font-bold text-danger">
                    <Ban className="w-4 h-4 text-danger" />
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                    <span>Account Is Deactivated</span>
                  </div>
                  {selectedSeller.deactivation_reason && (
                    <p>
                      <strong>Deactivation reason:</strong> {selectedSeller.deactivation_reason}
                    </p>
                  )}
<<<<<<< HEAD
                  <p className="text-xs text-error">
=======
                  <p className="text-[11px] text-danger">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                    Seller is blocked from creating, editing, and deleting products. Seller can submit a reactivation request.
                  </p>
                </div>
              )}

              {selectedSeller.status === 'permanently_deactivated' && (
<<<<<<< HEAD
                <div className="bg-red-50/80 border border-red-200 text-red-900 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-red-900">
                    <Lock className="w-4 h-4 text-red-700" />
                    <span>Permanently Deactivated (Terminal State)</span>
=======
                <div className="bg-gray-900 text-white rounded-xl p-4 space-y-2 text-xs border border-red-500/40">
                  <div className="flex items-center gap-2 font-bold text-danger">
                    <Lock className="w-4 h-4 text-danger" />
                    <span>Permanently Deactivated (Terminal)</span>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                  </div>
                  {selectedSeller.deactivation_reason && (
                    <p className="text-red-800">
                      <strong>Reason:</strong> {selectedSeller.deactivation_reason}
                    </p>
                  )}
                  <p className="text-xs text-red-700">
                    This account is permanently deactivated. No further status transitions or product listings are permitted.
                  </p>
                </div>
              )}

              {/* Action Buttons Toolbar */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Lifecycle Actions</p>
                
                {/* 1. Put Under Review (from active or suspended) */}
                {(selectedSeller.status === 'active' || selectedSeller.status === 'suspended') && (
                  <button
                    onClick={() => openActionModal('put_under_review')}
                    className="w-full px-4 py-2.5 bg-warning-bg hover:bg-warning-bg border border-warning text-warning text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Clock className="w-4 h-4 text-warning" />
                    <span>Place Under Review</span>
                  </button>
                )}

                {/* 2. Under Review Actions */}
                {selectedSeller.status === 'under_review' && (
                  <div className="space-y-2">
                    <button
                      onClick={() => openActionModal('keep_active')}
                      className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Keep Active / Complete Review (Restore)</span>
                    </button>

                    <button
                      onClick={() => openActionModal('start_temporary_review')}
                      className="w-full px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Calendar className="w-4 h-4 text-amber-700" />
                      <span>{selectedSeller.review_expires_at ? 'Set / Update Temporary Review Period' : 'Start Temporary Review Period'}</span>
                    </button>

                    {selectedSeller.review_expires_at && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => openActionModal('extend_review')}
                          className="px-3 py-2 bg-surface-muted hover:bg-border border border-border text-foreground text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5 text-foreground-muted" />
                          <span>Extend Review</span>
                        </button>
                        <button
                          onClick={() => openActionModal('end_review')}
                          className="px-3 py-2 bg-surface-muted hover:bg-border border border-border text-foreground text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5 text-foreground-muted" />
                          <span>End Review Early</span>
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => openActionModal('deactivate')}
<<<<<<< HEAD
                      className="w-full px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
=======
                      className="w-full px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-danger text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                    >
                      <Ban className="w-4 h-4 text-danger" />
                      <span>Deactivate Seller</span>
                    </button>
                  </div>
                )}

                {/* 3. Reactivation Requested Actions */}
                {selectedSeller.status === 'reactivation_requested' && (
                  <div className="space-y-2">
                    <button
                      onClick={() => openActionModal('approve_reactivation')}
                      className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Reactivation (Restore to Active)</span>
                    </button>
                    <button
                      onClick={() => openActionModal('reject_reactivation')}
<<<<<<< HEAD
                      className="w-full px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
=======
                      className="w-full px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-danger text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                    >
                      <XCircle className="w-4 h-4 text-danger" />
                      <span>Reject Reactivation (Remain Deactivated)</span>
                    </button>
                  </div>
                )}

                {/* 4. Deactivated Actions */}
                {selectedSeller.status === 'deactivated' && (
                  <div className="p-3 bg-surface-muted border border-border rounded-xl text-center text-xs text-foreground-muted space-y-1">
                    <p className="font-bold text-foreground">Awaiting Reactivation Request</p>
                    <p className="text-xs">
                      Per policy, deactivated sellers must submit a reactivation request from their portal before admin can approve reactivation.
                    </p>
                  </div>
                )}

                {/* 5. Permanent Deactivation Action (High impact destructive button) */}
                {selectedSeller.status !== 'permanently_deactivated' && (
                  <button
                    onClick={() => openActionModal('permanently_deactivate')}
<<<<<<< HEAD
                    className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer mt-2"
                  >
                    <Lock className="w-3.5 h-3.5" />
=======
                    className="w-full px-4 py-2 bg-gray-900 hover:bg-black text-danger text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer mt-2"
                  >
                    <Lock className="w-3.5 h-3.5 text-danger" />
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                    <span>Permanently Deactivate (Irreversible)</span>
                  </button>
                )}
              </div>

              {/* Status History / Audit Trail */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-foreground-muted" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">Status History & Audit Trail</h3>
                  </div>
                  <span className="text-xs text-foreground-muted">{sellerHistory.length} events</span>
                </div>

                {isLoadingDetails ? (
                  <div className="py-6 text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-foreground-muted mx-auto" />
                  </div>
                ) : sellerHistory.length === 0 ? (
                  <p className="text-xs text-foreground-muted text-center py-4">No status transition history recorded yet.</p>
                ) : (
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 divide-y divide-border">
                    {sellerHistory.map((item) => (
                      <div key={item.id} className="pt-2 text-xs space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-foreground capitalize">
                            {item.action?.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-foreground-muted font-mono">
                            {new Date(item.changed_at).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {item.reason && (
                          <p className="text-xs text-foreground-muted">
                            <strong>Reason:</strong> {item.reason}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-xs text-foreground-muted italic">
                            "{item.notes}"
                          </p>
                        )}
                        {item.review_expires_at && (
                          <p className="text-xs font-mono text-warning">
                            Expires: {new Date(item.review_expires_at).toLocaleDateString('en-IN')}
                          </p>
                        )}
                        <p className="text-xs text-foreground-muted">
                          Changed by: {item.profiles?.name || item.profiles?.email || 'Admin'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-surface rounded-2xl border border-border p-12 text-center space-y-3">
              <Store className="w-10 h-10 text-foreground-muted mx-auto" />
              <p className="text-sm font-bold text-foreground">Select a Seller</p>
              <p className="text-xs text-foreground-muted max-w-xs mx-auto">
                Click on any seller from the list to view their status history, manage review periods, or execute lifecycle transitions.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Action Execution Modal */}
      {actionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-xl animate-in fade-in">
            
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold text-foreground capitalize">
                  {modalAction.replace(/_/g, ' ')}
                </h3>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Target: <strong>{selectedSeller?.store_name}</strong>
                </p>
              </div>
              <button
                onClick={() => setActionModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-muted text-foreground-muted hover:bg-border flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Error or Success notification */}
            {actionMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  actionMessage.type === 'success'
<<<<<<< HEAD
                    ? 'bg-success-bg text-success border border-success/20'
                    : 'bg-error-bg text-error border border-error/20'
=======
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-danger border border-red-200'
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                }`}
              >
                {actionMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                ) : (
<<<<<<< HEAD
                  <AlertCircle className="w-4 h-4 text-error shrink-0" />
=======
                  <AlertCircle className="w-4 h-4 text-danger shrink-0" />
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                )}
                <span>{actionMessage.text}</span>
              </div>
            )}

            {/* Form Fields based on Action */}
            <div className="space-y-4 text-xs">
              
              {/* Reason Selector / Input */}
              <div>
<<<<<<< HEAD
                <label className="block font-bold text-foreground mb-1.5">
                  Reason <span className="text-red-500">*</span>
=======
                <label className="block font-bold text-gray-700 mb-1.5">
                  Reason <span className="text-danger">*</span>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                </label>
                {modalAction.includes('review') ? (
                  <div className="space-y-2">
                    <select
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
<<<<<<< HEAD
                      className="w-full p-2.5 bg-surface-muted border border-border rounded-xl text-xs font-medium text-foreground outline-none focus:border-primary"
=======
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-primary"
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                    >
                      <option value="">Select predefined reason...</option>
                      {metadata.reviewReasons.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Or specify custom reason..."
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
<<<<<<< HEAD
                      className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs text-foreground outline-none focus:border-primary"
=======
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-primary"
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                    />
                  </div>
                ) : modalAction.includes('deactivate') ? (
                  <div className="space-y-2">
                    <select
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
<<<<<<< HEAD
                      className="w-full p-2.5 bg-surface-muted border border-border rounded-xl text-xs font-medium text-foreground outline-none focus:border-primary"
=======
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-primary"
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                    >
                      <option value="">Select deactivation reason...</option>
                      {metadata.deactivationReasons.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Or specify custom deactivation reason..."
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
<<<<<<< HEAD
                      className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs text-foreground outline-none focus:border-primary"
=======
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-primary"
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Enter reason..."
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
<<<<<<< HEAD
                    className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs text-foreground outline-none focus:border-primary"
=======
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-primary"
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                  />
                )}
              </div>

              {/* Temporary Review Duration (1 day, 7 days, 14 days, 30 days, or custom) */}
              {(modalAction === 'start_temporary_review' || modalAction === 'extend_review') && (
<<<<<<< HEAD
                <div className="space-y-3 bg-surface-muted p-4 rounded-2xl border border-border">
                  <label className="block font-bold text-foreground">
                    Review Duration Period <span className="text-red-500">*</span>
=======
                <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <label className="block font-bold text-gray-800">
                    Review Duration Period <span className="text-danger">*</span>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {[
                      { id: '1', label: '1 Day' },
                      { id: '7', label: '7 Days' },
                      { id: '14', label: '14 Days' },
                      { id: '30', label: '30 Days' },
                      { id: 'custom', label: 'Custom' },
                    ].map((opt) => (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setReviewDuration(opt.id)}
                        className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-colors cursor-pointer ${
                          reviewDuration === opt.id
                            ? 'bg-primary text-white border-primary'
<<<<<<< HEAD
                            : 'bg-surface text-foreground border-border hover:border-border-hover'
=======
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {reviewDuration === 'custom' && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {modalAction === 'start_temporary_review' && (
                        <div>
                          <label className="block text-xs font-bold text-foreground-muted mb-1">Start Date</label>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
<<<<<<< HEAD
                            className="w-full p-2 bg-surface border border-border rounded-xl text-xs text-foreground outline-none"
=======
                            className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-primary"
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-bold text-foreground-muted mb-1">End Date</label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
<<<<<<< HEAD
                          className="w-full p-2 bg-surface border border-border rounded-xl text-xs text-foreground outline-none"
=======
                          className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-primary"
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Internal Notes */}
              <div>
                <label className="block font-bold text-foreground mb-1">Internal Notes (Optional)</label>
                <textarea
                  rows={3}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Additional notes for audit history..."
<<<<<<< HEAD
                  className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs text-foreground outline-none focus:border-primary"
=======
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-primary"
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                />
              </div>

              {/* Warning for permanent deactivation */}
              {modalAction === 'permanently_deactivate' && (
<<<<<<< HEAD
                <div className="p-3 bg-error-bg border border-error/20 rounded-xl text-xs text-error font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-error shrink-0" />
=======
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-danger font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                  <span>Warning: Permanent deactivation cannot be reversed. The seller will never be able to reactivate.</span>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setActionModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-surface-muted hover:bg-border text-foreground text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={isSubmitting || !actionReason.trim()}
                className={`px-5 py-2.5 text-xs font-bold rounded-xl text-white shadow-sm flex items-center gap-2 transition-all cursor-pointer ${
                  modalAction === 'permanently_deactivate'
                    ? 'bg-red-700 hover:bg-red-800'
                    : 'bg-primary hover:bg-primary-hover'
                } ${isSubmitting || !actionReason.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm & Apply</span>
              </button>
            </div>

          </div>
        </div>
      )}

      </div>
    </div>
  );
}
