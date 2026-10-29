"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { SellerOrdersManager } from '@/components/seller/SellerOrdersManager';
import { SellerReturnsManager } from '@/components/seller/SellerReturnsManager';
import { SellerSidebar } from '@/components/seller/SellerSidebar';
import { SellerQualityReportModal } from '@/components/seller/SellerQualityReportModal';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';

type DashboardTab = 
  | 'overview' 
  | 'profile' 
  | 'products' 
  | 'rejections' 
  | 'inventory' 
  | 'orders' 
  | 'returns'
  | 'quality-reports'
  | 'analytics' 
  | 'notifications'
  | 'store';

function SellerDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useStore((s) => s.user);
  const isAuthLoading = useStore((s) => s.isAuthLoading);
  const sellerStore = useStore((s) => s.sellerStore);

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [data, setData] = useState<SellerDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const tabParam = searchParams.get('tab') as DashboardTab | null;
    if (tabParam) {
      if (tabParam === 'store') setActiveTab('profile');
      else setActiveTab(tabParam);
    } else {
      setActiveTab('overview');
    }
  }, [searchParams]);

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

  // Quality Test Reports
  const [qualityReports, setQualityReports] = useState<any[]>([]);
  const [isLoadingQualityReports, setIsLoadingQualityReports] = useState(false);
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);

  const loadQualityReports = async () => {
    try {
      setIsLoadingQualityReports(true);
      const res = await fetch('/api/quality-reports');
      if (res.ok) {
        const d = await res.json();
        setQualityReports(d.reports || []);
      }
    } catch (err) {
      console.error('Failed to load quality reports', err);
    } finally {
      setIsLoadingQualityReports(false);
    }
  };

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
      Promise.all([loadSellerData(), loadProducts(), loadNotifications(), loadQualityReports()]).finally(() => {
        setIsLoading(false);
      });

      // 1. Silent live background refresh (every 12 seconds)
      const interval = setInterval(() => {
        loadSellerData();
        loadProducts();
        loadNotifications();
        loadQualityReports();
      }, 12000);

      // 2. Real-time Supabase listener on product approvals, products, and orders
      let isCancelled = false;
      let activeChannel: any = null;
      import('@/lib/supabase/lazy').then(({ getSupabaseLazy }) => {
        getSupabaseLazy().then((supabase) => {
          if (isCancelled) return;
          const channelName = `seller-live-${user.id}-${Math.random().toString(36).slice(2, 9)}`;
          activeChannel = supabase
            .channel(channelName)
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

          if (isCancelled) {
            supabase.removeChannel(activeChannel);
          }
        });
      });

      return () => {
        isCancelled = true;
        clearInterval(interval);
        if (activeChannel) {
          import('@/lib/supabase/lazy').then(({ getSupabaseLazy }) => {
            getSupabaseLazy().then((supabase) => {
              supabase.removeChannel(activeChannel);
            });
          });
        }
      };
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  /* Auth redirect.

     This used to key off `isLoading`, which is the DATA loading flag. With
     no user yet, the effect above takes its `else` branch and immediately
     sets isLoading = false, so this fired while the session was still being
     hydrated and bounced a perfectly valid seller to /login. AuthGuard then
     saw a logged-in seller sitting on /login and sent them back here --
     producing the endless reload loop after signing in.

     The only correct signal is the auth hydration flag: until it settles we
     genuinely do not know whether anyone is logged in. */
  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.replace('/login?redirect=/seller/dashboard');
    }
  }, [isAuthLoading, user, router]);

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-primary" />
          <p className="text-xs font-semibold text-foreground-muted">Loading Seller Dashboard...</p>
        </div>
      </div>
    );
  }

  const inquiry = data?.inquiry;

  // ─── 1. REJECTED SELLER APPLICATION SCREEN ───
  if (inquiry && inquiry.status === 'rejected') {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in">
          <div className="bg-surface rounded-xl border border-error/20 shadow-sm p-8 sm:p-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-error-bg text-error flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-error-bg border border-error/20 text-error text-xs font-semibold uppercase tracking-wider">
                Seller Application Rejected
              </span>
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
                {inquiry.business_name || 'Seller Application'}
              </h1>
              <p className="text-sm text-foreground-muted max-w-lg mx-auto">
                Your seller application was reviewed by our vendor onboarding team and could not be approved at this time. Access to the Seller Dashboard is restricted.
              </p>
            </div>

            {inquiry.admin_notes && (
              <div className="bg-error-bg/70 border border-error/20 rounded-2xl p-4 text-left max-w-lg mx-auto text-xs text-red-900">
                <span className="font-bold block mb-1">Reason / Admin Note:</span>
                <p>{inquiry.admin_notes}</p>
              </div>
            )}

            <div className="bg-surface-muted rounded-2xl p-5 text-left border border-border space-y-3 max-w-lg mx-auto text-xs">
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-foreground-muted">Inquiry ID:</span>
                <span className="font-mono font-bold text-foreground">{inquiry.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-foreground-muted">Contact Person:</span>
                <span className="font-bold text-foreground">{inquiry.full_name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-foreground-muted">Current Status:</span>
                <span className="font-semibold uppercase px-2 py-0.5 rounded-full bg-error-bg text-error text-xs">
                  Rejected
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/become-seller?resubmit=true"
                className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary text-on-primary text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Edit & Resubmit Application</span>
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
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in">
          
          <div className="bg-surface rounded-xl border border-warning/20 shadow-sm p-8 sm:p-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-warning-bg text-secondary flex items-center justify-center mx-auto shadow-inner">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-warning-bg border border-warning/20 text-warning text-xs font-semibold uppercase tracking-wider">
                {inquiry.status === 'contacted' ? 'Contacted & Under Review' : 'Application Under Manual Review'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
                {inquiry.business_name || 'Your Seller Application'}
              </h1>
              <p className="text-sm text-foreground-muted max-w-lg mx-auto">
                Thank you for applying to sell on Gjanand Sarkar. Our vendor onboarding team is reviewing your business details. Once approved, you will be granted access to the Seller Dashboard.
              </p>
            </div>

            {inquiry.admin_notes && (
              <div className="bg-warning-bg/80 border border-warning/20 rounded-2xl p-4 text-left max-w-lg mx-auto text-xs text-warning">
                <span className="font-bold block mb-1">Admin Note:</span>
                <p>{inquiry.admin_notes}</p>
              </div>
            )}

            {/* Application Summary Box */}
            <div className="bg-surface-muted rounded-2xl p-5 text-left border border-border space-y-3 max-w-lg mx-auto text-xs">
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-foreground-muted">Inquiry ID:</span>
                <span className="font-mono font-bold text-foreground">{inquiry.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-foreground-muted">Contact Person:</span>
                <span className="font-bold text-foreground">{inquiry.full_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-foreground-muted">Contact Number:</span>
                <span className="font-bold text-foreground">+91 {inquiry.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-foreground-muted">Product Category:</span>
                <span className="font-bold text-primary">{inquiry.category}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-foreground-muted">Current Status:</span>
                <span className="font-semibold uppercase px-2 py-0.5 rounded-full bg-warning-bg text-warning text-xs">
                  Pending Admin Approval
                </span>
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="bg-success-bg/70 border border-success/20/80 rounded-2xl p-5 text-left space-y-2 max-w-lg mx-auto text-xs text-success">
              <h4 className="font-semibold uppercase tracking-wider flex items-center gap-1.5 text-primary">
                <FileCheck2 className="w-4 h-4 text-primary" />
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
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-surface rounded-xl border border-red-300 p-8 sm:p-10 text-center space-y-6 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-primary text-red-400 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-error-bg border border-red-300 text-red-900 text-xs font-semibold uppercase tracking-wider">
                Seller Account Suspended
              </span>
              <h1 className="text-2xl font-semibold text-foreground">
                {(sellerStore as any)?.store_name || (data?.store as any)?.storeName || 'Seller Store'}
              </h1>
              <p className="text-xs text-foreground-muted max-w-md mx-auto">
                This seller account has been suspended or deactivated. Access to product operations and marketplace publishing has been suspended.
              </p>
            </div>
            {deactivationReason && (
              <div className="bg-error-bg border border-error/20 rounded-2xl p-4 text-left text-xs text-red-900 max-w-md mx-auto">
                <span className="font-bold block mb-1">Reason:</span>
                <p>{deactivationReason}</p>
              </div>
            )}
            <div className="pt-2 flex items-center justify-center gap-3">
              <Link
                href="/auth/login"
                className="px-6 py-2.5 bg-primary hover:bg-primary text-on-primary text-xs font-bold rounded-xl transition-all"
              >
                Back to Login
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
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-surface rounded-xl border border-border p-8 text-center space-y-5 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-success-bg text-primary flex items-center justify-center mx-auto">
            <Store className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Seller Dashboard Access Required</h2>
          <p className="text-xs text-foreground-muted">
            You don't have an active seller account. Please submit a seller application to request vendor onboarding and access seller tools.
          </p>
          <div className="pt-2">
            <Link
              href="/become-seller"
              className="w-full px-6 py-3 bg-primary hover:bg-primary text-on-primary text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
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
    <div className="w-full flex flex-col">
      {/* Operations Top Header matching Admin Panel */}
      <div className="px-4 sm:px-6 md:px-10 pt-6 pb-5 bg-surface border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Store className="w-4 h-4 text-primary" strokeWidth={2.5} />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Seller Hub Operations
              </span>
              <span className="px-2 py-0.5 rounded-full bg-success-bg text-success text-[11px] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Approved Seller</span>
              </span>
            </div>
            <h1 className="font-semibold text-2xl sm:text-[28px] tracking-tight text-foreground">
              {storeName}
            </h1>
            <p className="text-xs text-foreground-muted mt-1">
              Category: <strong className="text-foreground">{storeCategory}</strong> • Region: <strong className="text-foreground">{storeState}</strong> • Platform Commission: <span className="font-semibold text-secondary">{storeCommission}%</span>
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => {
                setIsLoadingProducts(true);
                Promise.all([loadSellerData(), loadProducts(), loadNotifications(), loadQualityReports()]).finally(() => {
                  setIsLoadingProducts(false);
                });
              }}
              title="Refresh live metrics & products"
              className="p-2.5 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingProducts ? 'animate-spin text-primary' : ''}`} />
            </button>

            <Link
              href="/seller/activity"
              className="hidden sm:inline-flex px-3.5 py-2 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-surface-muted transition-colors"
            >
              Activity Log
            </Link>

            <button
              onClick={handleOpenAddProduct}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:opacity-90 flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span>Add Product</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Sub-tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-4 sm:px-6 md:px-10 py-3 bg-surface border-b border-border">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'products', label: `Products (${products.length})` },
          { id: 'orders', label: 'Orders' },
          { id: 'quality-reports', label: 'Quality Reports' },
          { id: 'inventory', label: 'Inventory' },
          { id: 'returns', label: 'Returns' },
          { id: 'rejections', label: `Rejected (${rejectedProducts.length})` },
          { id: 'profile', label: 'Store Profile' },
          { id: 'analytics', label: 'Analytics' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setActiveTab(t.id as DashboardTab);
              window.history.pushState(null, '', t.id === 'overview' ? '/seller/dashboard' : `/seller/dashboard?tab=${t.id}`);
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap rounded-lg transition-colors cursor-pointer ${
              activeTab === t.id
                ? 'bg-primary text-on-primary shadow-2xs'
                : 'text-foreground-muted hover:bg-surface-muted hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content Container */}
      <div className="max-w-[1400px] w-full p-4 sm:p-6 md:p-8 flex flex-col gap-6">
          {/* Lifecycle Banner: Under Review */}
          {sellerStatus === 'under_review' && (
            <div className="bg-warning-bg border-2 border-warning rounded-2xl p-5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-warning font-semibold text-sm">
                  <Clock className="w-5 h-5 text-warning animate-pulse" />
                  <span>Seller Account Under Review</span>
                </div>
                {reviewExpiresAt && (
                  <span className="px-3 py-1 rounded-full bg-warning-bg text-warning text-xs font-bold font-mono border border-warning">
                    Review Expiry: {new Date(reviewExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
              <p className="text-xs text-warning">
                Your store is currently under review by our quality and compliance team.
                {reviewReason ? ` Reason: "${reviewReason}".` : ''} Existing orders continue to be fulfilled normally.
              </p>
            </div>
          )}

        {/* ─── TAB 1: OVERVIEW ─── */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface p-6 rounded-2xl border border-border/90 shadow-2xs">
                <div className="flex items-center justify-between text-foreground-muted mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Gross Revenue</span>
                  <div className="w-8 h-8 rounded-xl bg-success-bg text-primary flex items-center justify-center">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-semibold text-foreground">
                  ₹{(data?.metrics?.grossRevenue ?? 0).toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-success font-bold mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Verified Sales</span>
                </div>
              </div>

              <div className="bg-surface p-6 rounded-2xl border border-border/90 shadow-2xs">
                <div className="flex items-center justify-between text-foreground-muted mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Live Approved</span>
                  <div className="w-8 h-8 rounded-xl bg-success-bg text-success flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-semibold text-success">
                  {approvedProducts.length}
                </div>
                <div className="text-xs text-foreground-muted mt-1">
                  Active in customer catalog
                </div>
              </div>

              <div className="bg-surface p-6 rounded-2xl border border-border/90 shadow-2xs">
                <div className="flex items-center justify-between text-foreground-muted mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Pending Approvals</span>
                  <div className="w-8 h-8 rounded-xl bg-warning-bg text-warning flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-semibold text-warning">
                  {pendingProducts.length}
                </div>
                <div className="text-xs text-warning font-semibold mt-1">
                  Awaiting admin review
                </div>
              </div>

              <div className="bg-surface p-6 rounded-2xl border border-border/90 shadow-2xs">
                <div className="flex items-center justify-between text-foreground-muted mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Rejected Requests</span>
                  <div className="w-8 h-8 rounded-xl bg-error-bg text-error flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-semibold text-error">
                  {rejectedProducts.length}
                </div>
                <div className="text-xs text-error font-bold mt-1">
                  Action required to resubmit
                </div>
              </div>
            </div>

            {/* Quick Action Banner */}
            <div className="bg-gradient-to-r from-[var(--primary)] to-primary-light rounded-xl p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-md">
              <div className="space-y-1.5 max-w-xl">
                <span className="px-2.5 py-0.5 rounded-full bg-surface/20 text-white text-xs font-semibold uppercase tracking-wider">
                  Product Approval Pipeline
                </span>
                <h3 className="text-xl sm:text-2xl font-semibold">Ready to expand your store catalog?</h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  Submit new milk, ghee, sweets, or groceries. All submissions are thoroughly inspected by our quality assurance team before publishing.
                </p>
              </div>
              <button
                onClick={handleOpenAddProduct}
                className="px-6 py-3.5 bg-surface text-primary hover:bg-success-bg rounded-2xl font-semibold text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" strokeWidth={3} />
                <span>Add Product Now</span>
              </button>
            </div>

            {/* Recent Orders Overview */}
            <div className="bg-surface rounded-xl border border-border/90 shadow-2xs p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  Recent Store Orders
                </h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  View All Orders →
                </button>
              </div>

              <div className="divide-y divide-border">
                {(data?.recentOrders || []).length > 0 ? (
                  (data?.recentOrders || []).slice(0, 5).map((order) => (
                    <div key={order.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-mono font-bold text-foreground">{order.id}</span>
                        <p className="text-xs text-foreground-muted">{order.customerName} • {order.itemsCount} items</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-foreground">₹{order.amount}</span>
                        <p className="text-xs text-success capitalize font-semibold">{order.status.replace('_', ' ')}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-foreground-muted text-xs font-medium">
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
            <div className="bg-surface rounded-2xl border border-border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Status Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: 'All', count: products.length },
                  { id: 'pending', label: 'Pending Approvals', count: pendingProducts.length, color: 'text-warning bg-warning-bg' },
                  { id: 'approved', label: 'Approved Live', count: approvedProducts.length, color: 'text-success bg-success-bg' },
                  { id: 'rejected', label: 'Rejected', count: rejectedProducts.length, color: 'text-error bg-error-bg' },
                  { id: 'suspended', label: 'Suspended', count: suspendedProducts.length, color: 'text-foreground bg-surface-muted' },
                ].map(pill => (
                  <button
                    key={pill.id}
                    onClick={() => setProductStatusFilter(pill.id as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                      productStatusFilter === pill.id
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-surface-muted text-foreground hover:bg-border'
                    }`}
                  >
                    <span>{pill.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-xs font-semibold ${
                      productStatusFilter === pill.id ? 'bg-surface/20 text-white' : 'bg-border text-foreground'
                    }`}>
                      {pill.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search & Add */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="Search by name, SKU..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                  />
                </div>

                <button
                  onClick={handleOpenAddProduct}
                  className="px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-primary-hover transition-colors cursor-pointer shrink-0"
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
                  <div key={i} className="h-48 rounded-2xl bg-surface border border-border animate-pulse" />
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
                      className="bg-surface rounded-xl border border-border/90 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                    >
                      {/* Product Header & Image */}
                      <div>
                        <div className="relative h-44 bg-surface-muted overflow-hidden flex items-center justify-center border-b border-border">
                          <img
                            src={p.image_url || PLACEHOLDER_PRODUCT_IMAGE}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {/* Approval Status Badge */}
                          <div className="absolute top-3 left-3">
                            {isApproved && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-success-bg text-success border border-success/20 flex items-center gap-1 shadow-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                                <span>Approved & Live</span>
                              </span>
                            )}
                            {isPending && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-warning-bg text-warning border border-warning/20 flex items-center gap-1 shadow-xs animate-pulse">
                                <Clock className="w-3.5 h-3.5 text-warning" />
                                <span>Awaiting Review</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-error-bg text-error border border-error/20 flex items-center gap-1 shadow-xs">
                                <AlertTriangle className="w-3.5 h-3.5 text-error" />
                                <span>Rejected by Admin</span>
                              </span>
                            )}
                            {p.approval_status === 'suspended' && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-border text-foreground border border-border-hover flex items-center gap-1 shadow-xs">
                                <Ban className="w-3.5 h-3.5 text-foreground-muted" />
                                <span>Suspended</span>
                              </span>
                            )}
                          </div>

                          <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full text-xs font-bold bg-surface/95 text-foreground shadow-xs uppercase tracking-wide">
                            {p.category}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="p-5 space-y-3">
                          <div>
                            <div className="flex items-center justify-between text-xs text-foreground-muted mb-1">
                              <span className="font-mono text-xs bg-surface-muted px-1.5 py-0.5 rounded">SKU: {p.sku || 'N/A'}</span>
                              <span>{variant?.weight || 'Standard'}</span>
                            </div>
                            <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                              {p.name}
                            </h4>
                          </div>

                          {/* Price & Stock */}
                          <div className="flex items-center justify-between pt-2 border-t border-border">
                            <div>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-base font-semibold text-primary">₹{price}</span>
                                {compareAt && compareAt > price && (
                                  <span className="text-xs text-foreground-muted line-through">₹{compareAt}</span>
                                )}
                              </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                              totalStock > 0 ? 'bg-success-bg text-success' : 'bg-error-bg text-error'
                            }`}>
                              {totalStock} in stock
                            </span>
                          </div>

                          {/* Timestamps */}
                          <div className="text-xs text-foreground-muted flex items-center justify-between pt-1">
                            <span>Submitted: {new Date(p.created_at).toLocaleDateString()}</span>
                            {p.reviewed_at && (
                              <span>Reviewed: {new Date(p.reviewed_at).toLocaleDateString()}</span>
                            )}
                          </div>

                          {/* Rejection Notice if rejected */}
                          {isRejected && p.rejection_reason && (
                            <div className="p-3 bg-error-bg border border-error/20 rounded-xl text-xs text-error space-y-1">
                              <span className="font-bold flex items-center gap-1 text-error">
                                <AlertCircle className="w-3.5 h-3.5" /> Rejection Feedback:
                              </span>
                              <p className="text-xs text-error/90 leading-relaxed">{p.rejection_reason}</p>
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
                              className="flex-1 py-2 bg-surface-muted hover:bg-border text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                              Update Stock/Price
                            </button>
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              className="px-3 py-2 bg-surface border border-border hover:bg-surface-muted text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
                              title="Edit all product specs"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : isRejected ? (
                          <button
                            onClick={() => handleOpenEditProduct(p)}
                            className="w-full py-2.5 bg-error hover:bg-error text-on-error rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Edit & Resubmit for Review</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenEditProduct(p)}
                            className="w-full py-2 bg-warning-bg hover:bg-warning-bg text-warning border border-warning/20 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
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
              <div className="py-16 text-center text-foreground-muted text-xs font-medium space-y-3 bg-surface rounded-xl border border-border">
                <div className="w-14 h-14 rounded-2xl bg-surface-muted text-foreground-muted flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-foreground text-sm">No products found</p>
                  <p className="text-foreground-muted max-w-sm mx-auto">
                    {productStatusFilter !== 'all'
                      ? `No products with status "${productStatusFilter}".`
                      : 'You have not added any products yet. Click below to submit your first item.'}
                  </p>
                </div>
                <button
                  onClick={handleOpenAddProduct}
                  className="px-5 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: QUALITY TEST REPORTS ─── */}
        {activeTab === 'quality-reports' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-surface rounded-xl border border-border p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span>Certified Laboratory Quality Reports</span>
                </h3>
                <p className="text-xs text-foreground-muted mt-1 max-w-2xl">
                  Upload laboratory test reports and purity certificates for your products. Reports are reviewed and approved by the admin before being published to customer product pages.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsQualityModalOpen(true)}
                className="px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-on-primary text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Lab Report</span>
              </button>
            </div>

            {isLoadingQualityReports ? (
              <div className="bg-surface rounded-xl border border-border p-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                <p className="text-xs text-foreground-muted">Loading quality test reports...</p>
              </div>
            ) : qualityReports.length === 0 ? (
              <div className="bg-surface rounded-xl border border-border p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-foreground">No quality reports uploaded yet</h4>
                <p className="text-xs text-foreground-muted max-w-md mx-auto">
                  Lab reports build trust with your buyers. Upload testing certificates issued by NABL or FSSAI accredited laboratories.
                </p>
                <button
                  type="button"
                  onClick={() => setIsQualityModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  Upload First Lab Report
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {qualityReports.map((report) => (
                  <div key={report.id} className="bg-surface rounded-xl border border-border p-5 flex flex-col justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                          report.status === 'approved'
                            ? 'bg-success-bg text-success border border-success/20'
                            : report.status === 'rejected'
                            ? 'bg-error-bg text-error border border-error/20'
                            : 'bg-warning-bg text-warning border border-warning/20'
                        }`}>
                          {report.status === 'approved' ? 'Approved & Live' : report.status === 'rejected' ? 'Rejected' : 'Pending Review'}
                        </span>
                        <span className="text-[11px] text-foreground-muted">
                          {new Date(report.test_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-semibold text-sm text-foreground">{report.title}</h4>
                        <p className="text-xs text-foreground-muted mt-0.5">Lab: {report.laboratory_name}</p>
                        {report.batch_number && (
                          <p className="text-xs text-foreground-muted">Batch: {report.batch_number}</p>
                        )}
                        {report.product_name && (
                          <p className="text-xs font-medium text-primary mt-1">Product: {report.product_name}</p>
                        )}
                      </div>

                      {report.admin_notes && (
                        <div className="p-2.5 rounded-lg bg-surface-muted text-xs border border-border text-foreground-muted">
                          <span className="font-semibold text-foreground block mb-0.5">Admin Note:</span>
                          <p>{report.admin_notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between">
                      <a
                        href={report.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <span>View Certificate</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: PRODUCT REJECTION REASONS ─── */}
        {activeTab === 'rejections' && (
          <div className="bg-surface rounded-xl border border-border shadow-2xs p-6 sm:p-8 space-y-6 animate-in fade-in">
            <div>
              <h3 className="text-lg font-semibold text-foreground tracking-tight flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-error" />
                <span>Product Rejection Feedback & Corrections</span>
              </h3>
              <p className="text-xs text-foreground-muted mt-1">
                Products rejected by the admin team with detailed reasons. You can make the required changes and resubmit for approval.
              </p>
            </div>

            {rejectedProducts.length === 0 ? (
              <div className="py-12 text-center text-foreground-muted text-xs font-medium space-y-2">
                <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
                <p className="font-bold text-foreground text-sm">No Rejected Products</p>
                <p>All your submitted products are either approved or in review!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rejectedProducts.map((p) => {
                  const variant = p.product_variants?.[0];
                  return (
                    <div
                      key={p.id}
                      className="p-5 rounded-2xl border-2 border-error/20 bg-error-bg/40 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={p.image_url || PLACEHOLDER_PRODUCT_IMAGE}
                            alt={p.name}
                            className="w-16 h-16 rounded-xl object-cover bg-surface border border-border shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs bg-error-bg text-error px-1.5 py-0.5 rounded font-bold">
                                SKU: {p.sku || 'N/A'}
                              </span>
                              <span className="text-xs text-foreground-muted">{p.category}</span>
                            </div>
                            <h4 className="font-semibold text-foreground text-sm mt-0.5">{p.name}</h4>
                            <p className="text-xs font-bold text-primary mt-0.5">
                              ₹{variant?.price || 0} • {variant?.weight || 'Standard'}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenEditProduct(p)}
                          className="px-5 py-2.5 bg-error hover:bg-error text-on-error rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer self-start sm:self-center"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Edit & Resubmit</span>
                        </button>
                      </div>

                      {/* Admin Reason Box */}
                      <div className="p-4 rounded-xl bg-surface border border-error/20 text-xs text-error space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-error uppercase tracking-wider text-xs">
                            Admin Feedback / Required Correction:
                          </span>
                          {p.reviewed_at && (
                            <span className="text-xs text-foreground-muted">
                              Decision Date: {new Date(p.reviewed_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-foreground leading-relaxed font-medium">
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
          <div className="bg-surface rounded-xl border border-border shadow-2xs p-6 sm:p-8 space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground tracking-tight">
                  Inventory & Quick Price Management
                </h3>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Update stock quantities and selling prices on your approved products without requiring re-approval.
                </p>
              </div>
            </div>

            {approvedProducts.length === 0 ? (
              <div className="py-12 text-center text-foreground-muted text-xs font-medium space-y-2">
                <Layers className="w-12 h-12 text-foreground-muted mx-auto" />
                <p className="font-bold text-foreground text-sm">No Approved Products</p>
                <p>Once your products are approved by admin, manage their live inventory here.</p>
              </div>
            ) : (
              <div className="border border-border rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-muted text-foreground-muted font-bold border-b border-border">
                    <tr>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4">Current Price</th>
                      <th className="py-3 px-4">Available Stock</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {approvedProducts.map((p) => {
                      const variant = p.product_variants?.[0];
                      return (
                        <tr key={p.id} className="hover:bg-surface-muted/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={p.image_url || PLACEHOLDER_PRODUCT_IMAGE}
                                alt={p.name}
                                className="w-9 h-9 rounded-lg object-cover bg-surface-muted border border-border shrink-0"
                              />
                              <span className="font-bold text-foreground line-clamp-1">{p.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-foreground-muted">{p.sku || '—'}</td>
                          <td className="py-3 px-4 font-semibold text-primary">₹{variant?.price || 0}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                              (variant?.stock || 0) < 10 ? 'bg-warning-bg text-warning' : 'bg-success-bg text-success'
                            }`}>
                              {variant?.stock || 0} units
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold uppercase bg-success-bg text-success">
                              Live
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleOpenQuickUpdate(p)}
                              className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-on-primary font-bold rounded-lg text-xs transition-colors cursor-pointer"
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
        {(activeTab === 'profile' || activeTab === 'store') && (
          <div className="bg-surface rounded-xl border border-border shadow-2xs p-6 sm:p-8 space-y-6 animate-in fade-in">
            <div>
              <h3 className="text-lg font-semibold text-foreground tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <span>Seller Store Profile & Business Identity</span>
              </h3>
              <p className="text-xs text-foreground-muted mt-0.5">
                Verified registration details for your Gjanand Sarkar vendor account.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-surface-muted rounded-2xl border border-border space-y-3 text-xs">
                <span className="font-semibold text-foreground-muted uppercase tracking-wider block">Store & Contact Details</span>
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-foreground-muted">Business / Store Name:</span>
                  <span className="font-bold text-foreground">{storeName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-foreground-muted">Contact Person:</span>
                  <span className="font-bold text-foreground">{inquiry?.full_name || user?.name || 'Seller'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-foreground-muted">Registered Email:</span>
                  <span className="font-medium text-foreground">{inquiry?.email || user?.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-foreground-muted">Phone Number:</span>
                  <span className="font-bold text-foreground">{inquiry?.phone ? `+91 ${inquiry.phone}` : (user?.phone || 'N/A')}</span>
                </div>
              </div>

              <div className="p-5 bg-surface-muted rounded-2xl border border-border space-y-3 text-xs">
                <span className="font-semibold text-foreground-muted uppercase tracking-wider block">Taxation & Compliance</span>
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-foreground-muted">Business Entity Type:</span>
                  <span className="font-bold text-foreground">{inquiry?.business_type || 'Registered Vendor'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-foreground-muted">GSTIN:</span>
                  <span className="font-mono font-bold text-foreground">{inquiry?.gstin || (sellerStore as any)?.gstin || 'Not Applicable'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-foreground-muted">PAN Number:</span>
                  <span className="font-mono font-bold text-foreground">{inquiry?.pan || 'Verified'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-foreground-muted">Business Address:</span>
                  <span className="text-foreground text-right max-w-xs">{inquiry?.business_address || storeState}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 6: ORDERS ─── */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-surface rounded-xl border border-border/90 shadow-2xs p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground tracking-tight flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                    <span>Store Order Fulfillment</span>
                  </h3>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    Process store orders through fulfillment workflow: Confirmed → Out for Delivery → Delivered, or cancel eligible orders.
                  </p>
                </div>
              </div>
            </div>

            <SellerOrdersManager />
          </div>
        )}

        {/* ─── TAB 6b: RETURNS & CANCELLATIONS ─── */}
        {activeTab === 'returns' && (
          <SellerReturnsManager />
        )}

        {/* ─── TAB 7: ANALYTICS & PAYOUTS ─── */}
        {activeTab === 'analytics' && (
          <div className="bg-surface rounded-xl border border-border shadow-2xs p-6 sm:p-8 space-y-6 animate-in fade-in">
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Bank Payout & Settlement History
              </h3>
              <p className="text-xs text-foreground-muted">Automated settlements after deducting {storeCommission}% SaaS platform commission</p>
            </div>

            <div className="divide-y divide-border">
              {(data?.payoutHistory || []).length > 0 ? (
                (data?.payoutHistory || []).map((payout) => (
                  <div key={payout.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="text-xs font-mono font-bold text-foreground">{payout.id}</span>
                      <p className="text-xs text-foreground-muted">Direct Deposit (NEFT) • {payout.date}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-success">₹{payout.net.toLocaleString('en-IN')}</span>
                      <p className="text-xs text-foreground-muted">Platform fee deducted: ₹{payout.fee}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-foreground-muted text-xs font-medium">
                  No bank payout settlements yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 8: NOTIFICATIONS ─── */}
        {activeTab === 'notifications' && (
          <div className="bg-surface rounded-xl border border-border shadow-2xs p-6 sm:p-8 space-y-6 animate-in fade-in">
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Seller Notification Center
              </h3>
              <p className="text-xs text-foreground-muted">Important approvals, alerts, and platform messages</p>
            </div>

            {notifications.length === 0 ? (
              <div className="py-10 text-center text-foreground-muted text-xs font-medium">
                No new notifications.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-4 rounded-2xl bg-surface-muted border border-border text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-foreground">{n.title}</h4>
                      <span className="text-xs text-foreground-muted">
                        {n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p className="text-foreground leading-relaxed">{n.message}</p>
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

      {/* ─── SELLER QUALITY REPORT MODAL ─── */}
      <SellerQualityReportModal
        isOpen={isQualityModalOpen}
        onClose={() => setIsQualityModalOpen(false)}
        products={products.map((p) => ({ id: p.id, name: p.name }))}
        onReportCreated={() => {
          loadQualityReports();
        }}
      />

      {/* ─── QUICK STOCK & PRICE UPDATE MODAL ─── */}
      {quickUpdateModal.open && quickUpdateModal.product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4">
          <div className="bg-surface rounded-xl max-w-sm w-full p-6 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-semibold text-base text-foreground">Update Stock & Price</h3>
                <p className="text-xs text-foreground-muted truncate max-w-[200px]">{quickUpdateModal.product.name}</p>
              </div>
              <button
                onClick={() => setQuickUpdateModal(p => ({ ...p, open: false }))}
                className="p-1 rounded-lg text-foreground-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {quickUpdateModal.error && (
              <div className="p-3 rounded-xl bg-error-bg text-error text-xs font-bold">
                {quickUpdateModal.error}
              </div>
            )}

            {quickUpdateModal.success && (
              <div className="p-3 rounded-xl bg-success-bg text-success text-xs font-bold">
                {quickUpdateModal.success}
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-foreground mb-1">Selling Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={quickUpdateModal.price}
                  onChange={e => setQuickUpdateModal(p => ({ ...p, price: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-border text-sm font-bold outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">Available Stock Quantity</label>
                <input
                  type="number"
                  value={quickUpdateModal.stock}
                  onChange={e => setQuickUpdateModal(p => ({ ...p, stock: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-border text-sm font-bold outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                />
              </div>

              <p className="text-xs text-foreground-muted">
                Updating stock or price does not require reapproval. Your product remains live.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={quickUpdateModal.isSubmitting}
                onClick={() => setQuickUpdateModal(p => ({ ...p, open: false }))}
                className="px-4 py-2 text-xs font-bold text-foreground-muted hover:bg-surface-muted rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={quickUpdateModal.isSubmitting}
                onClick={handleExecuteQuickUpdate}
                className="px-5 py-2 text-xs font-bold bg-primary text-on-primary rounded-xl hover:bg-primary-hover disabled:opacity-50"
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
          <div className="bg-surface rounded-xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Request Account Reactivation</h3>
                <p className="text-xs text-foreground-muted mt-0.5">Submit an appeal to administrator</p>
              </div>
              <button
                onClick={() => setReactivationModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-muted text-foreground-muted hover:bg-border flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {reactivationMsg && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                reactivationMsg.type === 'success'
                  ? 'bg-success-bg text-success border border-success/20'
                  : 'bg-error-bg text-error border border-error/20'
              }`}>
                {reactivationMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-error shrink-0" />
                )}
                <span>{reactivationMsg.text}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-foreground mb-1.5">
                  Reason for Reactivation <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reactivationReason}
                  onChange={(e) => setReactivationReason(e.target.value)}
                  placeholder="Explain why your account should be reactivated, corrective actions taken, compliance updates..."
                  className="w-full p-3 bg-surface border border-border rounded-xl text-xs text-foreground outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1.5">Additional Notes / Evidence (Optional)</label>
                <textarea
                  rows={2}
                  value={reactivationNotes}
                  onChange={(e) => setReactivationNotes(e.target.value)}
                  placeholder="Supporting details or references..."
                  className="w-full p-3 bg-surface border border-border rounded-xl text-xs text-foreground outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isSubmittingReactivation}
                onClick={() => setReactivationModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-border text-foreground-muted font-bold text-xs hover:bg-surface-muted"
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
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-on-primary font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
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

export default function SellerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <SellerDashboardContent />
    </Suspense>
  );
}
