"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  PhoneCall, 
  MessageCircle, 
  Search, 
  Filter, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  Check, 
  Loader2, 
  RefreshCw,
  Award,
  FileText,
  Trash2,
  ExternalLink,
  PlusCircle,
  Radio,
  RotateCcw,
  Send
} from 'lucide-react';
import { getSellerInquiries, updateSellerInquiryStatus, deleteSellerInquiry, submitSellerInquiry, SellerInquiry } from '@/lib/api/sellers';
import { supabase } from '@/lib/supabase';

function formatRelativeTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 45) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateString;
  }
}

export default function AdminVendorInquiriesPage() {
  const [inquiries, setInquiries] = useState<SellerInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<SellerInquiry | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [newInquiryHighlightId, setNewInquiryHighlightId] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(true);
  const [showTestModal, setShowTestModal] = useState(false);
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Test modal state
  const [testForm, setTestForm] = useState({
    fullName: 'Ramesh Patel',
    businessName: 'Gir Organic Gaushala & Dairy',
    phone: '9876543210',
    email: 'ramesh@girgaushala.com',
    city: 'Junagadh',
    state: 'Gujarat',
    category: 'A2 Dairy & Vedic Ghee',
    monthlyVolume: '500 - 1,000 Liters / Units',
    gstin: '24ABCDE1234F1Z5',
    fssaiNumber: '10722001000999',
    notes: '80+ indigenous Gir cows. Authentic Vedic bilona curd-churned A2 ghee.'
  });

  const selectedInquiryRef = useRef(selectedInquiry);
  selectedInquiryRef.current = selectedInquiry;

  // Main loader function
  const loadInquiries = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const data = await getSellerInquiries(selectedStatus === 'all' ? undefined : selectedStatus);
      setInquiries(data);
      setLastSyncedAt(new Date());

      // Update currently selected inquiry if it still exists in the refreshed data
      if (selectedInquiryRef.current) {
        const matching = data.find(i => i.id === selectedInquiryRef.current?.id);
        if (matching) {
          setSelectedInquiry(matching);
          setAdminNotes(matching.admin_notes || '');
        } else if (data.length > 0) {
          setSelectedInquiry(data[0]);
          setAdminNotes(data[0].admin_notes || '');
        } else {
          setSelectedInquiry(null);
          setAdminNotes('');
        }
      } else if (data.length > 0) {
        setSelectedInquiry(data[0]);
        setAdminNotes(data[0].admin_notes || '');
      }
    } catch (err) {
      console.error('Failed to load seller inquiries:', err);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [selectedStatus]);

  // Initial load and on status filter change
  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  // Real-time Supabase Subscription + Background Polling Sync
  useEffect(() => {
    const channelName = `admin_seller_inquiries_${Math.random().toString(36).substring(2, 8)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'seller_inquiries' },
        (payload: any) => {
          console.log('[Realtime Event on seller_inquiries]:', payload.eventType, payload.new?.id || payload.old?.id);
          setIsRealtimeConnected(true);
          setLastSyncedAt(new Date());

          if (payload.eventType === 'INSERT') {
            const newInq = payload.new as SellerInquiry;
            setInquiries(prev => {
              if (prev.some(i => i.id === newInq.id)) return prev;
              return [newInq, ...prev];
            });
            setNewInquiryHighlightId(newInq.id);
            setTimeout(() => setNewInquiryHighlightId(null), 6000);
            
            // Auto select if no item currently selected
            setSelectedInquiry(curr => curr ? curr : newInq);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as SellerInquiry;
            setInquiries(prev => prev.map(i => i.id === updated.id ? { ...i, ...updated } : i));
            setSelectedInquiry(curr => curr?.id === updated.id ? { ...curr, ...updated } : curr);
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            setInquiries(prev => prev.filter(i => i.id !== deletedId));
            setSelectedInquiry(curr => {
              if (curr?.id === deletedId) {
                return null;
              }
              return curr;
            });
          }
        }
      )
      .subscribe((status: any) => {
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    // Background resilient polling (every 8 seconds) and window focus sync
    const pollInterval = setInterval(() => {
      loadInquiries(true);
    }, 8000);

    const handleWindowFocus = () => {
      loadInquiries(true);
    };

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [loadInquiries]);

  const handleSelectInquiry = (inq: SellerInquiry) => {
    setSelectedInquiry(inq);
    setAdminNotes(inq.admin_notes || '');
    setActionSuccess('');
    setActionError('');
  };

  const handleUpdateStatus = async (newStatus: 'pending' | 'contacted' | 'approved' | 'rejected') => {
    if (!selectedInquiry) return;
    setIsUpdating(true);
    setActionSuccess('');
    setActionError('');

    try {
      await updateSellerInquiryStatus(selectedInquiry.id, newStatus, adminNotes);
      
      const updatedInquiry: SellerInquiry = {
        ...selectedInquiry,
        status: newStatus,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString()
      };

      setSelectedInquiry(updatedInquiry);
      setInquiries(prev => prev.map(i => i.id === selectedInquiry.id ? updatedInquiry : i));
      setActionSuccess(`Inquiry marked as ${newStatus.toUpperCase()}`);
      setTimeout(() => setActionSuccess(''), 3500);
    } catch (err: any) {
      setActionError(err.message || 'Failed to update status');
      setTimeout(() => setActionError(''), 4000);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveNotesOnly = async () => {
    if (!selectedInquiry) return;
    setIsUpdating(true);
    setActionSuccess('');
    setActionError('');

    try {
      await updateSellerInquiryStatus(selectedInquiry.id, selectedInquiry.status, adminNotes);
      
      const updatedInquiry: SellerInquiry = {
        ...selectedInquiry,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString()
      };

      setSelectedInquiry(updatedInquiry);
      setInquiries(prev => prev.map(i => i.id === selectedInquiry.id ? updatedInquiry : i));
      setActionSuccess('Internal notes saved successfully');
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to save notes');
      setTimeout(() => setActionError(''), 4000);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteInquiry = async () => {
    if (!selectedInquiry) return;
    setIsDeleting(true);
    setActionSuccess('');
    setActionError('');

    try {
      await deleteSellerInquiry(selectedInquiry.id);
      
      const targetId = selectedInquiry.id;
      const remaining = inquiries.filter(i => i.id !== targetId);
      setInquiries(remaining);
      setSelectedInquiry(remaining.length > 0 ? remaining[0] : null);
      setShowDeleteConfirm(false);
      setActionSuccess('Inquiry deleted from database');
      setTimeout(() => setActionSuccess(''), 3500);
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete inquiry');
      setTimeout(() => setActionError(''), 4000);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateTestInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTest(true);
    setActionError('');
    try {
      const res = await submitSellerInquiry(testForm);
      if (res.success && res.inquiry) {
        setShowTestModal(false);
        setInquiries(prev => [res.inquiry, ...prev.filter(i => i.id !== res.inquiry.id)]);
        setSelectedInquiry(res.inquiry);
        setAdminNotes(res.inquiry.admin_notes || '');
        setNewInquiryHighlightId(res.inquiry.id);
        setTimeout(() => setNewInquiryHighlightId(null), 6000);
        setActionSuccess('Test inquiry created in live database!');
        setTimeout(() => setActionSuccess(''), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create test inquiry');
    } finally {
      setIsSubmittingTest(false);
    }
  };

  const filteredInquiries = inquiries.filter(i => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (i.business_name || '').toLowerCase().includes(q) ||
      (i.full_name || '').toLowerCase().includes(q) ||
      (i.phone || '').includes(q) ||
      (i.email || '').toLowerCase().includes(q) ||
      (i.state || '').toLowerCase().includes(q) ||
      (i.city || '').toLowerCase().includes(q) ||
      (i.category || '').toLowerCase().includes(q)
    );
  });

  const pendingCount = inquiries.filter(i => i.status === 'pending').length;
  const contactedCount = inquiries.filter(i => i.status === 'contacted').length;
  const approvedCount = inquiries.filter(i => i.status === 'approved').length;
  const rejectedCount = inquiries.filter(i => i.status === 'rejected').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header & Live Sync Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              Realtime Database Sync Active
            </span>
            <span className="text-[11px] text-gray-400 font-medium">
              Synced {lastSyncedAt.toLocaleTimeString()}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Seller Inquiries & Verification
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Review live inquiries submitted by dairy farmers, ghee makers, and artisans. Verify details and onboard sellers directly.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowTestModal(true)}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-700" />
            <span>Test Live Inquiry</span>
          </button>

          <Link
            href="/become-seller"
            target="_blank"
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
            <span>Public Form</span>
          </Link>

          <button
            onClick={() => loadInquiries(false)}
            disabled={isLoading}
            className="px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div 
          onClick={() => setSelectedStatus('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'all' ? 'bg-[#0f3e26] text-white border-[#0f3e26] shadow-sm' : 'bg-white text-gray-800 border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-[10px] font-black uppercase tracking-wider ${selectedStatus === 'all' ? 'text-gray-200' : 'text-gray-400'}`}>
              Total Inquiries
            </p>
            <Building2 className={`w-4 h-4 ${selectedStatus === 'all' ? 'text-emerald-300' : 'text-gray-400'}`} />
          </div>
          <p className="text-2xl font-black mt-1">{inquiries.length}</p>
        </div>

        <div 
          onClick={() => setSelectedStatus('pending')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'pending' ? 'bg-amber-500 text-white border-amber-500 shadow-sm' : 'bg-white text-gray-800 border-gray-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-[10px] font-black uppercase tracking-wider ${selectedStatus === 'pending' ? 'text-amber-100' : 'text-amber-700'}`}>
              Pending Review
            </p>
            <Clock className={`w-4 h-4 ${selectedStatus === 'pending' ? 'text-amber-200' : 'text-amber-500'}`} />
          </div>
          <p className={`text-2xl font-black mt-1 ${selectedStatus === 'pending' ? 'text-white' : 'text-amber-600'}`}>{pendingCount}</p>
        </div>

        <div 
          onClick={() => setSelectedStatus('contacted')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'contacted' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-gray-800 border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-[10px] font-black uppercase tracking-wider ${selectedStatus === 'contacted' ? 'text-blue-100' : 'text-blue-700'}`}>
              Contacted / Review
            </p>
            <PhoneCall className={`w-4 h-4 ${selectedStatus === 'contacted' ? 'text-blue-200' : 'text-blue-500'}`} />
          </div>
          <p className={`text-2xl font-black mt-1 ${selectedStatus === 'contacted' ? 'text-white' : 'text-blue-600'}`}>{contactedCount}</p>
        </div>

        <div 
          onClick={() => setSelectedStatus('approved')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'approved' ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm' : 'bg-white text-gray-800 border-gray-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-[10px] font-black uppercase tracking-wider ${selectedStatus === 'approved' ? 'text-emerald-100' : 'text-emerald-700'}`}>
              Approved Sellers
            </p>
            <ShieldCheck className={`w-4 h-4 ${selectedStatus === 'approved' ? 'text-emerald-200' : 'text-emerald-500'}`} />
          </div>
          <p className={`text-2xl font-black mt-1 ${selectedStatus === 'approved' ? 'text-white' : 'text-emerald-600'}`}>{approvedCount}</p>
        </div>
      </div>

      {/* Main Content Layout: Inquiries List + Detail Action Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_470px] gap-6">
        
        {/* Left: Inquiries List */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden flex flex-col min-h-[550px]">
          
          {/* Search bar & status filter indicator */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/70 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search inquiries by farm, owner name, phone, city, state..."
                className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-gray-200 text-xs text-gray-900 focus:border-[#0f3e26] outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick Status Pill Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold">
              <button
                onClick={() => setSelectedStatus('all')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedStatus === 'all' ? 'bg-[#0f3e26] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                All ({inquiries.length})
              </button>
              <button
                onClick={() => setSelectedStatus('pending')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedStatus === 'pending' ? 'bg-amber-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setSelectedStatus('contacted')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedStatus === 'contacted' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                Contacted ({contactedCount})
              </button>
              <button
                onClick={() => setSelectedStatus('approved')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedStatus === 'approved' ? 'bg-emerald-700 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                Approved ({approvedCount})
              </button>
              <button
                onClick={() => setSelectedStatus('rejected')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedStatus === 'rejected' ? 'bg-rose-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                Rejected ({rejectedCount})
              </button>
            </div>
          </div>

          {/* List items */}
          <div className="divide-y divide-gray-100 overflow-y-auto max-h-[650px] flex-1">
            {isLoading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#0f3e26] mx-auto" />
                <p className="text-xs text-gray-500 mt-3 font-medium">Fetching seller inquiries from database...</p>
              </div>
            ) : filteredInquiries.length === 0 ? (
              <div className="p-12 text-center space-y-4 my-auto">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#0f3e26] flex items-center justify-center mx-auto border border-emerald-100">
                  <Building2 className="w-7 h-7" />
                </div>
                <div className="max-w-sm mx-auto space-y-1">
                  <p className="text-sm font-bold text-gray-900">No seller inquiries found</p>
                  <p className="text-xs text-gray-500">
                    {searchQuery
                      ? 'No results match your search query. Try another term.'
                      : selectedStatus !== 'all'
                      ? `No inquiries currently marked as ${selectedStatus}.`
                      : 'When farmers or vendors submit inquiries on /become-seller, they will appear here in real-time.'}
                  </p>
                </div>
                {!searchQuery && selectedStatus === 'all' && (
                  <button
                    onClick={() => setShowTestModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f3e26] text-white text-xs font-bold hover:bg-[#144f31] transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-400" />
                    <span>Create Test Live Inquiry</span>
                  </button>
                )}
              </div>
            ) : (
              filteredInquiries.map((inq) => {
                const isSelected = selectedInquiry?.id === inq.id;
                const isNewHighlight = newInquiryHighlightId === inq.id;

                return (
                  <div
                    key={inq.id}
                    onClick={() => handleSelectInquiry(inq)}
                    className={`p-4 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-50/80 border-l-4 border-[#0f3e26]'
                        : isNewHighlight
                        ? 'bg-amber-50/70 border-l-4 border-amber-500 animate-pulse'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-gray-900 truncate">
                          {inq.business_name}
                        </span>
                        
                        {isNewHighlight && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white animate-bounce">
                            NEW
                          </span>
                        )}

                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          inq.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : inq.status === 'contacted'
                            ? 'bg-blue-100 text-blue-800'
                            : inq.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {inq.status}
                        </span>
                      </div>

                      <p className="text-xs text-gray-600 flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-800">{inq.full_name}</span>
                        <span>•</span>
                        <span className="text-[#0f3e26] font-semibold">{inq.category}</span>
                      </p>

                      <p className="text-[11px] text-gray-400 flex items-center gap-1.5 flex-wrap">
                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                        <span>{inq.city ? `${inq.city}, ` : ''}{inq.state}</span>
                        <span>•</span>
                        <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                        <span>+91 {inq.phone}</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end shrink-0 text-right">
                      <span className="text-[11px] text-gray-500 font-medium">
                        {formatRelativeTime(inq.created_at)}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(inq.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Selected Inquiry Detail & Contact Action Panel */}
        {selectedInquiry ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-6 h-fit sticky top-6">
            
            {/* Header & Status Indicator */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md truncate max-w-[180px]">
                    {selectedInquiry.id}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {new Date(selectedInquiry.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>

                <h2 className="text-lg font-black text-gray-900 leading-snug mt-1 truncate">
                  {selectedInquiry.business_name}
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  Owner: <strong className="text-gray-800">{selectedInquiry.full_name}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-full ${
                  selectedInquiry.status === 'pending'
                    ? 'bg-amber-100 text-amber-800'
                    : selectedInquiry.status === 'contacted'
                    ? 'bg-blue-100 text-blue-800'
                    : selectedInquiry.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {selectedInquiry.status}
                </span>

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 rounded-xl border border-gray-200 text-gray-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer"
                  title="Delete Inquiry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Contact Action Buttons (Call / WhatsApp / Email) */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-black tracking-wider text-gray-400">
                1-Click Manual Contact Channels
              </p>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:+91${selectedInquiry.phone.replace(/[^0-9]/g, '')}`}
                  className="px-3 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Call +91 {selectedInquiry.phone}</span>
                </a>

                <a
                  href={`https://wa.me/91${selectedInquiry.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${selectedInquiry.full_name}, this is Gjanand Sarkar Vendor Onboarding team regarding your seller inquiry for ${selectedInquiry.business_name}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>WhatsApp</span>
                </a>
              </div>

              {selectedInquiry.email && (
                <a
                  href={`mailto:${selectedInquiry.email}?subject=${encodeURIComponent(`Gjanand Sarkar Seller Inquiry - ${selectedInquiry.business_name}`)}`}
                  className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  <span className="truncate">{selectedInquiry.email}</span>
                </a>
              )}
            </div>

            {/* Key Business Details */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Category:</span>
                <strong className="text-gray-900 font-semibold">{selectedInquiry.category}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Location:</span>
                <strong className="text-gray-900">{selectedInquiry.city ? `${selectedInquiry.city}, ` : ''}{selectedInquiry.state}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Monthly Volume:</span>
                <strong className="text-gray-900">{selectedInquiry.monthly_volume || 'Not specified'}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500">FSSAI Number:</span>
                <strong className="text-gray-900 font-mono">{selectedInquiry.fssai_number || 'Under Verification'}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500">GSTIN:</span>
                <strong className="text-gray-900 font-mono">{selectedInquiry.gstin || 'Unregistered'}</strong>
              </div>
              {selectedInquiry.product_range && (
                <div className="py-1">
                  <span className="text-gray-500 block mb-0.5 font-medium">Specialty Products:</span>
                  <p className="text-gray-800 font-medium bg-white p-2 rounded-lg border border-gray-200/80">{selectedInquiry.product_range}</p>
                </div>
              )}
              {selectedInquiry.notes && (
                <div className="py-1">
                  <span className="text-gray-500 block mb-0.5 font-medium">Purity / Gaushala Practices:</span>
                  <p className="text-gray-800 italic bg-white p-2.5 rounded-xl border border-gray-200">
                    &ldquo;{selectedInquiry.notes}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Internal Admin Verification Notes */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                  Internal Verification Notes
                </label>
                <button
                  type="button"
                  onClick={handleSaveNotesOnly}
                  disabled={isUpdating}
                  className="text-[10px] font-bold text-[#0f3e26] hover:underline cursor-pointer"
                >
                  Save Notes
                </button>
              </div>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Called owner on WhatsApp. Verified lab test certificates. Approved sample."
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 text-gray-900 focus:border-[#0f3e26] outline-none resize-none"
              />
            </div>

            {/* Action Feedback Notifications */}
            {actionSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}
            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Status Change Buttons */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <p className="text-[10px] uppercase font-black tracking-wider text-gray-400">
                Update Onboarding Stage
              </p>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={isUpdating || selectedInquiry.status === 'pending'}
                  onClick={() => handleUpdateStatus('pending')}
                  className="px-2 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pending</span>
                </button>

                <button
                  type="button"
                  disabled={isUpdating || selectedInquiry.status === 'contacted'}
                  onClick={() => handleUpdateStatus('contacted')}
                  className="px-2 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                  <span>Contacted</span>
                </button>

                <button
                  type="button"
                  disabled={isUpdating || selectedInquiry.status === 'rejected'}
                  onClick={() => handleUpdateStatus('rejected')}
                  className="px-2 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Reject</span>
                </button>
              </div>

              <button
                type="button"
                disabled={isUpdating || selectedInquiry.status === 'approved'}
                onClick={() => handleUpdateStatus('approved')}
                className="w-full px-4 py-3 bg-[#0f3e26] hover:bg-[#144f31] text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-[#c88a23]" />
                    <span>Approve & Activate Seller Store</span>
                  </>
                )}
              </button>
            </div>

          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400 my-auto">
            <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600">No inquiry selected</p>
            <p className="text-xs text-gray-400 mt-1">Select an inquiry from the list to view details and contact actions.</p>
          </div>
        )}

      </div>

      {/* Test Live Inquiry Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#c88a23]" />
                <h3 className="font-bold text-gray-900 text-sm">Create Real Test Seller Inquiry</h3>
              </div>
              <button
                onClick={() => setShowTestModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTestInquiry} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Owner Name *</label>
                  <input
                    type="text"
                    required
                    value={testForm.fullName}
                    onChange={(e) => setTestForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#0f3e26] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={testForm.businessName}
                    onChange={(e) => setTestForm(prev => ({ ...prev, businessName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#0f3e26] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={testForm.phone}
                    onChange={(e) => setTestForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#0f3e26] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Email</label>
                  <input
                    type="email"
                    value={testForm.email}
                    onChange={(e) => setTestForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#0f3e26] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">City & State</label>
                  <input
                    type="text"
                    value={testForm.city}
                    onChange={(e) => setTestForm(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#0f3e26] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Category</label>
                  <select
                    value={testForm.category}
                    onChange={(e) => setTestForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#0f3e26] outline-none bg-white"
                  >
                    <option value="A2 Dairy & Vedic Ghee">A2 Dairy & Vedic Ghee</option>
                    <option value="Vedic Ayurveda & Herbs">Vedic Ayurveda & Herbs</option>
                    <option value="Cold-Pressed Oils">Cold-Pressed Oils</option>
                    <option value="Heritage Spices">Heritage Spices</option>
                    <option value="Artisanal Handloom">Artisanal Handloom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-600 font-bold mb-1">Specialty / Farm Notes</label>
                <textarea
                  rows={2}
                  value={testForm.notes}
                  onChange={(e) => setTestForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#0f3e26] outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTest}
                  className="px-4 py-2 bg-[#0f3e26] text-white font-bold rounded-xl hover:bg-[#144f31] flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSubmittingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Submit to Live Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedInquiry && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            
            <div className="text-center space-y-1">
              <h3 className="font-black text-gray-900 text-base">Delete Seller Inquiry?</h3>
              <p className="text-xs text-gray-500">
                Are you sure you want to permanently delete the inquiry for <strong>{selectedInquiry.business_name}</strong>? This action cannot be undone.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteInquiry}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
