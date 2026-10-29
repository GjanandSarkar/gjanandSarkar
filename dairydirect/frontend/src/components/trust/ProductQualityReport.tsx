"use client";

import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, ExternalLink, X, Calendar, Building2, Eye, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';

export interface QualityReport {
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
}

interface ProductQualityReportProps {
  productId: string;
  productName: string;
}

export function ProductQualityReport({ productId, productName }: ProductQualityReportProps) {
  const { t } = useTranslation();
  const [reports, setReports] = useState<QualityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<QualityReport | null>(null);

  useEffect(() => {
    if (!productId) return;
    setLoading(false);
    fetch(`/api/quality-reports?productId=${encodeURIComponent(productId)}`)
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
  }, [productId]);

  if (loading) return null;

  return (
    <>
      <div className="bg-surface rounded-xl border border-border p-5 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">{t('qualityTestingTitle')}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-success-bg text-primary border border-primary/20">
                  {t('certified')}
                </span>
              </div>
              <p className="text-xs text-foreground-muted mt-0.5">
                {t('qualityTestingSub')}
              </p>
            </div>
          </div>
        </div>

        {reports.length > 0 ? (
          <div className="space-y-2.5 pt-1">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 rounded-lg bg-surface-muted/50 border border-border/80 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{report.title}</p>
                    <div className="flex items-center gap-3 text-[11px] text-foreground-muted mt-0.5 font-medium">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {report.laboratory_name}
                      </span>
                      {report.batch_number && (
                        <span>Batch: {report.batch_number}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(report.test_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveReport(report)}
                  className="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-muted text-foreground border border-border text-xs font-semibold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0 ml-2"
                >
                  <Eye className="w-3.5 h-3.5 text-primary" />
                  <span>View Report</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-surface-muted/30 border border-dashed border-border text-xs text-foreground-muted flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            <span>{t('fssaiCert')}</span>
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
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{activeReport.title}</h3>
                    <p className="text-xs text-foreground-muted font-medium">
                      {productName} • Tested by {activeReport.laboratory_name}{activeReport.batch_number ? ` • Batch ${activeReport.batch_number}` : ''}
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

              {/* Modal Viewer Body */}
              <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center bg-surface-muted min-h-[360px]">
                {activeReport.file_url.endsWith('.pdf') ? (
                  <iframe
                    src={activeReport.file_url}
                    className="w-full h-[500px] rounded-lg border border-border"
                    title="Quality Test Report PDF"
                  />
                ) : (
                  <img
                    src={activeReport.file_url}
                    alt={activeReport.title}
                    className="max-h-[500px] w-auto object-contain rounded-lg shadow-sm"
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
