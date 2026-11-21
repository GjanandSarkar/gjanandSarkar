"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Eye, 
  ExternalLink, 
  Loader2, 
  Search, 
  Plus, 
  Building2, 
  Calendar,
  X,
  AlertCircle
} from 'lucide-react';
import { SellerQualityReportModal } from '@/components/seller/SellerQualityReportModal';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminToolbar } from '@/components/admin/AdminToolbar';

export default function AdminQualityReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const [activeReport, setActiveReport] = useState<any | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportsRes, productsRes] = await Promise.all([
        fetch('/api/quality-reports?admin=true'),
        fetch('/api/products')
      ]);

      const reportsData = await reportsRes.json();
      const productsData = await productsRes.json();

      if (reportsData.reports) setReports(reportsData.reports);
      if (Array.isArray(productsData)) setProducts(productsData);
      else if (productsData.products) setProducts(productsData.products);
    } catch (e) {
      console.error('Error fetching quality reports:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/quality-reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          adminNotes: status === 'rejected' ? adminNotes : undefined,
        }),
      });

      if (res.ok) {
        setRejectingId(null);
        setAdminNotes('');
        await fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update status');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (activeTab !== 'all' && r.status !== activeTab) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      r.title.toLowerCase().includes(q) ||
      r.laboratory_name.toLowerCase().includes(q) ||
      (r.batch_number && r.batch_number.toLowerCase().includes(q)) ||
      (r.product?.name && r.product.name.toLowerCase().includes(q))
    );
  });

  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Standard Admin Header */}
      <AdminHeader
        title={
          <div className="flex items-center gap-3">
            <span>Quality Test Reports</span>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300">
                {pendingCount} Pending Review
              </span>
            )}
          </div>
        }
        subtitle="Verify laboratory certifications submitted by sellers before customer display"
        onRefresh={fetchData}
        isRefreshing={loading}
        actions={
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs text-white transition-all shadow-xs active:scale-95 cursor-pointer bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>Upload Report</span>
          </button>
        }
      />

      {/* Reports Table & Standard Toolbar (Edit #38) */}
      <div className="px-6 md:px-10 py-6 flex flex-col gap-5">
        <AdminToolbar
          pills={[
            { id: 'pending', label: 'Pending Review', count: pendingCount },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'all', label: 'All Reports' },
          ]}
          activePill={activeTab}
          onPillChange={(id) => setActiveTab(id as any)}
          searchPlaceholder="Search reports by lab, product, batch..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <AdminTable
          columns={[
            { header: 'Product & Test Title' },
            { header: 'Laboratory & Date' },
            { header: 'Batch #' },
            { header: 'Status' },
            { header: 'Actions', align: 'right' },
          ]}
          isLoading={loading}
          isEmpty={!loading && filteredReports.length === 0}
          emptyIcon={FileText}
          emptyTitle="No quality reports found"
          emptyDescription="No reports match your current filter and search criteria."
        >
          {filteredReports.map((report) => {
            const isPending = report.status === 'pending';
            const isApproved = report.status === 'approved';

            return (
              <tr key={report.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    {report.product?.image_url && (
                      <img
                        src={report.product.image_url}
                        alt=""
                        className="w-10 h-10 object-cover rounded-[10px] border border-border shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-[13px] text-foreground truncate max-w-xs">{report.title}</p>
                      <p className="text-xs text-foreground-muted truncate max-w-xs">
                        {report.product?.name || 'General Dairy Line'}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-3.5">
                  <p className="font-semibold text-xs text-foreground">{report.laboratory_name}</p>
                  <p className="text-[11px] text-foreground-muted">
                    {new Date(report.test_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </td>

                <td className="px-5 py-3.5 font-mono text-xs text-foreground">
                  {report.batch_number || '—'}
                </td>

                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      isApproved
                        ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
                        : isPending
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                    }`}
                  >
                    {report.status}
                  </span>
                </td>

                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveReport(report)}
                      className="px-2.5 py-1.5 rounded-lg border border-border/80 hover:bg-surface-muted text-foreground text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Preview certificate"
                    >
                      <Eye className="w-3.5 h-3.5 text-foreground-muted" />
                      <span>Preview</span>
                    </button>

                    {isPending && (
                      <>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleUpdateStatus(report.id, 'approved')}
                          className="px-3 py-1.5 rounded-lg bg-primary hover:opacity-90 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => {
                            setRejectingId(report.id);
                            setAdminNotes('');
                          }}
                          className="px-3 py-1.5 rounded-lg border border-red-300 hover:bg-red-50 text-red-700 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </AdminTable>
      </div>

      {/* Rejection Notes Modal */}
      <AnimatePresence>
        {rejectingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-xl border border-border shadow-2xl w-full max-w-md p-5 space-y-4"
            >
              <div className="flex items-center gap-2.5 text-error">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-bold text-foreground">Reject Quality Report</h3>
              </div>
              <p className="text-xs text-foreground-muted">
                Please provide feedback for the seller explaining why this certificate was rejected (e.g. illegible scan, mismatched batch, expired accreditation).
              </p>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Enter rejection notes..."
                rows={3}
                className="w-full p-3 rounded-lg border border-border bg-surface text-xs text-foreground outline-none focus:border-error"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingId(null)}
                  className="px-4 py-2 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isUpdating || !adminNotes.trim()}
                  onClick={() => handleUpdateStatus(rejectingId, 'rejected')}
                  className="px-4 py-2 rounded-lg bg-error hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Certificate Preview Modal */}
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
                    <p className="text-xs text-foreground-muted">
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
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setActiveReport(null)}
                    className="p-2 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors cursor-pointer"
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

      {/* Admin Upload Modal */}
      {isUploadModalOpen && (
        <SellerQualityReportModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          products={products}
          onReportCreated={fetchData}
          isAdmin={true}
        />
      )}
    </div>
  );
}
