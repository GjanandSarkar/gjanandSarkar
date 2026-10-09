"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  ArrowRight, 
  Phone, 
  Mail, 
  MapPin, 
  Truck, 
  Award,
  Loader2,
  Store,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  HelpCircle,
  Copy,
  MessageCircle,
  RefreshCw,
  Edit3
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { submitSellerInquiry, getMySellerInquiry, SellerInquiry } from '@/lib/api/sellers';
import { validatePhoneNumber, formatPhoneInput } from '@/lib/utils/phone';
import { CATEGORY_NAMES } from '@/lib/constants/categories';

export default function BecomeSellerPage() {
  const user = useStore((s) => s.user);
  const isAuthLoading = useStore((s) => s.isAuthLoading);

  // Status check & existing application
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [existingInquiry, setExistingInquiry] = useState<SellerInquiry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form State
  const [fullName, setFullName] = useState(user?.name || '');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [city, setCity] = useState('');
  const [stateOrigin, setStateOrigin] = useState('Gujarat');
  const [category, setCategory] = useState(CATEGORY_NAMES[0]);
  const [productRange, setProductRange] = useState('');
  const [monthlyVolume, setMonthlyVolume] = useState('500 - 1,000 Liters / Units');
  const [fssaiNumber, setFssaiNumber] = useState('');
  const [gstin, setGstin] = useState('');
  const [notes, setNotes] = useState('');

  // Status & Submission
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  const statesList = [
    'Gujarat', 'Rajasthan', 'Punjab', 'Maharashtra', 'Kerala', 
    'Tamil Nadu', 'Kashmir', 'Himachal Pradesh', 'West Bengal', 'Karnataka', 'Madhya Pradesh', 'Uttar Pradesh'
  ];

  const categoriesList = CATEGORY_NAMES;

  const volumeOptions = [
    'Under 200 units per month',
    '200 - 500 units per month',
    '500 - 1,000 units per month',
    '1,000 - 5,000 units per month',
    '5,000+ units per month (commercial scale)'
  ];

  const populateFormWithInquiry = (inq: SellerInquiry) => {
    if (inq.full_name) setFullName(inq.full_name);
    if (inq.business_name) setBusinessName(inq.business_name);
    if (inq.phone) setPhone(inq.phone);
    if (inq.email) setEmail(inq.email);
    if (inq.city) setCity(inq.city);
    if (inq.state) setStateOrigin(inq.state);
    if (inq.category) setCategory(inq.category);
    if (inq.product_range) setProductRange(inq.product_range);
    if (inq.monthly_volume) setMonthlyVolume(inq.monthly_volume);
    if (inq.fssai_number) setFssaiNumber(inq.fssai_number);
    if (inq.gstin) setGstin(inq.gstin);
    if (inq.notes) setNotes(inq.notes);
  };

  const checkApplicationStatus = async () => {
    try {
      const inq = await getMySellerInquiry();
      if (inq) {
        setExistingInquiry(inq);
        populateFormWithInquiry(inq);
      } else {
        setExistingInquiry(null);
        if (user) {
          if (!fullName && user.name) setFullName(user.name);
          if (!email && user.email) setEmail(user.email);
          if (!phone && user.phone) setPhone(user.phone);
        }
      }
    } catch (err) {
      console.error('Failed to fetch seller application status:', err);
    } finally {
      setIsCheckingStatus(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading) {
      checkApplicationStatus();
    }
  }, [isAuthLoading, user?.id]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkApplicationStatus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!businessName.trim()) {
      setError('Please enter your farm, brand, or business name');
      return;
    }
    const validPhone = validatePhoneNumber(phone);
    if (!validPhone.isValid) {
      setError('Enter a valid Indian mobile number');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const res = await submitSellerInquiry({
        userId: user?.id,
        fullName,
        businessName,
        phone,
        email,
        city,
        state: stateOrigin,
        category,
        productRange,
        monthlyVolume,
        fssaiNumber,
        gstin,
        notes
      });

      if (res.success && res.inquiry) {
        setExistingInquiry(res.inquiry);
        setIsEditing(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyId = () => {
    if (existingInquiry?.id) {
      navigator.clipboard.writeText(existingInquiry.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf8] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Top Hero Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0f3e26]/10 border border-[#0f3e26]/20 text-[#0f3e26] text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-[#c88a23]" />
            <span>Direct-from-Source Vendor Partnership</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0f3e26] tracking-tight leading-tight">
            Become a Verified Seller on Gjanand Sarkar
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Gjanand Sarkar works with exactly one partner company per category.
            If your category is open, we want to hear from you. Submit your
            application below and our onboarding team will contact you within
            24–48 hours to verify your business and discuss terms.
          </p>
        </div>

        {/* 3-Step Manual Onboarding Workflow Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0f3e26] flex items-center justify-center font-black text-sm mb-3">
              01
            </div>
            <h3 className="text-sm font-black text-gray-900 mb-1">Submit Seller Inquiry</h3>
            <p className="text-xs text-gray-500 leading-normal">
              Tell us about your company, the category you want to own, and your monthly production capacity.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#c88a23]/30 shadow-2xs relative">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#c88a23] flex items-center justify-center font-black text-sm mb-3">
              02
            </div>
            <h3 className="text-sm font-black text-gray-900 mb-1">Manual Quality Verification</h3>
            <p className="text-xs text-gray-500 leading-normal">
              We call or WhatsApp you within 24–48h to verify registration, GST, category licences and product samples.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs relative">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-sm mb-3">
              03
            </div>
            <h3 className="text-sm font-black text-gray-900 mb-1">Store Launch & Pan-India Sales</h3>
            <p className="text-xs text-gray-500 leading-normal">
              Once approved, your brand storefront is activated with integrated nationwide cold-chain delivery.
            </p>
          </div>
        </div>

        {/* ─── Dynamic View Based on Application Status ─────────────────────── */}
        {isCheckingStatus ? (
          /* Loading Indicator: Prevents blank form flashing on refresh */
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-12 text-center max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#0f3e26]/10 text-[#0f3e26] flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 animate-spin text-[#0f3e26]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-gray-900">Checking Seller Application Status</h3>
              <p className="text-xs text-gray-500">
                Verifying your account and fetching your latest registration records from the database...
              </p>
            </div>
          </div>
        ) : existingInquiry && !isEditing ? (
          <>
            {/* ─── 1. PENDING / CONTACTED SCREEN ───────────────────────────── */}
            {(existingInquiry.status === 'pending' || existingInquiry.status === 'contacted') && (
              <div className="bg-white rounded-3xl border-2 border-amber-500/30 p-8 sm:p-12 shadow-xl text-center max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95">
                <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-inner">
                  <Clock className="w-12 h-12 text-amber-600 animate-pulse" />
                </div>

                <div className="space-y-3">
                  <span className="px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black uppercase tracking-wider">
                    Application Pending Review
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                    Application Under Review
                  </h2>
                  <p className="text-sm font-medium text-gray-700 leading-relaxed max-w-lg mx-auto bg-amber-50/60 p-4 rounded-2xl border border-amber-200/60">
                    Your seller registration application has been submitted successfully and is currently under review by our admin team. You do not need to fill out the form again. We will update your status once the review is complete.
                  </p>
                </div>

                {/* Inquiry Details Summary Card */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-md mx-auto text-left">
                  <div>
                    <p className="text-[10px] uppercase font-black text-gray-400">Business / Farm Name</p>
                    <p className="text-sm font-black text-gray-900">{existingInquiry.business_name}</p>
                    <p className="text-[11px] text-gray-500 font-medium">Category: {existingInquiry.category}</p>
                  </div>
                  <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
                    <p className="text-[10px] uppercase font-black text-gray-400">Inquiry ID</p>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 flex items-center gap-1.5 transition-colors shadow-2xs font-mono"
                      title="Click to copy ID"
                    >
                      {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{existingInquiry.id.slice(0, 8)}...</span>
                    </button>
                  </div>
                </div>

                {/* What Happens Next Card */}
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 text-left space-y-3">
                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#c88a23]" />
                    <span>What Happens Next?</span>
                  </h4>
                  <ul className="text-xs text-amber-900 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-[#c88a23]">•</span>
                      <span>Our Onboarding Manager will call / WhatsApp you at <strong>+91 {existingInquiry.phone}</strong> within <strong>24 to 48 business hours</strong>.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-[#c88a23]">•</span>
                      <span>We will verify your business registration, GST, category licences, and product samples.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-[#c88a23]">•</span>
                      <span>Once approved by the admin team, your seller dashboard will be unlocked automatically.</span>
                    </li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="w-full sm:w-auto px-5 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-2xs transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : 'text-gray-500'}`} />
                    <span>{isRefreshing ? 'Checking Status...' : 'Refresh Status'}</span>
                  </button>

                  <a
                    href={`https://wa.me/919825123456?text=${encodeURIComponent(`Hello Gjanand Sarkar team, I have submitted a seller application (ID: ${existingInquiry.id}) for ${existingInquiry.business_name}. Could you please check the review status?`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-6 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Quick WhatsApp Verification</span>
                  </a>

                  <Link
                    href="/home"
                    className="w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center justify-center transition-colors"
                  >
                    Return to Marketplace
                  </Link>
                </div>
              </div>
            )}

            {/* ─── 2. APPROVED SCREEN ───────────────────────────────────────── */}
            {existingInquiry.status === 'approved' && (
              <div className="bg-white rounded-3xl border-2 border-emerald-500/40 p-8 sm:p-12 shadow-xl text-center max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95">
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-[#0f3e26] flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                </div>

                <div className="space-y-3">
                  <span className="px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black uppercase tracking-wider">
                    Application Approved
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                    Welcome to Gjanand Sarkar!
                  </h2>
                  <p className="text-sm font-semibold text-emerald-950 leading-relaxed max-w-lg mx-auto bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
                    Congratulations! Your seller registration application has been approved. You can now access your seller dashboard.
                  </p>
                </div>

                {/* Approved Store Badge */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between gap-4 max-w-md mx-auto text-left">
                  <div>
                    <p className="text-[10px] uppercase font-black text-gray-400">Verified Brand / Farm</p>
                    <p className="text-base font-black text-[#0f3e26]">{existingInquiry.business_name}</p>
                    <p className="text-xs text-gray-500 font-medium">Category: {existingInquiry.category}</p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-black">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Active Partner</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Link
                    href="/seller/dashboard"
                    className="w-full sm:w-auto px-8 py-3.5 bg-[#0f3e26] hover:bg-[#144f31] text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <span>Access Seller Dashboard</span>
                    <ArrowRight className="w-4 h-4 text-[#c88a23]" />
                  </Link>

                  <Link
                    href="/home"
                    className="w-full sm:w-auto px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center justify-center transition-colors"
                  >
                    Browse Marketplace
                  </Link>
                </div>
              </div>
            )}

            {/* ─── 3. REJECTED SCREEN ───────────────────────────────────────── */}
            {existingInquiry.status === 'rejected' && (
              <div className="bg-white rounded-3xl border-2 border-rose-500/30 p-8 sm:p-12 shadow-xl text-center max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95">
                <div className="w-20 h-20 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center mx-auto shadow-inner">
                  <XCircle className="w-12 h-12 text-rose-600" />
                </div>

                <div className="space-y-3">
                  <span className="px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-black uppercase tracking-wider">
                    Application Not Approved
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                    Application Status Update
                  </h2>
                  <p className="text-sm font-medium text-gray-700 leading-relaxed max-w-lg mx-auto bg-rose-50/60 p-4 rounded-2xl border border-rose-200/60">
                    Your seller registration application was not approved. Please review the admin's feedback and follow the available next steps.
                  </p>
                </div>

                {/* Admin Feedback Box */}
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 text-left space-y-2 max-w-lg mx-auto">
                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Admin Feedback</span>
                  </h4>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    {existingInquiry.admin_notes?.trim() 
                      ? existingInquiry.admin_notes 
                      : 'No specific comments provided. Please review your business licenses, FSSAI registration, and contact information before resubmitting.'}
                  </p>
                </div>

                {/* Permitted Next Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      populateFormWithInquiry(existingInquiry);
                      setIsEditing(true);
                    }}
                    className="w-full sm:w-auto px-6 py-3.5 bg-[#0f3e26] hover:bg-[#144f31] text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 text-[#c88a23]" />
                    <span>Edit & Resubmit Application</span>
                  </button>

                  <a
                    href={`https://wa.me/919825123456?text=${encodeURIComponent(`Hello Gjanand Sarkar team, I have questions regarding my seller application (ID: ${existingInquiry.id}) for ${existingInquiry.business_name}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-gray-600" />
                    <span>Contact Support</span>
                  </a>

                  <Link
                    href="/home"
                    className="w-full sm:w-auto px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center justify-center transition-colors"
                  >
                    Return to Marketplace
                  </Link>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ─── 4. SELLER REGISTRATION / EDIT FORM ────────────────────────── */
          <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-6 sm:p-10">
            {isEditing && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
                <div className="text-left">
                  <p className="text-xs font-black text-amber-900">Editing Your Previous Application</p>
                  <p className="text-[11px] text-amber-700">
                    Update any requested details or licenses below. Submitting will send your updated application for admin review.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-amber-100 transition-colors"
                >
                  Cancel Edit
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold">
                  {error}
                </div>
              )}

              {/* Section 1: Contact Information */}
              <div>
                <h3 className="text-sm font-black text-[#0f3e26] uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Phone className="w-4 h-4 text-[#c88a23]" />
                  <span>1. Contact & Owner Details</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Full Name / Owner Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Bhavesh Bhai Patel"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Mobile / WhatsApp Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-xs font-bold">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        value={phone.replace(/^\+91/, '')}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setPhone(`+91${digits}`);
                        }}
                        placeholder="9825012345"
                        maxLength={10}
                        className="w-full px-4 py-2.5 rounded-r-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Our verification team will call or message this number.</p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. contact@yourcompany.in"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Farm / Brand / Business Profile */}
              <div>
                <h3 className="text-sm font-black text-[#0f3e26] uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Building2 className="w-4 h-4 text-[#c88a23]" />
                  <span>2. Farm & Brand Credentials</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Brand / Farm / Business Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Shree Industries Pvt Ltd"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      State Origin <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={stateOrigin}
                      onChange={(e) => setStateOrigin(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] outline-none bg-white font-medium"
                    >
                      {statesList.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      City / District / Village
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Junagadh / Kutch"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Primary Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] outline-none bg-white font-medium"
                    >
                      {categoriesList.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Estimated Monthly Capacity / Production
                    </label>
                    <select
                      value={monthlyVolume}
                      onChange={(e) => setMonthlyVolume(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] outline-none bg-white font-medium"
                    >
                      {volumeOptions.map((vol) => (
                        <option key={vol} value={vol}>{vol}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Product Specialties & Product Range
                    </label>
                    <input
                      type="text"
                      value={productRange}
                      onChange={(e) => setProductRange(e.target.value)}
                      placeholder="e.g. Stainless steel cookware, cold-pressed sesame oil, handloom cotton sarees"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Purity & Quality Standards */}
              <div>
                <h3 className="text-sm font-black text-[#0f3e26] uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Award className="w-4 h-4 text-[#c88a23]" />
                  <span>3. Quality Verification & Licenses</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      FSSAI License Number (food &amp; beverage categories only)
                    </label>
                    <input
                      type="text"
                      value={fssaiNumber}
                      onChange={(e) => setFssaiNumber(e.target.value)}
                      placeholder="14-digit FSSAI Number"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] outline-none uppercase font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      GSTIN (Optional)
                    </label>
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      placeholder="15-digit GSTIN"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] outline-none uppercase font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Describe Your Products, Certifications and Manufacturing Process
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Tell us how your products are made, what certifications you hold, your manufacturing or sourcing setup, and why you should own this category..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Terms & Submit Button */}
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[11px] text-gray-500 max-w-md text-center sm:text-left">
                  By submitting this inquiry, you agree to undergo our quality audit and adhere to Gjanand Sarkar 100% Purity Guidelines.
                </p>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#0f3e26] hover:bg-[#144f31] text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isEditing ? 'Updating Application...' : 'Submitting Inquiry...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isEditing ? 'Resubmit Seller Application' : 'Submit Seller Inquiry'}</span>
                      <ArrowRight className="w-4 h-4 text-[#c88a23]" />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200">
            <ShieldCheck className="w-6 h-6 text-[#0f3e26] mb-2" />
            <h4 className="text-xs font-black text-gray-900 mb-1">Purity Verified Seal</h4>
            <p className="text-[11px] text-gray-500">Every batch is certified so conscious customers buy with full trust.</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200">
            <Truck className="w-6 h-6 text-[#c88a23] mb-2" />
            <h4 className="text-xs font-black text-gray-900 mb-1">Cold-Chain Logistics</h4>
            <p className="text-[11px] text-gray-500">Temperature-controlled pan-India shipping handled end-to-end.</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200">
            <Store className="w-6 h-6 text-[#0f3e26] mb-2" />
            <h4 className="text-xs font-black text-gray-900 mb-1">Direct Brand Store</h4>
            <p className="text-[11px] text-gray-500">Dedicated storefront with full brand identity and storytelling.</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200">
            <Award className="w-6 h-6 text-[#c88a23] mb-2" />
            <h4 className="text-xs font-black text-gray-900 mb-1">Weekly Payouts</h4>
            <p className="text-[11px] text-gray-500">Direct-to-bank settlement every 7 days with lowest SaaS commission.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
