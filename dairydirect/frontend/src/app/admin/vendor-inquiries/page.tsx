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
  FileText,
  CreditCard,
  ExternalLink,
  AlertTriangle,
  FileCheck,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { getSellerInquiries, updateSellerInquiryStatus, SellerInquiry } from '@/lib/api/sellers';

const STATUS_FILTERS = [
  { id: 'all', label: 'All Applications' },
  { id: 'pending', label: 'Pending Review' },
  { id: 'approved', label: 'Approved Sellers' },
  { id: 'rejected', label: 'Rejected Applications' },
  { id: 'suspended', label: 'Suspended' },
];

export default function AdminVendorInquiriesPage() {
  const [inquiries, setInquiries] = useState<SellerInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<SellerInquiry | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    action: 'approved' | 'rejected' | 'suspended';
    title: string;
    description: string;
  }>({
    open: false,
    action: 'approved',
    title: '',
    description: '',
  });

  const loadInquiries = async () => {
    setIsLoading(true);
    try {
      const data = await getSellerInquiries(selectedStatus === 'all' ? undefined : selectedStatus);
      setInquiries(data);
      if (data.length > 0) {
        if (!selectedInquiry || !data.some(i => i.id === selectedInquiry.id)) {
          setSelectedInquiry(data[0]);
          setAdminNotes(data[0].admin_notes || '');
        } else {
          const current = data.find(i => i.id === selectedInquiry.id);
          if (current) setSelectedInquiry(current);
        }
      } else {
        setSelectedInquiry(null);
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

  const handleTriggerConfirm = (action: 'approved' | 'rejected' | 'suspended') => {
    if (!selectedInquiry) return;
    
    if (action === 'rejected' && (!adminNotes || !adminNotes.trim())) {
      alert('Please enter a rejection reason before rejecting the application.');
      return;
    }

    if (action === 'approved') {
      setConfirmModal({
        open: true,
        action: 'approved',
        title: 'Approve Seller Application?',
        description: `This will activate the seller account for "${selectedInquiry.business_name}", assign the seller role to the user, and unlock their seller dashboard to submit products.`,
      });
    } else if (action === 'rejected') {
      setConfirmModal({
        open: true,
        action: 'rejected',
        title: 'Reject Seller Application?',
        description: `This will reject the application for "${selectedInquiry.business_name}" with reason: "${adminNotes.trim()}". The seller will not receive seller dashboard access.`,
      });
    } else if (action === 'suspended') {
      setConfirmModal({
        open: true,
        action: 'suspended',
        title: 'Suspend Seller?',
        description: `This will suspend "${selectedInquiry.business_name}". Their products will be hidden from the marketplace.`,
      });
    }
  };

  const executeConfirmedAction = async () => {
    if (!selectedInquiry) return;
    setIsUpdating(true);
    setActionSuccess('');

    try {
      const targetStatus = confirmModal.action;
      const res = await updateSellerInquiryStatus(selectedInquiry.id, targetStatus, adminNotes);
      
      const updatedInquiry: SellerInquiry = {
        ...selectedInquiry,
        status: targetStatus,
        admin_notes: adminNotes,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setSelectedInquiry(updatedInquiry);
      setInquiries(prev => prev.map(i => i.id === selectedInquiry.id ? updatedInquiry : i));
      setActionSuccess(`Application successfully marked as ${targetStatus.toUpperCase()}`);
      setConfirmModal({ ...confirmModal, open: false });
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update application status');
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
      (i.city && i.city.toLowerCase().includes(q)) ||
      i.state.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q)
    );
  });

  const pendingCount = inquiries.filter(i => i.status === 'pending').length;
  const approvedCount = inquiries.filter(i => i.status === 'approved').length;
  const rejectedCount = inquiries.filter(i => i.status === 'rejected').length;
  const suspendedCount = inquiries.filter(i => i.status === 'suspended').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-[#c88a23] text-xs font-black uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Marketplace Onboarding</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Seller Applications & Requests
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Review business credentials, PAN, GSTIN, and compliance documents to approve or reject merchant accounts.
          </p>
        </div>

        <button
          onClick={loadInquiries}
          className="self-start sm:self-auto px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-2 shadow-2xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          <span>Refresh Applications</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pending Review</p>
            <p className="text-xl font-black text-gray-900">{pendingCount}</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Approved Sellers</p>
            <p className="text-xl font-black text-gray-900">{approvedCount}</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Rejected</p>
            <p className="text-xl font-black text-gray-900">{rejectedCount}</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Suspended</p>
            <p className="text-xl font-black text-gray-900">{suspendedCount}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedStatus(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedStatus === f.id
                  ? 'bg-[#0f3e26] text-white shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search seller, email, phone, or ID..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#0f3e26] outline-none"
          />
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Grid: Left List + Right Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Applications List */}
        <div className="lg:col-span-5 space-y-3">
          {isLoading ? (
            <div className="bg-white rounded-2xl p-10 border border-gray-200 text-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#0f3e26] mx-auto" />
              <p className="text-xs text-gray-500 font-medium">Loading seller applications...</p>
            </div>
          ) : filteredInquiries.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-gray-200 text-center space-y-2">
              <Building2 className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs font-bold text-gray-800">No applications match your filter</p>
              <p className="text-[11px] text-gray-400">Applications submitted from the Become a Seller page will appear here.</p>
            </div>
          ) : (
            filteredInquiries.map((inq) => {
              const isSelected = selectedInquiry?.id === inq.id;
              return (
                <div
                  key={inq.id}
                  onClick={() => handleSelectInquiry(inq)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-left space-y-2.5 ${
                    isSelected
                      ? 'bg-emerald-50/40 border-[#0f3e26] shadow-sm'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-black text-gray-900 leading-snug">
                        {inq.business_name}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-0.5">
                        <span>{inq.full_name}</span>
                        <span>•</span>
                        <span>{inq.category}</span>
                      </p>
                    </div>

                    {/* Status Badge */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                      inq.status === 'approved' 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : inq.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : inq.status === 'suspended'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {inq.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-gray-100">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{inq.city ? `${inq.city}, ${inq.state}` : inq.state}</span>
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[10px]">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(inq.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Complete Application Review Drawer */}
        <div className="lg:col-span-7">
          {selectedInquiry ? (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6 text-left">
              
              {/* Header Box */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">
                      {selectedInquiry.business_name}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      selectedInquiry.status === 'approved' 
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedInquiry.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : selectedInquiry.status === 'suspended'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedInquiry.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-mono mt-1">Application ID: {selectedInquiry.id}</p>
                </div>

                {/* Direct Contact Actions */}
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:+91${selectedInquiry.phone}`}
                    className="p-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
                    title="Call Applicant"
                  >
                    <Phone className="w-4 h-4 text-emerald-600" />
                  </a>
                  <a
                    href={`https://wa.me/91${selectedInquiry.phone}?text=${encodeURIComponent(`Hello ${selectedInquiry.full_name}, this is Gjanand Sarkar Admin team regarding your seller application for ${selectedInquiry.business_name}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-emerald-50 hover:border-emerald-200 transition-colors shadow-2xs"
                    title="Chat on WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                  </a>
                  <a
                    href={`mailto:${selectedInquiry.email}`}
                    className="p-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
                    title="Send Email"
                  >
                    <Mail className="w-4 h-4 text-blue-600" />
                  </a>
                </div>
              </div>

              {/* 1. Owner & Contact Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-[#0f3e26] uppercase tracking-wider flex items-center gap-2">
                  <PhoneCall className="w-3.5 h-3.5 text-[#c88a23]" />
                  <span>Applicant & Contact Details</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Contact Person</span>
                    <span className="font-bold text-gray-900">{selectedInquiry.full_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Mobile Number</span>
                    <span className="font-bold text-gray-900 font-mono">+91 {selectedInquiry.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Email Address</span>
                    <span className="font-bold text-gray-900 truncate block">{selectedInquiry.email}</span>
                  </div>
                </div>
              </div>

              {/* 2. Business Address & Structure */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-[#0f3e26] uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-[#c88a23]" />
                  <span>Business Address & Structure</span>
                </h4>
                
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Business Entity Type</span>
                      <span className="font-bold text-gray-900 capitalize">{selectedInquiry.business_type?.replace(/_/g, ' ') || 'Sole Proprietorship'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Product Category</span>
                      <span className="font-bold text-gray-900">{selectedInquiry.category}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Full Registered Address</span>
                    <span className="font-medium text-gray-800">
                      {selectedInquiry.business_address || 'Address line not specified'}, {selectedInquiry.city || ''}, {selectedInquiry.state} {selectedInquiry.pincode ? `- ${selectedInquiry.pincode}` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Verification Details (PAN, GSTIN, FSSAI, Docs) */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-[#0f3e26] uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-[#c88a23]" />
                  <span>Tax & Compliance Verification</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Business PAN</span>
                    <span className="font-mono font-bold text-gray-900">{selectedInquiry.pan || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">GSTIN</span>
                    <span className="font-mono font-bold text-gray-900">{selectedInquiry.gstin || 'Unregistered / Small'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">FSSAI / Reg. No.</span>
                    <span className="font-mono font-bold text-gray-900">{selectedInquiry.fssai_number || 'N/A'}</span>
                  </div>
                </div>

                {/* Documents link */}
                {selectedInquiry.business_documents && selectedInquiry.business_documents.length > 0 && (
                  <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/80 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-950 font-bold">
                      <FileCheck className="w-4 h-4 text-emerald-700" />
                      <span>Submitted Business Verification Document</span>
                    </div>
                    <a
                      href={selectedInquiry.business_documents[0]?.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 bg-white text-emerald-800 rounded-lg text-xs font-bold border border-emerald-300 hover:bg-emerald-50 flex items-center gap-1"
                    >
                      <span>View Document</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* 4. Submission & Decision Timestamps */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Application Submitted</span>
                  <span className="font-semibold text-gray-800">{new Date(selectedInquiry.created_at).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Decision / Last Updated</span>
                  <span className="font-semibold text-gray-800">{new Date(selectedInquiry.updated_at).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* 5. Remarks & Rejection Reason Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700">
                  Admin Decision Feedback / Rejection Reason
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Enter feedback or mandatory rejection reason to communicate with the seller..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] outline-none resize-none"
                />
              </div>

              {/* 6. Admin Action Decision Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-gray-100">
                {selectedInquiry.status !== 'suspended' && (
                  <button
                    type="button"
                    onClick={() => handleTriggerConfirm('suspended')}
                    disabled={isUpdating}
                    className="px-4 py-2.5 border border-red-200 hover:bg-red-50 text-red-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Suspend Seller
                  </button>
                )}

                {selectedInquiry.status !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => handleTriggerConfirm('rejected')}
                    disabled={isUpdating}
                    className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Reject Application</span>
                  </button>
                )}

                {selectedInquiry.status !== 'approved' && (
                  <button
                    type="button"
                    onClick={() => handleTriggerConfirm('approved')}
                    disabled={isUpdating}
                    className="px-6 py-2.5 bg-[#0f3e26] hover:bg-[#144f31] text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#c88a23]" />
                    <span>Approve Seller Account</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center space-y-3">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="text-sm font-black text-gray-800">Select an application to inspect</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Click on any seller application from the list on the left to review their verification documents, PAN, GSTIN, and take approval actions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-gray-200 shadow-2xl text-left">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                confirmModal.action === 'approved' 
                  ? 'bg-emerald-100 text-[#0f3e26]' 
                  : 'bg-rose-100 text-rose-600'
              }`}>
                {confirmModal.action === 'approved' ? (
                  <ShieldCheck className="w-6 h-6 text-emerald-700" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 leading-tight">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Please confirm your decision</p>
              </div>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-200">
              {confirmModal.description}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ ...confirmModal, open: false })}
                disabled={isUpdating}
                className="px-5 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={executeConfirmedAction}
                disabled={isUpdating}
                className={`px-6 py-2.5 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-2 cursor-pointer ${
                  confirmModal.action === 'approved'
                    ? 'bg-[#0f3e26] hover:bg-[#144f31]'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm {confirmModal.action.toUpperCase()}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
