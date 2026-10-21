"use client";

import { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import {
  TrendingUp, ShoppingBag, Truck, Package, ArrowRight,
  Clock, CheckCircle2, AlertCircle, BarChart3, Leaf,
  Loader2, AlertTriangle, RefreshCw, Users, IndianRupee,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { format, isToday, subDays } from 'date-fns';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/lib/i18n';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; icon: any }> = {
  confirmed:        { bg: 'bg-success-bg border-success/20', text: 'text-success', dot: 'bg-emerald-500', icon: CheckCircle2 },
  out_for_delivery: { bg: 'bg-info-bg border-info/20', text: 'text-info', dot: 'bg-blue-500', icon: Truck },
  delivered:        { bg: 'bg-primary-fixed/80 border-primary/20', text: 'text-primary', dot: 'bg-primary', icon: CheckCircle2 },
  pending:          { bg: 'bg-warning-bg border-warning/20', text: 'text-warning', dot: 'bg-amber-500', icon: Clock },
  cancelled:        { bg: 'bg-surface-muted border-border', text: 'text-foreground-muted', dot: 'bg-slate-400', icon: AlertCircle },
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

export default function AdminDashboard() {
  const { t } = useTranslation();
  const user = useStore((s) => s.user);
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d'>('30d');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [reportsRes, ordersRes, inventoryRes] = await Promise.all([
        fetch(`/api/admin/reports?period=${period}`),
        fetch('/api/orders?limit=8&admin=true'),
        fetch('/api/admin/inventory?filter=summary'),
      ]);

      const reports = await reportsRes.json();
      const orders = await ordersRes.json();
      const inventory = await inventoryRes.json();

      setData({
        overview: reports.overview || {},
        daily: (reports.daily || []).slice(-14),
        topProducts: (reports.topProducts || []).slice(0, 5),
        recentOrders: orders.orders || [],
        inventory: inventory.stats || {},
      });
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [period]);

  const statsCards = data ? [
    {
      label: 'Total Revenue',
      value: `₹${parseFloat(data.overview.gross_revenue || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      sub: `${period === '7d' ? 'Last 7 days' : 'Last 30 days'}`,
      icon: IndianRupee,
      iconClass: 'text-primary bg-primary-fixed',
    },
    {
      label: 'Total Orders',
      value: data.overview.total_orders || '0',
      sub: `${data.overview.delivered_orders || '0'} delivered`,
      icon: ShoppingBag,
      iconClass: 'text-info bg-info-bg',
    },
    {
      label: 'Pending Orders',
      value: data.overview.pending_orders || '0',
      sub: 'Needs attention',
      icon: Clock,
      iconClass: 'text-warning bg-warning-bg',
    },
    {
      label: 'Active Customers',
      value: data.overview.unique_customers || '0',
      sub: 'Unique buyers',
      icon: Users,
      iconClass: 'text-indigo-600 bg-indigo-50',
    },
    {
      label: 'Avg Order Value',
      value: `₹${parseFloat(data.overview.avg_order_value || '0').toFixed(0)}`,
      sub: 'Per order',
      icon: TrendingUp,
      iconClass: 'text-success bg-success-bg',
    },
    {
      label: 'Low Stock Alerts',
      value: data.inventory.out_of_stock || '0',
      sub: `${data.inventory.low_stock || '0'} low stock`,
      icon: AlertTriangle,
      iconClass: 'text-error bg-error-bg',
    },
  ] : [];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--color-on-surface-variant)' }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ═══ HEADER ═══ */}
      <div className="px-5 sm:px-8 pt-6 pb-5 bg-surface border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Platform Operations
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {greeting()}, {user?.name?.split(' ')[0] || 'Admin'}
            </h1>
            <p className="text-xs text-foreground-muted mt-0.5">
              {format(new Date(), 'EEEE, MMMM d, yyyy')} · Last updated {format(lastRefreshed, 'h:mm a')}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Period Toggle */}
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
            </div>

            <button
              type="button"
              onClick={fetchData}
              title="Refresh Data"
              className="p-2 rounded-lg border border-border bg-surface hover:bg-surface-muted text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <Link
              href="/admin/reports"
              className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Full Reports</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="px-5 sm:px-8 py-6 flex flex-col gap-6">
        {/* ═══ STAT CARDS ═══ */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
          variants={container} initial="hidden" animate="show"
        >
          {statsCards.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                variants={item}
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
                    {stat.sub}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ═══ CHART + QUICK LINKS ═══ */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Revenue Chart */}
          <motion.div
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
          </motion.div>

          {/* Quick Navigation */}
          <motion.div
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
                        <td className="px-5 py-3.5 font-bold text-primary">
                          {order.order_number || order.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-foreground">
                          {order.customer_name || 'Customer'}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-foreground">
                          ₹{order.total_amount}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold capitalize ${statusCfg.bg} ${statusCfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-foreground-muted text-[11px]">
                          {format(new Date(order.created_at), 'MMM d, h:mm a')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* ═══ TOP PRODUCTS ═══ */}
        {data?.topProducts && data.topProducts.length > 0 && (
          <motion.div
            variants={item} initial="hidden" animate="show"
            className="rounded-xl p-5 bg-surface border border-border shadow-2xs"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-foreground">Top Performing Products</h2>
              <Link href="/admin/products" className="text-xs font-semibold text-primary hover:underline">
                All Products
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {data.topProducts.map((product, i) => (
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
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
