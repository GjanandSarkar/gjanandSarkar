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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-800 border border-gray-300">
            <ShieldAlert className="w-3.5 h-3.5 text-gray-600" /> Suspended
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Awaiting Review
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/60 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 md:px-10 py-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => router.push('/admin/products')}
                className="text-gray-500 hover:text-gray-800 transition-colors p-1 -ml-1 rounded-lg hover:bg-gray-100"
                title="Back to Products"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
                <Package className="w-7 h-7 text-[#0c3c26]" />
                Product Approval Requests
              </h1>
            </div>
            <p className="text-sm text-gray-600 ml-6">
              Review, verify, and approve marketplace products submitted by active sellers before publishing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadApprovals()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => router.push('/admin/products')}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-[#0c3c26] text-white shadow-xs hover:bg-[#114e32] transition-all cursor-pointer"
            >
              View All Catalogue
            </button>
          </div>
        </div>

        {/* Status Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
          {[
            { id: 'pending', label: 'Pending Review', count: counts.pending, color: 'text-amber-700', bg: 'bg-amber-50/70 border-amber-200', activeBg: 'border-amber-500 bg-amber-50' },
            { id: 'approved', label: 'Approved Live', count: counts.approved, color: 'text-emerald-700', bg: 'bg-emerald-50/70 border-emerald-200', activeBg: 'border-emerald-500 bg-emerald-50' },
            { id: 'rejected', label: 'Rejected', count: counts.rejected, color: 'text-rose-700', bg: 'bg-rose-50/70 border-rose-200', activeBg: 'border-rose-500 bg-rose-50' },
            { id: 'suspended', label: 'Suspended', count: counts.suspended, color: 'text-gray-700', bg: 'bg-gray-50/70 border-gray-200', activeBg: 'border-gray-500 bg-gray-100' },
            { id: 'all', label: 'Total Products', count: counts.all, color: 'text-slate-800', bg: 'bg-white border-gray-200', activeBg: 'border-[#0c3c26] bg-emerald-50/30' },
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
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{tab.label}</p>
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
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, SKU, brand, ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30 transition-all"
            />
          </div>

          <div className="text-xs text-gray-500 font-medium self-end sm:self-center">
            Showing <span className="font-bold text-gray-800">{products.length}</span> items
          </div>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div className={`mb-5 p-4 rounded-xl flex items-center justify-between ${
            notification.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}>
            <span className="text-sm font-semibold">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="p-1 hover:bg-black/5 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold">Unable to load approval queue</p>
                <p className="text-xs text-amber-800 mt-0.5">{errorMessage}</p>
                {errorMessage.toLowerCase().includes('admin') && (
                  <p className="text-xs text-amber-700 mt-1 font-semibold">
                    Tip: Ensure you are logged in with your Admin email (<code className="bg-amber-100 px-1 py-0.5 rounded">gjanandsarkar09@gmail.com</code>).
                  </p>
                )}
              </div>
            </div>
            <button onClick={() => setErrorMessage(null)} className="p-1 hover:bg-amber-100 rounded-lg shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content Table / Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-white rounded-2xl border border-gray-200 animate-pulse p-5" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto mt-6">
            <Package className="w-14 h-14 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900">No {selectedStatus !== 'all' ? selectedStatus : ''} products found</h3>
            <p className="text-sm text-gray-500 mt-1">
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
                  className="bg-white rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col group"
                >
                  {/* Top Image + Badges */}
                  <div className="relative h-48 bg-gray-50 overflow-hidden flex items-center justify-center border-b border-gray-100">
                    <img
                      src={product.image_url || PLACEHOLDER_PRODUCT_IMAGE}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {getStatusBadge(product.approval_status)}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/95 text-gray-700 shadow-xs uppercase tracking-wide">
                        {product.category}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setActiveImageIndex(0);
                        setIsPreviewOpen(true);
                      }}
                      className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-gray-800 text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#0c3c26]" /> Preview
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <Building2 className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-semibold text-gray-700 truncate">{sellerName}</span>
                      {product.sku && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-[11px] bg-gray-100 px-1.5 py-0.5 rounded">SKU: {product.sku}</span>
                        </>
                      )}
                    </div>

                    <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">
                      {product.name}
                    </h3>

                    {product.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    {/* Price and Stock Stats */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-black text-[#0c3c26]">₹{price}</span>
                          {compareAt && compareAt > price && (
                            <span className="text-xs text-gray-400 line-through">₹{compareAt}</span>
                          )}
                        </div>
                        {primaryVariant?.weight && (
                          <span className="text-[11px] text-gray-500 font-medium">Pack: {primaryVariant.weight}</span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                          stock > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                        }`}>
                          {stock > 0 ? `${stock} in stock` : 'Out of stock'}
                        </span>
                        {product.tax_rate ? (
                          <div className="text-[10px] text-gray-400 mt-0.5">GST: {product.tax_rate}%</div>
                        ) : null}
                      </div>
                    </div>

                    {/* Rejection notice if present */}
                    {product.approval_status === 'rejected' && product.rejection_reason && (
                      <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-900 text-xs">
                        <span className="font-bold block">Rejection Feedback:</span>
                        <p className="mt-0.5 text-rose-800">{product.rejection_reason}</p>
                      </div>
                    )}

                    {/* Decision info */}
                    <div className="mt-3 pt-2 text-[11px] text-gray-400 flex items-center justify-between">
                      <span>Submitted: {new Date(product.created_at).toLocaleDateString()}</span>
                      {product.reviewed_at && (
                        <span>Reviewed: {new Date(product.reviewed_at).toLocaleDateString()}</span>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
                      {product.approval_status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleOpenDecisionModal(product, 'approved')}
                            className="flex-1 py-2 px-3 rounded-xl bg-[#0c3c26] hover:bg-[#114e32] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" strokeWidth={3} /> Approve
                          </button>
                          <button
                            onClick={() => handleOpenDecisionModal(product, 'rejected')}
                            className="flex-1 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
                            className="text-xs text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-1"
                          >
                            View Specs <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex gap-2">
                            {product.approval_status !== 'approved' && (
                              <button
                                onClick={() => handleOpenDecisionModal(product, 'approved')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors"
                              >
                                Approve
                              </button>
                            )}
                            {product.approval_status !== 'rejected' && (
                              <button
                                onClick={() => handleOpenDecisionModal(product, 'rejected')}
                                className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200 transition-colors"
                              >
                                Reject
                              </button>
                            )}
                            {product.approval_status !== 'suspended' && (
                              <button
                                onClick={() => handleOpenDecisionModal(product, 'suspended')}
                                className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors"
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
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2.5">
                  <span className="font-extrabold text-gray-900 text-lg">Product Verification Preview</span>
                  {getStatusBadge(selectedProduct.approval_status)}
                </div>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
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
                        <div className="h-72 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden flex items-center justify-center">
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
                                  activeImageIndex === idx ? 'border-[#0c3c26]' : 'border-gray-200 opacity-60'
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
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Core Specifications</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Product Name:</span>
                        <span className="font-bold text-gray-900 text-right">{selectedProduct.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Category:</span>
                        <span className="font-semibold text-gray-800">{selectedProduct.category}</span>
                      </div>
                      {selectedProduct.subcategory && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Subcategory:</span>
                          <span className="font-semibold text-gray-800">{selectedProduct.subcategory}</span>
                        </div>
                      )}
                      {selectedProduct.brand && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Brand:</span>
                          <span className="font-semibold text-gray-800">{selectedProduct.brand}</span>
                        </div>
                      )}
                      {selectedProduct.sku && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">SKU Code:</span>
                          <span className="font-mono font-bold text-gray-900">{selectedProduct.sku}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Seller & Compliance</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Seller Store:</span>
                        <span className="font-bold text-[#0c3c26]">{selectedProduct.sellers?.store_name || 'Gjanand Sarkar'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Seller Status:</span>
                        <span className="font-semibold text-emerald-700 capitalize">{selectedProduct.sellers?.status || 'Active'}</span>
                      </div>
                      {selectedProduct.sellers?.gstin && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Seller GSTIN:</span>
                          <span className="font-mono text-xs">{selectedProduct.sellers.gstin}</span>
                        </div>
                      )}
                      {selectedProduct.tax_rate !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Applicable GST:</span>
                          <span className="font-bold text-gray-800">{selectedProduct.tax_rate}%</span>
                        </div>
                      )}
                      {selectedProduct.return_policy && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Return Policy:</span>
                          <span className="text-xs text-gray-700 text-right">{selectedProduct.return_policy}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedProduct.description && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Description</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200 leading-relaxed">
                      {selectedProduct.description}
                    </p>
                  </div>
                )}

                {/* Variants & Pricing Table */}
                {selectedProduct.product_variants && selectedProduct.product_variants.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Pack Sizes & Inventory</h4>
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-100 text-gray-600 font-bold border-b border-gray-200">
                          <tr>
                            <th className="py-2.5 px-3">Variant / Weight</th>
                            <th className="py-2.5 px-3">Selling Price</th>
                            <th className="py-2.5 px-3">MRP (Strike)</th>
                            <th className="py-2.5 px-3">Available Stock</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedProduct.product_variants.map(v => (
                            <tr key={v.id} className="hover:bg-gray-50">
                              <td className="py-2.5 px-3 font-semibold text-gray-900">{v.weight || 'Standard Unit'}</td>
                              <td className="py-2.5 px-3 font-black text-[#0c3c26]">₹{v.price}</td>
                              <td className="py-2.5 px-3 text-gray-400">{v.compare_at_price ? `₹${v.compare_at_price}` : '—'}</td>
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
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Category Attributes</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(selectedProduct.attributes).map(([key, value]) => (
                        <div key={key} className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-xs">
                          <span className="text-gray-400 block font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="font-bold text-gray-800">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Compliance Documents */}
                {selectedProduct.compliance_documents && selectedProduct.compliance_documents.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Compliance Documents</h4>
                    <div className="space-y-2">
                      {selectedProduct.compliance_documents.map((doc, i) => (
                        <a
                          key={i}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors text-xs font-semibold text-gray-800"
                        >
                          <span className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-700" />
                            {doc.name || `Document #${i + 1}`}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky Footer Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between sticky bottom-0">
                <span className="text-xs text-gray-500">
                  {selectedProduct.approval_status === 'pending'
                    ? 'Pending approval by administrator.'
                    : `Currently ${selectedProduct.approval_status}.`}
                </span>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors cursor-pointer"
                  >
                    Close
                  </button>

                  <button
                    onClick={() => {
                      setIsPreviewOpen(false);
                      handleOpenDecisionModal(selectedProduct, 'rejected');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                  >
                    Reject
                  </button>

                  <button
                    onClick={() => {
                      setIsPreviewOpen(false);
                      handleOpenDecisionModal(selectedProduct, 'approved');
                    }}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0c3c26] hover:bg-[#114e32] text-white transition-colors shadow-xs cursor-pointer"
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
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  decisionModal.action === 'approved'
                    ? 'bg-emerald-100 text-emerald-700'
                    : decisionModal.action === 'rejected'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-amber-100 text-amber-700'
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
                  <h3 className="font-extrabold text-lg text-gray-900 capitalize">
                    {decisionModal.action} Product?
                  </h3>
                  <p className="text-xs text-gray-500">
                    Product: <span className="font-bold text-gray-800">{decisionModal.product.name}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600 leading-relaxed">
                  {decisionModal.action === 'approved' && (
                    <>
                      By approving this product, it will be marked as <strong className="text-emerald-700">Approved & Active</strong> and made immediately eligible to appear in the customer storefront and cart, provided the seller is active and inventory is available.
                    </>
                  )}
                  {decisionModal.action === 'rejected' && (
                    <>
                      By rejecting this product, it will remain <strong className="text-rose-700">unavailable</strong> for customers. The rejection reason will be sent to the seller dashboard so they can modify and resubmit.
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
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                      Rejection Reason <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={decisionModal.rejectionReason}
                      onChange={e => setDecisionModal(prev => ({ ...prev, rejectionReason: e.target.value }))}
                      placeholder="Explain what needs to be changed (e.g. incorrect category, missing FSSAI certification, blurry images, invalid price)..."
                      className="w-full p-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                    />
                  </div>
                )}

                {/* Internal notes */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Internal Admin Notes <span className="text-gray-400 font-normal">(Optional audit log)</span>
                  </label>
                  <input
                    type="text"
                    value={decisionModal.notes}
                    onChange={e => setDecisionModal(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="e.g. Verified brand authorization letter on 10/10/2026"
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                {decisionModal.error && (
                  <p className="text-xs font-bold text-rose-600">{decisionModal.error}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  disabled={decisionModal.isSubmitting}
                  onClick={() => setDecisionModal(prev => ({ ...prev, open: false }))}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={decisionModal.isSubmitting}
                  onClick={handleExecuteDecision}
                  className={`px-5 py-2 rounded-xl text-sm font-bold text-white shadow-xs transition-all cursor-pointer flex items-center gap-2 ${
                    decisionModal.action === 'approved'
                      ? 'bg-[#0c3c26] hover:bg-[#114e32]'
                      : decisionModal.action === 'rejected'
                      ? 'bg-rose-600 hover:bg-rose-700'
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
          <RefreshCw className="w-8 h-8 animate-spin text-[#0c3c26]" />
        </div>
      }
    >
      <ProductApprovalsContent />
    </Suspense>
  );
}
