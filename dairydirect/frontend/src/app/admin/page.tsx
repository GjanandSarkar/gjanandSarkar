"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, ShoppingBag, Truck, Package, ArrowRight,
  Clock, CheckCircle2, AlertCircle, BarChart3,
  Loader2, AlertTriangle, RefreshCw, Users, IndianRupee,
  Calendar, Info, ChevronDown, Check, X
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/lib/i18n';
<<<<<<< HEAD
import dynamic from 'next/dynamic';
import { AdminTable } from '@/components/admin/AdminTable';

// Recharts is heavy (~160 KB gzip). Dynamic import ensures it is only loaded
// when the admin dashboard is actually visited.
const AreaChart = dynamic(() => import('recharts').then(m => m.AreaChart));
const Area = dynamic(() => import('recharts').then(m => m.Area));
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis));
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis));
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip));
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer));
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid));
=======
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { toneFor } from '@/lib/statusTone';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};

<<<<<<< HEAD
const STATUS_CONFIG: Record<string, { bg: string; color: string; dot: string; icon: any }> = {
  confirmed:        { bg: '#dcfce7', color: '#14532d', dot: '#16a34a', icon: CheckCircle2 },
  out_for_delivery: { bg: '#fef3c7', color: '#92400e', dot: '#d97706', icon: Truck },
  delivered:        { bg: '#d1fae5', color: '#065f46', dot: '#059669', icon: CheckCircle2 },
  pending:          { bg: '#ffedd5', color: '#9a3412', dot: '#ea580c', icon: Clock },
  cancelled:        { bg: '#f1f5f9', color: '#475569', dot: '#64748b', icon: AlertCircle },
=======
const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; icon: any }> = {
  confirmed:        { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', icon: CheckCircle2 },
  out_for_delivery: { bg: 'bg-blue-50 border-blue-200', text: 'text-info', dot: 'bg-blue-500', icon: Truck },
  delivered:        { bg: 'bg-primary-fixed/80 border-primary/20', text: 'text-primary', dot: 'bg-primary', icon: CheckCircle2 },
  pending:          { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', icon: Clock },
  cancelled:        { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400', icon: AlertCircle },
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
};

type DashboardData = {
  overview: {
    total_orders: string;
    delivered_orders: string;
    pending_orders: string;
    cancelled_orders: string;
    gross_revenue: string;
    avg_order_value: string;
    unique_customers: string;
  };
  daily: { date: string; orders: number; revenue: number }[];
  topProducts: { name: string; weight: string; total_sold: number; revenue: number }[];
  recentOrders: {
    id: string;
    order_number: string;
    total_amount: number;
    status: string;
    created_at: string;
    customer_name?: string;
  }[];
  inventory: {
    out_of_stock: string;
    low_stock: string;
    in_stock: string;
  };
};

type FilterPeriod = 'today' | '7d' | '30d' | 'custom';
type ChartMetric = 'revenue' | 'orders' | 'aov';

export default function AdminDashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useStore((s) => s.user);
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Period filter state
  const [period, setPeriod] = useState<FilterPeriod>('30d');
  const [customStartDate, setCustomStartDate] = useState(
    new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Chart swap state (Edit #8)
  const [activeChart, setActiveChart] = useState<ChartMetric>('revenue');
  const [showChartExplainer, setShowChartExplainer] = useState(false);

  const customFilterRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const apiPeriod = period === 'today' ? 'today' : (period === '7d' ? '7d' : '30d');
      const [reportsRes, ordersRes, inventoryRes] = await Promise.all([
        fetch(`/api/admin/reports?period=${apiPeriod}`),
        fetch('/api/orders?limit=8&admin=true'),
        fetch('/api/admin/inventory?filter=summary'),
      ]);

      const reports = await reportsRes.json();
      const orders = await ordersRes.json();
      const inventory = await inventoryRes.json();

      const mappedOrders = (orders.orders || []).map((o: any) => ({
        ...o,
        customer_name: o.customer_name || o.profiles?.name || o.profiles?.email || 'Customer',
      }));

      setData({
        overview: reports.overview || {},
        daily: (reports.daily || []).slice(-14),
        topProducts: (reports.topProducts || []).slice(0, 5),
        recentOrders: mappedOrders,
        inventory: inventory.stats || {},
      });
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  // Close custom filter popup on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (customFilterRef.current && !customFilterRef.current.contains(e.target as Node)) {
        setIsCustomOpen(false);
      }
    };
    if (isCustomOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isCustomOpen]);

  // Dynamic time-aware greeting (Edit #3)
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h >= 4 && h < 12) return 'Good morning';
    if (h >= 12 && h < 17) return 'Good afternoon';
    if (h >= 17 && h < 22) return 'Good evening';
    return 'Good night';
  };

  // Stats cards configuration
  const statsCards = data ? [
    {
      label: 'Total Revenue',
      value: `₹${parseFloat(data.overview.gross_revenue || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      sub: `${period === 'today' ? 'Today' : period === '7d' ? 'Last 7 days' : 'Last 30 days'}`,
      icon: IndianRupee,
<<<<<<< HEAD
      color: '#15803d',
      bg: '#dcfce7',
=======
      iconClass: 'text-primary bg-primary-fixed',
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
    },
    {
      label: 'Total Orders',
      value: data.overview.total_orders || '0',
      sub: `${data.overview.delivered_orders || '0'} delivered`,
      icon: ShoppingBag,
<<<<<<< HEAD
      color: '#1d4ed8',
      bg: '#dbeafe',
=======
      iconClass: 'text-info bg-blue-50',
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
    },
    {
      label: 'Pending Orders',
      value: data.overview.pending_orders || '0',
      sub: 'Needs attention',
      icon: Clock,
<<<<<<< HEAD
      color: '#c2410c',
      bg: '#ffedd5',
=======
      iconClass: 'text-amber-600 bg-amber-50',
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
    },
    {
      label: 'Active Customers',
      value: data.overview.unique_customers || '0',
      sub: 'Unique buyers',
      icon: Users,
<<<<<<< HEAD
      color: '#7e22ce',
      bg: '#f3e8ff',
=======
      iconClass: 'text-indigo-600 bg-indigo-50',
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
    },
    {
      label: 'Avg Order Value',
      value: `₹${parseFloat(data.overview.avg_order_value || '0').toFixed(0)}`,
      sub: 'Per order ticket',
      icon: TrendingUp,
<<<<<<< HEAD
      color: '#047857',
      bg: '#d1fae5',
=======
      iconClass: 'text-emerald-600 bg-emerald-50',
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
    },
    {
      label: 'Low Stock Alerts',
      value: data.inventory.out_of_stock || '0',
      sub: `${data.inventory.low_stock || '0'} low stock`,
      icon: AlertTriangle,
<<<<<<< HEAD
      color: '#a16207',
      bg: '#fef9c3',
=======
      iconClass: 'text-rose-600 bg-rose-50',
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
    },
  ] : [];

  // Chart configuration computed from daily data (Edit #8)
  const chartData = (data?.daily || []).map((d) => ({
    ...d,
    aov: d.orders > 0 ? Math.round(d.revenue / d.orders) : 0,
  }));

  const chartConfig = {
    revenue: {
      title: 'Gross Revenue Trend',
      unit: '₹',
      color: '#16a34a',
      gradId: 'revGrad',
      dataKey: 'revenue',
      explanation: 'Displays daily gross turnover generated from completed orders over time.',
      formatter: (v: number) => `₹${parseFloat(String(v)).toLocaleString('en-IN')}`,
    },
    orders: {
      title: 'Daily Order Volume',
      unit: '',
      color: '#2563eb',
      gradId: 'ordGrad',
      dataKey: 'orders',
      explanation: 'Visualizes daily order numbers to identify high-traffic days and purchasing momentum.',
      formatter: (v: number) => `${v} orders`,
    },
    aov: {
      title: 'Average Order Value (AOV)',
      unit: '₹',
      color: '#9333ea',
      gradId: 'aovGrad',
      dataKey: 'aov',
      explanation: 'Calculated as daily gross revenue divided by orders to show basket size trends.',
      formatter: (v: number) => `₹${v}`,
    },
  }[activeChart];

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-[60vh] items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-semibold text-foreground-muted">Loading dashboard data...</p>
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="flex flex-col min-h-screen">
      {/* ═══ HEADER (Edits #1, #2, #3, #7) ═══ */}
      <div className="px-4 sm:px-6 md:px-10 pt-20 md:pt-7 pb-6 bg-surface border-b border-border transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left: Time-Aware Greeting (Leaf removed per Edit #2; Title aware per Edit #3) */}
          <div>
            <h1 className="font-semibold text-[26px] md:text-[28px] tracking-tight text-foreground leading-snug">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Admin'}{' '}
              <span className="text-[19px] md:text-[22px] font-normal text-foreground-muted">
                — on your dashboard
              </span>
            </h1>
            <p className="text-[13px] text-foreground-muted mt-1">
              {format(new Date(), 'EEEE, MMMM d, yyyy')} · Last updated {format(lastRefreshed, 'h:mm a')}
            </p>
          </div>

          {/* Right: Ordered toolbar per Edit #7: [1. Refresh] -> [2. Filters with Custom] -> [3. Full Reports] */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* 1. Refresh Button (Left side) */}
            <button
              type="button"
              onClick={fetchData}
              disabled={isRefreshing}
              className="p-2.5 rounded-[12px] border border-border/80 bg-surface-container-low hover:bg-surface-muted transition-all cursor-pointer disabled:opacity-50 text-foreground"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`w-4 h-4 text-primary ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* 2. Filter Selector in between (Background-aware per Edit #1 + Custom filter per Edit #7) */}
            <div className="relative" ref={customFilterRef}>
              <div className="flex items-center rounded-[12px] p-1 border border-border/80 bg-surface shadow-xs">
                {(['today', '7d', '30d'] as const).map((p) => {
                  const isActive = period === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setPeriod(p);
                        setIsCustomOpen(false);
                      }}
                      className={`px-3 py-1.5 text-[12px] font-bold rounded-[8px] transition-all cursor-pointer ${
                        isActive
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-foreground hover:bg-surface-muted hover:text-foreground'
                      }`}
                    >
                      {p === 'today' ? 'Today' : p}
                    </button>
                  );
                })}

                {/* Custom Filter Button */}
                <button
                  type="button"
                  onClick={() => setIsCustomOpen(prev => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold rounded-[8px] transition-all cursor-pointer ${
                    period === 'custom' || isCustomOpen
                      ? 'bg-primary-fixed text-primary shadow-xs'
                      : 'text-foreground hover:bg-surface-muted hover:text-foreground'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Custom</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>
              </div>

              {/* Custom Date Range Popover */}
              <AnimatePresence>
                {isCustomOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.16 }}
                    className="absolute right-0 top-[calc(100%+8px)] w-72 rounded-[16px] p-4 bg-surface border border-border shadow-2xl z-50 flex flex-col gap-3"
                    style={{ background: 'var(--color-surface)' }}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <span className="text-xs font-bold text-foreground">Custom Date Filter</span>
                      <button
                        type="button"
                        onClick={() => setIsCustomOpen(false)}
                        className="text-foreground-muted hover:text-foreground p-0.5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-semibold text-foreground-muted">Start Date</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-[10px] text-xs font-medium border border-border bg-surface-container-low text-foreground outline-none focus:border-primary"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-semibold text-foreground-muted">End Date</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-[10px] text-xs font-medium border border-border bg-surface-container-low text-foreground outline-none focus:border-primary"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPeriod('custom');
                          setIsCustomOpen(false);
                          fetchData();
                        }}
                        className="flex-1 py-2 rounded-[10px] text-xs font-bold bg-primary text-white hover:opacity-95 transition-opacity cursor-pointer shadow-xs"
                      >
                        Apply Range
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3. Full Reports Button (Right side) */}
            <Link
              href="/admin/reports"
              className="flex items-center gap-2 px-4 py-2 rounded-[12px] text-[13px] font-bold text-white transition-all hover:opacity-90 active:scale-95 shadow-xs"
              style={{ background: 'var(--color-primary)' }}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Full Reports</span>
            </Link>
=======
    <AdminPageShell
      title="Platform Operations"
      description={`${greeting()}, ${user?.name?.split(' ')[0] || 'Admin'} · ${format(new Date(), 'EEEE, MMMM d, yyyy')} · Last updated ${format(lastRefreshed, 'h:mm a')}`}
      actions={
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-border bg-surface-muted p-0.5">
            {(['7d', '30d'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  period === p ? 'bg-surface text-foreground shadow-2xs font-bold' : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                {p}
              </button>
            ))}
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            loading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
<<<<<<< HEAD
      </div>

      {/* ═══ DASHBOARD CONTENT ═══ */}
      <div className="px-6 md:px-10 py-6 flex flex-col gap-6">
        {/* ═══ STAT CARDS ═══ */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5"
          variants={container}
          initial="hidden"
          animate="show"
=======
      }
    >
      <div className="space-y-6">
        
        {/* ═══ STAT CARDS ═══ */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
          variants={container} initial="hidden" animate="show"
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
        >
          {statsCards.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                variants={item}
<<<<<<< HEAD
                className="rounded-[16px] p-4 flex flex-col gap-2 bg-surface border border-border shadow-xs hover:shadow-md transition-all cursor-default"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center font-bold"
                    style={{ background: stat.bg, color: stat.color }}
                  >
                    <Icon className="w-4.5 h-4.5" strokeWidth={2.2} />
                  </div>
                </div>
                <div>
                  <p className="font-bold text-[20px] leading-tight text-foreground tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-xs font-bold mt-1 text-foreground">
                    {stat.label}
                  </p>
                  <p className="text-[11px] text-foreground-muted mt-0.5">
=======
                className="rounded-xl p-3.5 sm:p-4 bg-surface border border-border flex flex-col justify-between shadow-2xs hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.iconClass}`}>
                    <Icon className="w-4 h-4" strokeWidth={2.2} />
                  </div>
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-bold tracking-tight text-foreground leading-none">
                    {stat.value}
                  </p>
                  <p className="text-xs font-medium text-foreground mt-1 truncate">
                    {stat.label}
                  </p>
                  <p className="text-[10px] text-foreground-muted mt-0.5 truncate">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                    {stat.sub}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ═══ CHART (Edit #8) + QUICK ACTIONS (Edit #6) ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Revenue / Orders / AOV Trend (lg:col-span-8 or 9) */}
          <motion.div
<<<<<<< HEAD
            variants={item}
            initial="hidden"
            animate="show"
            className="lg:col-span-8 xl:col-span-8 rounded-[16px] p-5 bg-surface border border-border shadow-xs"
          >
            {/* Chart Header with Interactive Swappable Tabs per Edit #8 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-[15px] text-foreground">
                  {chartConfig.title}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowChartExplainer(prev => !prev)}
                  className="text-foreground-muted hover:text-foreground transition-colors p-1"
                  title="What is this chart?"
                >
                  <Info className="w-4 h-4 text-foreground-muted" />
                </button>
              </div>

              {/* Chart Switcher Buttons (Revenue | Orders | Avg Order Value) */}
              <div className="flex items-center rounded-[10px] p-1 border border-border bg-surface-muted/60 self-start sm:self-auto">
                {(['revenue', 'orders', 'aov'] as const).map((metric) => {
                  const isActive = activeChart === metric;
                  const label = metric === 'revenue' ? 'Revenue' : (metric === 'orders' ? 'Orders' : 'Avg Value');
                  return (
                    <button
                      key={metric}
                      type="button"
                      onClick={() => setActiveChart(metric)}
                      className={`px-3 py-1 text-[11px] font-bold rounded-[8px] transition-all cursor-pointer ${
                        isActive
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-foreground-muted hover:text-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Explanation banner toggleable */}
            <AnimatePresence>
              {showChartExplainer && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-3 px-3 py-2 rounded-[10px] bg-primary-fixed/30 border border-primary/20 text-xs text-foreground flex items-center justify-between"
                >
                  <span>{chartConfig.explanation}</span>
                  <button
                    type="button"
                    onClick={() => setShowChartExplainer(false)}
                    className="p-1 text-foreground-muted hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <defs>
                    <linearGradient id={chartConfig.gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartConfig.color} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={chartConfig.color} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: 'var(--color-foreground-muted)' }}
                    tickFormatter={(d) => d ? format(new Date(String(d)), 'MMM d') : ''}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--color-foreground-muted)' }}
                    tickFormatter={(v) => {
                      if (activeChart === 'orders') return String(v);
                      return `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`;
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                      borderRadius: 12,
                      fontSize: 12,
                      color: 'var(--color-foreground)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    }}
                    formatter={(v: any) => [chartConfig.formatter(Number(v)), chartConfig.title]}
                    labelFormatter={(l) => l ? format(new Date(String(l)), 'EEEE, MMM d, yyyy') : ''}
                  />
                  <Area
                    type="monotone"
                    dataKey={chartConfig.dataKey}
                    stroke={chartConfig.color}
                    strokeWidth={2.5}
                    fill={`url(#${chartConfig.gradId})`}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
=======
            variants={item} initial="hidden" animate="show"
            className="lg:col-span-2 rounded-xl p-4 sm:p-5 bg-surface border border-border shadow-2xs"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-foreground">
                Revenue Trajectory
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary-fixed text-primary">
                Last {period === '7d' ? '7' : '14'} days
              </span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data?.daily || []} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0c831f" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0c831f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(d) => d ? format(new Date(String(d)), 'MMM d') : ''} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(v: any) => [`₹${parseFloat(v).toLocaleString('en-IN')}`, 'Revenue']}
                  labelFormatter={(l) => l ? format(new Date(String(l)), 'MMM d, yyyy') : ''}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0c831f" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
          </motion.div>

          {/* Quick Actions (Compact width: lg:col-span-4 per Edit #6) */}
          <motion.div
<<<<<<< HEAD
            variants={item}
            initial="hidden"
            animate="show"
            className="lg:col-span-4 xl:col-span-4 rounded-[16px] p-5 bg-surface border border-border shadow-xs flex flex-col gap-2.5"
          >
            <div className="flex items-center justify-between pb-1">
              <h2 className="font-bold text-[15px] text-foreground">Quick Actions</h2>
              <span className="text-[11px] font-semibold text-foreground-muted">Fast Shortcuts</span>
            </div>

            {/* Buttons with tone-matched borders and elevated hover per Edit #6 */}
            {[
              { label: 'Manage Orders', href: '/admin/orders', bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', iconColor: '#16a34a' },
              { label: 'Inventory & Stock', href: '/admin/inventory', bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', iconColor: '#2563eb' },
              { label: 'Return Requests', href: '/admin/returns', bg: '#fff7ed', border: '#fed7aa', text: '#c2410c', iconColor: '#ea580c' },
              { label: 'All Products', href: '/admin/products', bg: '#faf5ff', border: '#e9d5ff', text: '#7e22ce', iconColor: '#9333ea' },
              { label: 'Customers', href: '/admin/customers', bg: '#ecfdf5', border: '#a7f3d0', text: '#047857', iconColor: '#059669' },
              { label: 'Business Settings', href: '/admin/settings', bg: '#fefce8', border: '#fef08a', text: '#a16207', iconColor: '#ca8a04' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-[12px] border transition-all duration-150 hover:shadow-xs hover:scale-[1.01] active:scale-[0.99] group cursor-pointer"
                style={{
                  backgroundColor: link.bg,
                  borderColor: link.border,
                  color: link.text,
                }}
              >
                <span className="text-[13px] font-bold">{link.label}</span>
                <ArrowRight
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
                  style={{ color: link.iconColor }}
                />
              </Link>
            ))}
          </motion.div>
        </div>

        {/* ═══ RECENT ORDERS (Standardized AdminTable per Edit #9 & #11) ═══ */}
        <motion.div variants={item} initial="hidden" animate="show">
          <AdminTable
            title="Recent Orders"
            headerAction={
              <Link
                href="/admin/orders"
                className="flex items-center gap-1 text-[12px] font-bold text-primary hover:underline"
              >
                View All Orders <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
            columns={[
              { header: 'Order #' },
              { header: 'Customer' },
              { header: 'Total' },
              { header: 'Status' },
              { header: 'Date', align: 'right' },
            ]}
            isEmpty={!data?.recentOrders?.length}
            emptyIcon={ShoppingBag}
            emptyTitle="No orders yet"
            emptyDescription="Recent customer orders will automatically appear here."
          >
            {data?.recentOrders?.map((order) => {
              const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['pending'];
              return (
                <tr
                  key={order.id}
                  className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/orders?id=${order.id}`)}
                >
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-[13px] text-primary">
                      {order.order_number || order.id.slice(0, 8).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] font-medium text-foreground">
                    {order.customer_name || '—'}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-[13px] text-foreground">
                    ₹{order.total_amount}
                  </td>
                  <td className="px-5 py-3.5">
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ background: statusCfg.bg, color: statusCfg.color }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusCfg.dot }} />
                      <span className="capitalize">{order.status.replace(/_/g, ' ')}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right text-xs text-foreground-muted">
                    {format(new Date(order.created_at), 'MMM d, h:mm a')}
                  </td>
                </tr>
              );
            })}
          </AdminTable>
=======
            variants={item} initial="hidden" animate="show"
            className="rounded-xl p-4 sm:p-5 bg-surface border border-border shadow-2xs flex flex-col justify-between"
          >
            <h2 className="text-sm font-bold text-foreground mb-3">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: 'Manage Orders', href: '/admin/orders', sub: 'Status updates & fulfillment' },
                { label: 'Inventory & Stock', href: '/admin/inventory', sub: 'Real-time SKU quantities' },
                { label: 'Return Requests', href: '/admin/returns', sub: 'Cancellations & approvals' },
                { label: 'Product Catalog', href: '/admin/products', sub: 'Pricing & pack variations' },
                { label: 'Sellers & Vendors', href: '/admin/sellers', sub: 'Commission & verification' },
                { label: 'Audit Log', href: '/admin/audit-log', sub: 'Security & system history' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:border-primary/40 hover:bg-surface-muted/60 transition-all group"
                >
                  <div>
                    <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors block">
                      {link.label}
                    </span>
                    <span className="text-[10px] text-foreground-muted">
                      {link.sub}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-foreground-muted group-hover:text-primary group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ═══ RECENT ORDERS ═══ */}
        <motion.div
          variants={item} initial="hidden" animate="show"
          className="rounded-xl overflow-hidden bg-surface border border-border shadow-2xs"
        >
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <h2 className="text-sm font-bold text-foreground">Recent Orders</h2>
            <Link href="/admin/orders" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!data?.recentOrders?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingBag className="w-8 h-8 text-foreground-muted mb-2 opacity-50" strokeWidth={1.5} />
              <p className="text-xs font-semibold text-foreground">No recent orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-muted/50 border-b border-border text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">
                    <th className="px-5 py-3">Order #</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Total</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.recentOrders.map((order) => {
                    const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['pending'];
                    const StatusIcon = statusCfg.icon;
                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-surface-muted/40 transition-colors cursor-pointer text-xs"
                        onClick={() => window.location.href = `/admin/orders?id=${order.id}`}
                      >
                        <td className="px-5 py-3.5 font-bold text-primary tabular">
                          {order.order_number || order.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-foreground">
                          {order.customer_name || 'Customer'}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-foreground tabular">
                          ₹{order.total_amount}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant={toneFor(order.status)} dot size="sm">
                            {order.status.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-foreground-muted text-[11px] tabular">
                          {format(new Date(order.created_at), 'MMM d, h:mm a')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
        </motion.div>

        {/* ═══ TOP PRODUCTS ═══ */}
        {data?.topProducts && data.topProducts.length > 0 && (
          <motion.div
<<<<<<< HEAD
            variants={item}
            initial="hidden"
            animate="show"
            className="rounded-[16px] p-5 bg-surface border border-border shadow-xs"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[15px] text-foreground">Top Performing Products</h2>
              <Link href="/admin/products" className="text-[12px] font-bold text-primary hover:underline">
=======
            variants={item} initial="hidden" animate="show"
            className="rounded-xl p-5 bg-surface border border-border shadow-2xs"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-foreground">Top Performing Products</h2>
              <Link href="/admin/products" className="text-xs font-semibold text-primary hover:underline">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                All Products
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {data.topProducts.map((product, i) => (
<<<<<<< HEAD
                <div key={i} className="flex items-center justify-between p-2 rounded-[10px] hover:bg-surface-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-primary-fixed text-primary"
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">
                        {product.name} ({product.weight})
                      </p>
                      <p className="text-xs text-foreground-muted">
                        {product.total_sold} units sold
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-[13px] text-primary">
                    ₹{parseFloat(product.revenue as any).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
=======
                <div key={i} className="p-3 rounded-lg border border-border bg-surface-muted/30 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold bg-primary-fixed text-primary">
                      #{i + 1}
                    </span>
                    <p className="text-xs font-semibold text-foreground truncate">
                      {product.name}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-foreground-muted">
                      {product.total_sold} sold
                    </span>
                    <span className="font-bold text-foreground">
                      ₹{parseFloat(product.revenue as any).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </AdminPageShell>
  );
}
