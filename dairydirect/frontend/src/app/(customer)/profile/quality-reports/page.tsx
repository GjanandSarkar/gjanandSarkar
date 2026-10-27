"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ShieldCheck, 
  FileText, 
  Search, 
  Building2, 
  Calendar, 
  ExternalLink, 
  Eye, 
  X,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';

interface QualityReportItem {
  id: string;
  product_id: string;
  title: string;
  batch_number?: string | null;
  laboratory_name: string;
  test_date: string;
  file_url: string;
  file_name: string;
  status: string;
  created_at: string;
  product?: {
    id: string;
    name: string;
    image_url?: string;
    category?: string;
  };
}

export default function ProfileQualityReportsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [reports, setReports] = useState<QualityReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeReport, setActiveReport] = useState<QualityReportItem | null>(null);

  useEffect(() => {
    fetch('/api/quality-reports')
      .then((res) => res.json())
      .then((data) => {
        if (data.reports) {
          setReports(data.reports);
        }
      })
      .catch((err) => {
        console.error('Failed to load quality reports:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredReports = reports.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      r.title.toLowerCase().includes(q) ||
      r.laboratory_name.toLowerCase().includes(q) ||
      (r.batch_number && r.batch_number.toLowerCase().includes(q)) ||
      (r.product?.name && r.product.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary transition-colors py-1.5 px-3 rounded-lg hover:bg-surface-muted min-h-[44px] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('profile') || 'Profile'}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded text-xs font-semibold bg-success-bg text-primary border border-primary/20 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t('verifiedLabReport') || '100% Certified'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {/* Banner Section */}
        <div className="bg-surface rounded-xl border border-border p-6 shadow-xs">
          <div className="max-w-2xl space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              {t('labQualityReports') || 'Verified Quality & Lab Reports'}
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
              {t('labQualityReportsSub') || 'Every manufacturer on Gjanand Sarkar undergoes mandatory accredited laboratory batch testing. Review official certificates for purity, nutritional facts, and hygiene.'}
            </p>
          </div>

          {/* Search Box */}
          <div className="mt-5 relative max-w-md">
            <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder') || 'Search by product name, lab or batch number...'}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface text-sm text-foreground placeholder:text-foreground-muted/60 outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Reports Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-foreground-muted">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs font-semibold">Loading certified laboratory reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-surface rounded-xl border border-border p-12 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No reports match your search</h3>
            <p className="text-xs text-foreground-muted max-w-sm mx-auto">
              Try searching with another keyword or browse all available products.
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-surface rounded-xl border border-border p-5 shadow-xs hover:border-primary/50 transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {report.product?.image_url ? (
                        <img
                          src={report.product.image_url}
                          alt={report.product.name}
                          className="w-12 h-12 object-cover rounded-lg border border-border shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-surface-muted flex items-center justify-center shrink-0">
                          <FileText className="w-6 h-6 text-foreground-muted" />
                        </div>
                      )}
                      <div>
                        {report.product?.name && (
                          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-0.5">
                            {report.product.name}
                          </p>
                        )}
                        <h3 className="text-sm font-bold text-foreground leading-snug">
                          {report.title}
                        </h3>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-success-bg text-primary border border-primary/20 shrink-0">
                      Approved
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs text-foreground-muted">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                      <span className="truncate">{report.laboratory_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                      <span>
                        {new Date(report.test_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    {report.batch_number && (
                      <div className="col-span-2 text-[11px] font-mono text-foreground-muted">
                        Batch No: <strong className="text-foreground">{report.batch_number}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-border gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveReport(report)}
                    className="flex-1 py-2 px-3 rounded-lg bg-primary hover:bg-primary-hover text-on-primary text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t('viewDetails') || 'View Certificate'}</span>
                  </button>

                  <a
                    href={report.file_url}
                    target="_blank"
                    rel="noreferrer"
                    download={report.file_name}
                    className="py-2 px-3 rounded-lg border border-border hover:bg-surface-muted text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-foreground-muted" />
                    <span>{t('downloadReport') || 'Open Link'}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Preview Modal */}
      <AnimatePresence>
        {activeReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-xl border border-border shadow-2xl w-full max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{activeReport.title}</h3>
                    <p className="text-xs text-foreground-muted font-medium">
                      {activeReport.laboratory_name} • {activeReport.batch_number ? `Batch ${activeReport.batch_number}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={activeReport.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
                    title="Open in new window"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setActiveReport(null)}
                    className="p-2 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center bg-surface-muted min-h-[360px]">
                {activeReport.file_url.endsWith('.pdf') ? (
                  <iframe
                    src={activeReport.file_url}
                    className="w-full h-[520px] rounded-lg border border-border"
                    title="Quality Test Report PDF"
                  />
                ) : (
                  <img
                    src={activeReport.file_url}
                    alt={activeReport.title}
                    className="max-h-[520px] w-auto object-contain rounded-lg shadow-sm"
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
