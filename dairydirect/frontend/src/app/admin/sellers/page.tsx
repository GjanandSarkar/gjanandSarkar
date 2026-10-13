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

  // Status Badge Component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Active
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            Under Review
          </span>
        );
      case 'deactivated':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
            <Ban className="w-3.5 h-3.5 text-red-600" />
            Deactivated
          </span>
        );
      case 'permanently_deactivated':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-gray-900 text-red-400 border border-gray-700">
            <Lock className="w-3.5 h-3.5 text-red-400" />
            Permanently Deactivated
          </span>
        );
      case 'reactivation_requested':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300">
            <BadgeAlert className="w-3.5 h-3.5 text-blue-600" />
            Reactivation Requested
          </span>
        );
      case 'pending':
      case 'pending_kyc':
      case 'pending_inquiry':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-yellow-100 text-yellow-800 border border-yellow-200">
            <Clock className="w-3.5 h-3.5 text-yellow-600" />
            Pending Onboarding
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-300">
            <XCircle className="w-3.5 h-3.5 text-gray-500" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-gray-100 text-gray-800">
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Seller Lifecycle Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
              Admin Control
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Supervise seller operational lifecycle states, manage temporary review periods, process deactivations and review reactivation requests.
          </p>
        </div>

        <button
          onClick={loadSellers}
          disabled={isLoading}
          className="self-start md:self-auto px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#0f3e26]' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Active Sellers</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs bg-amber-50/20">
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Under Review</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{underReviewCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs bg-blue-50/20">
          <p className="text-[10px] font-black uppercase tracking-wider text-blue-700">Reactivation Requested</p>
          <p className="text-2xl font-black text-blue-700 mt-1">{reactivationRequestedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-red-200 shadow-2xs bg-red-50/20">
          <p className="text-[10px] font-black uppercase tracking-wider text-red-700">Deactivated</p>
          <p className="text-2xl font-black text-red-700 mt-1">{deactivatedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-700 shadow-2xs bg-gray-900 text-white">
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Permanently Banned</p>
          <p className="text-2xl font-black text-red-400 mt-1">{permanentCount}</p>
        </div>
      </div>

      {/* Status Filter Tabs (Required by prompt: All, Pending, Active, Under Review, Deactivated, Permanently Deactivated, Reactivation Requested, Rejected) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {STATUS_FILTERS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedStatus(tab.id)}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              selectedStatus === tab.id
                ? 'bg-[#0f3e26] text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Layout: List on Left, Detail & Actions Drawer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-6">
        
        {/* Left: Sellers Table & Search */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden flex flex-col">
          {/* Search bar */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by store name, slug, owner, state, status..."
                className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-gray-200 text-xs text-gray-900 focus:border-[#0f3e26] outline-none"
              />
            </div>
          </div>

          {/* List items */}
          <div className="divide-y divide-gray-100 overflow-y-auto max-h-[700px]">
            {isLoading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#0f3e26] mx-auto" />
                <p className="text-xs text-gray-500 mt-2">Loading sellers...</p>
              </div>
            ) : filteredSellers.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Store className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-sm font-bold text-gray-800">No sellers found</p>
                <p className="text-xs text-gray-500">Try changing status filter or search query</p>
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
                        ? 'bg-emerald-50/60 border-l-4 border-l-[#0f3e26]'
                        : 'hover:bg-gray-50/80 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#0f3e26]/10 text-[#0f3e26] flex items-center justify-center font-bold text-sm shrink-0">
                        {seller.store_name?.charAt(0) || 'S'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black text-gray-900 truncate">
                            {seller.store_name}
                          </p>
                          <span className="text-[10px] text-gray-400 font-mono">
                            /{seller.slug}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">
                          {seller.profiles?.name ? `${seller.profiles.name} • ` : ''}
                          {seller.state} • Total Sales: ₹{(Number(seller.total_sales) || 0).toLocaleString('en-IN')}
                        </p>

                        {/* Review expiry countdown banner if applicable */}
                        {hasReviewExpiry && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 w-fit">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>{getReviewTimeRemaining(seller.review_expires_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {getStatusBadge(seller.status)}
                      <ChevronRight className="w-4 h-4 text-gray-400" />
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
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden p-6 space-y-6">
              
              {/* Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Seller Record</span>
                  <h2 className="text-xl font-black text-gray-900 mt-0.5">{selectedSeller.store_name}</h2>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {selectedSeller.id}</p>
                </div>
                <div className="text-right">
                  {getStatusBadge(selectedSeller.status)}
                </div>
              </div>

              {/* Status Specific Alerts */}
              {selectedSeller.status === 'under_review' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Account Is Currently Under Review</span>
                  </div>
                  {selectedSeller.review_reason && (
                    <p className="text-amber-800">
                      <strong>Reason:</strong> {selectedSeller.review_reason}
                    </p>
                  )}
                  {selectedSeller.review_expires_at && (
                    <div className="pt-1 flex items-center justify-between text-amber-900 font-bold border-t border-amber-200/60">
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
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2 text-xs text-blue-900">
                  <div className="flex items-center gap-2 font-bold text-blue-900">
                    <BadgeAlert className="w-4 h-4 text-blue-600" />
                    <span>Seller Requested Reactivation</span>
                  </div>
                  <p>
                    <strong>Reason submitted:</strong> {selectedSeller.reactivation_reason || 'Reactivation request'}
                  </p>
                </div>
              )}

              {selectedSeller.status === 'deactivated' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2 text-xs text-red-900">
                  <div className="flex items-center gap-2 font-bold text-red-900">
                    <Ban className="w-4 h-4 text-red-600" />
                    <span>Account Is Deactivated</span>
                  </div>
                  {selectedSeller.deactivation_reason && (
                    <p>
                      <strong>Deactivation reason:</strong> {selectedSeller.deactivation_reason}
                    </p>
                  )}
                  <p className="text-[11px] text-red-700">
                    Seller is blocked from creating, editing, and deleting products. Seller can submit a reactivation request.
                  </p>
                </div>
              )}

              {selectedSeller.status === 'permanently_deactivated' && (
                <div className="bg-gray-900 text-white rounded-xl p-4 space-y-2 text-xs border border-red-500/40">
                  <div className="flex items-center gap-2 font-bold text-red-400">
                    <Lock className="w-4 h-4 text-red-400" />
                    <span>Permanently Deactivated (Terminal)</span>
                  </div>
                  {selectedSeller.deactivation_reason && (
                    <p className="text-gray-300">
                      <strong>Reason:</strong> {selectedSeller.deactivation_reason}
                    </p>
                  )}
                  <p className="text-[11px] text-gray-400">
                    This account is permanently banned. No further status transitions or reactivation requests are allowed.
                  </p>
                </div>
              )}

              {/* Action Buttons Toolbar */}
              <div className="space-y-2 pt-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Lifecycle Actions</p>
                
                {/* 1. Put Under Review (from active or suspended) */}
                {(selectedSeller.status === 'active' || selectedSeller.status === 'suspended') && (
                  <button
                    onClick={() => openActionModal('put_under_review')}
                    className="w-full px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span>Place Under Review</span>
                  </button>
                )}

                {/* 2. Under Review Actions */}
                {selectedSeller.status === 'under_review' && (
                  <div className="space-y-2">
                    <button
                      onClick={() => openActionModal('keep_active')}
                      className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
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
                          className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5 text-gray-600" />
                          <span>Extend Review</span>
                        </button>
                        <button
                          onClick={() => openActionModal('end_review')}
                          className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5 text-gray-600" />
                          <span>End Review Early</span>
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => openActionModal('deactivate')}
                      className="w-full px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Ban className="w-4 h-4 text-red-600" />
                      <span>Deactivate Seller</span>
                    </button>
                  </div>
                )}

                {/* 3. Reactivation Requested Actions */}
                {selectedSeller.status === 'reactivation_requested' && (
                  <div className="space-y-2">
                    <button
                      onClick={() => openActionModal('approve_reactivation')}
                      className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Reactivation (Restore to Active)</span>
                    </button>
                    <button
                      onClick={() => openActionModal('reject_reactivation')}
                      className="w-full px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>Reject Reactivation (Remain Deactivated)</span>
                    </button>
                  </div>
                )}

                {/* 4. Deactivated Actions */}
                {selectedSeller.status === 'deactivated' && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-xs text-gray-600 space-y-1">
                    <p className="font-bold text-gray-800">Awaiting Reactivation Request</p>
                    <p className="text-[11px]">
                      Per policy, deactivated sellers must submit a reactivation request from their portal before admin can approve reactivation.
                    </p>
                  </div>
                )}

                {/* 5. Permanent Deactivation Action (Available for non-permanently deactivated) */}
                {selectedSeller.status !== 'permanently_deactivated' && (
                  <button
                    onClick={() => openActionModal('permanently_deactivate')}
                    className="w-full px-4 py-2 bg-gray-900 hover:bg-black text-red-400 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer mt-2"
                  >
                    <Lock className="w-3.5 h-3.5 text-red-400" />
                    <span>Permanently Deactivate (Irreversible)</span>
                  </button>
                )}
              </div>

              {/* Status History / Audit Trail */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-gray-500" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-700">Status History & Audit Trail</h3>
                  </div>
                  <span className="text-[10px] text-gray-400">{sellerHistory.length} events</span>
                </div>

                {isLoadingDetails ? (
                  <div className="py-6 text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400 mx-auto" />
                  </div>
                ) : sellerHistory.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No status transition history recorded yet.</p>
                ) : (
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 divide-y divide-gray-50">
                    {sellerHistory.map((item) => (
                      <div key={item.id} className="pt-2 text-xs space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-gray-800 capitalize">
                            {item.action?.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {new Date(item.changed_at).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {item.reason && (
                          <p className="text-[11px] text-gray-600">
                            <strong>Reason:</strong> {item.reason}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-[11px] text-gray-500 italic">
                            "{item.notes}"
                          </p>
                        )}
                        {item.review_expires_at && (
                          <p className="text-[10px] font-mono text-amber-700">
                            Expires: {new Date(item.review_expires_at).toLocaleDateString('en-IN')}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400">
                          Changed by: {item.profiles?.name || item.profiles?.email || 'Admin'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
              <Store className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm font-bold text-gray-800">Select a Seller</p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Click on any seller from the list to view their status history, manage review periods, or execute lifecycle transitions.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Action Execution Modal */}
      {actionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-xl animate-in fade-in">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-black text-gray-900 capitalize">
                  {modalAction.replace(/_/g, ' ')}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Target: <strong>{selectedSeller?.store_name}</strong>
                </p>
              </div>
              <button
                onClick={() => setActionModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Error or Success notification */}
            {actionMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  actionMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {actionMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{actionMessage.text}</span>
              </div>
            )}

            {/* Form Fields based on Action */}
            <div className="space-y-4 text-xs">
              
              {/* Reason Selector / Input */}
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">
                  Reason <span className="text-red-500">*</span>
                </label>
                {modalAction.includes('review') ? (
                  <div className="space-y-2">
                    <select
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-[#0f3e26]"
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
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-[#0f3e26]"
                    />
                  </div>
                ) : modalAction.includes('deactivate') ? (
                  <div className="space-y-2">
                    <select
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-[#0f3e26]"
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
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-[#0f3e26]"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Enter reason..."
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-[#0f3e26]"
                  />
                )}
              </div>

              {/* Temporary Review Duration (1 day, 7 days, 14 days, 30 days, or custom) */}
              {(modalAction === 'start_temporary_review' || modalAction === 'extend_review') && (
                <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <label className="block font-bold text-gray-800">
                    Review Duration Period <span className="text-red-500">*</span>
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
                            ? 'bg-[#0f3e26] text-white border-[#0f3e26]'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
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
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 outline-none"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1">End Date</label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Internal Notes */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Internal Notes (Optional)</label>
                <textarea
                  rows={3}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Additional notes for audit history..."
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-[#0f3e26]"
                />
              </div>

              {/* Warning for permanent deactivation */}
              {modalAction === 'permanently_deactivate' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-800 font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Warning: Permanent deactivation cannot be reversed. The seller will never be able to reactivate.</span>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActionModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
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
                    : 'bg-[#0f3e26] hover:bg-[#144f31]'
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
  );
}
