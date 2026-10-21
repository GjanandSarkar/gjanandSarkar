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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Marketplace Onboarding</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Seller Applications & Requests
          </h1>
          <p className="text-xs text-foreground-muted mt-0.5">
            Review business credentials, PAN, GSTIN, and compliance documents to approve or reject merchant accounts.
          </p>
        </div>

        <button
          onClick={loadInquiries}
          className="self-start sm:self-auto px-4 py-2 bg-surface border border-border-hover hover:bg-surface-muted text-foreground text-xs font-bold rounded-xl flex items-center gap-2 shadow-2xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-success' : ''}`} />
          <span>Refresh Applications</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-surface rounded-2xl border border-border shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning-bg text-warning flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">Pending Review</p>
            <p className="text-xl font-black text-foreground">{pendingCount}</p>
          </div>
        </div>

        <div className="p-4 bg-surface rounded-2xl border border-border shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success-bg text-success flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">Approved Sellers</p>
            <p className="text-xl font-black text-foreground">{approvedCount}</p>
          </div>
        </div>

        <div className="p-4 bg-surface rounded-2xl border border-border shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-error-bg text-error flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">Rejected</p>
            <p className="text-xl font-black text-foreground">{rejectedCount}</p>
          </div>
        </div>

        <div className="p-4 bg-surface rounded-2xl border border-border shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-error-bg text-error flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">Suspended</p>
            <p className="text-xl font-black text-foreground">{suspendedCount}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-surface p-3 rounded-2xl border border-border shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedStatus(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedStatus === f.id
                  ? 'bg-primary text-white shadow-2xs'
                  : 'text-foreground-muted hover:bg-surface-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search seller, email, phone, or ID..."
            className="w-full pl-9 pr-4 py-2 bg-surface-muted border border-border rounded-xl text-xs text-foreground placeholder:text-foreground-muted focus:bg-surface focus:border-primary outline-none"
          />
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-success-bg border border-success/20 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Grid: Left List + Right Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Applications List */}
        <div className="lg:col-span-5 space-y-3">
          {isLoading ? (
            <div className="bg-surface rounded-2xl p-10 border border-border text-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
              <p className="text-xs text-foreground-muted font-medium">Loading seller applications...</p>
            </div>
          ) : filteredInquiries.length === 0 ? (
            <div className="bg-surface rounded-2xl p-10 border border-border text-center space-y-2">
              <Building2 className="w-8 h-8 text-foreground-muted mx-auto" />
              <p className="text-xs font-bold text-foreground">No applications match your filter</p>
              <p className="text-[11px] text-foreground-muted">Applications submitted from the Become a Seller page will appear here.</p>
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
                      ? 'bg-success-bg/40 border-primary shadow-sm'
                      : 'bg-surface border-border hover:border-border-hover'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-black text-foreground leading-snug">
                        {inq.business_name}
                      </h4>
                      <p className="text-xs text-foreground-muted font-medium flex items-center gap-1.5 mt-0.5">
                        <span>{inq.full_name}</span>
                        <span>•</span>
                        <span>{inq.category}</span>
                      </p>
                    </div>

                    {/* Status Badge */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                      inq.status === 'approved' 
                        ? 'bg-success-bg text-emerald-800 border border-success/20'
                        : inq.status === 'rejected'
                        ? 'bg-error-bg text-rose-800 border border-error/20'
                        : inq.status === 'suspended'
                        ? 'bg-error-bg text-error border border-error/20'
                        : 'bg-warning-bg text-amber-800 border border-warning/20'
                    }`}>
                      {inq.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-foreground-muted pt-1 border-t border-border">
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
            <div className="bg-surface rounded-3xl border border-border shadow-sm p-6 sm:p-8 space-y-6 text-left">
              
              {/* Header Box */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-foreground tracking-tight">
                      {selectedInquiry.business_name}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      selectedInquiry.status === 'approved' 
                        ? 'bg-success-bg text-emerald-800'
                        : selectedInquiry.status === 'rejected'
                        ? 'bg-error-bg text-rose-800'
                        : selectedInquiry.status === 'suspended'
                        ? 'bg-error-bg text-error'
                        : 'bg-warning-bg text-amber-800'
                    }`}>
                      {selectedInquiry.status}
                    </span>
                  </div>
                  <p className="text-xs text-foreground-muted font-mono mt-1">Application ID: {selectedInquiry.id}</p>
                </div>

                {/* Direct Contact Actions */}
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:+91${selectedInquiry.phone}`}
                    className="p-2.5 rounded-xl border border-border text-foreground hover:bg-surface-muted transition-colors shadow-2xs"
                    title="Call Applicant"
                  >
                    <Phone className="w-4 h-4 text-success" />
                  </a>
                  <a
                    href={`https://wa.me/91${selectedInquiry.phone}?text=${encodeURIComponent(`Hello ${selectedInquiry.full_name}, this is Gjanand Sarkar Admin team regarding your seller application for ${selectedInquiry.business_name}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl border border-border text-foreground hover:bg-success-bg hover:border-success/20 transition-colors shadow-2xs"
                    title="Chat on WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4 text-success" />
                  </a>
                  <a
                    href={`mailto:${selectedInquiry.email}`}
                    className="p-2.5 rounded-xl border border-border text-foreground hover:bg-surface-muted transition-colors shadow-2xs"
                    title="Send Email"
                  >
                    <Mail className="w-4 h-4 text-info" />
                  </a>
                </div>
              </div>

              {/* 1. Owner & Contact Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                  <PhoneCall className="w-3.5 h-3.5 text-primary" />
                  <span>Applicant & Contact Details</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-surface-muted p-4 rounded-2xl border border-border text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-foreground-muted block">Contact Person</span>
                    <span className="font-bold text-foreground">{selectedInquiry.full_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-foreground-muted block">Mobile Number</span>
                    <span className="font-bold text-foreground font-mono">+91 {selectedInquiry.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-foreground-muted block">Email Address</span>
                    <span className="font-bold text-foreground truncate block">{selectedInquiry.email}</span>
                  </div>
                </div>
              </div>

              {/* 2. Business Address & Structure */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  <span>Business Address & Structure</span>
                </h4>
                
                <div className="bg-surface-muted p-4 rounded-2xl border border-border text-xs space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-foreground-muted block">Business Entity Type</span>
                      <span className="font-bold text-foreground capitalize">{selectedInquiry.business_type?.replace(/_/g, ' ') || 'Sole Proprietorship'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-foreground-muted block">Product Category</span>
                      <span className="font-bold text-foreground">{selectedInquiry.category}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-foreground-muted block">Full Registered Address</span>
                    <span className="font-medium text-foreground">
                      {selectedInquiry.business_address || 'Address line not specified'}, {selectedInquiry.city || ''}, {selectedInquiry.state} {selectedInquiry.pincode ? `- ${selectedInquiry.pincode}` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Verification Details (PAN, GSTIN, FSSAI, Docs) */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-primary" />
                  <span>Tax & Compliance Verification</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-surface-muted p-4 rounded-2xl border border-border text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-foreground-muted block">Business PAN</span>
                    <span className="font-mono font-bold text-foreground">{selectedInquiry.pan || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-foreground-muted block">GSTIN</span>
                    <span className="font-mono font-bold text-foreground">{selectedInquiry.gstin || 'Unregistered / Small'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-foreground-muted block">FSSAI / Reg. No.</span>
                    <span className="font-mono font-bold text-foreground">{selectedInquiry.fssai_number || 'N/A'}</span>
                  </div>
                </div>

                {/* Documents link */}
                {selectedInquiry.business_documents && selectedInquiry.business_documents.length > 0 && (
                  <div className="bg-success-bg/70 p-3.5 rounded-2xl border border-success/20/80 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-950 font-bold">
                      <FileCheck className="w-4 h-4 text-success" />
                      <span>Submitted Business Verification Document</span>
                    </div>
                    <a
                      href={selectedInquiry.business_documents[0]?.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 bg-surface text-emerald-800 rounded-lg text-xs font-bold border border-emerald-300 hover:bg-success-bg flex items-center gap-1"
                    >
                      <span>View Document</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* 4. Submission & Decision Timestamps */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-surface-muted p-3 rounded-2xl border border-border">
                <div>
                  <span className="text-[10px] uppercase font-bold text-foreground-muted block">Application Submitted</span>
                  <span className="font-semibold text-foreground">{new Date(selectedInquiry.created_at).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-foreground-muted block">Decision / Last Updated</span>
                  <span className="font-semibold text-foreground">{new Date(selectedInquiry.updated_at).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* 5. Remarks & Rejection Reason Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-foreground">
                  Admin Decision Feedback / Rejection Reason
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Enter feedback or mandatory rejection reason to communicate with the seller..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-border-hover text-xs text-foreground focus:border-primary outline-none resize-none"
                />
              </div>

              {/* 6. Admin Action Decision Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-border">
                {selectedInquiry.status !== 'suspended' && (
                  <button
                    type="button"
                    onClick={() => handleTriggerConfirm('suspended')}
                    disabled={isUpdating}
                    className="px-4 py-2.5 border border-error/20 hover:bg-error-bg text-error text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Suspend Seller
                  </button>
                )}

                {selectedInquiry.status !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => handleTriggerConfirm('rejected')}
                    disabled={isUpdating}
                    className="px-5 py-2.5 bg-error-bg hover:bg-error-bg border border-rose-300 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-4 h-4 text-error" />
                    <span>Reject Application</span>
                  </button>
                )}

                {selectedInquiry.status !== 'approved' && (
                  <button
                    type="button"
                    onClick={() => handleTriggerConfirm('approved')}
                    disabled={isUpdating}
                    className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-white" />
                    <span>Approve Seller Account</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-3xl border border-border p-16 text-center space-y-3">
              <Building2 className="w-12 h-12 text-foreground-muted mx-auto" />
              <h3 className="text-sm font-black text-foreground">Select an application to inspect</h3>
              <p className="text-xs text-foreground-muted max-w-sm mx-auto">
                Click on any seller application from the list on the left to review their verification documents, PAN, GSTIN, and take approval actions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-border shadow-2xl text-left">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                confirmModal.action === 'approved' 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-error-bg text-error'
              }`}>
                {confirmModal.action === 'approved' ? (
                  <ShieldCheck className="w-6 h-6 text-primary" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-error" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground leading-tight">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-foreground-muted mt-0.5">Please confirm your decision</p>
              </div>
            </div>

            <p className="text-xs text-foreground leading-relaxed bg-surface-muted p-4 rounded-2xl border border-border">
              {confirmModal.description}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ ...confirmModal, open: false })}
                disabled={isUpdating}
                className="px-5 py-2.5 border border-border-hover hover:bg-surface-muted text-foreground text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={executeConfirmedAction}
                disabled={isUpdating}
                className={`px-6 py-2.5 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-2 cursor-pointer ${
                  confirmModal.action === 'approved'
                    ? 'bg-primary hover:bg-primary-hover'
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
