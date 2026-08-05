"use client";

import React, { useState, useEffect } from 'react';
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
  FileText
} from 'lucide-react';
import { getSellerInquiries, updateSellerInquiryStatus, SellerInquiry } from '@/lib/api/sellers';

export default function AdminVendorInquiriesPage() {
  const [inquiries, setInquiries] = useState<SellerInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<SellerInquiry | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const loadInquiries = async () => {
    setIsLoading(true);
    try {
      const data = await getSellerInquiries(selectedStatus === 'all' ? undefined : selectedStatus);
      setInquiries(data);
      if (data.length > 0 && !selectedInquiry) {
        setSelectedInquiry(data[0]);
        setAdminNotes(data[0].admin_notes || '');
      }
    } catch (err) {
      console.error('Failed to load inquiries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, [selectedStatus]);

  const handleSelectInquiry = (inq: SellerInquiry) => {
    setSelectedInquiry(inq);
    setAdminNotes(inq.admin_notes || '');
    setActionSuccess('');
  };

  const handleUpdateStatus = async (newStatus: 'pending' | 'contacted' | 'approved' | 'rejected') => {
    if (!selectedInquiry) return;
    setIsUpdating(true);
    setActionSuccess('');

    try {
      await updateSellerInquiryStatus(selectedInquiry.id, newStatus, adminNotes);
      
      // Update local state
      const updatedInquiry = {
        ...selectedInquiry,
        status: newStatus,
        admin_notes: adminNotes,
        updated_at: new Date().toISOString()
      };

      setSelectedInquiry(updatedInquiry);
      setInquiries(prev => prev.map(i => i.id === selectedInquiry.id ? updatedInquiry : i));
      setActionSuccess(`Inquiry marked as ${newStatus.toUpperCase()}`);
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredInquiries = inquiries.filter(i => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      i.business_name.toLowerCase().includes(q) ||
      i.full_name.toLowerCase().includes(q) ||
      i.phone.includes(q) ||
      i.email.toLowerCase().includes(q) ||
      i.state.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q)
    );
  });

  const pendingCount = inquiries.filter(i => i.status === 'pending').length;
  const contactedCount = inquiries.filter(i => i.status === 'contacted').length;
  const approvedCount = inquiries.filter(i => i.status === 'approved').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-[#c88a23] text-xs font-black uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Manual Onboarding Pipeline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Seller Inquiries & Verification
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Review prospective dairy farmers, ghee makers, and artisans. Contact manually to verify samples before approval.
          </p>
        </div>

        <button
          onClick={loadInquiries}
          disabled={isLoading}
          className="self-start sm:self-auto px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 shadow-2xs cursor-pointer transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Inquiries</span>
        </button>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div 
          onClick={() => setSelectedStatus('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'all' ? 'bg-[#0f3e26] text-white border-[#0f3e26] shadow-sm' : 'bg-white text-gray-800 border-gray-200 hover:border-gray-300'
          }`}
        >
          <p className={`text-[10px] font-black uppercase tracking-wider ${selectedStatus === 'all' ? 'text-gray-200' : 'text-gray-400'}`}>
            Total Inquiries
          </p>
          <p className="text-2xl font-black mt-1">{inquiries.length}</p>
        </div>

        <div 
          onClick={() => setSelectedStatus('pending')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'pending' ? 'bg-amber-500 text-white border-amber-500 shadow-sm' : 'bg-white text-gray-800 border-gray-200 hover:border-amber-300'
          }`}
        >
          <p className={`text-[10px] font-black uppercase tracking-wider ${selectedStatus === 'pending' ? 'text-amber-100' : 'text-amber-700'}`}>
            Pending Review (New)
          </p>
          <p className="text-2xl font-black mt-1 text-amber-600 group-hover:text-amber-700">{pendingCount}</p>
        </div>

        <div 
          onClick={() => setSelectedStatus('contacted')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'contacted' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-gray-800 border-gray-200 hover:border-blue-300'
          }`}
        >
          <p className={`text-[10px] font-black uppercase tracking-wider ${selectedStatus === 'contacted' ? 'text-blue-100' : 'text-blue-700'}`}>
            Contacted & In-Review
          </p>
          <p className="text-2xl font-black mt-1 text-blue-600">{contactedCount}</p>
        </div>

        <div 
          onClick={() => setSelectedStatus('approved')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedStatus === 'approved' ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm' : 'bg-white text-gray-800 border-gray-200 hover:border-emerald-300'
          }`}
        >
          <p className={`text-[10px] font-black uppercase tracking-wider ${selectedStatus === 'approved' ? 'text-emerald-100' : 'text-emerald-700'}`}>
            Approved Sellers
          </p>
          <p className="text-2xl font-black mt-1 text-emerald-600">{approvedCount}</p>
        </div>
      </div>

      {/* Main Content Layout: Inquiries List + Detail Action Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-6">
        
        {/* Left: Inquiries List */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden flex flex-col">
          
          {/* Search bar inside list */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by farm, owner name, mobile, state..."
                className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-gray-200 text-xs text-gray-900 focus:border-[#0f3e26] outline-none"
              />
            </div>
          </div>

          {/* List items */}
          <div className="divide-y divide-gray-100 overflow-y-auto max-h-[650px]">
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#0f3e26] mx-auto" />
                <p className="text-xs text-gray-500 mt-2">Loading seller inquiries...</p>
              </div>
            ) : filteredInquiries.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Building2 className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-sm font-bold text-gray-800">No seller inquiries found</p>
                <p className="text-xs text-gray-500">Inquiries submitted via /become-seller will appear here.</p>
              </div>
            ) : (
              filteredInquiries.map((inq) => {
                const isSelected = selectedInquiry?.id === inq.id;
                return (
                  <div
                    key={inq.id}
                    onClick={() => handleSelectInquiry(inq)}
                    className={`p-4 transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected ? 'bg-emerald-50/70 border-l-4 border-[#0f3e26]' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-gray-900 truncate">
                          {inq.business_name}
                        </span>
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

                      <p className="text-xs text-gray-600 flex items-center gap-2">
                        <span>{inq.full_name}</span>
                        <span>•</span>
                        <span className="text-[#0f3e26] font-semibold">{inq.category}</span>
                      </p>

                      <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span>{inq.city ? `${inq.city}, ` : ''}{inq.state}</span>
                        <span>•</span>
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>+91 {inq.phone}</span>
                      </p>
                    </div>

                    <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                      {new Date(inq.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Selected Inquiry Detail & Manual Contact Action Panel */}
        {selectedInquiry ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-6 h-fit sticky top-6">
            
            {/* Header & Status Indicator */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <span className="text-[10px] uppercase font-mono text-gray-400">{selectedInquiry.id}</span>
                <h2 className="text-lg font-black text-gray-900 leading-snug">
                  {selectedInquiry.business_name}
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  Owner: <strong className="text-gray-800">{selectedInquiry.full_name}</strong>
                </p>
              </div>

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
            </div>

            {/* Quick Contact Action Buttons (Call / WhatsApp / Email) */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-black tracking-wider text-gray-400">
                1-Click Manual Contact
              </p>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:+91${selectedInquiry.phone.replace(/[^0-9]/g, '')}`}
                  className="px-3 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Call +91 {selectedInquiry.phone}</span>
                </a>

                <a
                  href={`https://wa.me/91${selectedInquiry.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${selectedInquiry.full_name}, this is Gjanand Sarkar Vendor Onboarding team regarding your seller inquiry for ${selectedInquiry.business_name}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>

              <a
                href={`mailto:${selectedInquiry.email}?subject=${encodeURIComponent(`Gjanand Sarkar Seller Inquiry - ${selectedInquiry.business_name}`)}`}
                className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-gray-500" />
                <span className="truncate">{selectedInquiry.email}</span>
              </a>
            </div>

            {/* Key Business Details */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-200/60">
                <span className="text-gray-500">Category:</span>
                <strong className="text-gray-900">{selectedInquiry.category}</strong>
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
                  <span className="text-gray-500 block mb-0.5">Specialty Products:</span>
                  <p className="text-gray-800 font-medium">{selectedInquiry.product_range}</p>
                </div>
              )}
              {selectedInquiry.notes && (
                <div className="py-1">
                  <span className="text-gray-500 block mb-0.5">Purity / Cattle Practice Notes:</span>
                  <p className="text-gray-800 italic bg-white p-2.5 rounded-xl border border-gray-200">
                    &ldquo;{selectedInquiry.notes}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Internal Admin Verification Notes */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                Internal Onboarding Notes
              </label>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Called owner on WhatsApp. Purity test certificate received. Approved for A2 Ghee."
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 text-gray-900 focus:border-[#0f3e26] outline-none resize-none"
              />
            </div>

            {/* Action Feedback Notification */}
            {actionSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Status Change Buttons */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <p className="text-[10px] uppercase font-black tracking-wider text-gray-400">
                Update Onboarding Stage
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isUpdating || selectedInquiry.status === 'contacted'}
                  onClick={() => handleUpdateStatus('contacted')}
                  className="px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                  <span>Mark Contacted</span>
                </button>

                <button
                  type="button"
                  disabled={isUpdating || selectedInquiry.status === 'rejected'}
                  onClick={() => handleUpdateStatus('rejected')}
                  className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
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
                    <span>Approve & Activate Seller Storefront</span>
                  </>
                )}
              </button>
            </div>

          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
            Select an inquiry from the list to view details and take action.
          </div>
        )}

      </div>

    </div>
  );
}
