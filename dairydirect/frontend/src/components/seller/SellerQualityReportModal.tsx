"use client";

import React, { useState } from 'react';
import { X, Upload, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { uploadImageToImageKit } from '@/lib/api/imagekit';

interface SellerQualityReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: { id: string; name: string }[];
  onReportCreated: () => void;
  isAdmin?: boolean;
}

export function SellerQualityReportModal({
  isOpen,
  onClose,
  products,
  onReportCreated,
  isAdmin = false,
}: SellerQualityReportModalProps) {
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [title, setTitle] = useState('');
  const [laboratoryName, setLaboratoryName] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [file, setFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !title.trim() || !laboratoryName.trim() || !testDate || !file) {
      setError('Please fill all required fields and choose a report document.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Upload file to ImageKit
      const uploadRes = await uploadImageToImageKit(file, 'quality-reports');
      if (!uploadRes.success || !uploadRes.url) {
        throw new Error(uploadRes.error || 'Failed to upload report document.');
      }

      // 2. Submit record to backend API
      const res = await fetch('/api/quality-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          title: title.trim(),
          laboratoryName: laboratoryName.trim(),
          batchNumber: batchNumber.trim() || null,
          testDate,
          fileUrl: uploadRes.url,
          fileName: file.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit quality report.');
      }

      onReportCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error uploading quality report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-surface rounded-xl border border-border shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm sm:text-base">
                {isAdmin ? 'Upload Quality Test Report' : 'Submit Lab Report for Review'}
              </h3>
              <p className="text-xs text-foreground-muted font-medium">
                {isAdmin ? 'Directly publish certified lab report' : 'Admin will review and verify before publishing'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-error-bg text-error text-xs font-semibold flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Select */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Select Product *
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-foreground outline-none focus:border-primary transition-colors"
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Report Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. FSSAI Purity & Quality Analysis"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-foreground outline-none focus:border-primary transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Laboratory Name */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Accredited Lab Name *
              </label>
              <input
                type="text"
                value={laboratoryName}
                onChange={(e) => setLaboratoryName(e.target.value)}
                placeholder="e.g. NABL Certified Food Lab"
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-foreground outline-none focus:border-primary transition-colors"
                required
              />
            </div>

            {/* Batch Number */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Batch Number (Optional)
              </label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="e.g. BATCH-2026-OCT-09"
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-foreground outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Test Date */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Test Date *
            </label>
            <input
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-foreground outline-none focus:border-primary transition-colors"
              required
            />
          </div>

          {/* Document Upload */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Upload Certificate / Test Report (PDF, PNG, JPG) *
            </label>
            <div className="border border-dashed border-border rounded-lg p-4 text-center bg-surface-muted/30 hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="quality-report-file"
                required
              />
              <label
                htmlFor="quality-report-file"
                className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
              >
                <Upload className="w-5 h-5 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  {file ? file.name : 'Click to select document or photo'}
                </span>
                <span className="text-[11px] text-foreground-muted">
                  Max file size: 10MB
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-muted text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-on-primary text-xs font-semibold flex items-center gap-2 shadow-2xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>{isAdmin ? 'Publish Report' : 'Submit for Approval'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
