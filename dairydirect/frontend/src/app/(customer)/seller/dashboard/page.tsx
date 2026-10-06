"use client";

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  IndianRupee, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Store, 
  Plus, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight, 
  ExternalLink, 
  Edit, 
  Trash2,
  Phone,
  MessageCircle,
  AlertCircle,
  FileCheck2,
  Building2,
  ShoppingBag,
  Ban,
  BadgeAlert,
  Lock,
  Loader2,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getSellerDashboard, SellerDashboardData, requestSellerReactivation } from '@/lib/api/sellers';
import { getProducts, ProductWithVariants } from '@/lib/api/products';
import { ProductEditModal } from '@/components/admin/ProductEditModal';
import Link from 'next/link';

export default function SellerDashboardPage() {
  const user = useStore((s) => s.user);
  const sellerStore = useStore((s) => s.sellerStore);

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'payouts'>('overview');
  const [data, setData] = useState<SellerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Products belonging ONLY to this logged-in seller
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [editingProduct, setEditingProduct] = useState<ProductWithVariants | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Reactivation Request Modal State
  const [reactivationModalOpen, setReactivationModalOpen] = useState(false);
  const [reactivationReason, setReactivationReason] = useState('');
  const [reactivationNotes, setReactivationNotes] = useState('');
  const [isSubmittingReactivation, setIsSubmittingReactivation] = useState(false);
  const [reactivationMsg, setReactivationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getSellerDashboard(user?.id || '').then((res) => {
      setData(res);
      if (res?.store) {
        useStore.getState().setSellerStore(res.store as any);
      }
      setIsLoading(false);
    });

    if (user?.id) {
      setIsLoadingProducts(true);
      getProducts({ sellerId: user.id, activeOnly: false }).then((prods) => {
        setProducts(prods);
        setIsLoadingProducts(false);
      });
    } else {
      setIsLoadingProducts(false);
    }
  }, [user?.id]);

  const handleOpenNewProduct = () => {
    setEditingProduct({
      id: '',
      name: '',
      category: 'Milk',
      description: '',
      image_url: '',
      is_freshness_guarantee: true,
      is_active: true,
      created_at: new Date().toISOString(),
      seller_id: user?.id || '',
      product_variants: [
        {
          id: '',
          product_id: '',
          weight: '500g',
          price: 0,
          original_price: null,
          stock: 50,
        },
      ],
    } as any);
    setIsEditModalOpen(true);
  };

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf8]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f3e26]" />
      </div>
    );
  }

  const inquiry = data?.inquiry;

  // ─── 1. REJECTED SELLER APPLICATION SCREEN ───
  if (inquiry && inquiry.status === 'rejected') {
    return (
      <div className="min-h-screen bg-[#fafaf8] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-red-200 shadow-sm p-8 sm:p-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-black uppercase tracking-wider">
                Seller Application Rejected
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
                {inquiry.business_name || 'Seller Application'}
              </h1>
              <p className="text-sm text-gray-600 max-w-lg mx-auto">
                Your seller application was reviewed by our vendor onboarding team and could not be approved at this time. Access to the Seller Dashboard is restricted.
              </p>
            </div>

            {inquiry.admin_notes && (
              <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 text-left max-w-lg mx-auto text-xs text-red-900">
                <span className="font-bold block mb-1">Reason / Admin Note:</span>
                <p>{inquiry.admin_notes}</p>
              </div>
            )}

            <div className="bg-gray-50 rounded-2xl p-5 text-left border border-gray-200 space-y-3 max-w-lg mx-auto text-xs">
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">Inquiry ID:</span>
                <span className="font-mono font-bold text-gray-900">{inquiry.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">Contact Person:</span>
                <span className="font-bold text-gray-900">{inquiry.full_name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Current Status:</span>
                <span className="font-black uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px]">
                  Rejected
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/become-seller"
                className="w-full sm:w-auto px-6 py-3 bg-[#0f3e26] hover:bg-[#0c331f] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Building2 className="w-4 h-4" />
                <span>Submit New Inquiry</span>
              </Link>
              <Link
                href="/home"
                className="w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center justify-center transition-colors"
              >
                Browse Marketplace
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── 2. PENDING REVIEW / CONTACTED SCREEN (LOCKED) ───
  const isPendingReview = (sellerStore as any)?.status === 'pending_inquiry' || 
                          (data?.store as any)?.status === 'pending_review' || 
                          (inquiry && inquiry.status !== 'approved');

  if (isPendingReview && inquiry && inquiry.status !== 'approved') {
    return (
      <div className="min-h-screen bg-[#fafaf8] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in">
          
          <div className="bg-white rounded-3xl border border-amber-200 shadow-sm p-8 sm:p-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-[#c88a23] flex items-center justify-center mx-auto shadow-inner">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black uppercase tracking-wider">
                {inquiry.status === 'contacted' ? 'Contacted & Under Review' : 'Application Under Manual Review'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
                {inquiry.business_name || 'Your Seller Application'}
              </h1>
              <p className="text-sm text-gray-600 max-w-lg mx-auto">
                Thank you for applying to sell on Gjanand Sarkar. Our vendor onboarding manager is reviewing your details and will contact you manually via Call/WhatsApp.
              </p>
            </div>

            {inquiry.admin_notes && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-left max-w-lg mx-auto text-xs text-amber-900">
                <span className="font-bold block mb-1">Admin Note:</span>
                <p>{inquiry.admin_notes}</p>
              </div>
            )}

            {/* Application Summary Box */}
            <div className="bg-gray-50 rounded-2xl p-5 text-left border border-gray-200 space-y-3 max-w-lg mx-auto text-xs">
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">Inquiry ID:</span>
                <span className="font-mono font-bold text-gray-900">{inquiry.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">Contact Person:</span>
                <span className="font-bold text-gray-900">{inquiry.full_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">Contact Number:</span>
                <span className="font-bold text-gray-900">+91 {inquiry.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">Product Category:</span>
                <span className="font-bold text-[#0f3e26]">{inquiry.category}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Current Status:</span>
                <span className="font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px]">
                  {inquiry.status === 'contacted' ? 'Contacted & Sampling' : 'Pending Verification'}
                </span>
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 text-left space-y-2 max-w-lg mx-auto text-xs text-emerald-900">
              <h4 className="font-black uppercase tracking-wider flex items-center gap-1.5 text-[#0f3e26]">
                <FileCheck2 className="w-4 h-4 text-[#0f3e26]" />
                <span>Verification Checklist</span>
              </h4>
              <p>1. Our quality audit team will verify your FSSAI / cattle breed pedigree.</p>
              <p>2. We arrange a sample quality check or lab purity certificate review.</p>
              <p>3. Once approved, your seller dashboard & storefront go live instantly.</p>
            </div>

            {/* Quick Action */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={`https://wa.me/919825123456?text=${encodeURIComponent(`Hello Gjanand Sarkar team, checking status on my seller inquiry (ID: ${inquiry.id}) for ${inquiry.business_name}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-6 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat with Onboarding Team</span>
              </a>
              <Link
                href="/home"
                className="w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center justify-center transition-colors"
              >
                Browse Marketplace
              </Link>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // ─── 3. STATUS DERIVATION & ACCESS CHECKS ───
  const sellerStatus = (data?.store as any)?.status || (sellerStore as any)?.status || (inquiry && inquiry.status === 'approved' ? 'active' : 'pending');
  const reviewExpiresAt = (data?.store as any)?.review_expires_at || (sellerStore as any)?.review_expires_at;
  const reviewReason = (data?.store as any)?.review_reason || (sellerStore as any)?.review_reason;
  const deactivationReason = (data?.store as any)?.deactivation_reason || (sellerStore as any)?.deactivation_reason;
  const reactivationReasonSubmitted = (data?.store as any)?.reactivation_reason || (sellerStore as any)?.reactivation_reason;
  const isDeactivatedOrRestricted = ['deactivated', 'permanently_deactivated', 'reactivation_requested'].includes(sellerStatus);

  // ─── 4. PERMANENTLY DEACTIVATED SCREEN ───
  if (sellerStatus === 'permanently_deactivated') {
    return (
      <div className="min-h-screen bg-[#fafaf8] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl border border-red-300 p-8 sm:p-10 text-center space-y-6 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-gray-900 text-red-400 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-red-100 border border-red-300 text-red-900 text-xs font-black uppercase tracking-wider">
                Account Permanently Deactivated
              </span>
              <h1 className="text-2xl font-black text-gray-900">
                {(sellerStore as any)?.store_name || (data?.store as any)?.storeName || 'Seller Store'}
              </h1>
              <p className="text-xs text-gray-600 max-w-md mx-auto">
                This seller account has been permanently deactivated due to serious policy violations. Access to seller dashboard operations and product listings has been permanently revoked.
              </p>
            </div>
            {deactivationReason && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-left text-xs text-red-900 max-w-md mx-auto">
                <span className="font-bold block mb-1">Reason:</span>
                <p>{deactivationReason}</p>
              </div>
            )}
            <div className="pt-2 flex items-center justify-center gap-3">
              <Link
                href="/home"
                className="px-6 py-2.5 bg-[#0f3e26] hover:bg-[#0c331f] text-white text-xs font-bold rounded-xl transition-all"
              >
                Return to Storefront
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── 5. NO INQUIRY SUBMITTED & NOT AN APPROVED SELLER ───
  const isApprovedSeller = user?.role === 'admin' || 
                           user?.role === 'seller' || 
                           (['active', 'under_review', 'deactivated', 'reactivation_requested'].includes(sellerStatus) || (inquiry && inquiry.status === 'approved'));

  if (!isApprovedSeller && !inquiry) {
    return (
      <div className="min-h-screen bg-[#fafaf8] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-gray-200 p-8 text-center space-y-5 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-[#0f3e26] flex items-center justify-center mx-auto">
            <Store className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-gray-900">Seller Dashboard Access Required</h2>
          <p className="text-xs text-gray-600">
            You don't have an active seller account. Please submit a seller inquiry to request vendor onboarding and access seller tools.
          </p>
          <div className="pt-2">
            <Link
              href="/become-seller"
              className="w-full px-6 py-3 bg-[#0f3e26] hover:bg-[#0c331f] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Building2 className="w-4 h-4" />
              <span>Become a Seller</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── ACTIVE SELLER DASHBOARD ───
  const storeName = (sellerStore as any)?.store_name 
    || (data?.store as any)?.storeName 
    || (user?.name ? `${user.name}'s Store` : 'Seller Store');
  const storeState = sellerStore?.state || (data?.store as any)?.state || 'India';
  const storePlan = sellerStore?.plan || (data?.store as any)?.plan || 'Growth';
  const storeCommission = (sellerStore as any)?.commission_rate || (data?.store as any)?.commissionRate || 5;

  return (
    <div className="min-h-screen bg-[#fafaf8] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ─── LIFECYCLE BANNER 1: Under Review ─── */}
        {sellerStatus === 'under_review' && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                <Clock className="w-5 h-5 text-amber-700 animate-pulse" />
                <span>Seller Account Under Review</span>
              </div>
              {reviewExpiresAt && (
                <span className="px-3 py-1 rounded-full bg-amber-200 text-amber-900 text-xs font-bold font-mono border border-amber-300">
                  Review Expiry: {new Date(reviewExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
            <p className="text-xs text-amber-800">
              Your store is currently under review by our quality and compliance team.
              {reviewReason ? ` Reason: "${reviewReason}".` : ''} Existing orders continue to be processed and fulfilled normally.
            </p>
          </div>
        )}

        {/* ─── LIFECYCLE BANNER 2: Deactivated ─── */}
        {sellerStatus === 'deactivated' && (
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-red-900 font-black text-sm">
                <Ban className="w-5 h-5 text-red-600" />
                <span>Seller Account Deactivated</span>
              </div>
              <button
                onClick={() => {
                  setReactivationReason('');
                  setReactivationNotes('');
                  setReactivationMsg(null);
                  setReactivationModalOpen(true);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Request Account Reactivation
              </button>
            </div>
            <p className="text-xs text-red-800">
              Your seller account is currently deactivated. Product additions, price updates, stock changes, and deletion operations are blocked.
              {deactivationReason ? ` Reason: "${deactivationReason}".` : ''} You may submit an appeal using the Request Reactivation button.
            </p>
          </div>
        )}

        {/* ─── LIFECYCLE BANNER 3: Reactivation Requested ─── */}
        {sellerStatus === 'reactivation_requested' && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-5 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-blue-900 font-black text-sm">
              <BadgeAlert className="w-5 h-5 text-blue-600" />
              <span>Reactivation Request Submitted (Pending Review)</span>
            </div>
            <p className="text-xs text-blue-800">
              Your request for account reactivation has been submitted to the admin team for evaluation.
              {reactivationReasonSubmitted ? ` Submitted Reason: "${reactivationReasonSubmitted}".` : ''} Our team will review your account history and notify you once a decision is made.
            </p>
          </div>
        )}
        
        {/* Top Banner & Store Header */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#0f3e26] text-white flex items-center justify-center font-black text-2xl shadow-md border border-[#c88a23]/40 shrink-0">
              <Store className="w-8 h-8 text-[#c88a23]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#0f3e26] tracking-tight">
                  {storeName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified Seller</span>
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                State Origin: <strong className="text-gray-800">{storeState}</strong> • Plan: <span className="capitalize font-bold text-[#c88a23]">{storePlan} Tier ({storeCommission}% Platform Fee)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/home"
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
            >
              <span>View Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            {isDeactivatedOrRestricted ? (
              <button
                disabled
                title="Product creation disabled while account is deactivated"
                className="px-4 py-2 rounded-xl bg-gray-200 text-gray-400 text-xs font-bold cursor-not-allowed flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product (Restricted)</span>
              </button>
            ) : (
              <button
                onClick={handleOpenNewProduct}
                className="px-4 py-2 rounded-xl bg-[#0f3e26] text-white text-xs font-bold hover:bg-[#144f31] flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Financial Overview & KPIs' },
            { id: 'orders', label: 'Recent Orders' },
            { id: 'products', label: 'Product Catalog & Inventory' },
            { id: 'payouts', label: 'Payout Settlements' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[#0f3e26] text-[#0f3e26]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in">
            
            {/* SaaS Metrics 4-Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Gross Revenue</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0f3e26] flex items-center justify-center">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900">
                  ₹{(data?.metrics?.grossRevenue ?? 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Real-time total</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Platform Commission</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#c88a23] flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-700">
                  ₹{(data?.metrics?.platformCommission ?? 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  {storeCommission}% rate on {storePlan} tier
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Net Payout to Bank</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-[#0f3e26]">
                  ₹{(data?.metrics?.netPayout ?? 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-blue-600 font-bold mt-1">
                  Settled weekly every Tuesday
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Active Orders</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900">
                  {data?.metrics?.totalOrders ?? 0}
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  {data?.metrics?.pendingDeliveries ?? 0} dispatching today
                </div>
              </div>
            </div>

            {/* Recent Orders Preview */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Recent Customer Orders
                </h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-[#0f3e26] hover:underline"
                >
                  View All Orders →
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {(data?.recentOrders || []).length > 0 ? (
                  (data?.recentOrders || []).map((order) => (
                    <div key={order.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-mono font-bold text-gray-800">{order.id}</span>
                        <p className="text-xs text-gray-500">{order.customerName} • {order.itemsCount} items</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-gray-900">₹{order.amount}</span>
                        <p className="text-[11px] text-emerald-600 capitalize font-semibold">{order.status.replace('_', ' ')}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-400 text-xs font-medium">
                    No customer orders received yet.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Orders */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-4 animate-in fade-in">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
              Store Order Management
            </h3>
            <div className="divide-y divide-gray-100">
              {(data?.recentOrders || []).length > 0 ? (
                (data?.recentOrders || []).map((order) => (
                  <div key={order.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#0f3e26]">{order.id}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                          {order.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{order.customerName} • {order.itemsCount} products ordered</p>
                      <span className="text-[10px] text-gray-400">{order.date}</span>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="text-sm font-black text-gray-900">₹{order.amount}</span>
                      <button className="block text-[11px] font-bold text-[#0f3e26] hover:underline">
                        Print Shipping Label
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-gray-400 text-xs font-medium">
                  No customer orders received yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Products */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Store Product Catalog
                </h3>
                <p className="text-xs text-gray-500">Manage active items, pricing, and batch stock levels for your store</p>
              </div>
              {isDeactivatedOrRestricted ? (
                <button 
                  disabled
                  title="Account is deactivated or under reactivation review"
                  className="px-4 py-2 bg-gray-200 text-gray-400 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product (Restricted)</span>
                </button>
              ) : (
                <button 
                  onClick={handleOpenNewProduct}
                  className="px-4 py-2 bg-[#0f3e26] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-[#144f31] transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              )}
            </div>

            {isLoadingProducts ? (
              <div className="py-12 text-center text-gray-400 text-xs font-medium">
                Loading your store products...
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {products.map((p) => {
                  const variant = p.product_variants?.[0];
                  const price = variant?.price || 0;
                  const totalStock = p.product_variants?.reduce((acc, v) => acc + (v.stock || 0), 0) ?? 0;
                  return (
                    <div key={p.id} className="p-4 rounded-2xl border border-gray-200 hover:border-[#0f3e26] transition-colors bg-white space-y-3 shadow-2xs flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            p.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {p.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-xs font-bold text-amber-600">★ {(p as any).rating || '5.0'}</span>
                        </div>

                        <div className="flex gap-3 items-center">
                          <img
                            src={p.image_url || '/milk.png'}
                            alt={p.name}
                            className="w-12 h-12 rounded-xl object-contain bg-gray-50 border border-gray-100 shrink-0"
                          />
                          <div>
                            <h4 className="text-xs font-bold text-gray-900 line-clamp-2">{p.name}</h4>
                            <p className="text-sm font-black text-[#0f3e26] mt-0.5">₹{price}</p>
                            <p className="text-[11px] text-gray-500">Stock: {totalStock} units</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        {isDeactivatedOrRestricted ? (
                          <button 
                            disabled
                            title="Product editing is disabled while account is deactivated"
                            className="flex-1 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-[11px] font-bold text-gray-400 cursor-not-allowed"
                          >
                            Edit Restricted
                          </button>
                        ) : (
                          <button 
                            onClick={() => {
                              setEditingProduct(p);
                              setIsEditModalOpen(true);
                            }}
                            className="flex-1 py-1.5 bg-white border border-gray-300 rounded-lg text-[11px] font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            Edit Product
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500 text-xs font-medium space-y-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-gray-800 text-sm">No Products in Your Catalog</p>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    You haven't added any products to your store yet. Click below to add your first product.
                  </p>
                </div>
                <button
                  onClick={handleOpenNewProduct}
                  className="px-4 py-2 bg-[#0f3e26] text-white text-xs font-bold rounded-xl hover:bg-[#144f31] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Payouts */}
        {activeTab === 'payouts' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-6 animate-in fade-in">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                Bank Payout & Settlement History
              </h3>
              <p className="text-xs text-gray-500">Automated NEFT settlements after deducting SaaS commission</p>
            </div>

            <div className="divide-y divide-gray-100">
              {(data?.payoutHistory || []).length > 0 ? (
                (data?.payoutHistory || []).map((payout) => (
                  <div key={payout.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="text-xs font-mono font-bold text-gray-900">{payout.id}</span>
                      <p className="text-xs text-gray-500">Direct Deposit (NEFT) • {payout.date}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-700">₹{payout.net.toLocaleString('en-IN')}</span>
                      <p className="text-[10px] text-gray-400">Platform fee deducted: ₹{payout.fee}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-gray-400 text-xs font-medium">
                  No bank payout settlements yet.
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Reactivation Request Modal */}
      {reactivationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-black text-gray-900">Request Account Reactivation</h3>
                <p className="text-xs text-gray-500 mt-0.5">Submit an appeal to administrator</p>
              </div>
              <button
                onClick={() => setReactivationModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {reactivationMsg && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                reactivationMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {reactivationMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{reactivationMsg.text}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">
                  Reason for Reactivation <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reactivationReason}
                  onChange={(e) => setReactivationReason(e.target.value)}
                  placeholder="Explain why your account should be reactivated, corrective actions taken, compliance updates..."
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-[#0f3e26]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1.5">Additional Notes / Evidence (Optional)</label>
                <textarea
                  rows={2}
                  value={reactivationNotes}
                  onChange={(e) => setReactivationNotes(e.target.value)}
                  placeholder="Supporting details or references..."
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 outline-none focus:border-[#0f3e26]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setReactivationModalOpen(false)}
                disabled={isSubmittingReactivation}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!reactivationReason.trim()) return;
                  setIsSubmittingReactivation(true);
                  setReactivationMsg(null);
                  try {
                    await requestSellerReactivation({
                      reason: reactivationReason.trim(),
                      notes: reactivationNotes.trim(),
                    });
                    setReactivationMsg({ type: 'success', text: 'Reactivation request submitted successfully!' });

                    if (user?.id) {
                      const res = await getSellerDashboard(user.id);
                      setData(res);
                      if (res?.store) {
                        useStore.getState().setSellerStore(res.store as any);
                      }
                    }

                    setTimeout(() => {
                      setReactivationModalOpen(false);
                      setReactivationMsg(null);
                    }, 1200);
                  } catch (err: any) {
                    setReactivationMsg({ type: 'error', text: err.message || 'Failed to submit reactivation request' });
                  } finally {
                    setIsSubmittingReactivation(false);
                  }
                }}
                disabled={isSubmittingReactivation || !reactivationReason.trim()}
                className={`px-5 py-2 text-xs font-bold rounded-xl text-white bg-[#0f3e26] hover:bg-[#144f31] shadow-sm flex items-center gap-2 cursor-pointer ${
                  isSubmittingReactivation || !reactivationReason.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmittingReactivation && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Submit Request</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Edit / Creation Modal */}
      {isEditModalOpen && editingProduct && (
        <ProductEditModal
          product={editingProduct}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingProduct(null);
          }}
          onProductUpdated={(updated) => {
            setProducts((prev) => {
              const exists = prev.some((p) => p.id === updated.id);
              if (exists) {
                // Merge the narrow CatalogProduct update over the existing
                // full record instead of replacing (and losing) it.
                return prev.map((p) =>
                  p.id === updated.id
                    ? { ...p, ...updated, category: updated.category ?? p.category }
                    : p
                );
              }
              return [
                {
                  description: null,
                  is_freshness_guarantee: false,
                  is_active: true,
                  created_at: new Date().toISOString(),
                  ...updated,
                  category: updated.category ?? '',
                },
                ...prev,
              ];
            });
          }}
          onProductDeleted={(deletedId) => {
            setProducts((prev) => prev.filter((p) => p.id !== deletedId));
          }}
        />
      )}
    </div>
  );
}
