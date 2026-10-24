'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  RotateCcw,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Loader2,
  IndianRupee,
  ShieldCheck,
  Upload,
  Image as ImageIcon,
  MapPin,
  ChevronRight,
  Package,
  X,
  Trash2,
  Eye,
} from 'lucide-react';

const REASON_OPTIONS = [
  'Defective / Damaged packet',
  'Spoiled / Sour / Leaking',
  'Wrong item delivered',
  'Near or past expiry date',
  'Quality not as expected',
  'Other issue',
];

function ReturnsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const preselectedItemId = searchParams.get('orderItemId') || '';
  const preselectedType = (searchParams.get('type') as 'return' | 'replacement') || 'return';

  const [requests, setRequests] = useState<any[]>([]);
  const [deliveredItems, setDeliveredItems] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [orderItemId, setOrderItemId] = useState(preselectedItemId);
  const [requestType, setRequestType] = useState<'return' | 'replacement'>(preselectedType);
  const [reason, setReason] = useState(REASON_OPTIONS[0]);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [pickupAddressId, setPickupAddressId] = useState('');
  const [upiId, setUpiId] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [reqRes, ordRes, addrRes] = await Promise.all([
          fetch('/api/returns'),
          fetch('/api/orders'),
          fetch('/api/addresses').catch(() => ({ ok: false, json: async () => ({}) })),
        ]);

        if (reqRes.ok) {
          const reqData = await reqRes.json();
          setRequests(reqData.requests || []);
        }

        if (ordRes.ok) {
          const ordData = await ordRes.json();
          const items: any[] = [];
          for (const order of ordData.orders || []) {
            if (order.status === 'delivered' && order.order_items) {
              for (const item of order.order_items) {
                items.push({
                  ...item,
                  order_number: order.order_number,
                  order_status: order.status,
                  payment_method: order.payment_method,
                });
              }
            }
          }
          setDeliveredItems(items);
          if (preselectedItemId && !orderItemId) {
            setOrderItemId(preselectedItemId);
          } else if (items.length > 0 && !orderItemId) {
            setOrderItemId(items[0].id);
          }
        }

        if (addrRes.ok) {
          const addrData = await addrRes.json();
          const list = addrData.addresses || [];
          setAddresses(list);
          const defaultAddr = list.find((a: any) => a.is_default) || list[0];
          if (defaultAddr) setPickupAddressId(defaultAddr.id);
        }
      } catch (err) {
        console.error('Failed to load returns data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [preselectedItemId]);

  const selectedItem = deliveredItems.find((i) => i.id === orderItemId);
  const isCodOrder = selectedItem?.payment_method === 'COD';

  const lowerReason = (reason || '').toLowerCase();
  const requiresImage =
    lowerReason.includes('defect') ||
    lowerReason.includes('spoil') ||
    lowerReason.includes('damage') ||
    lowerReason.includes('sour') ||
    lowerReason.includes('wrong');

  const processFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const remainingSlots = 6 - images.length;
    if (remainingSlots <= 0) {
      setError('You have reached the maximum limit of 6 photos.');
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setError(`Only ${remainingSlots} photo(s) added. Maximum limit is 6 photos.`);
    } else {
      setError(null);
    }

    setIsUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];

        if (!file.type.startsWith('image/')) {
          setError(`File "${file.name}" is not an image. Only JPG, PNG, and WebP are allowed.`);
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          setError(`File "${file.name}" exceeds the 10MB limit.`);
          continue;
        }

        // Convert file to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const base64Data = await base64Promise;

        // Try upload via ImageKit backend endpoint
        try {
          const res = await fetch('/api/upload/imagekit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              file: base64Data,
              fileName: `return_${Date.now()}_${i}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
              folder: '/returns_evidence',
            }),
          });

          if (res.ok) {
            const json = await res.json();
            if (json.url) {
              uploadedUrls.push(json.url);
              continue;
            }
          }
        } catch (uploadErr) {
          console.warn('ImageKit endpoint upload failed, using base64 fallback:', uploadErr);
        }

        // Fallback: store base64 data directly so user is never blocked
        uploadedUrls.push(base64Data);
      }

      if (uploadedUrls.length > 0) {
        setImages((prev) => [...prev, ...uploadedUrls]);
      }
    } catch (err: any) {
      setError('Photo upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderItemId) {
      setError('Please select an order item.');
      return;
    }

    if (requiresImage && images.length === 0) {
      setError('Please upload at least one photo showing the damage, spoilage, or defect.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderItemId,
          requestType,
          reason,
          description,
          images,
          pickupAddressId: pickupAddressId || undefined,
          upiId: isCodOrder ? upiId : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to submit request');
      }

      router.push(`/returns/${json.request.id}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-background min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 pt-12 md:pt-16">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/orders"
            className="p-2.5 rounded-2xl bg-surface border border-border text-foreground hover:bg-surface-muted transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
              Returns & Replacements
            </h1>
            <p className="text-xs md:text-sm text-foreground-muted mt-1">
              Hassle-free, auto-approved returns and replacements for delivered items
            </p>
          </div>
        </div>

        {/* Freshness Promise Banner */}
        <div className="p-4 rounded-2xl bg-success-bg border border-success/20/80 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-success shrink-0 mt-0.5" />
          <div className="text-xs text-success">
            <span className="font-extrabold">DairyDirect Quality Commitment: </span>
            <span className="text-success">
              Perishables (Milk, Curd, Paneer, Butter, Sweets) are covered within 24 hours of delivery. Non-perishable items enjoy a 7-day window. All requests are auto-approved!
            </span>
          </div>
        </div>

        {/* Create Request Form */}
        <div className="bg-surface rounded-3xl border border-border/80 shadow-2xs p-6 md:p-8">
          <h2 className="text-lg font-black text-foreground mb-6 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-success" />
            <span>Submit a New Request</span>
          </h2>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-error-bg border border-error/20 text-error text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Request Type Toggle */}
            <div>
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                Action Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRequestType('return')}
                  className={`p-3.5 rounded-2xl border text-center font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    requestType === 'return'
                      ? 'border-success bg-success-bg text-success ring-2 ring-emerald-700/20'
                      : 'border-border hover:bg-surface-muted text-foreground-muted'
                  }`}
                >
                  <RotateCcw className="w-4 h-4 text-success" />
                  <span>Return & Full Refund</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRequestType('replacement')}
                  className={`p-3.5 rounded-2xl border text-center font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    requestType === 'replacement'
                      ? 'border-success bg-success-bg text-success ring-2 ring-emerald-700/20'
                      : 'border-border hover:bg-surface-muted text-foreground-muted'
                  }`}
                >
                  <RefreshCw className="w-4 h-4 text-success" />
                  <span>Request Replacement</span>
                </button>
              </div>
            </div>

            {/* Item Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                  Select Delivered Item
                </label>
                {deliveredItems.length > 0 && (
                  <span className="text-[11px] font-semibold text-success">
                    {deliveredItems.length} eligible item(s)
                  </span>
                )}
              </div>
              {deliveredItems.length === 0 ? (
                <div className="p-4 rounded-2xl bg-surface-muted border border-border text-center text-xs text-foreground-muted">
                  No delivered orders eligible for return found.
                </div>
              ) : (
                <div className="space-y-3">
                  <select
                    value={orderItemId}
                    onChange={(e) => setOrderItemId(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-border bg-surface text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-700/20 shadow-2xs"
                  >
                    {deliveredItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.product_name} ({item.variant_name || `${item.quantity} units`}) — Order #{item.order_number || item.order_id?.slice(0, 8)}
                      </option>
                    ))}
                  </select>

                  {/* Selected Item Preview Card */}
                  {selectedItem && (
                    <div className="p-3.5 rounded-2xl bg-success-bg/50 border border-success-bg flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-xl bg-surface border border-success/20/60 overflow-hidden shrink-0 shadow-2xs flex items-center justify-center">
                        {selectedItem.image_url || selectedItem.product_image || selectedItem.products?.image_url ? (
                          <img
                            src={selectedItem.image_url || selectedItem.product_image || selectedItem.products?.image_url}
                            alt={selectedItem.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-success/40" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-foreground truncate">{selectedItem.product_name}</p>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-success-bg text-success shrink-0">
                            Delivered
                          </span>
                        </div>
                        <p className="text-[11px] text-foreground-muted mt-0.5">
                          Qty: <span className="font-semibold text-foreground">{selectedItem.quantity}</span>
                          {selectedItem.variant_name ? ` • ${selectedItem.variant_name}` : ''}
                          {' • '}Order #{selectedItem.order_number || selectedItem.order_id?.slice(0, 8)}
                        </p>
                        <p className="text-xs font-black text-success mt-0.5">
                          ₹{Number(selectedItem.unit_price || selectedItem.price || selectedItem.total_price || 0) * (selectedItem.quantity || 1)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Reason Selector */}
            <div>
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 rounded-2xl border border-border bg-surface text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              >
                {REASON_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                Details & Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe the issue in detail..."
                rows={3}
                className="w-full p-3.5 rounded-2xl border border-border text-xs text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>

            {/* Multiple Photo Upload */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                  Upload Proof Photos {requiresImage && <span className="text-error normal-case font-bold">(Required for this claim)</span>}
                </label>
                <span className="text-[11px] font-bold text-foreground-muted">
                  {images.length} / 6 photos uploaded
                </span>
              </div>

              {requiresImage && (
                <div className="mb-3 p-2.5 rounded-xl bg-warning-bg/80 border border-warning/20/80 text-[11px] text-warning flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-warning shrink-0" />
                  <span>
                    Clear photos of the packaging, defect, leakage, or expiry date stamp are required for speedy verification.
                  </span>
                </div>
              )}

              {/* Upload Dropzone & Previews */}
              <div className="space-y-3">
                {images.length < 6 && (
                  <label
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`w-full p-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer text-center ${
                      isDragging
                        ? 'border-success bg-success-bg/70 scale-[0.99]'
                        : 'border-border-hover hover:border-success bg-surface-muted/60 hover:bg-success-bg/20'
                    }`}
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp,image/jpg"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />

                    {isUploading ? (
                      <div className="flex flex-col items-center py-2">
                        <Loader2 className="w-7 h-7 text-success animate-spin mb-2" />
                        <span className="text-xs font-bold text-foreground">Uploading & processing photo(s)...</span>
                        <span className="text-[11px] text-foreground-muted mt-0.5">Please wait a moment</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-success-bg/70 text-success flex items-center justify-center mb-2.5 shadow-2xs">
                          <Upload className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-foreground">
                          Click to select multiple photos or drag and drop here
                        </p>
                        <p className="text-[11px] text-foreground-muted mt-1">
                          PNG, JPG, or WebP up to 10MB each (up to 6 photos)
                        </p>
                      </>
                    )}
                  </label>
                )}

                {/* Photo Previews Grid */}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-1">
                    {images.map((url, i) => (
                      <div
                        key={i}
                        className="group relative aspect-square rounded-2xl overflow-hidden border border-border bg-surface-muted shadow-2xs"
                      >
                        <img src={url} alt={`Proof ${i + 1}`} className="w-full h-full object-cover" />

                        {/* Overlay Controls */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                          <button
                            type="button"
                            onClick={() => setSelectedPreviewImage(url)}
                            title="Preview full size"
                            className="p-1.5 rounded-full bg-surface/90 text-foreground hover:bg-surface hover:scale-110 transition-transform shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                            title="Remove photo"
                            className="p-1.5 rounded-full bg-error text-on-error hover:bg-error hover:scale-110 transition-transform shadow-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Photo Number Tag */}
                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-bold backdrop-blur-xs">
                          #{i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pickup Address Selector */}
            {addresses.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Select Pickup Address
                </label>
                <select
                  value={pickupAddressId}
                  onChange={(e) => setPickupAddressId(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-border bg-surface text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                >
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label || 'Home'}: {a.street_address}, {a.city} - {a.postal_code}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* COD UPI ID Input */}
            {isCodOrder && requestType === 'return' && (
              <div className="p-4 rounded-2xl bg-warning-bg/70 border border-warning/20">
                <label className="block text-xs font-bold text-warning uppercase tracking-wider mb-1">
                  UPI ID for Direct Refund Payout
                </label>
                <p className="text-[11px] text-warning mb-2">
                  Since this order was paid via Cash on Delivery, your refund will be transferred directly to your UPI ID upon seller receipt.
                </p>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. mobile@upi or username@okhdfcbank"
                  className="w-full p-2.5 rounded-xl border border-warning bg-surface text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || deliveredItems.length === 0}
              className="w-full py-3.5 bg-primary hover:bg-primary-light text-on-primary text-xs font-extrabold uppercase tracking-wider rounded-2xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <span>Confirm & Submit {requestType === 'return' ? 'Return' : 'Replacement'}</span>
              )}
            </button>
          </form>
        </div>

        {/* Existing Requests Section */}
        <div className="bg-surface rounded-3xl border border-border/80 shadow-2xs overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Package className="w-5 h-5 text-secondary" />
              <span>My Return & Replacement Requests</span>
            </h2>
            <span className="text-xs font-bold text-foreground-muted">{requests.length} Requests</span>
          </div>

          {isLoading ? (
            <div className="p-10 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-success" />
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-xs text-foreground-muted">
              You have not submitted any return or replacement requests.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {requests.map((r) => (
                <Link
                  key={r.id}
                  href={`/returns/${r.id}`}
                  className="p-5 flex items-center justify-between hover:bg-surface-muted/70 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-muted flex items-center justify-center shrink-0 border border-border overflow-hidden">
                      {r.order_items?.image_url ? (
                        <img src={r.order_items.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-foreground-muted" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {r.order_items?.product_name || 'Product'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            r.request_type === 'replacement'
                              ? 'bg-info-bg text-blue-800'
                              : 'bg-success-bg text-success'
                          }`}
                        >
                          {r.request_type}
                        </span>
                      </div>
                      <p className="text-[11px] text-foreground-muted mt-0.5">
                        Status: <span className="font-semibold text-foreground capitalize">{r.status.replace(/_/g, ' ')}</span> · Submitted on {new Date(r.created_at).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {r.request_type === 'return' && r.refund_amount > 0 && (
                      <span className="text-xs font-black text-success">
                        ₹{Number(r.refund_amount).toFixed(2)}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-foreground-muted" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Image Preview Lightbox */}
        {selectedPreviewImage && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setSelectedPreviewImage(null)}
          >
            <div
              className="relative max-w-2xl max-h-[85vh] bg-surface rounded-3xl overflow-hidden p-3 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedPreviewImage(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <img
                src={selectedPreviewImage}
                alt="Full Proof Preview"
                className="w-full max-h-[75vh] object-contain rounded-2xl"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReturnsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ReturnsContent />
    </Suspense>
  );
}
