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
  ArrowRight,
  Eye,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSellerInquiries, updateSellerInquiryStatus, SellerInquiry } from '@/lib/api/sellers';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTable } from '@/components/admin/AdminTable';
import { categoryColors } from '@/lib/constants/categories';

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
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  
  // Status Badge Component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-900 border border-red-300 dark:bg-red-950/40 dark:text-red-300">
            <XCircle className="w-3.5 h-3.5 text-red-700" />
            Rejected
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300">
            <ShieldAlert className="w-3.5 h-3.5 text-zinc-600" />
            Suspended
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            Pending Review
          </span>
        );
    }
  };

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

  const handleInspectInquiry = (inq: SellerInquiry) => {
    setSelectedInquiry(inq);
    setAdminNotes(inq.admin_notes || '');
    setActionSuccess('');
    setIsDetailOpen(true);
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

      /* One company per category is a rule the admin may knowingly override.
         The API refuses the first attempt with CATEGORY_CONFLICT and names
         the existing partner; approving again with the confirmation flag
         goes through. */
      let res;
      try {
        res = await updateSellerInquiryStatus(selectedInquiry.id, targetStatus, adminNotes);
      } catch (err: any) {
        if (err?.code !== 'CATEGORY_CONFLICT') throw err;
        if (!window.confirm(`${err.message}\n\nApprove anyway?`)) {
          setIsUpdating(false);
          return;
        }
        res = await updateSellerInquiryStatus(selectedInquiry.id, targetStatus, adminNotes, {
          confirmCategoryConflict: true,
        });
      }
      
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
<<<<<<< HEAD
    <div className="flex flex-col min-h-screen">
      {/* Standard Admin Header */}
      <AdminHeader
        title={
          <div className="flex items-center gap-3">
            <span>Seller Applications</span>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300">
                {pendingCount} Pending Review
              </span>
            )}
=======
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Marketplace Onboarding</span>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
          </div>
        }
        subtitle="Review business credentials, PAN, GSTIN, and compliance documents to approve or reject merchant accounts"
        onRefresh={loadInquiries}
        isRefreshing={isLoading}
      />

      <div className="px-6 md:px-10 py-6 space-y-6">

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-surface rounded-2xl border border-border shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning-bg text-warning flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground-muted uppercase tracking-wider">Pending Review</p>
            <p className="text-xl font-semibold text-foreground">{pendingCount}</p>
          </div>
        </div>

        <div className="p-4 bg-surface rounded-2xl border border-border shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success-bg text-success flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground-muted uppercase tracking-wider">Approved Sellers</p>
            <p className="text-xl font-semibold text-foreground">{approvedCount}</p>
          </div>
        </div>

        <div className="p-4 bg-surface rounded-2xl border border-border shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-error-bg text-error flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground-muted uppercase tracking-wider">Rejected</p>
            <p className="text-xl font-semibold text-foreground">{rejectedCount}</p>
          </div>
        </div>

<<<<<<< HEAD
        <div className="p-4 bg-surface rounded-2xl border border-border shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-error-bg text-error flex items-center justify-center font-bold">
=======
        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-danger flex items-center justify-center font-bold">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground-muted uppercase tracking-wider">Suspended</p>
            <p className="text-xl font-semibold text-foreground">{suspendedCount}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar (Edit #23 & #24) */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search seller by business name, applicant, email, phone, PAN..."
            className="w-full pl-10 pr-4 h-10 bg-surface rounded-xl border border-border/90 text-xs text-foreground placeholder:text-foreground-muted focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-2xs"
          />
        </div>

        {/* Status Filter Pills with compact h-8 height */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full sm:w-auto">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedStatus(f.id)}
              className={`whitespace-nowrap h-8 px-3.5 rounded-full text-[12px] font-bold transition-all shrink-0 cursor-pointer flex items-center justify-center border ${
                selectedStatus === f.id
<<<<<<< HEAD
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-surface border-border/80 text-foreground-muted hover:text-foreground hover:border-border-hover'
=======
                  ? 'bg-primary text-white shadow-2xs'
                  : 'text-gray-600 hover:bg-gray-100'
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
<<<<<<< HEAD
=======

        <div className="relative min-w-[260px]">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search seller, email, phone, or ID..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-primary outline-none"
          />
        </div>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

<<<<<<< HEAD
      {/* Vendor Inquiries AdminTable */}
      <AdminTable
        columns={[
          { header: 'Applicant & Business' },
          { header: 'Category' },
          { header: 'Location' },
          { header: 'Tax / Registration' },
          { header: 'Applied Date' },
          { header: 'Status' },
          { header: 'Action', align: 'right' },
        ]}
        isLoading={isLoading}
        isEmpty={!isLoading && filteredInquiries.length === 0}
        emptyIcon={Building2}
        emptyTitle="No applications match your filter"
        emptyDescription="Applications submitted from the Become a Seller page will appear here."
      >
        {filteredInquiries.map((inq) => {
          const catStyle = categoryColors(inq.category);
          return (
            <tr
              key={inq.id}
              onClick={() => handleInspectInquiry(inq)}
              className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
            >
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20">
                    <Building2 className="w-4 h-4 text-primary" />
=======
      {/* Main Grid: Left List + Right Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Applications List */}
        <div className="lg:col-span-5 space-y-3">
          {isLoading ? (
            <div className="bg-white rounded-2xl p-10 border border-gray-200 text-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
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
                      ? 'bg-emerald-50/40 border-primary shadow-sm'
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
                        ? 'bg-red-100 text-danger border border-red-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {inq.status}
                    </span>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-[13px] leading-tight flex items-center gap-2">
                      <span>{inq.business_name}</span>
                      <span className="text-[10px] text-foreground-muted font-mono">#{inq.id.slice(-6)}</span>
                    </div>
                    <div className="text-[11px] text-foreground-muted flex items-center gap-2 mt-0.5">
                      <span>{inq.full_name}</span>
                      <span>•</span>
                      <span className="font-mono">{inq.phone}</span>
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3.5 whitespace-nowrap min-w-[140px]">
                <span 
                  style={{ backgroundColor: catStyle.bg, color: catStyle.color }}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap border border-black/5"
                >
                  {inq.category}
                </span>
              </td>
              <td className="px-5 py-3.5 whitespace-nowrap">
                <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{inq.city ? `${inq.city}, ${inq.state}` : inq.state}</span>
                </div>
              </td>
              <td className="px-5 py-3.5 whitespace-nowrap">
                <div className="text-xs space-y-0.5">
                  <div className="font-mono font-semibold text-foreground">PAN: {inq.pan || 'N/A'}</div>
                  <div className="font-mono text-[11px] text-foreground-muted">GSTIN: {inq.gstin || 'None'}</div>
                </div>
              </td>
              <td className="px-5 py-3.5 whitespace-nowrap">
                <div className="flex items-center gap-1.5 text-xs text-foreground-muted font-mono">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>{new Date(inq.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </td>
              <td className="px-5 py-3.5 whitespace-nowrap">
                {getStatusBadge(inq.status)}
              </td>
              <td className="px-5 py-3.5 text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInspectInquiry(inq);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:border-primary text-xs font-semibold text-foreground hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-primary" />
                  <span>Review</span>
                </button>
              </td>
            </tr>
          );
        })}
      </AdminTable>

      {/* Inspection Modal / Drawer */}
      <AnimatePresence>
        {isDetailOpen && selectedInquiry && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-surface rounded-2xl border border-border shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 text-left my-8 max-h-[90vh] overflow-y-auto"
            >
              {/* Header Box */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-xl font-bold text-foreground tracking-tight">
                      {selectedInquiry.business_name}
                    </h3>
<<<<<<< HEAD
                    {getStatusBadge(selectedInquiry.status)}
=======
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      selectedInquiry.status === 'approved' 
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedInquiry.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : selectedInquiry.status === 'suspended'
                        ? 'bg-red-100 text-danger'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedInquiry.status}
                    </span>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                  </div>
                  <p className="text-xs text-foreground-muted font-mono mt-1">Application ID: {selectedInquiry.id}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`tel:+91${selectedInquiry.phone}`}
                    className="p-2 rounded-xl border border-border text-foreground hover:bg-surface-muted transition-colors"
                    title="Call Applicant"
                  >
                    <Phone className="w-4 h-4 text-emerald-600" />
                  </a>
                  <a
                    href={`https://wa.me/91${selectedInquiry.phone}?text=` + encodeURIComponent(`Hello ${selectedInquiry.full_name}, this is Gjanand Sarkar Admin team regarding your seller application for ${selectedInquiry.business_name}.`)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl border border-border text-foreground hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                    title="Chat on WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                  </a>
                  <a
                    href={`mailto:${selectedInquiry.email}`}
                    className="p-2 rounded-xl border border-border text-foreground hover:bg-surface-muted transition-colors"
                    title="Send Email"
                  >
<<<<<<< HEAD
                    <Mail className="w-4 h-4 text-sky-600" />
=======
                    <Mail className="w-4 h-4 text-info" />
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                  </a>
                  <button
                    type="button"
                    onClick={() => setIsDetailOpen(false)}
                    className="p-2 rounded-xl border border-border hover:bg-surface-muted text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 1. Owner & Contact Information */}
<<<<<<< HEAD
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-foreground-muted uppercase tracking-wider flex items-center gap-2">
=======
              <div className="space-y-3">
                <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                  <PhoneCall className="w-3.5 h-3.5 text-primary" />
                  <span>Applicant & Contact Details</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-surface-muted p-4 rounded-xl border border-border text-xs">
                  <div>
                    <span className="text-[11px] uppercase font-bold text-foreground-muted block">Contact Person</span>
                    <span className="font-bold text-foreground">{selectedInquiry.full_name}</span>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-foreground-muted block">Mobile Number</span>
                    <span className="font-bold text-foreground font-mono">+91 {selectedInquiry.phone}</span>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-foreground-muted block">Email Address</span>
                    <span className="font-bold text-foreground truncate block">{selectedInquiry.email}</span>
                  </div>
                </div>
              </div>

              {/* 2. Business Address & Structure */}
<<<<<<< HEAD
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-foreground-muted uppercase tracking-wider flex items-center gap-2">
=======
              <div className="space-y-3">
                <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  <span>Business Address & Structure</span>
                </h4>
                
                <div className="bg-surface-muted p-4 rounded-xl border border-border text-xs space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] uppercase font-bold text-foreground-muted block">Business Entity Type</span>
                      <span className="font-bold text-foreground capitalize">{selectedInquiry.business_type?.replace(/_/g, ' ') || 'Sole Proprietorship'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase font-bold text-foreground-muted block">Product Category</span>
                      <span className="font-bold text-foreground">{selectedInquiry.category}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] uppercase font-bold text-foreground-muted block">Full Registered Address</span>
                    <span className="font-medium text-foreground">
                      {selectedInquiry.business_address || 'Address line not specified'}, {selectedInquiry.city || ''}, {selectedInquiry.state} {selectedInquiry.pincode ? `- ${selectedInquiry.pincode}` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Verification Details (PAN, GSTIN, FSSAI, Docs) */}
<<<<<<< HEAD
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-foreground-muted uppercase tracking-wider flex items-center gap-2">
=======
              <div className="space-y-3">
                <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                  <CreditCard className="w-3.5 h-3.5 text-primary" />
                  <span>Tax & Compliance Verification</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-surface-muted p-4 rounded-xl border border-border text-xs">
                  <div>
                    <span className="text-[11px] uppercase font-bold text-foreground-muted block">Business PAN</span>
                    <span className="font-mono font-bold text-foreground">{selectedInquiry.pan || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-foreground-muted block">GSTIN</span>
                    <span className="font-mono font-bold text-foreground">{selectedInquiry.gstin || 'Unregistered / Small'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase font-bold text-foreground-muted block">FSSAI / Reg. No.</span>
                    <span className="font-mono font-bold text-foreground">{selectedInquiry.fssai_number || 'N/A'}</span>
                  </div>
                </div>

                {/* Documents link */}
                {selectedInquiry.business_documents && selectedInquiry.business_documents.length > 0 && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                      <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Submitted Business Verification Document</span>
                    </div>
                    <a
                      href={selectedInquiry.business_documents[0]?.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 bg-surface text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-bold border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 flex items-center gap-1"
                    >
                      <span>View Document</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* 4. Submission & Decision Timestamps */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-surface-muted p-3 rounded-xl border border-border">
                <div>
                  <span className="text-[11px] uppercase font-bold text-foreground-muted block">Application Submitted</span>
                  <span className="font-semibold text-foreground">{new Date(selectedInquiry.created_at).toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-foreground-muted block">Decision / Last Updated</span>
                  <span className="font-semibold text-foreground">{new Date(selectedInquiry.updated_at).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* 5. Remarks & Rejection Reason Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground">
                  Admin Decision Feedback / Rejection Reason
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Enter feedback or mandatory rejection reason to communicate with the seller..."
<<<<<<< HEAD
                  className="w-full px-4 py-2.5 rounded-xl border border-border text-xs text-foreground focus:border-primary outline-none resize-none"
=======
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-300 text-xs text-gray-900 focus:border-primary outline-none resize-none"
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                />
              </div>

              {/* 6. Admin Action Decision Buttons */}
              <div className="pt-3 flex flex-wrap items-center justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-surface-muted text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>

                {selectedInquiry.status !== 'suspended' && (
                  <button
                    type="button"
                    onClick={() => handleTriggerConfirm('suspended')}
                    disabled={isUpdating}
<<<<<<< HEAD
                    className="px-4 py-2 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-700 dark:text-red-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
=======
                    className="px-4 py-2.5 border border-red-200 hover:bg-red-50 text-danger text-xs font-bold rounded-xl transition-colors cursor-pointer"
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                  >
                    Suspend Seller
                  </button>
                )}

                {selectedInquiry.status !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => handleTriggerConfirm('rejected')}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Application</span>
                  </button>
                )}

                {selectedInquiry.status !== 'approved' && (
                  <button
                    type="button"
                    onClick={() => handleTriggerConfirm('approved')}
                    disabled={isUpdating}
<<<<<<< HEAD
                    className="px-5 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
=======
                    className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-white" />
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                    <span>Approve Seller Account</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface rounded-xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-border shadow-2xl text-left">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                confirmModal.action === 'approved' 
<<<<<<< HEAD
                  ? 'bg-success-bg text-primary' 
                  : 'bg-error-bg text-error'
              }`}>
                {confirmModal.action === 'approved' ? (
                  <ShieldCheck className="w-6 h-6 text-success" />
=======
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-rose-100 text-rose-600'
              }`}>
                {confirmModal.action === 'approved' ? (
                  <ShieldCheck className="w-6 h-6 text-primary" />
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                ) : (
                  <AlertTriangle className="w-6 h-6 text-error" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground leading-tight">
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
                className={`px-6 py-2.5 text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-2 cursor-pointer ${
                  confirmModal.action === 'approved'
                    ? 'bg-primary hover:bg-primary-hover'
<<<<<<< HEAD
                    : 'bg-error hover:bg-error'
=======
                    : 'bg-rose-600 hover:bg-rose-700'
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
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
    </div>
  );
}
