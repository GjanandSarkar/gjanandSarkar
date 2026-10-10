"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Edit3,
  LogIn,
  CreditCard,
  FileCheck,
  AlertTriangle,
  Upload
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { submitSellerInquiry, getMySellerInquiry, SellerInquiry } from '@/lib/api/sellers';
import { validatePhoneNumber, formatPhoneInput } from '@/lib/utils/phone';
import { CATEGORY_NAMES } from '@/lib/constants/categories';

export default function BecomeSellerPage() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const isAuthLoading = useStore((s) => s.isAuthLoading);

  // Status check & existing application
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [existingInquiry, setExistingInquiry] = useState<SellerInquiry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [submissionSuccessMsg, setSubmissionSuccessMsg] = useState('');

  // Form State
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateOrigin, setStateOrigin] = useState('Gujarat');
  const [pincode, setPincode] = useState('');
  const [businessType, setBusinessType] = useState('sole_proprietorship');
  const [category, setCategory] = useState(CATEGORY_NAMES[0]);
  const [productRange, setProductRange] = useState('');
  const [monthlyVolume, setMonthlyVolume] = useState('500 - 1,000 Units per month');
  const [fssaiNumber, setFssaiNumber] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Status & Submission
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  const businessTypes = [
    { id: 'sole_proprietorship', label: 'Sole Proprietorship' },
    { id: 'partnership', label: 'Partnership Firm' },
    { id: 'private_limited', label: 'Private Limited Company (Pvt Ltd)' },
    { id: 'llp', label: 'Limited Liability Partnership (LLP)' },
    { id: 'cooperative', label: 'Farmer Producer Organisation (FPO) / Cooperative' },
    { id: 'individual', label: 'Individual / Home Producer' },
  ];

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
    if (inq.phone) setPhone(inq.phone.replace(/\D/g, '').slice(-10));
    if (inq.email) setEmail(inq.email);
    if (inq.business_address) setBusinessAddress(inq.business_address);
    if (inq.city) setCity(inq.city);
    if (inq.state) setStateOrigin(inq.state);
    if (inq.pincode) setPincode(inq.pincode);
    if (inq.business_type) setBusinessType(inq.business_type);
    if (inq.category) setCategory(inq.category);
    if (inq.product_range) setProductRange(inq.product_range);
    if (inq.monthly_volume) setMonthlyVolume(inq.monthly_volume);
    if (inq.fssai_number) setFssaiNumber(inq.fssai_number);
    if (inq.gstin) setGstin(inq.gstin);
    if (inq.pan) setPan(inq.pan);
    if (inq.business_documents && inq.business_documents.length > 0) {
      setDocumentUrl(inq.business_documents[0]?.url || '');
    }
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
          if (!phone && user.phone) setPhone(user.phone.replace(/\D/g, '').slice(-10));
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
      if (!user) {
        // Redirect unauthenticated user to login with return parameter
        router.push('/login?redirect=/become-seller');
      } else {
        checkApplicationStatus();
      }
    }
  }, [isAuthLoading, user?.id]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkApplicationStatus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmissionSuccessMsg('');

    if (!user) {
      router.push('/login?redirect=/become-seller');
      return;
    }

    if (!fullName.trim()) {
      setError('Please enter contact person / owner name');
      return;
    }
    if (!businessName.trim()) {
      setError('Please enter your business, brand, or store name');
      return;
    }
    const cleanPhoneDigits = phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhoneDigits || cleanPhoneDigits.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhoneDigits)) {
      setError('Please enter a valid 10-digit Indian mobile number (e.g. 9825123456)');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid business email address');
      return;
    }
    if (!businessAddress.trim()) {
      setError('Please enter your business / office / farm address');
      return;
    }
    if (!city.trim()) {
      setError('Please enter your business city / town');
      return;
    }
    if (!pincode.trim() || pincode.trim().length !== 6 || !/^\d{6}$/.test(pincode.trim())) {
      setError('Please enter a valid 6-digit postal pincode');
      return;
    }
    if (pan.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(pan.trim())) {
      setError('Invalid PAN format. Standard PAN is 10 characters (e.g. ABCDE1234F)');
      return;
    }
    if (gstin.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(gstin.trim())) {
      setError('Invalid GSTIN format. Standard GSTIN is 15 characters (e.g. 24AAAAA0000A1Z5)');
      return;
    }

    setIsLoading(true);

    try {
      const docs = documentUrl.trim()
        ? [{ name: 'Business Verification Document', url: documentUrl.trim(), uploadedAt: new Date().toISOString() }]
        : [];

      const res = await submitSellerInquiry({
        userId: user?.id,
        fullName: fullName.trim(),
        businessName: businessName.trim(),
        phone: cleanPhoneDigits,
        email: email.trim().toLowerCase(),
        businessAddress: businessAddress.trim(),
        city: city.trim(),
        state: stateOrigin,
        pincode: pincode.trim(),
        businessType,
        category,
        productRange: productRange.trim(),
        monthlyVolume,
        gstin: gstin.trim().toUpperCase() || undefined,
        pan: pan.trim().toUpperCase() || undefined,
        fssaiNumber: fssaiNumber.trim() || undefined,
        businessDocuments: docs,
        notes: notes.trim(),
      });

      if (res.success && res.inquiry) {
        setExistingInquiry(res.inquiry);
        setIsEditing(false);
        setSubmissionSuccessMsg('Your seller application has been submitted successfully and is awaiting admin approval.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const cleanPhone = (p: string) => p.replace(/\D/g, '').slice(-10);

  const handleCopyId = () => {
    if (existingInquiry?.id) {
      navigator.clipboard.writeText(existingInquiry.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  // If user is logged out, show clean login redirect view
  if (!isAuthLoading && !user) {
    return (
      <div className="min-h-screen bg-[#fafaf8] py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-xl p-8 sm:p-12 text-center max-w-md mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#0f3e26]/10 text-[#0f3e26] flex items-center justify-center mx-auto">
            <Store className="w-8 h-8 text-[#0f3e26]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900">Sign In to Become a Seller</h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              Please sign in to your Gjanand Sarkar account to submit and track your seller registration application.
            </p>
          </div>
          <Link
            href="/login?redirect=/become-seller"
            className="w-full py-3.5 px-6 bg-[#0f3e26] hover:bg-[#144f31] text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <LogIn className="w-4 h-4 text-[#c88a23]" />
            <span>Sign In to Continue</span>
          </Link>
          <div className="pt-2">
            <Link href="/home" className="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">
              Return to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf8] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Top Hero Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0f3e26]/10 border border-[#0f3e26]/20 text-[#0f3e26] text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-[#c88a23]" />
            <span>Marketplace Seller Onboarding</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0f3e26] tracking-tight leading-tight">
            Become a Verified Seller on Gjanand Sarkar
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Expand your business across India with verified merchant privileges, dedicated delivery logistics, and transparent payouts. Submit your seller application below for admin review.
          </p>
        </div>

        {/* 3-Step Manual Onboarding Workflow Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0f3e26] flex items-center justify-center font-black text-sm mb-3">
              01
            </div>
            <h3 className="text-sm font-black text-gray-900 mb-1">Submit Application</h3>
            <p className="text-xs text-gray-500 leading-normal">
              Provide your business name, address, GSTIN, PAN, and verification documents.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#c88a23]/30 shadow-2xs relative">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#c88a23] flex items-center justify-center font-black text-sm mb-3">
              02
            </div>
            <h3 className="text-sm font-black text-gray-900 mb-1">Admin Verification</h3>
            <p className="text-xs text-gray-500 leading-normal">
              Our marketplace compliance team reviews your business credentials and licenses.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs relative">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-sm mb-3">
              03
            </div>
            <h3 className="text-sm font-black text-gray-900 mb-1">Seller Dashboard Unlocked</h3>
            <p className="text-xs text-gray-500 leading-normal">
              Once approved, your seller portal is activated to list products and start selling.
            </p>
          </div>
        </div>

        {/* Success Alert Banner when just submitted */}
        {submissionSuccessMsg && (
          <div className="bg-emerald-50 border-2 border-emerald-500/40 rounded-2xl p-5 flex items-center gap-3 text-emerald-900 text-sm font-bold shadow-sm animate-in fade-in">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <p>{submissionSuccessMsg}</p>
            </div>
          </div>
        )}

        {/* ─── Dynamic View Based on Application Status ─────────────────────── */}
        {isCheckingStatus ? (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-12 text-center max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#0f3e26]/10 text-[#0f3e26] flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 animate-spin text-[#0f3e26]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-gray-900">Checking Seller Application Status</h3>
              <p className="text-xs text-gray-500">
                Fetching your registration records and review history from the database...
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
                    Awaiting Admin Approval
                  </h2>
                  <p className="text-sm font-medium text-gray-700 leading-relaxed max-w-lg mx-auto bg-amber-50/60 p-4 rounded-2xl border border-amber-200/60">
                    Your seller application has been submitted successfully and is awaiting admin approval. Duplicate submissions are prevented while an application is pending.
                  </p>
                </div>

                {/* Inquiry Details Summary Card */}
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 text-left space-y-3 max-w-lg mx-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                    <div>
                      <p className="text-[10px] uppercase font-black text-gray-400">Business Name</p>
                      <p className="text-base font-black text-gray-900">{existingInquiry.business_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-black text-gray-400">Application ID</p>
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

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-400 font-bold block text-[10px] uppercase">Contact Person</span>
                      <span className="font-semibold text-gray-900">{existingInquiry.full_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold block text-[10px] uppercase">Mobile Number</span>
                      <span className="font-semibold text-gray-900 font-mono">+91 {existingInquiry.phone}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold block text-[10px] uppercase">Category</span>
                      <span className="font-semibold text-gray-900">{existingInquiry.category}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold block text-[10px] uppercase">Business Type</span>
                      <span className="font-semibold text-gray-900 capitalize">{existingInquiry.business_type?.replace(/_/g, ' ') || 'Sole Proprietorship'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400 font-bold block text-[10px] uppercase">Submitted Date</span>
                      <span className="font-semibold text-gray-900">{new Date(existingInquiry.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
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
                      <span>The admin team verifies your business details, PAN, and applicable GSTIN.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-[#c88a23]">•</span>
                      <span>Upon approval, your seller account is activated and your seller dashboard is unlocked automatically.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-[#c88a23]">•</span>
                      <span>You will receive an in-app notification and email once a decision is made.</span>
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
                    Congratulations! Your seller registration application has been approved by admin. Your seller dashboard is active and ready for product submissions.
                  </p>
                </div>

                {/* Approved Store Badge */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between gap-4 max-w-md mx-auto text-left">
                  <div>
                    <p className="text-[10px] uppercase font-black text-gray-400">Verified Seller Account</p>
                    <p className="text-base font-black text-[#0f3e26]">{existingInquiry.business_name}</p>
                    <p className="text-xs text-gray-500 font-medium">Category: {existingInquiry.category}</p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-black">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Active Seller</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Link
                    href="/seller/dashboard"
                    className="w-full sm:w-auto px-8 py-3.5 bg-[#0f3e26] hover:bg-[#144f31] text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Store className="w-4 h-4 text-[#c88a23]" />
                    <span>Go to Seller Dashboard</span>
                    <ArrowRight className="w-4 h-4 text-white" />
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
                    Application Rejected
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                    Application Review Update
                  </h2>
                  <p className="text-sm font-medium text-gray-700 leading-relaxed max-w-lg mx-auto bg-rose-50/60 p-4 rounded-2xl border border-rose-200/60">
                    Your seller registration application was not approved. You may review the admin feedback below, update your details, and resubmit for review.
                  </p>
                </div>

                {/* Admin Feedback Box */}
                <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-5 text-left space-y-2 max-w-lg mx-auto">
                  <h4 className="text-xs font-black text-rose-950 uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Admin Rejection Reason</span>
                  </h4>
                  <p className="text-xs text-rose-900 leading-relaxed font-semibold">
                    {existingInquiry.admin_notes?.trim() 
                      ? existingInquiry.admin_notes 
                      : 'Business verification could not be completed with the provided information. Please verify your business registration, PAN, and contact details.'}
                  </p>
                </div>

                {/* Permitted Next Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      populateFormWithInquiry(existingInquiry);
                      setIsEditing(true);
                      setError('');
                    }}
                    className="w-full sm:w-auto px-6 py-3.5 bg-[#0f3e26] hover:bg-[#144f31] text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 text-[#c88a23]" />
                    <span>Edit & Resubmit Application</span>
                  </button>

                  <Link
                    href="/home"
                    className="w-full sm:w-auto px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center justify-center transition-colors"
                  >
                    Return to Marketplace
                  </Link>
                </div>
              </div>
            )}

            {/* ─── 4. SUSPENDED SCREEN ──────────────────────────────────────── */}
            {existingInquiry.status === 'suspended' && (
              <div className="bg-white rounded-3xl border-2 border-red-500/30 p-8 sm:p-12 shadow-xl text-center max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95">
                <div className="w-20 h-20 rounded-full bg-red-100 text-red-800 flex items-center justify-center mx-auto shadow-inner">
                  <AlertTriangle className="w-12 h-12 text-red-600" />
                </div>

                <div className="space-y-3">
                  <span className="px-3.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-800 text-xs font-black uppercase tracking-wider">
                    Seller Account Suspended
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                    Account Under Suspension
                  </h2>
                  <p className="text-sm font-medium text-gray-700 leading-relaxed max-w-lg mx-auto bg-red-50/60 p-4 rounded-2xl border border-red-200/60">
                    Your seller account is currently suspended by administration. Product listings are temporarily hidden from the marketplace.
                  </p>
                </div>

                {existingInquiry.admin_notes && (
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 max-w-lg mx-auto text-left">
                    <p className="text-[10px] uppercase font-bold text-gray-400">Suspension Notice</p>
                    <p className="text-xs text-gray-800 mt-1">{existingInquiry.admin_notes}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      populateFormWithInquiry(existingInquiry);
                      setIsEditing(true);
                      setError('');
                    }}
                    className="w-full sm:w-auto px-6 py-3.5 bg-[#0f3e26] hover:bg-[#144f31] text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 text-[#c88a23]" />
                    <span>Update Business Details</span>
                  </button>

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
          /* ─── 5. SELLER REGISTRATION / EDIT FORM ────────────────────────── */
          <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-6 sm:p-10">
            {isEditing && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
                <div className="text-left">
                  <p className="text-xs font-black text-amber-900">Editing Your Application</p>
                  <p className="text-[11px] text-amber-700">
                    Update any requested details or verification documents below. Submitting will send your updated application for admin review.
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
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Section 1: Business Identity */}
              <div>
                <h3 className="text-sm font-black text-[#0f3e26] uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Building2 className="w-4 h-4 text-[#c88a23]" />
                  <span>1. Business & Store Identity</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Seller or Business Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Gir Organic Farms Pvt Ltd"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Business Entity Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none bg-white"
                    >
                      {businessTypes.map((bt) => (
                        <option key={bt.id} value={bt.id}>{bt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Primary Product Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none bg-white"
                    >
                      {categoriesList.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Estimated Monthly Capacity
                    </label>
                    <select
                      value={monthlyVolume}
                      onChange={(e) => setMonthlyVolume(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none bg-white"
                    >
                      {volumeOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Contact Person */}
              <div>
                <h3 className="text-sm font-black text-[#0f3e26] uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Phone className="w-4 h-4 text-[#c88a23]" />
                  <span>2. Contact Person Information</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Contact Person's Full Name <span className="text-rose-500">*</span>
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
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 flex items-center gap-1.5 pointer-events-none text-xs font-bold text-gray-600 select-none">
                        <span>🇮🇳</span>
                        <span>+91</span>
                        <span className="text-gray-300">|</span>
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        required
                        maxLength={10}
                        value={phone}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setPhone(digits);
                        }}
                        placeholder="9825123456"
                        className="w-full pl-[72px] pr-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-medium focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Enter 10-digit mobile number without +91 prefix
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Business Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contact@girfarms.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Business Address */}
              <div>
                <h3 className="text-sm font-black text-[#0f3e26] uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                  <MapPin className="w-4 h-4 text-[#c88a23]" />
                  <span>3. Registered Business Address</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Address (Shop / Survey No / Building / Street) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                      placeholder="Plot No. 42, GIDC Industrial Estate, Highway Road"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        City / Town <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Palanpur"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        State <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={stateOrigin}
                        onChange={(e) => setStateOrigin(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none bg-white"
                      >
                        {statesList.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Postal Pincode <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                        placeholder="385001"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Tax & Regulatory Verification */}
              <div>
                <h3 className="text-sm font-black text-[#0f3e26] uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                  <CreditCard className="w-4 h-4 text-[#c88a23]" />
                  <span>4. Tax & Business Verification Details</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Business PAN
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={pan}
                      onChange={(e) => setPan(e.target.value.toUpperCase())}
                      placeholder="ABCDE1234F"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-mono uppercase focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">10-character PAN of business/proprietor</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      GSTIN (If Applicable)
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      placeholder="24AAAAA0000A1Z5"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-mono uppercase focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Optional for unregistered small producers</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      FSSAI License / Trade Reg. No.
                    </label>
                    <input
                      type="text"
                      value={fssaiNumber}
                      onChange={(e) => setFssaiNumber(e.target.value)}
                      placeholder="e.g. 10723000000000"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-mono focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Required for food, dairy, and grocery items</p>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Verification Document / License Link
                  </label>
                  <input
                    type="url"
                    value={documentUrl}
                    onChange={(e) => setDocumentUrl(e.target.value)}
                    placeholder="https://... (Cloud drive link or certificate URL)"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Upload your GST certificate, FSSAI license, or Shop Establishment document to a secure cloud drive and share the link.
                  </p>
                </div>
              </div>

              {/* Section 5: Products & Notes */}
              <div>
                <h3 className="text-sm font-black text-[#0f3e26] uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-gray-100">
                  <FileText className="w-4 h-4 text-[#c88a23]" />
                  <span>5. Products Overview & Remarks</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Product Range / Proposed Items
                    </label>
                    <input
                      type="text"
                      value={productRange}
                      onChange={(e) => setProductRange(e.target.value)}
                      placeholder="e.g. A2 Bilona Cow Ghee, Organic Butter, Artisanal Honey"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Additional Notes for Admin Team
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Tell us about your production facilities, cold storage, delivery readiness, or certifications..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:border-[#0f3e26] focus:ring-1 focus:ring-[#0f3e26] outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-gray-100">
                <Link
                  href="/home"
                  className="w-full sm:w-auto px-6 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold rounded-xl text-center transition-colors"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#0f3e26] hover:bg-[#144f31] text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#c88a23]" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Seller Application</span>
                      <ArrowRight className="w-4 h-4 text-[#c88a23]" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
