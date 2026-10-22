"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Package, Search, CheckCircle, XCircle, Clock, AlertTriangle, Eye,
  Building2, ArrowLeft, RefreshCw, ShieldAlert, FileText, Check, X,
  ExternalLink, Layers, Sparkles, Filter, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAdminProductApprovals, updateAdminProductApproval } from '@/lib/api/products';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';

interface ProductItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  sku?: string;
  image_url?: string;
  gallery_images?: string[];
  approval_status: 'pending' | 'approved' | 'rejected' | 'suspended';
  is_approved?: boolean;
  is_rejected?: boolean;
  rejection_reason?: string;
  is_active: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  tax_rate?: number;
  shipping_details?: any;
  return_policy?: string;
  attributes?: Record<string, any>;
  compliance_documents?: Array<{ name: string; url: string; type?: string }>;
  product_variants?: Array<{
    id: string;
    weight?: string;
    price: number;
    compare_at_price?: number;
    stock: number;
  }>;
  sellers?: {
    id: string;
    store_name: string;
    status: string;
    category?: string;
    user_id?: string;
    gstin?: string;
    pan?: string;
  };
}

function ProductApprovalsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    suspended: 0,
    all: 0,
  });
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams.get('status') || 'pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Decision Modal State
  const [decisionModal, setDecisionModal] = useState<{
    open: boolean;
    product: ProductItem | null;
    action: 'approved' | 'rejected' | 'suspended';
    rejectionReason: string;
    notes: string;
    isSubmitting: boolean;
    error: string;
  }>({
    open: false,
    product: null,
    action: 'approved',
    rejectionReason: '',
    notes: '',
    isSubmitting: false,
    error: '',
  });

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadApprovals = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await getAdminProductApprovals({
        status: selectedStatus,
        search: searchQuery,
      });

      if (res.success) {
        setProducts(res.products || []);
        if (res.counts) setCounts(res.counts);
      } else if (res.error) {
        setErrorMessage(res.error);
      }
    } catch (err: any) {
      console.error('Failed to load product approvals:', err);
      setErrorMessage(err.message || 'Failed to load product approvals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, [selectedStatus]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadApprovals();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleOpenDecisionModal = (product: ProductItem, action: 'approved' | 'rejected' | 'suspended') => {
    setDecisionModal({
      open: true,
      product,
      action,
      rejectionReason: product.rejection_reason || '',
      notes: '',
      isSubmitting: false,
      error: '',
    });
  };

  const handleExecuteDecision = async () => {
    if (!decisionModal.product) return;

    if (decisionModal.action === 'rejected' && !decisionModal.rejectionReason.trim()) {
      setDecisionModal(prev => ({ ...prev, error: 'Rejection reason is mandatory.' }));
      return;
    }

    setDecisionModal(prev => ({ ...prev, isSubmitting: true, error: '' }));

    try {
      await updateAdminProductApproval(
        decisionModal.product.id,
        decisionModal.action,
        decisionModal.rejectionReason,
        decisionModal.notes
      );

      setNotification({
        message: `Product "${decisionModal.product.name}" has been ${decisionModal.action}.`,
        type: 'success',
      });

      setDecisionModal({
        open: false,
        product: null,
        action: 'approved',
        rejectionReason: '',
        notes: '',
        isSubmitting: false,
        error: '',
      });

      // Reload
      await loadApprovals();

      // If preview was open for this product, close it or update it
      if (selectedProduct?.id === decisionModal.product.id) {
        setIsPreviewOpen(false);
      }
    } catch (err: any) {
      setDecisionModal(prev => ({ ...prev, isSubmitting: false, error: err.message || 'Operation failed' }));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-success-bg text-success border border-success/20">
            <CheckCircle className="w-3.5 h-3.5 text-success" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-error-bg text-error border border-error/20">
            <XCircle className="w-3.5 h-3.5 text-error" /> Rejected
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-border text-foreground border border-border-hover">
            <ShieldAlert className="w-3.5 h-3.5 text-foreground-muted" /> Suspended
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-warning-bg text-warning border border-warning/20 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-warning" /> Awaiting Review
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface-muted/60 pb-16">
      {/* Header */}
      <div className="bg-surface border-b border-border px-6 md:px-10 py-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => router.push('/admin/products')}
                className="text-foreground-muted hover:text-foreground transition-colors p-1 -ml-1 rounded-lg hover:bg-surface-muted"
                title="Back to Products"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2.5">
                <Package className="w-7 h-7 text-primary" />
                Product Approval Requests
              </h1>
            </div>
            <p className="text-sm text-foreground-muted ml-6">
              Review, verify, and approve marketplace products submitted by active sellers before publishing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadApprovals()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-surface-muted hover:bg-border text-foreground transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => router.push('/admin/products')}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-on-primary shadow-xs hover:bg-primary-hover transition-all cursor-pointer"
            >
              View All Catalogue
            </button>
          </div>
        </div>

        {/* Status Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
          {[
            { id: 'pending', label: 'Pending Review', count: counts.pending, color: 'text-warning', bg: 'bg-warning-bg/70 border-warning/20', activeBg: 'border-warning bg-warning-bg' },
            { id: 'approved', label: 'Approved Live', count: counts.approved, color: 'text-success', bg: 'bg-success-bg/70 border-success/20', activeBg: 'border-success bg-success-bg' },
            { id: 'rejected', label: 'Rejected', count: counts.rejected, color: 'text-error', bg: 'bg-error-bg/70 border-error/20', activeBg: 'border-error bg-error-bg' },
            { id: 'suspended', label: 'Suspended', count: counts.suspended, color: 'text-foreground', bg: 'bg-surface-muted/70 border-border', activeBg: 'border-gray-500 bg-surface-muted' },
            { id: 'all', label: 'Total Products', count: counts.all, color: 'text-foreground', bg: 'bg-surface border-border', activeBg: 'border-primary bg-success-bg/30' },
          ].map(tab => {
            const isSelected = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected ? tab.activeBg + ' ring-2 ring-emerald-600/30 font-bold shadow-xs' : tab.bg + ' hover:opacity-90'
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">{tab.label}</p>
                <p className={`text-xl font-extrabold mt-0.5 ${tab.color}`}>{tab.count}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Body */}
      <div className="px-6 md:px-10 py-6">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-5">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, SKU, brand, ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30 transition-all"
            />
          </div>

          <div className="text-xs text-foreground-muted font-medium self-end sm:self-center">
            Showing <span className="font-bold text-foreground">{products.length}</span> items
          </div>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div className={`mb-5 p-4 rounded-xl flex items-center justify-between ${
            notification.type === 'success' ? 'bg-success-bg border border-success/20 text-success' : 'bg-error-bg border border-error/20 text-error'
          }`}>
            <span className="text-sm font-semibold">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="p-1 hover:bg-black/5 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-4 rounded-xl bg-warning-bg border border-warning text-warning flex items-start justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold">Unable to load approval queue</p>
                <p className="text-xs text-warning mt-0.5">{errorMessage}</p>
                {errorMessage.toLowerCase().includes('admin') && (
                  <p className="text-xs text-warning mt-1 font-semibold">
                    Tip: Ensure you are logged in with your Admin email (<code className="bg-warning-bg px-1 py-0.5 rounded">gjanandsarkar09@gmail.com</code>).
                  </p>
                )}
              </div>
            </div>
            <button onClick={() => setErrorMessage(null)} className="p-1 hover:bg-warning-bg rounded-lg shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content Table / Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-surface rounded-2xl border border-border animate-pulse p-5" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-border p-12 text-center max-w-lg mx-auto mt-6">
            <Package className="w-14 h-14 text-foreground-muted mx-auto mb-3" />
            <h3 className="text-lg font-bold text-foreground">No {selectedStatus !== 'all' ? selectedStatus : ''} products found</h3>
            <p className="text-sm text-foreground-muted mt-1">
              {selectedStatus === 'pending'
                ? 'All seller product approval requests have been addressed. No pending reviews!'
                : `No products matching the status "${selectedStatus}" were found.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {products.map(product => {
              const primaryVariant = product.product_variants?.[0];
              const price = primaryVariant?.price || 0;
              const compareAt = primaryVariant?.compare_at_price;
              const stock = primaryVariant?.stock ?? 0;
              const sellerName = product.sellers?.store_name || 'Direct / Gjanand';

              return (
                <div
                  key={product.id}
                  className="bg-surface rounded-2xl border border-border shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col group"
                >
                  {/* Top Image + Badges */}
                  <div className="relative h-48 bg-surface-muted overflow-hidden flex items-center justify-center border-b border-border">
                    <img
                      src={product.image_url || PLACEHOLDER_PRODUCT_IMAGE}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {getStatusBadge(product.approval_status)}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface/95 text-foreground shadow-xs uppercase tracking-wide">
                        {product.category}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setActiveImageIndex(0);
                        setIsPreviewOpen(true);
                      }}
                      className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-surface/95 hover:bg-surface text-foreground text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-primary" /> Preview
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-foreground-muted mb-1">
                      <Building2 className="w-3.5 h-3.5 text-foreground-muted" />
                      <span className="font-semibold text-foreground truncate">{sellerName}</span>
                      {product.sku && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-[11px] bg-surface-muted px-1.5 py-0.5 rounded">SKU: {product.sku}</span>
                        </>
                      )}
                    </div>

                    <h3 className="font-bold text-foreground text-base leading-snug line-clamp-2">
                      {product.name}
                    </h3>

                    {product.description && (
                      <p className="text-xs text-foreground-muted mt-1 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    {/* Price and Stock Stats */}
                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-black text-primary">₹{price}</span>
                          {compareAt && compareAt > price && (
                            <span className="text-xs text-foreground-muted line-through">₹{compareAt}</span>
                          )}
                        </div>
                        {primaryVariant?.weight && (
                          <span className="text-[11px] text-foreground-muted font-medium">Pack: {primaryVariant.weight}</span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                          stock > 0 ? 'bg-success-bg text-success' : 'bg-error-bg text-error'
                        }`}>
                          {stock > 0 ? `${stock} in stock` : 'Out of stock'}
                        </span>
                        {product.tax_rate ? (
                          <div className="text-[10px] text-foreground-muted mt-0.5">GST: {product.tax_rate}%</div>
                        ) : null}
                      </div>
                    </div>

                    {/* Rejection notice if present */}
                    {product.approval_status === 'rejected' && product.rejection_reason && (
                      <div className="mt-3 p-2.5 rounded-xl bg-error-bg border border-error-bg text-error text-xs">
                        <span className="font-bold block">Rejection Feedback:</span>
                        <p className="mt-0.5 text-error">{product.rejection_reason}</p>
                      </div>
                    )}

                    {/* Decision info */}
                    <div className="mt-3 pt-2 text-[11px] text-foreground-muted flex items-center justify-between">
                      <span>Submitted: {new Date(product.created_at).toLocaleDateString()}</span>
                      {product.reviewed_at && (
                        <span>Reviewed: {new Date(product.reviewed_at).toLocaleDateString()}</span>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="mt-4 pt-3 border-t border-border flex items-center gap-2">
                      {product.approval_status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleOpenDecisionModal(product, 'approved')}
                            className="flex-1 py-2 px-3 rounded-xl bg-primary hover:bg-primary-hover text-on-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" strokeWidth={3} /> Approve
                          </button>
                          <button
                            onClick={() => handleOpenDecisionModal(product, 'rejected')}
                            className="flex-1 py-2 px-3 rounded-xl bg-error-bg hover:bg-error-bg text-error border border-error/20 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" strokeWidth={3} /> Reject
                          </button>
                        </>
                      ) : (
                        <div className="w-full flex items-center justify-between">
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setActiveImageIndex(0);
                              setIsPreviewOpen(true);
                            }}
                            className="text-xs text-foreground-muted hover:text-foreground font-semibold flex items-center gap-1"
                          >
                            View Specs <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex gap-2">
                            {product.approval_status !== 'approved' && (
                              <button
                                onClick={() => handleOpenDecisionModal(product, 'approved')}
                                className="px-3 py-1.5 rounded-lg bg-success-bg hover:bg-success-bg text-success text-xs font-bold border border-success/20 transition-colors"
                              >
                                Approve
                              </button>
                            )}
                            {product.approval_status !== 'rejected' && (
                              <button
                                onClick={() => handleOpenDecisionModal(product, 'rejected')}
                                className="px-3 py-1.5 rounded-lg bg-error-bg hover:bg-error-bg text-error text-xs font-bold border border-error/20 transition-colors"
                              >
                                Reject
                              </button>
                            )}
                            {product.approval_status !== 'suspended' && (
                              <button
                                onClick={() => handleOpenDecisionModal(product, 'suspended')}
                                className="px-2.5 py-1.5 rounded-lg bg-surface-muted hover:bg-border text-foreground text-xs font-semibold transition-colors"
                              >
                                Suspend
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Detail & Spec Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10">
                <div className="flex items-center gap-2.5">
                  <span className="font-extrabold text-foreground text-lg">Product Verification Preview</span>
                  {getStatusBadge(selectedProduct.approval_status)}
                </div>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 text-foreground-muted hover:text-foreground rounded-xl hover:bg-surface-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Images Gallery */}
                <div>
                  {(() => {
                    const allImages = [
                      selectedProduct.image_url || PLACEHOLDER_PRODUCT_IMAGE,
                      ...(selectedProduct.gallery_images || []),
                    ].filter(Boolean);

                    return (
                      <div className="space-y-3">
                        <div className="h-72 bg-surface-muted rounded-xl border border-border overflow-hidden flex items-center justify-center">
                          <img
                            src={allImages[activeImageIndex] || PLACEHOLDER_PRODUCT_IMAGE}
                            alt={selectedProduct.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        {allImages.length > 1 && (
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {allImages.map((img, idx) => (
                              <button
                                key={idx}
                                onClick={() => setActiveImageIndex(idx)}
                                className={`w-16 h-16 rounded-lg border-2 overflow-hidden shrink-0 cursor-pointer ${
                                  activeImageIndex === idx ? 'border-primary' : 'border-border opacity-60'
                                }`}
                              >
                                <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Primary Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-surface-muted rounded-xl border border-border/80">
                    <p className="text-xs font-bold text-foreground-muted uppercase tracking-wider mb-2">Core Specifications</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-foreground-muted">Product Name:</span>
                        <span className="font-bold text-foreground text-right">{selectedProduct.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-muted">Category:</span>
                        <span className="font-semibold text-foreground">{selectedProduct.category}</span>
                      </div>
                      {selectedProduct.subcategory && (
                        <div className="flex justify-between">
                          <span className="text-foreground-muted">Subcategory:</span>
                          <span className="font-semibold text-foreground">{selectedProduct.subcategory}</span>
                        </div>
                      )}
                      {selectedProduct.brand && (
                        <div className="flex justify-between">
                          <span className="text-foreground-muted">Brand:</span>
                          <span className="font-semibold text-foreground">{selectedProduct.brand}</span>
                        </div>
                      )}
                      {selectedProduct.sku && (
                        <div className="flex justify-between">
                          <span className="text-foreground-muted">SKU Code:</span>
                          <span className="font-mono font-bold text-foreground">{selectedProduct.sku}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-surface-muted rounded-xl border border-border/80">
                    <p className="text-xs font-bold text-foreground-muted uppercase tracking-wider mb-2">Seller & Compliance</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-foreground-muted">Seller Store:</span>
                        <span className="font-bold text-primary">{selectedProduct.sellers?.store_name || 'Gjanand Sarkar'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-muted">Seller Status:</span>
                        <span className="font-semibold text-success capitalize">{selectedProduct.sellers?.status || 'Active'}</span>
                      </div>
                      {selectedProduct.sellers?.gstin && (
                        <div className="flex justify-between">
                          <span className="text-foreground-muted">Seller GSTIN:</span>
                          <span className="font-mono text-xs">{selectedProduct.sellers.gstin}</span>
                        </div>
                      )}
                      {selectedProduct.tax_rate !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-foreground-muted">Applicable GST:</span>
                          <span className="font-bold text-foreground">{selectedProduct.tax_rate}%</span>
                        </div>
                      )}
                      {selectedProduct.return_policy && (
                        <div className="flex justify-between">
                          <span className="text-foreground-muted">Return Policy:</span>
                          <span className="text-xs text-foreground text-right">{selectedProduct.return_policy}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedProduct.description && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted mb-1.5">Description</h4>
                    <p className="text-sm text-foreground bg-surface-muted p-4 rounded-xl border border-border leading-relaxed">
                      {selectedProduct.description}
                    </p>
                  </div>
                )}

                {/* Variants & Pricing Table */}
                {selectedProduct.product_variants && selectedProduct.product_variants.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted mb-2">Pack Sizes & Inventory</h4>
                    <div className="border border-border rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-surface-muted text-foreground-muted font-bold border-b border-border">
                          <tr>
                            <th className="py-2.5 px-3">Variant / Weight</th>
                            <th className="py-2.5 px-3">Selling Price</th>
                            <th className="py-2.5 px-3">MRP (Strike)</th>
                            <th className="py-2.5 px-3">Available Stock</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {selectedProduct.product_variants.map(v => (
                            <tr key={v.id} className="hover:bg-surface-muted">
                              <td className="py-2.5 px-3 font-semibold text-foreground">{v.weight || 'Standard Unit'}</td>
                              <td className="py-2.5 px-3 font-black text-primary">₹{v.price}</td>
                              <td className="py-2.5 px-3 text-foreground-muted">{v.compare_at_price ? `₹${v.compare_at_price}` : '—'}</td>
                              <td className="py-2.5 px-3 font-bold">{v.stock} units</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Attributes / Tech specs if any */}
                {selectedProduct.attributes && Object.keys(selectedProduct.attributes).length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted mb-2">Category Attributes</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(selectedProduct.attributes).map(([key, value]) => (
                        <div key={key} className="p-2.5 rounded-lg bg-surface-muted border border-border text-xs">
                          <span className="text-foreground-muted block font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="font-bold text-foreground">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compliance Documents */}
                {selectedProduct.compliance_documents && selectedProduct.compliance_documents.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted mb-2">Compliance Documents</h4>
                    <div className="space-y-2">
                      {selectedProduct.compliance_documents.map((doc, i) => (
                        <a
                          key={i}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 rounded-xl bg-surface-muted hover:bg-surface-muted border border-border transition-colors text-xs font-semibold text-foreground"
                        >
                          <span className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-success" />
                            {doc.name || `Document #${i + 1}`}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-foreground-muted" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky Footer Actions */}
              <div className="px-6 py-4 bg-surface-muted border-t border-border flex items-center justify-between sticky bottom-0">
                <span className="text-xs text-foreground-muted">
                  {selectedProduct.approval_status === 'pending'
                    ? 'Pending approval by administrator.'
                    : `Currently ${selectedProduct.approval_status}.`}
                </span>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-border hover:bg-gray-300 text-foreground transition-colors cursor-pointer"
                  >
                    Close
                  </button>

                  <button
                    onClick={() => {
                      setIsPreviewOpen(false);
                      handleOpenDecisionModal(selectedProduct, 'rejected');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-error-bg hover:bg-error-bg text-error border border-error/20 transition-colors cursor-pointer"
                  >
                    Reject
                  </button>

                  <button
                    onClick={() => {
                      setIsPreviewOpen(false);
                      handleOpenDecisionModal(selectedProduct, 'approved');
                    }}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-on-primary transition-colors shadow-xs cursor-pointer"
                  >
                    Approve Product
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation & Decision Dialog */}
      <AnimatePresence>
        {decisionModal.open && decisionModal.product && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-2xl max-w-lg w-full p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  decisionModal.action === 'approved'
                    ? 'bg-success-bg text-success'
                    : decisionModal.action === 'rejected'
                    ? 'bg-error-bg text-error'
                    : 'bg-warning-bg text-warning'
                }`}>
                  {decisionModal.action === 'approved' ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : decisionModal.action === 'rejected' ? (
                    <XCircle className="w-6 h-6" />
                  ) : (
                    <AlertTriangle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-foreground capitalize">
                    {decisionModal.action} Product?
                  </h3>
                  <p className="text-xs text-foreground-muted">
                    Product: <span className="font-bold text-foreground">{decisionModal.product.name}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-surface-muted rounded-xl border border-border text-xs text-foreground-muted leading-relaxed">
                  {decisionModal.action === 'approved' && (
                    <>
                      By approving this product, it will be marked as <strong className="text-success">Approved & Active</strong> and made immediately eligible to appear in the customer storefront and cart, provided the seller is active and inventory is available.
                    </>
                  )}
                  {decisionModal.action === 'rejected' && (
                    <>
                      By rejecting this product, it will remain <strong className="text-error">unavailable</strong> for customers. The rejection reason will be sent to the seller dashboard so they can modify and resubmit.
                    </>
                  )}
                  {decisionModal.action === 'suspended' && (
                    <>
                      Suspending this product will immediately disable it from being searched or purchased by customers.
                    </>
                  )}
                </div>

                {/* Rejection reason textarea */}
                {decisionModal.action === 'rejected' && (
                  <div>
                    <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1.5">
                      Rejection Reason <span className="text-error">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={decisionModal.rejectionReason}
                      onChange={e => setDecisionModal(prev => ({ ...prev, rejectionReason: e.target.value }))}
                      placeholder="Explain what needs to be changed (e.g. incorrect category, missing FSSAI certification, blurry images, invalid price)..."
                      className="w-full p-3 rounded-xl border border-border-hover text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                    />
                  </div>
                )}

                {/* Internal notes */}
                <div>
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1.5">
                    Internal Admin Notes <span className="text-foreground-muted font-normal">(Optional audit log)</span>
                  </label>
                  <input
                    type="text"
                    value={decisionModal.notes}
                    onChange={e => setDecisionModal(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="e.g. Verified brand authorization letter on 10/10/2026"
                    className="w-full p-2.5 rounded-xl border border-border-hover text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                {decisionModal.error && (
                  <p className="text-xs font-bold text-error">{decisionModal.error}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
                <button
                  type="button"
                  disabled={decisionModal.isSubmitting}
                  onClick={() => setDecisionModal(prev => ({ ...prev, open: false }))}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-foreground-muted hover:bg-surface-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={decisionModal.isSubmitting}
                  onClick={handleExecuteDecision}
                  className={`px-5 py-2 rounded-xl text-sm font-bold text-white shadow-xs transition-all cursor-pointer flex items-center gap-2 ${
                    decisionModal.action === 'approved'
                      ? 'bg-primary hover:bg-primary-hover'
                      : decisionModal.action === 'rejected'
                      ? 'bg-error hover:bg-error'
                      : 'bg-gray-800 hover:bg-black'
                  }`}
                >
                  {decisionModal.isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    `Confirm ${decisionModal.action.charAt(0).toUpperCase() + decisionModal.action.slice(1)}`
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminProductApprovalsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <ProductApprovalsContent />
    </Suspense>
  );
}
