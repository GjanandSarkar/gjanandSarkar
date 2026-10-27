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
import { SellerHeroBanner } from '@/components/seller/SellerHeroBanner';

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
      <div className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="bg-surface rounded-xl border border-border/90 shadow-xl p-8 sm:p-12 text-center max-w-md mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Sign In to Become a Seller</h2>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Please sign in to your Gjanand Sarkar account to submit and track your seller registration application.
            </p>
          </div>
          <Link
            href="/login?redirect=/become-seller"
            className="w-full py-3.5 px-6 bg-primary hover:bg-primary-hover text-on-primary text-xs font-semibold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <LogIn className="w-4 h-4 text-secondary" />
            <span>Sign In to Continue</span>
          </Link>
          <div className="pt-2">
            <Link href="/home" className="text-xs font-bold text-foreground-muted hover:text-foreground transition-colors">
              Return to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Authentic Image 3 Showcase Banner */}
      <SellerHeroBanner />

      <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-10">

        {/* 3-Step Manual Onboarding Workflow Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface p-5 rounded-2xl border border-border shadow-2xs relative">
            <div className="w-10 h-10 rounded-xl bg-success-bg text-primary flex items-center justify-center font-semibold text-sm mb-3">
              01
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Submit Application</h3>
            <p className="text-xs text-foreground-muted leading-normal">
              Provide your business name, address, GSTIN, PAN, and verification documents.
            </p>
          </div>

          <div className="bg-surface p-5 rounded-2xl border border-secondary/30 shadow-2xs relative">
            <div className="w-10 h-10 rounded-xl bg-warning-bg text-secondary flex items-center justify-center font-semibold text-sm mb-3">
              02
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Admin Verification</h3>
            <p className="text-xs text-foreground-muted leading-normal">
              Our marketplace compliance team reviews your business credentials and licenses.
            </p>
          </div>

          <div className="bg-surface p-5 rounded-2xl border border-border shadow-2xs relative">
            <div className="w-10 h-10 rounded-xl bg-info-bg text-blue-800 flex items-center justify-center font-semibold text-sm mb-3">
              03
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Seller Dashboard Unlocked</h3>
            <p className="text-xs text-foreground-muted leading-normal">
              Once approved, your seller portal is activated to list products and start selling.
            </p>
          </div>
        </div>

        {/* Success Alert Banner when just submitted */}
        {submissionSuccessMsg && (
          <div className="bg-success-bg border-2 border-success/40 rounded-2xl p-5 flex items-center gap-3 text-success text-sm font-bold shadow-sm animate-in fade-in">
            <CheckCircle2 className="w-6 h-6 text-success shrink-0" />
            <div className="flex-1">
              <p>{submissionSuccessMsg}</p>
            </div>
          </div>
        )}

        {/* ─── Dynamic View Based on Application Status ─────────────────────── */}
        {isCheckingStatus ? (
          <div className="bg-surface rounded-xl border border-border shadow-sm p-12 text-center max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">Checking Seller Application Status</h3>
              <p className="text-xs text-foreground-muted">
                Fetching your registration records and review history from the database...
              </p>
            </div>
          </div>
        ) : existingInquiry && !isEditing ? (
          <>
            {/* ─── 1. PENDING / CONTACTED SCREEN ───────────────────────────── */}
            {(existingInquiry.status === 'pending' || existingInquiry.status === 'contacted') && (
              <div className="bg-surface rounded-xl border-2 border-warning/30 p-8 sm:p-12 shadow-xl text-center max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95">
                <div className="w-20 h-20 rounded-full bg-warning-bg text-warning flex items-center justify-center mx-auto shadow-inner">
                  <Clock className="w-12 h-12 text-warning animate-pulse" />
                </div>

                <div className="space-y-3">
                  <span className="px-3.5 py-1 rounded-full bg-warning-bg border border-warning/20 text-warning text-xs font-semibold uppercase tracking-wider">
                    Application Pending Review
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
                    Awaiting Admin Approval
                  </h2>
                  <p className="text-sm font-medium text-foreground leading-relaxed max-w-lg mx-auto bg-warning-bg/60 p-4 rounded-2xl border border-warning/20/60">
                    Your seller application has been submitted successfully and is awaiting admin approval. Duplicate submissions are prevented while an application is pending.
                  </p>
                </div>

                {/* Inquiry Details Summary Card */}
                <div className="p-5 bg-surface-muted rounded-2xl border border-border text-left space-y-3 max-w-lg mx-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div>
                      <p className="text-xs uppercase font-semibold text-foreground-muted">Business Name</p>
                      <p className="text-base font-semibold text-foreground">{existingInquiry.business_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase font-semibold text-foreground-muted">Application ID</p>
                      <button
                        type="button"
                        onClick={handleCopyId}
                        className="px-2.5 py-1 bg-surface border border-border rounded-lg text-xs font-bold text-foreground hover:bg-surface-muted flex items-center gap-1.5 transition-colors shadow-2xs font-mono"
                        title="Click to copy ID"
                      >
                        {copiedId ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{existingInquiry.id.slice(0, 8)}...</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-foreground-muted font-bold block text-xs uppercase">Contact Person</span>
                      <span className="font-semibold text-foreground">{existingInquiry.full_name}</span>
                    </div>
                    <div>
                      <span className="text-foreground-muted font-bold block text-xs uppercase">Mobile Number</span>
                      <span className="font-semibold text-foreground font-mono">+91 {existingInquiry.phone}</span>
                    </div>
                    <div>
                      <span className="text-foreground-muted font-bold block text-xs uppercase">Category</span>
                      <span className="font-semibold text-foreground">{existingInquiry.category}</span>
                    </div>
                    <div>
                      <span className="text-foreground-muted font-bold block text-xs uppercase">Business Type</span>
                      <span className="font-semibold text-foreground capitalize">{existingInquiry.business_type?.replace(/_/g, ' ') || 'Sole Proprietorship'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-foreground-muted font-bold block text-xs uppercase">Submitted Date</span>
                      <span className="font-semibold text-foreground">{new Date(existingInquiry.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* What Happens Next Card */}
                <div className="bg-warning-bg/70 border border-warning/20/80 rounded-2xl p-5 text-left space-y-3">
                  <h4 className="text-xs font-semibold text-warning uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-secondary" />
                    <span>What Happens Next?</span>
                  </h4>
                  <ul className="text-xs text-warning space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-secondary">•</span>
                      <span>The admin team verifies your business details, PAN, and applicable GSTIN.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-secondary">•</span>
                      <span>Upon approval, your seller account is activated and your seller dashboard is unlocked automatically.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-secondary">•</span>
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
                    className="w-full sm:w-auto px-5 py-3 bg-surface border border-border-hover hover:bg-surface-muted text-foreground text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-2xs transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-success' : 'text-foreground-muted'}`} />
                    <span>{isRefreshing ? 'Checking Status...' : 'Refresh Status'}</span>
                  </button>

                  <Link
                    href="/home"
                    className="w-full sm:w-auto px-6 py-3 bg-surface-muted hover:bg-border text-foreground text-xs font-bold rounded-xl flex items-center justify-center transition-colors"
                  >
                    Return to Marketplace
                  </Link>
                </div>
              </div>
            )}

            {/* ─── 2. APPROVED SCREEN ───────────────────────────────────────── */}
            {existingInquiry.status === 'approved' && (
              <div className="bg-surface rounded-xl border-2 border-success/40 p-8 sm:p-12 shadow-xl text-center max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95">
                <div className="w-20 h-20 rounded-full bg-success-bg text-primary flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-12 h-12 text-success" />
                </div>

                <div className="space-y-3">
                  <span className="px-3.5 py-1 rounded-full bg-success-bg border border-success/20 text-success text-xs font-semibold uppercase tracking-wider">
                    Application Approved
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
                    Welcome to Gjanand Sarkar!
                  </h2>
                  <p className="text-sm font-semibold text-success leading-relaxed max-w-lg mx-auto bg-success-bg/70 p-4 rounded-2xl border border-success/20">
                    Congratulations! Your seller registration application has been approved by admin. Your seller dashboard is active and ready for product submissions.
                  </p>
                </div>

                {/* Approved Store Badge */}
                <div className="p-4 bg-surface-muted rounded-2xl border border-border flex items-center justify-between gap-4 max-w-md mx-auto text-left">
                  <div>
                    <p className="text-xs uppercase font-semibold text-foreground-muted">Verified Seller Account</p>
                    <p className="text-base font-semibold text-primary">{existingInquiry.business_name}</p>
                    <p className="text-xs text-foreground-muted font-medium">Category: {existingInquiry.category}</p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-success-bg text-success rounded-lg text-xs font-semibold">
                    <ShieldCheck className="w-4 h-4 text-success" />
                    <span>Active Seller</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Link
                    href="/seller/dashboard"
                    className="w-full sm:w-auto px-8 py-3.5 bg-primary hover:bg-primary-hover text-on-primary text-xs font-semibold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Store className="w-4 h-4 text-secondary" />
                    <span>Go to Seller Dashboard</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </Link>

                  <Link
                    href="/home"
                    className="w-full sm:w-auto px-6 py-3.5 bg-surface-muted hover:bg-border text-foreground text-xs font-bold rounded-xl flex items-center justify-center transition-colors"
                  >
                    Browse Marketplace
                  </Link>
                </div>
              </div>
            )}

            {/* ─── 3. REJECTED SCREEN ───────────────────────────────────────── */}
            {existingInquiry.status === 'rejected' && (
              <div className="bg-surface rounded-xl border-2 border-error/30 p-8 sm:p-12 shadow-xl text-center max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95">
                <div className="w-20 h-20 rounded-full bg-error-bg text-error flex items-center justify-center mx-auto shadow-inner">
                  <XCircle className="w-12 h-12 text-error" />
                </div>

                <div className="space-y-3">
                  <span className="px-3.5 py-1 rounded-full bg-error-bg border border-error/20 text-error text-xs font-semibold uppercase tracking-wider">
                    Application Rejected
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
                    Application Review Update
                  </h2>
                  <p className="text-sm font-medium text-foreground leading-relaxed max-w-lg mx-auto bg-error-bg/60 p-4 rounded-2xl border border-error/20/60">
                    Your seller registration application was not approved. You may review the admin feedback below, update your details, and resubmit for review.
                  </p>
                </div>

                {/* Admin Feedback Box */}
                <div className="bg-error-bg/80 border border-error/20 rounded-2xl p-5 text-left space-y-2 max-w-lg mx-auto">
                  <h4 className="text-xs font-semibold text-error uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-error" />
                    <span>Admin Rejection Reason</span>
                  </h4>
                  <p className="text-xs text-error leading-relaxed font-semibold">
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
                    className="w-full sm:w-auto px-6 py-3.5 bg-primary hover:bg-primary-hover text-on-primary text-xs font-semibold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 text-secondary" />
                    <span>Edit & Resubmit Application</span>
                  </button>

                  <Link
                    href="/home"
                    className="w-full sm:w-auto px-6 py-3.5 bg-surface-muted hover:bg-border text-foreground text-xs font-bold rounded-xl flex items-center justify-center transition-colors"
                  >
                    Return to Marketplace
                  </Link>
                </div>
              </div>
            )}

            {/* ─── 4. SUSPENDED SCREEN ──────────────────────────────────────── */}
            {existingInquiry.status === 'suspended' && (
              <div className="bg-surface rounded-xl border-2 border-red-500/30 p-8 sm:p-12 shadow-xl text-center max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95">
                <div className="w-20 h-20 rounded-full bg-error-bg text-error flex items-center justify-center mx-auto shadow-inner">
                  <AlertTriangle className="w-12 h-12 text-error" />
                </div>

                <div className="space-y-3">
                  <span className="px-3.5 py-1 rounded-full bg-error-bg border border-error/20 text-error text-xs font-semibold uppercase tracking-wider">
                    Seller Account Suspended
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
                    Account Under Suspension
                  </h2>
                  <p className="text-sm font-medium text-foreground leading-relaxed max-w-lg mx-auto bg-error-bg/60 p-4 rounded-2xl border border-error/20/60">
                    Your seller account is currently suspended by administration. Product listings are temporarily hidden from the marketplace.
                  </p>
                </div>

                {existingInquiry.admin_notes && (
                  <div className="bg-surface-muted border border-border rounded-2xl p-4 max-w-lg mx-auto text-left">
                    <p className="text-xs uppercase font-bold text-foreground-muted">Suspension Notice</p>
                    <p className="text-xs text-foreground mt-1">{existingInquiry.admin_notes}</p>
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
                    className="w-full sm:w-auto px-6 py-3.5 bg-primary hover:bg-primary-hover text-on-primary text-xs font-semibold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 text-secondary" />
                    <span>Update Business Details</span>
                  </button>

                  <Link
                    href="/home"
                    className="w-full sm:w-auto px-6 py-3.5 bg-surface-muted hover:bg-border text-foreground text-xs font-bold rounded-xl flex items-center justify-center transition-colors"
                  >
                    Return to Marketplace
                  </Link>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ─── 5. SELLER REGISTRATION / EDIT FORM ────────────────────────── */
          <div id="seller-application-form" className="bg-surface rounded-xl border border-border/90 shadow-sm p-6 sm:p-10 scroll-mt-20">
            {isEditing && (
              <div className="mb-6 p-4 bg-warning-bg border border-warning/20 rounded-2xl flex items-center justify-between gap-4">
                <div className="text-left">
                  <p className="text-xs font-semibold text-warning">Editing Your Application</p>
                  <p className="text-xs text-warning">
                    Update any requested details or verification documents below. Submitting will send your updated application for admin review.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 bg-surface border border-warning rounded-xl text-xs font-bold text-foreground hover:bg-warning-bg transition-colors"
                >
                  Cancel Edit
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              
              {error && (
                <div className="p-4 bg-error-bg border border-error/20 rounded-2xl text-error text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-error" />
                  <span>{error}</span>
                </div>
              )}

              {/* Section 1: Business Identity */}
              <div>
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-border">
                  <Building2 className="w-4 h-4 text-secondary" />
                  <span>1. Business & Store Identity</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Seller or Business Name <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Gir Organic Farms Pvt Ltd"
                      className="w-full px-4 py-2.5 rounded-xl border border-border-hover text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-[var(--primary)] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Business Entity Type <span className="text-error">*</span>
                    </label>
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border-hover text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-[var(--primary)] outline-none bg-surface"
                    >
                      {businessTypes.map((bt) => (
                        <option key={bt.id} value={bt.id}>{bt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Primary Product Category <span className="text-error">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border-hover text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-[var(--primary)] outline-none bg-surface"
                    >
                      {categoriesList.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Estimated Monthly Capacity
                    </label>
                    <select
                      value={monthlyVolume}
                      onChange={(e) => setMonthlyVolume(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border-hover text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-[var(--primary)] outline-none bg-surface"
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
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-border">
                  <Phone className="w-4 h-4 text-secondary" />
                  <span>2. Contact Person Information</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Contact Person's Full Name <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Bhavesh Bhai Patel"
                      className="w-full px-4 py-2.5 rounded-xl border border-border-hover text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-[var(--primary)] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Mobile Number <span className="text-error">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 flex items-center gap-1.5 pointer-events-none text-xs font-bold text-foreground-muted select-none">
                        <span>🇮🇳</span>
                        <span>+91</span>
                        <span className="text-foreground-muted">|</span>
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
                        className="w-full pl-[72px] pr-4 py-2.5 rounded-xl border border-border-hover text-xs text-foreground font-medium focus:border-primary focus:ring-1 focus:ring-[var(--primary)] outline-none"
                      />
                    </div>
                    <p className="text-xs text-foreground-muted mt-1">
                      Enter 10-digit mobile number without +91 prefix
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Business Email Address <span className="text-error">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contact@girfarms.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-border-hover text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-[var(--primary)] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Business Address */}
              <div>
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-border">
                  <MapPin className="w-4 h-4 text-secondary" />
                  <span>3. Registered Business Address</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Address (Shop / Survey No / Building / Street) <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                      placeholder="Plot No. 42, GIDC Industrial Estate, Highway Road"
                      className="w-full px-4 py-2.5 rounded-xl border border-border-hover text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-[var(--primary)] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1.5">
                        City / Town <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Palanpur"
                        className="w-full px-4 py-2.5 rounded-xl border border-border-hover text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-[var(--primary)] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1.5">
                        State <span className="text-error">*</span>
                      </label>
                      <select
                        value={stateOrigin}
                        onChange={(e) => setStateOrigin(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-border-hover text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-[var(--primary)] outline-none bg-surface"
                      >
                        {statesList.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-foreground mb-1.5">
                        Postal Pincode <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                        placeholder="385001"
                        className="w-full px-4 py-2.5 rounded-xl border border-border-hover text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-[var(--primary)] outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Tax & Regulatory Verification */}
              <div>
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-border">
                  <CreditCard className="w-4 h-4 text-secondary" />
                  <span>4. Tax & Business Verification Details</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Business PAN
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={pan}
                      onChange={(e) => setPan(e.target.value.toUpperCase())}
                      placeholder="ABCDE1234F"
                      className="w-full px-4 py-2.5 rounded-xl border border-border-hover text-xs text-foreground font-mono uppercase focus:border-primary focus:ring-1 focus:ring-[var(--primary)] outline-none"
                    />
                    <p className="text-xs text-foreground-muted mt-1">10-character PAN of business/proprietor</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      GSTIN (If Applicable)
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      placeholder="24AAAAA0000A1Z5"
                      className="w-full px-4 py-2.5 rounded-xl border border-border-hover text-xs text-foreground font-mono uppercase focus:border-primary focus:ring-1 focus:ring-[var(--primary)] outline-none"
                    />
                    <p className="text-xs text-foreground-muted mt-1">Optional for unregistered small producers</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      FSSAI License / Trade Reg. No.
                    </label>
                    <input
                      type="text"
                      value={fssaiNumber}
                      onChange={(e) => setFssaiNumber(e.target.value)}
                      placeholder="e.g. 10723000000000"
                      className="w-full px-4 py-2.5 rounded-xl border border-border-hover text-xs text-foreground font-mono focus:border-primary focus:ring-1 focus:ring-[var(--primary)] outline-none"
                    />
                    <p className="text-xs text-foreground-muted mt-1">Required for food, dairy, and grocery items</p>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Verification Document / License Link
                  </label>
                  <input
                    type="url"
                    value={documentUrl}
                    onChange={(e) => setDocumentUrl(e.target.value)}
                    placeholder="https://... (Cloud drive link or certificate URL)"
                    className="w-full px-4 py-2.5 rounded-xl border border-border-hover text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-[var(--primary)] outline-none"
                  />
                  <p className="text-xs text-foreground-muted mt-1">
                    Upload your GST certificate, FSSAI license, or Shop Establishment document to a secure cloud drive and share the link.
                  </p>
                </div>
              </div>

              {/* Section 5: Products & Notes */}
              <div>
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-border">
                  <FileText className="w-4 h-4 text-secondary" />
                  <span>5. Products Overview & Remarks</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Product Range / Proposed Items
                    </label>
                    <input
                      type="text"
                      value={productRange}
                      onChange={(e) => setProductRange(e.target.value)}
                      placeholder="e.g. A2 Bilona Cow Ghee, Organic Butter, Artisanal Honey"
                      className="w-full px-4 py-2.5 rounded-xl border border-border-hover text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-[var(--primary)] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Additional Notes for Admin Team
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Tell us about your production facilities, cold storage, delivery readiness, or certifications..."
                      className="w-full px-4 py-2.5 rounded-xl border border-border-hover text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-[var(--primary)] outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-border">
                <Link
                  href="/home"
                  className="w-full sm:w-auto px-6 py-3 border border-border text-foreground-muted hover:bg-surface-muted text-xs font-bold rounded-xl text-center transition-colors"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-8 py-3.5 bg-primary hover:bg-primary-hover text-on-primary text-xs font-semibold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-secondary" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Seller Application</span>
                      <ArrowRight className="w-4 h-4 text-secondary" />
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
