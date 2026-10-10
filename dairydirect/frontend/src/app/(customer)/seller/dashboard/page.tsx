"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Bell,
  RefreshCw,
  Search,
  Check,
  X,
  FileText,
  User,
  Shield,
  Layers,
  MapPin,
  CreditCard,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getSellerDashboard, SellerDashboardData, getSellerProducts, requestSellerReactivation } from '@/lib/api/sellers';
import { SellerProductModal } from '@/components/seller/SellerProductModal';
import Link from 'next/link';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';

type DashboardTab = 
  | 'overview' 
  | 'profile' 
  | 'products' 
  | 'rejections' 
  | 'inventory' 
  | 'orders' 
  | 'analytics' 
  | 'notifications';

export default function SellerDashboardPage() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const sellerStore = useStore((s) => s.sellerStore);

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [data, setData] = useState<SellerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Products belonging to this authenticated seller
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suspended'>('all');
  const [productSearch, setProductSearch] = useState('');

  // Seller Product Modal (Add / Edit / Resubmit)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Quick Stock / Price Update Modal
  const [quickUpdateModal, setQuickUpdateModal] = useState<{
    open: boolean;
    product: any | null;
    price: string;
    stock: string;
    isSubmitting: boolean;
    error: string;
    success: string;
  }>({
    open: false,
    product: null,
    price: '',
    stock: '',
    isSubmitting: false,
    error: '',
    success: '',
  });

  // Reactivation Request Modal State
  const [reactivationModalOpen, setReactivationModalOpen] = useState(false);
  const [reactivationReason, setReactivationReason] = useState('');
  const [reactivationNotes, setReactivationNotes] = useState('');
  const [isSubmittingReactivation, setIsSubmittingReactivation] = useState(false);
  const [reactivationMsg, setReactivationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<any[]>([]);

  // Load Dashboard Data & Products
  const loadSellerData = async () => {
    if (!user?.id) return;
    try {
      const res = await getSellerDashboard(user.id);
      setData(res);
      if (res?.store) {
        useStore.getState().setSellerStore(res.store as any);
      }
    } catch (err) {
      console.error('Failed to load seller dashboard:', err);
    }
  };

  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const prods = await getSellerProducts();
      setProducts(prods);
    } catch (err) {
      console.error('Failed to load seller products:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.notifications || []);
      }
    } catch {}
  };

  useEffect(() => {
    if (user?.id) {
      setIsLoading(true);
      Promise.all([loadSellerData(), loadProducts(), loadNotifications()]).finally(() => {
        setIsLoading(false);
      });

      // 1. Silent live background refresh (every 12 seconds)
      const interval = setInterval(() => {
        loadSellerData();
        loadProducts();
        loadNotifications();
      }, 12000);

      // 2. Real-time Supabase listener on product approvals, products, and orders
      let channel: any = null;
      import('@/lib/supabase/lazy').then(({ getSupabaseLazy }) => {
        getSupabaseLazy().then((supabase) => {
          channel = supabase
            .channel(`seller-live-${user.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'seller_product_approval' }, () => {
              loadProducts();
              loadSellerData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'seller_product' }, () => {
              loadProducts();
              loadSellerData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
              loadProducts();
              loadSellerData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
              loadSellerData();
            })
            .subscribe();
        });
      });

      return () => {
        clearInterval(interval);
        if (channel) {
          import('@/lib/supabase/lazy').then(({ getSupabaseLazy }) => {
            getSupabaseLazy().then((supabase) => {
              supabase.removeChannel(channel);
            });
          });
        }
      };
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Auth redirect check
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login?redirect=/seller/dashboard');
    }
  }, [isLoading, user, router]);

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: any) => {
    setEditingProduct(prod);
    setIsProductModalOpen(true);
  };

  const handleProductSubmitted = (updatedProd: any, isEdit: boolean) => {
    loadProducts();
    loadSellerData();
    setActiveTab('products');
  };

  const handleOpenQuickUpdate = (prod: any) => {
    const primaryVariant = prod.product_variants?.[0];
    setQuickUpdateModal({
      open: true,
      product: prod,
      price: primaryVariant?.price ? String(primaryVariant.price) : '0',
      stock: primaryVariant?.stock !== undefined ? String(primaryVariant.stock) : '50',
      isSubmitting: false,
      error: '',
      success: '',
    });
  };

  const handleExecuteQuickUpdate = async () => {
    if (!quickUpdateModal.product) return;
    const numPrice = parseFloat(quickUpdateModal.price);
    const numStock = parseInt(quickUpdateModal.stock, 10);

    if (isNaN(numPrice) || numPrice <= 0) {
      setQuickUpdateModal(p => ({ ...p, error: 'Enter a valid selling price greater than 0' }));
      return;
    }
    if (isNaN(numStock) || numStock < 0) {
      setQuickUpdateModal(p => ({ ...p, error: 'Stock quantity cannot be negative' }));
      return;
    }

    setQuickUpdateModal(p => ({ ...p, isSubmitting: true, error: '', success: '' }));

    try {
      const { updateSellerProduct } = await import('@/lib/api/products');
      await updateSellerProduct(quickUpdateModal.product.id, {
        price: numPrice,
        stock: numStock,
      });

      setQuickUpdateModal(p => ({ ...p, isSubmitting: false, success: 'Price & inventory updated successfully! Approval status retained.' }));
      await loadProducts();
      setTimeout(() => {
        setQuickUpdateModal({
          open: false,
          product: null,
          price: '',
          stock: '',
          isSubmitting: false,
          error: '',
          success: '',
        });
      }, 1200);
    } catch (err: any) {
      setQuickUpdateModal(p => ({ ...p, isSubmitting: false, error: err.message || 'Failed to update' }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf8]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-[#0f3e26]" />
          <p className="text-xs font-semibold text-gray-500">Loading Seller Dashboard...</p>
        </div>
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
                href="/become-seller?resubmit=true"
                className="w-full sm:w-auto px-6 py-3 bg-[#0f3e26] hover:bg-[#0c331f] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Edit & Resubmit Application</span>
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
                Thank you for applying to sell on Gjanand Sarkar. Our vendor onboarding team is reviewing your business details. Once approved, you will be granted access to the Seller Dashboard.
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
                  Pending Admin Approval
                </span>
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 text-left space-y-2 max-w-lg mx-auto text-xs text-emerald-900">
              <h4 className="font-black uppercase tracking-wider flex items-center gap-1.5 text-[#0f3e26]">
                <FileCheck2 className="w-4 h-4 text-[#0f3e26]" />
                <span>What Happens Next</span>
              </h4>
              <p>1. Our compliance team verifies your business GSTIN/PAN and category licences.</p>
              <p>2. We approve your seller account and assign the Seller role.</p>
              <p>3. You can immediately access this Seller Dashboard to submit products for approval.</p>
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
  const isDeactivatedOrRestricted = ['deactivated', 'permanently_deactivated', 'reactivation_requested', 'suspended'].includes(sellerStatus);

  // ─── 4. PERMANENTLY DEACTIVATED SCREEN ───
  if (sellerStatus === 'permanently_deactivated' || sellerStatus === 'suspended') {
    return (
      <div className="min-h-screen bg-[#fafaf8] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl border border-red-300 p-8 sm:p-10 text-center space-y-6 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-gray-900 text-red-400 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-red-100 border border-red-300 text-red-900 text-xs font-black uppercase tracking-wider">
                Seller Account Suspended
              </span>
              <h1 className="text-2xl font-black text-gray-900">
                {(sellerStore as any)?.store_name || (data?.store as any)?.storeName || 'Seller Store'}
              </h1>
              <p className="text-xs text-gray-600 max-w-md mx-auto">
                This seller account has been suspended or deactivated. Access to product operations and marketplace publishing has been suspended.
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
            You don't have an active seller account. Please submit a seller application to request vendor onboarding and access seller tools.
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
    || inquiry?.business_name
    || (user?.name ? `${user.name}'s Store` : 'Seller Store');
  const storeState = sellerStore?.state || (data?.store as any)?.state || inquiry?.state || 'India';
  const storeCategory = (sellerStore as any)?.category || inquiry?.category || 'Organic Dairy & Farm Produce';
  const storePlan = (sellerStore as any)?.plan || (data?.store as any)?.plan || 'Growth';
  const storeCommission = (sellerStore as any)?.commission_rate || (data?.store as any)?.commissionRate || 5;

  // Product Counts By Approval Status
  const pendingProducts = products.filter(p => p.approval_status === 'pending');
  const approvedProducts = products.filter(p => p.approval_status === 'approved');
  const rejectedProducts = products.filter(p => p.approval_status === 'rejected');
  const suspendedProducts = products.filter(p => p.approval_status === 'suspended');

  // Filtered Products for Catalog tab
  const filteredProducts = products.filter(p => {
    const matchesStatus = 
      productStatusFilter === 'all' ? true : p.approval_status === productStatusFilter;
    const matchesSearch = 
      !productSearch.trim() || 
      p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku?.toLowerCase().includes(productSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#fafaf8] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ─── LIFECYCLE BANNER: Under Review ─── */}
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
              {reviewReason ? ` Reason: "${reviewReason}".` : ''} Existing orders continue to be fulfilled normally.
            </p>
          </div>
        )}

        {/* ─── Top Banner & Store Header ─── */}
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#0f3e26] text-white flex items-center justify-center font-black text-2xl shadow-md border border-[#c88a23]/40 shrink-0">
              <Store className="w-8 h-8 text-[#c88a23]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-[#0f3e26] tracking-tight">
                  {storeName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Approved Seller</span>
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Category: <strong className="text-gray-800">{storeCategory}</strong> • Region: <strong className="text-gray-800">{storeState}</strong> • Commission: <span className="capitalize font-bold text-[#c88a23]">{storeCommission}% Platform Fee</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsLoadingProducts(true);
                Promise.all([loadSellerData(), loadProducts(), loadNotifications()]).finally(() => {
                  setIsLoadingProducts(false);
                });
              }}
              title="Refresh live metrics & products"
              className="p-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingProducts ? 'animate-spin text-[#0f3e26]' : ''}`} />
            </button>

            <Link
              href="/home"
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
            >
              <span>View Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={handleOpenAddProduct}
              className="px-5 py-2.5 rounded-xl bg-[#0f3e26] text-white text-xs font-bold hover:bg-[#144f31] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span>Add New Product</span>
            </button>
          </div>
        </div>

        {/* ─── Navigation Tabs ─── */}
        <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto no-scrollbar bg-white/70 backdrop-blur-xs p-1.5 rounded-2xl border border-gray-200/60">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'products', label: `My Products (${products.length})`, icon: Package },
            { id: 'rejections', label: `Rejected Reasons (${rejectedProducts.length})`, icon: AlertTriangle, badge: rejectedProducts.length },
            { id: 'inventory', label: 'Inventory Management', icon: Layers },
            { id: 'profile', label: 'Seller Profile', icon: Building2 },
            { id: 'orders', label: `Orders (${data?.recentOrders?.length || 0})`, icon: ShoppingBag },
            { id: 'analytics', label: 'Sales & Settlements', icon: IndianRupee },
            { id: 'notifications', label: 'Notifications', icon: Bell, badge: notifications.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DashboardTab)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold whitespace-nowrap rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0f3e26] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 && !isActive ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* ─── TAB 1: OVERVIEW ─── */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in">
            {/* KPI Cards */}
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
                  <span>Verified Sales</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Live Approved</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-700">
                  {approvedProducts.length}
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  Active in customer catalog
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Pending Approvals</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-700">
                  {pendingProducts.length}
                </div>
                <div className="text-[11px] text-amber-800 font-semibold mt-1">
                  Awaiting admin review
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-gray-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Rejected Requests</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-rose-700">
                  {rejectedProducts.length}
                </div>
                <div className="text-[11px] text-rose-600 font-bold mt-1">
                  Action required to resubmit
                </div>
              </div>
            </div>

            {/* Quick Action Banner */}
            <div className="bg-gradient-to-r from-[#0c3c26] to-[#165b3b] rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-md">
              <div className="space-y-1.5 max-w-xl">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider">
                  Product Approval Pipeline
                </span>
                <h3 className="text-xl sm:text-2xl font-black">Ready to expand your store catalog?</h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  Submit new milk, ghee, sweets, or groceries. All submissions are thoroughly inspected by our quality assurance team before publishing.
                </p>
              </div>
              <button
                onClick={handleOpenAddProduct}
                className="px-6 py-3.5 bg-white text-[#0c3c26] hover:bg-emerald-50 rounded-2xl font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" strokeWidth={3} />
                <span>Add Product Now</span>
              </button>
            </div>

            {/* Recent Orders Overview */}
            <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Recent Store Orders
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
                  (data?.recentOrders || []).slice(0, 5).map((order) => (
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

        {/* ─── TAB 2: MY PRODUCTS (WITH APPROVAL STATUS TABS) ─── */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Filter Bar */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Status Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: 'All', count: products.length },
                  { id: 'pending', label: 'Pending Approvals', count: pendingProducts.length, color: 'text-amber-700 bg-amber-50' },
                  { id: 'approved', label: 'Approved Live', count: approvedProducts.length, color: 'text-emerald-700 bg-emerald-50' },
                  { id: 'rejected', label: 'Rejected', count: rejectedProducts.length, color: 'text-rose-700 bg-rose-50' },
                  { id: 'suspended', label: 'Suspended', count: suspendedProducts.length, color: 'text-gray-700 bg-gray-100' },
                ].map(pill => (
                  <button
                    key={pill.id}
                    onClick={() => setProductStatusFilter(pill.id as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                      productStatusFilter === pill.id
                        ? 'bg-[#0f3e26] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{pill.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      productStatusFilter === pill.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-800'
                    }`}>
                      {pill.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search & Add */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="Search by name, SKU..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0c3c26]/20"
                  />
                </div>

                <button
                  onClick={handleOpenAddProduct}
                  className="px-4 py-2 bg-[#0f3e26] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-[#144f31] transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {/* Products List */}
            {isLoadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-48 rounded-2xl bg-white border border-gray-200 animate-pulse" />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProducts.map((p) => {
                  const variant = p.product_variants?.[0];
                  const price = variant?.price || 0;
                  const compareAt = variant?.original_price || variant?.compare_at_price;
                  const totalStock = p.product_variants?.reduce((acc: number, v: any) => acc + (v.stock || 0), 0) ?? 0;
                  const isApproved = p.approval_status === 'approved';
                  const isPending = p.approval_status === 'pending';
                  const isRejected = p.approval_status === 'rejected';

                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                    >
                      {/* Product Header & Image */}
                      <div>
                        <div className="relative h-44 bg-gray-50 overflow-hidden flex items-center justify-center border-b border-gray-100">
                          <img
                            src={p.image_url || PLACEHOLDER_PRODUCT_IMAGE}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {/* Approval Status Badge */}
                          <div className="absolute top-3 left-3">
                            {isApproved && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 shadow-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Approved & Live</span>
                              </span>
                            )}
                            {isPending && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 shadow-xs animate-pulse">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>Awaiting Review</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 shadow-xs">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Rejected by Admin</span>
                              </span>
                            )}
                            {p.approval_status === 'suspended' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-200 text-gray-800 border border-gray-300 flex items-center gap-1 shadow-xs">
                                <Ban className="w-3.5 h-3.5 text-gray-600" />
                                <span>Suspended</span>
                              </span>
                            )}
                          </div>

                          <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/95 text-gray-700 shadow-xs uppercase tracking-wide">
                            {p.category}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="p-5 space-y-3">
                          <div>
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span className="font-mono text-[11px] bg-gray-100 px-1.5 py-0.5 rounded">SKU: {p.sku || 'N/A'}</span>
                              <span>{variant?.weight || 'Standard'}</span>
                            </div>
                            <h4 className="text-sm font-extrabold text-gray-900 leading-snug line-clamp-2">
                              {p.name}
                            </h4>
                          </div>

                          {/* Price & Stock */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-base font-black text-[#0f3e26]">₹{price}</span>
                                {compareAt && compareAt > price && (
                                  <span className="text-xs text-gray-400 line-through">₹{compareAt}</span>
                                )}
                              </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                              totalStock > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                            }`}>
                              {totalStock} in stock
                            </span>
                          </div>

                          {/* Timestamps */}
                          <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1">
                            <span>Submitted: {new Date(p.created_at).toLocaleDateString()}</span>
                            {p.reviewed_at && (
                              <span>Reviewed: {new Date(p.reviewed_at).toLocaleDateString()}</span>
                            )}
                          </div>

                          {/* Rejection Notice if rejected */}
                          {isRejected && p.rejection_reason && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
                              <span className="font-bold flex items-center gap-1 text-rose-800">
                                <AlertCircle className="w-3.5 h-3.5" /> Rejection Feedback:
                              </span>
                              <p className="text-[11px] text-rose-800/90 leading-relaxed">{p.rejection_reason}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="p-4 pt-0 flex items-center gap-2">
                        {isApproved ? (
                          <>
                            <button
                              onClick={() => handleOpenQuickUpdate(p)}
                              className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                              Update Stock/Price
                            </button>
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                              title="Edit all product specs"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : isRejected ? (
                          <button
                            onClick={() => handleOpenEditProduct(p)}
                            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Edit & Resubmit for Review</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenEditProduct(p)}
                            className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Modify Pending Request</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center text-gray-500 text-xs font-medium space-y-3 bg-white rounded-3xl border border-gray-200">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-gray-800 text-sm">No products found</p>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    {productStatusFilter !== 'all'
                      ? `No products with status "${productStatusFilter}".`
                      : 'You have not added any products yet. Click below to submit your first item.'}
                  </p>
                </div>
                <button
                  onClick={handleOpenAddProduct}
                  className="px-5 py-2.5 bg-[#0f3e26] text-white text-xs font-bold rounded-xl hover:bg-[#144f31] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: PRODUCT REJECTION REASONS ─── */}
        {activeTab === 'rejections' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs p-6 sm:p-8 space-y-6 animate-in fade-in">
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Product Rejection Feedback & Corrections</span>
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Products rejected by the admin team with detailed reasons. You can make the required changes and resubmit for approval.
              </p>
            </div>

            {rejectedProducts.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs font-medium space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <p className="font-bold text-gray-800 text-sm">No Rejected Products</p>
                <p>All your submitted products are either approved or in review!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rejectedProducts.map((p) => {
                  const variant = p.product_variants?.[0];
                  return (
                    <div
                      key={p.id}
                      className="p-5 rounded-2xl border-2 border-rose-200 bg-rose-50/40 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={p.image_url || PLACEHOLDER_PRODUCT_IMAGE}
                            alt={p.name}
                            className="w-16 h-16 rounded-xl object-cover bg-white border border-gray-200 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold">
                                SKU: {p.sku || 'N/A'}
                              </span>
                              <span className="text-[11px] text-gray-500">{p.category}</span>
                            </div>
                            <h4 className="font-black text-gray-900 text-sm mt-0.5">{p.name}</h4>
                            <p className="text-xs font-bold text-[#0f3e26] mt-0.5">
                              ₹{variant?.price || 0} • {variant?.weight || 'Standard'}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenEditProduct(p)}
                          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer self-start sm:self-center"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Edit & Resubmit</span>
                        </button>
                      </div>

                      {/* Admin Reason Box */}
                      <div className="p-4 rounded-xl bg-white border border-rose-200 text-xs text-rose-900 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-rose-800 uppercase tracking-wider text-[11px]">
                            Admin Feedback / Required Correction:
                          </span>
                          {p.reviewed_at && (
                            <span className="text-[10px] text-gray-400">
                              Decision Date: {new Date(p.reviewed_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-800 leading-relaxed font-medium">
                          {p.rejection_reason || 'Product does not meet standard marketplace quality or compliance requirements.'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 4: INVENTORY MANAGEMENT ─── */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs p-6 sm:p-8 space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">
                  Inventory & Quick Price Management
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Update stock quantities and selling prices on your approved products without requiring re-approval.
                </p>
              </div>
            </div>

            {approvedProducts.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs font-medium space-y-2">
                <Layers className="w-12 h-12 text-gray-300 mx-auto" />
                <p className="font-bold text-gray-800 text-sm">No Approved Products</p>
                <p>Once your products are approved by admin, manage their live inventory here.</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4">Current Price</th>
                      <th className="py-3 px-4">Available Stock</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {approvedProducts.map((p) => {
                      const variant = p.product_variants?.[0];
                      return (
                        <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={p.image_url || PLACEHOLDER_PRODUCT_IMAGE}
                                alt={p.name}
                                className="w-9 h-9 rounded-lg object-cover bg-gray-50 border border-gray-100 shrink-0"
                              />
                              <span className="font-bold text-gray-900 line-clamp-1">{p.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-gray-600">{p.sku || '—'}</td>
                          <td className="py-3 px-4 font-black text-[#0f3e26]">₹{variant?.price || 0}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                              (variant?.stock || 0) < 10 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {variant?.stock || 0} units
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                              Live
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleOpenQuickUpdate(p)}
                              className="px-3 py-1.5 bg-[#0f3e26] hover:bg-[#144f31] text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                            >
                              Update Stock/Price
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 5: SELLER PROFILE ─── */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs p-6 sm:p-8 space-y-6 animate-in fade-in">
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#0f3e26]" />
                <span>Seller Store Profile & Business Identity</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Verified registration details for your Gjanand Sarkar vendor account.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-3 text-xs">
                <span className="font-black text-gray-400 uppercase tracking-wider block">Store & Contact Details</span>
                <div className="flex justify-between py-1.5 border-b border-gray-200">
                  <span className="text-gray-500">Business / Store Name:</span>
                  <span className="font-bold text-gray-900">{storeName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-200">
                  <span className="text-gray-500">Contact Person:</span>
                  <span className="font-bold text-gray-900">{inquiry?.full_name || user?.name || 'Seller'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-200">
                  <span className="text-gray-500">Registered Email:</span>
                  <span className="font-medium text-gray-900">{inquiry?.email || user?.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500">Phone Number:</span>
                  <span className="font-bold text-gray-900">{inquiry?.phone ? `+91 ${inquiry.phone}` : (user?.phone || 'N/A')}</span>
                </div>
              </div>

              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-3 text-xs">
                <span className="font-black text-gray-400 uppercase tracking-wider block">Taxation & Compliance</span>
                <div className="flex justify-between py-1.5 border-b border-gray-200">
                  <span className="text-gray-500">Business Entity Type:</span>
                  <span className="font-bold text-gray-900">{inquiry?.business_type || 'Registered Vendor'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-200">
                  <span className="text-gray-500">GSTIN:</span>
                  <span className="font-mono font-bold text-gray-900">{inquiry?.gstin || (sellerStore as any)?.gstin || 'Not Applicable'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-200">
                  <span className="text-gray-500">PAN Number:</span>
                  <span className="font-mono font-bold text-gray-900">{inquiry?.pan || 'Verified'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500">Business Address:</span>
                  <span className="text-gray-800 text-right max-w-xs">{inquiry?.business_address || storeState}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 6: ORDERS ─── */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs p-6 sm:p-8 space-y-4 animate-in fade-in">
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

        {/* ─── TAB 7: ANALYTICS & PAYOUTS ─── */}
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs p-6 sm:p-8 space-y-6 animate-in fade-in">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                Bank Payout & Settlement History
              </h3>
              <p className="text-xs text-gray-500">Automated settlements after deducting {storeCommission}% SaaS platform commission</p>
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

        {/* ─── TAB 8: NOTIFICATIONS ─── */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs p-6 sm:p-8 space-y-6 animate-in fade-in">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                Seller Notification Center
              </h3>
              <p className="text-xs text-gray-500">Important approvals, alerts, and platform messages</p>
            </div>

            {notifications.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-xs font-medium">
                No new notifications.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900">{n.title}</h4>
                      <span className="text-[10px] text-gray-400">
                        {n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ─── FULL SELLER PRODUCT MODAL (ADD / EDIT / RESUBMIT) ─── */}
      <SellerProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={editingProduct}
        defaultStoreName={storeName}
        onSuccess={handleProductSubmitted}
      />

      {/* ─── QUICK STOCK & PRICE UPDATE MODAL ─── */}
      {quickUpdateModal.open && quickUpdateModal.product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-gray-900">Update Stock & Price</h3>
                <p className="text-xs text-gray-500 truncate max-w-[200px]">{quickUpdateModal.product.name}</p>
              </div>
              <button
                onClick={() => setQuickUpdateModal(p => ({ ...p, open: false }))}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {quickUpdateModal.error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-bold">
                {quickUpdateModal.error}
              </div>
            )}

            {quickUpdateModal.success && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold">
                {quickUpdateModal.success}
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Selling Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={quickUpdateModal.price}
                  onChange={e => setQuickUpdateModal(p => ({ ...p, price: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-sm font-bold outline-none focus:ring-2 focus:ring-[#0c3c26]/20"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Available Stock Quantity</label>
                <input
                  type="number"
                  value={quickUpdateModal.stock}
                  onChange={e => setQuickUpdateModal(p => ({ ...p, stock: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-sm font-bold outline-none focus:ring-2 focus:ring-[#0c3c26]/20"
                />
              </div>

              <p className="text-[11px] text-gray-400">
                Updating stock or price does not require reapproval. Your product remains live.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={quickUpdateModal.isSubmitting}
                onClick={() => setQuickUpdateModal(p => ({ ...p, open: false }))}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={quickUpdateModal.isSubmitting}
                onClick={handleExecuteQuickUpdate}
                className="px-5 py-2 text-xs font-bold bg-[#0c3c26] text-white rounded-xl hover:bg-[#144f31] disabled:opacity-50"
              >
                {quickUpdateModal.isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── REACTIVATION MODAL ─── */}
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

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isSubmittingReactivation}
                onClick={() => setReactivationModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingReactivation || !reactivationReason.trim()}
                onClick={async () => {
                  setIsSubmittingReactivation(true);
                  setReactivationMsg(null);
                  try {
                    await requestSellerReactivation({ reason: reactivationReason, notes: reactivationNotes });
                    setReactivationMsg({ type: 'success', text: 'Reactivation request submitted successfully!' });
                    setTimeout(() => {
                      setReactivationModalOpen(false);
                      loadSellerData();
                    }, 1500);
                  } catch (err: any) {
                    setReactivationMsg({ type: 'error', text: err.message || 'Submission failed' });
                  } finally {
                    setIsSubmittingReactivation(false);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-[#0f3e26] hover:bg-[#144f31] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingReactivation ? 'Submitting...' : 'Submit Appeal'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
