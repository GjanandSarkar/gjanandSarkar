"use client";

import { useRouter } from 'next/navigation';
import { ShieldCheck, ChevronLeft, FlaskConical, Droplets, CheckCircle2, FlaskRound, Info, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function QualityReportsScreen() {
  const router = useRouter();

  const reports = [
    { 
      id: 'QR-8821', 
      date: '12 April 2026', 
      item: 'A2 Gir Cow Milk', 
      fat: '4.8%', 
      snf: '8.7', 
      score: '99/100',
      status: 'Excellent' 
    },
    { 
      id: 'QR-8794', 
      date: '11 April 2026', 
      item: 'Farm Fresh Cow Milk', 
      fat: '3.9%', 
      snf: '8.5', 
      score: '98/100',
      status: 'Premium' 
    },
  ];

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 glass-surface px-5 pt-8 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-black text-on-surface tracking-tight">Quality Reports</h1>
        </div>
      </div>

      <div className="px-5 pt-6 space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-[28px] p-6 border border-primary/10 relative overflow-hidden">
          <ShieldCheck className="absolute -right-4 -bottom-4 w-32 h-32 text-primary/10 rotate-12" />
          <div className="relative z-10 flex flex-col gap-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white mb-2">
              <FlaskConical className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-primary">Lab Certified Pure</h2>
            <p className="text-[13px] text-primary/70 font-medium leading-relaxed">
              Every batch of milk is tested for Fat, SNF, and Adulterants before it reach your doorstep.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-2">Recent Test Results</h2>
          {reports.map((report) => (
            <div key={report.id} className="bg-white rounded-[24px] p-5 border border-sand shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[12px] bg-surface-container flex items-center justify-center text-primary">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-[15px] text-on-surface">{report.item}</h3>
                    <p className="text-[10px] text-muted font-bold flex items-center gap-1 uppercase tracking-wider mt-0.5">
                      <Calendar className="w-3 h-3" /> {report.date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[14px] font-black text-primary">{report.score}</p>
                  <p className="text-[9px] text-green-600 font-bold uppercase tracking-widest">{report.status}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-surface-container-low rounded-[16px] p-3 text-center border border-sand/50">
                  <p className="text-[9px] font-black text-muted uppercase tracking-[0.15em] mb-1">Fat Content</p>
                  <p className="text-[16px] font-black text-on-surface">{report.fat}</p>
                </div>
                <div className="bg-surface-container-low rounded-[16px] p-3 text-center border border-sand/50">
                  <p className="text-[9px] font-black text-muted uppercase tracking-[0.15em] mb-1">SNF Content</p>
                  <p className="text-[16px] font-black text-on-surface">{report.snf}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-bold text-muted justify-center py-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                No Adulterants Found (Lab ID: {report.id})
              </div>
            </div>
          ))}
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-[24px] p-5 border border-sand shadow-sm flex gap-4">
           <div className="w-10 h-10 shrink-0 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
             <Info className="w-5 h-5" />
           </div>
           <p className="text-[12px] text-muted font-medium leading-relaxed">
             Reports are updated daily at 4:30 AM after final quality check at our processing center.
           </p>
        </div>
      </div>
    </div>
  );
}
