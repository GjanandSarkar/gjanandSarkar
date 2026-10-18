"use client";

import { ShieldCheck, FlaskConical, Droplets, CheckCircle2, Info, Calendar } from 'lucide-react';

export default function QualityReportsScreen() {
  // These were two hardcoded fake lab reports ("A2 Gir Cow Milk", 99/100,
  // "No Adulterants Found") shown to every customer regardless of what they
  // had ever ordered. Publishing invented lab results is a legal and trust
  // risk, so the list is empty until real reports are wired to the
  // `quality_reports` table. See docs/LAUNCH_READINESS_AUDIT.md section 5.1.
  const reports: Array<{
    id: string;
    date: string;
    item: string;
    fat: string;
    snf: string;
    score: string;
    status: string;
  }> = [];

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 transition-colors duration-150">
      {/* Standardized Page Header */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 pt-6 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Certified Quality & Safety</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Quality & Lab Reports
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted mt-1">
              Batch purity tests, fat & SNF analysis, and certified laboratory reports
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-8 pt-6 space-y-6">
        {/* Banner */}
        <div className="bg-surface rounded-2xl p-6 border border-border relative overflow-hidden shadow-2xs">
          <ShieldCheck className="absolute -right-4 -bottom-4 w-32 h-32 text-primary/10 rotate-12 pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-2 max-w-xl">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-1">
              <FlaskConical className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">Lab-Tested Direct Produce</h2>
            <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
              Every dairy and cold-pressed oil batch is laboratory tested for zero adulterants, precise fat percentages, and purity standards before dispatch.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xs font-bold text-foreground-muted uppercase tracking-wider">Recent Batch Results</h2>
          {reports.length === 0 && (
            <div className="bg-surface rounded-2xl p-10 border border-border shadow-2xs text-center max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-xl bg-surface-muted flex items-center justify-center text-foreground-muted mx-auto mb-3">
                <FlaskConical className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1">No Quality Reports Yet</h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                When your order includes a batch-tested dairy or wellness product, certified laboratory test certificates will be displayed here.
              </p>
            </div>
          )}
          {reports.map((report) => (
            <div key={report.id} className="bg-surface rounded-2xl p-5 border border-border shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{report.item}</h3>
                    <p className="text-[10px] text-foreground-muted font-bold flex items-center gap-1 uppercase tracking-wider mt-0.5">
                      <Calendar className="w-3 h-3" /> {report.date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-primary">{report.score}</p>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">{report.status}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-surface-muted rounded-xl p-3 text-center border border-border/70">
                  <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider mb-1">Fat Content</p>
                  <p className="text-sm font-bold text-foreground">{report.fat}</p>
                </div>
                <div className="bg-surface-muted rounded-xl p-3 text-center border border-border/70">
                  <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider mb-1">SNF Content</p>
                  <p className="text-sm font-bold text-foreground">{report.snf}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-foreground-muted justify-center py-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                No Adulterants Found (Lab ID: {report.id})
              </div>
            </div>
          ))}
        </div>

        {/* Info Card */}
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-2xs flex gap-3.5 items-start">
           <div className="w-9 h-9 shrink-0 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
             <Info className="w-4.5 h-4.5" />
           </div>
           <p className="text-xs text-foreground-muted leading-relaxed">
             Reports are verified by NABL-accredited test laboratories before shipment. Contact customer support if you require a physical signed certificate for your batch.
           </p>
        </div>
      </div>
    </div>
  );
}
