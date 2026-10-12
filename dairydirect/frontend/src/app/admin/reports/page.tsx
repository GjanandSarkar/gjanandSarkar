"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Download, Calendar, TrendingUp, DollarSign,
  Package, Users, ArrowLeft, RefreshCw, Loader2, IndianRupee
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#4a8c3f', '#4a6fa5', '#d4712a', '#6b21a8', '#065f46', '#c78c2e'];

export default function AdminReportsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?period=${period}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('Failed to load reports:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [period]);

  const handleExportCSV = () => {
    window.location.href = `/api/admin/reports?period=${period}&format=csv`;
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-background)' }}>
      {/* Header */}
      <div className="px-6 md:px-10 pt-8 pb-6" style={{ background: 'var(--color-surface-container-lowest)', borderBottom: '1px solid rgba(195,201,187,0.2)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-1.5 rounded-[8px] hover:opacity-70 transition-opacity" style={{ background: 'var(--color-surface-container-low)' }}>
              <ArrowLeft className="w-4 h-4" style={{ color: 'var(--color-on-surface)' }} />
            </Link>
            <div>
              <h1 className="font-extrabold text-[24px]" style={{ color: 'var(--color-on-surface)' }}>Business Reports & Analytics</h1>
              <p className="text-[12px]" style={{ color: 'var(--color-outline)' }}>Financial analytics, revenue trends, and product performance</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex rounded-[10px] overflow-hidden border" style={{ borderColor: 'rgba(195,201,187,0.4)' }}>
              {(['7d', '30d', '90d'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="px-3 py-1.5 text-[12px] font-semibold transition-all"
                  style={{
                    background: period === p ? 'var(--color-primary)' : 'transparent',
                    color: period === p ? '#fff' : 'var(--color-outline)',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-semibold"
              style={{ background: 'var(--color-surface-container-low)', color: 'var(--color-on-surface)' }}
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-10 py-6 flex flex-col gap-6">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
        ) : (
          <>
            {/* KPI Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Gross Revenue', val: `₹${parseFloat(data?.overview?.gross_revenue || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, sub: `${data?.overview?.total_orders || 0} orders`, bg: '#c2efac', text: '#2d5a27' },
                { label: 'Net Delivered', val: `₹${parseFloat(data?.overview?.net_revenue || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, sub: `${data?.overview?.delivered_orders || 0} fulfilled`, bg: '#dce8ff', text: '#4a6fa5' },
                { label: 'Avg Order Value', val: `₹${parseFloat(data?.overview?.avg_order_value || '0').toFixed(0)}`, sub: 'Per transaction', bg: '#f3e8ff', text: '#6b21a8' },
                { label: 'Discounts Given', val: `₹${parseFloat(data?.overview?.total_discounts || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, sub: 'Coupons applied', bg: '#ffdcc7', text: '#774117' },
              ].map(kpi => (
                <div key={kpi.label} className="rounded-[16px] p-4 flex flex-col gap-1" style={{ background: kpi.bg }}>
                  <p className="font-extrabold text-[22px]" style={{ color: kpi.text }}>{kpi.val}</p>
                  <p className="text-[12px] font-bold" style={{ color: kpi.text }}>{kpi.label}</p>
                  <p className="text-[10px]" style={{ color: kpi.text, opacity: 0.8 }}>{kpi.sub}</p>
                </div>
              ))}
            </div>

            {/* Daily Revenue Area Chart */}
            <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(195,201,187,0.25)' }}>
              <h2 className="font-bold text-[16px] mb-4" style={{ color: 'var(--color-on-surface)' }}>Revenue Over Time</h2>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data?.daily || []}>
                  <defs>
                    <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4a8c3f" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4a8c3f" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(195,201,187,0.2)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#7a8870' }} tickFormatter={d => format(new Date(d), 'MMM d')} />
                  <YAxis tick={{ fontSize: 11, fill: '#7a8870' }} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid rgba(195,201,187,0.4)', borderRadius: 8, fontSize: 12 }}
                    formatter={(v: any) => [`₹${parseFloat(v).toLocaleString('en-IN')}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#4a8c3f" strokeWidth={2.5} fill="url(#revArea)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Category Revenue & Payment Methods */}
            <div className="grid lg:grid-cols-2 gap-4">
              {/* Category Breakdown */}
              <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(195,201,187,0.25)' }}>
                <h2 className="font-bold text-[16px] mb-4" style={{ color: 'var(--color-on-surface)' }}>Revenue by Category</h2>
                <div className="flex flex-col gap-3">
                  {(data?.byCategory || []).map((cat: any, i: number) => (
                    <div key={cat.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-[13px] font-semibold capitalize" style={{ color: 'var(--color-on-surface)' }}>{cat.category}</span>
                        <span className="text-[11px]" style={{ color: 'var(--color-outline)' }}>({cat.units_sold} units)</span>
                      </div>
                      <span className="font-bold text-[13px]" style={{ color: 'var(--color-primary)' }}>
                        ₹{parseFloat(cat.revenue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(195,201,187,0.25)' }}>
                <h2 className="font-bold text-[16px] mb-4" style={{ color: 'var(--color-on-surface)' }}>Payment Method Breakdown</h2>
                <div className="flex flex-col gap-3">
                  {(data?.byPaymentMethod || []).map((pm: any, i: number) => (
                    <div key={pm.payment_method} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: COLORS[(i + 2) % COLORS.length] }} />
                        <span className="text-[13px] font-semibold uppercase" style={{ color: 'var(--color-on-surface)' }}>{pm.payment_method}</span>
                        <span className="text-[11px]" style={{ color: 'var(--color-outline)' }}>({pm.count} orders)</span>
                      </div>
                      <span className="font-bold text-[13px]" style={{ color: 'var(--color-on-surface)' }}>
                        ₹{parseFloat(pm.total || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Products Table */}
            <div className="rounded-[16px] overflow-hidden" style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(195,201,187,0.25)' }}>
              <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(195,201,187,0.2)' }}>
                <h2 className="font-bold text-[16px]" style={{ color: 'var(--color-on-surface)' }}>Top Performing Products (Profit Analysis)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: 'var(--color-surface-container-low)' }}>
                      {['Product', 'Units Sold', 'Revenue', 'Cost', 'Est. Profit'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-outline)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.topProducts || []).map((p: any, i: number) => (
                      <tr key={i} style={{ borderTop: i > 0 ? '1px solid rgba(195,201,187,0.15)' : undefined }}>
                        <td className="px-5 py-3 font-semibold text-[13px]" style={{ color: 'var(--color-on-surface)' }}>
                          {p.name} ({p.weight})
                        </td>
                        <td className="px-5 py-3 text-[13px]" style={{ color: 'var(--color-on-surface)' }}>{p.total_sold}</td>
                        <td className="px-5 py-3 font-bold text-[13px]" style={{ color: 'var(--color-primary)' }}>
                          ₹{parseFloat(p.revenue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-5 py-3 text-[12px]" style={{ color: 'var(--color-outline)' }}>
                          ₹{parseFloat(p.cost || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-5 py-3 font-bold text-[13px]" style={{ color: '#2d5a27' }}>
                          ₹{parseFloat(p.profit || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
