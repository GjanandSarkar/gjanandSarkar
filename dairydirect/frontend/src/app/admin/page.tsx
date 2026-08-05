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

const STATUS_CONFIG: Record<string, { bg: string; color: string; dot: string; icon: any }> = {
  confirmed:        { bg: '#c2efac', color: '#042100', dot: '#3f6530', icon: CheckCircle2 },
  out_for_delivery: { bg: '#fff8e6', color: '#7d5200', dot: '#c78c2e', icon: Truck },
  delivered:        { bg: '#eaf4e2', color: '#2a4f1d', dot: '#3f6530', icon: CheckCircle2 },
  pending:          { bg: '#ffdcc7', color: '#774117', dot: '#d4712a', icon: Clock },
  cancelled:        { bg: '#e3e3dc', color: '#43493e', dot: '#73796d', icon: AlertCircle },
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
      color: '#2d5a27',
      bg: '#c2efac',
      trend: '+',
    },
    {
      label: 'Total Orders',
      value: data.overview.total_orders || '0',
      sub: `${data.overview.delivered_orders || '0'} delivered`,
      icon: ShoppingBag,
      color: '#4a6fa5',
      bg: '#dce8ff',
      trend: data.overview.total_orders,
    },
    {
      label: 'Pending Orders',
      value: data.overview.pending_orders || '0',
      sub: 'Needs attention',
      icon: Clock,
      color: '#774117',
      bg: '#ffdcc7',
      trend: 'Alert',
    },
    {
      label: 'Active Customers',
      value: data.overview.unique_customers || '0',
      sub: 'Unique buyers',
      icon: Users,
      color: '#6b21a8',
      bg: '#f3e8ff',
      trend: 'New',
    },
    {
      label: 'Avg Order Value',
      value: `₹${parseFloat(data.overview.avg_order_value || '0').toFixed(0)}`,
      sub: 'Per order',
      icon: TrendingUp,
      color: '#065f46',
      bg: '#d1fae5',
      trend: '+',
    },
    {
      label: 'Low Stock Alerts',
      value: data.inventory.out_of_stock || '0',
      sub: `${data.inventory.low_stock || '0'} low stock`,
      icon: AlertTriangle,
      color: '#92400e',
      bg: '#fef3c7',
      trend: 'Alert',
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
        <p className="text-sm font-medium" style={{ color: 'var(--color-outline)' }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-background)' }}>
      {/* ═══ HEADER ═══ */}
      <div
        className="px-6 md:px-10 pt-8 pb-6"
        style={{ background: 'var(--color-surface-container-lowest)', borderBottom: '1px solid rgba(195,201,187,0.2)' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Leaf className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} strokeWidth={2.5} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-primary)' }}>
                Admin Dashboard
              </span>
            </div>
            <h1 className="font-extrabold text-[28px] tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
              {greeting()}, {user?.name?.split(' ')[0] || 'Admin'} 👋
            </h1>
            <p className="text-[13px] mt-1" style={{ color: 'var(--color-outline)' }}>
              {format(new Date(), 'EEEE, MMMM d, yyyy')} · Last updated {format(lastRefreshed, 'h:mm a')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Period Toggle */}
            <div className="flex rounded-[10px] overflow-hidden border" style={{ borderColor: 'rgba(195,201,187,0.4)' }}>
              {(['7d', '30d'] as const).map((p) => (
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
              onClick={fetchData}
              className="p-2 rounded-[10px] transition-all hover:opacity-80"
              style={{ background: 'var(--color-surface-container-low)' }}
            >
              <RefreshCw className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
            </button>

            <Link
              href="/admin/reports"
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-[10px] transition-opacity hover:opacity-90 text-[13px] font-semibold"
              style={{ background: 'var(--color-primary)', color: '#fff' }}
            >
              <BarChart3 className="w-4 h-4" />
              Full Reports
            </Link>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-10 py-6 flex flex-col gap-6">
        {/* ═══ STAT CARDS ═══ */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
          variants={container} initial="hidden" animate="show"
        >
          {statsCards.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                variants={item}
                className="rounded-[16px] p-4 flex flex-col gap-2 cursor-default hover:shadow-md transition-shadow"
                style={{
                  background: 'var(--color-surface-container-lowest)',
                  border: '1px solid rgba(195,201,187,0.25)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                    style={{ background: stat.bg, color: stat.color }}
                  >
                    <Icon className="w-4.5 h-4.5" strokeWidth={2} />
                  </div>
                </div>
                <div>
                  <p className="font-extrabold text-[20px] leading-tight" style={{ color: 'var(--color-on-surface)' }}>
                    {stat.value}
                  </p>
                  <p className="text-[11px] font-semibold mt-0.5" style={{ color: 'var(--color-on-surface)' }}>
                    {stat.label}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-outline)' }}>
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
            className="lg:col-span-2 rounded-[16px] p-5"
            style={{
              background: 'var(--color-surface-container-lowest)',
              border: '1px solid rgba(195,201,187,0.25)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[15px]" style={{ color: 'var(--color-on-surface)' }}>
                Revenue Trend
              </h2>
              <span className="text-[11px] font-medium px-2 py-1 rounded-full" style={{ background: '#eaf4e2', color: '#3f6530' }}>
                Last {period === '7d' ? '7' : '14'} days
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data?.daily || []} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4a8c3f" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4a8c3f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(195,201,187,0.2)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#7a8870' }} tickFormatter={(d) => d ? format(new Date(String(d)), 'MMM d') : ''} />
                <YAxis tick={{ fontSize: 10, fill: '#7a8870' }} tickFormatter={(v) => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid rgba(195,201,187,0.4)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => [`₹${parseFloat(v).toLocaleString('en-IN')}`, 'Revenue']}
                  labelFormatter={(l) => l ? format(new Date(String(l)), 'MMM d, yyyy') : ''}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4a8c3f" strokeWidth={2} fill="url(#revenueGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Quick Navigation */}
          <motion.div
            variants={item} initial="hidden" animate="show"
            className="rounded-[16px] p-5 flex flex-col gap-3"
            style={{
              background: 'var(--color-surface-container-lowest)',
              border: '1px solid rgba(195,201,187,0.25)',
            }}
          >
            <h2 className="font-bold text-[15px]" style={{ color: 'var(--color-on-surface)' }}>Quick Actions</h2>
            {[
              { label: 'Manage Orders', href: '/admin/orders', color: '#c2efac', text: '#2d5a27' },
              { label: 'Inventory & Stock', href: '/admin/inventory', color: '#dce8ff', text: '#4a6fa5' },
              { label: 'Return Requests', href: '/admin/returns', color: '#ffdcc7', text: '#774117' },
              { label: 'All Products', href: '/admin/products', color: '#f3e8ff', text: '#6b21a8' },
              { label: 'Customers', href: '/admin/customers', color: '#d1fae5', text: '#065f46' },
              { label: 'Business Settings', href: '/admin/settings', color: '#fef3c7', text: '#92400e' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between px-3 py-2.5 rounded-[10px] transition-opacity hover:opacity-80"
                style={{ background: link.color }}
              >
                <span className="text-[13px] font-semibold" style={{ color: link.text }}>{link.label}</span>
                <ArrowRight className="w-3.5 h-3.5" style={{ color: link.text }} />
              </Link>
            ))}
          </motion.div>
        </div>

        {/* ═══ RECENT ORDERS ═══ */}
        <motion.div
          variants={item} initial="hidden" animate="show"
          className="rounded-[16px] overflow-hidden"
          style={{
            background: 'var(--color-surface-container-lowest)',
            border: '1px solid rgba(195,201,187,0.25)',
          }}
        >
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(195,201,187,0.2)' }}>
            <h2 className="font-bold text-[15px]" style={{ color: 'var(--color-on-surface)' }}>Recent Orders</h2>
            <Link href="/admin/orders" className="flex items-center gap-1 text-[12px] font-semibold" style={{ color: 'var(--color-primary)' }}>
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!data?.recentOrders?.length ? (
            <div className="flex flex-col items-center justify-center py-16">
              <ShoppingBag className="w-8 h-8 mb-3" style={{ color: 'var(--color-outline)' }} strokeWidth={1.5} />
              <p className="font-semibold" style={{ color: 'var(--color-on-surface)' }}>No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'var(--color-surface-container-low)' }}>
                    {['Order #', 'Customer', 'Total', 'Status', 'Date'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-outline)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order, i) => {
                    const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['pending'];
                    const StatusIcon = statusCfg.icon;
                    return (
                      <tr
                        key={order.id}
                        className="transition-all hover:bg-black/[0.02] cursor-pointer"
                        style={{ borderTop: i > 0 ? '1px solid rgba(195,201,187,0.15)' : undefined }}
                        onClick={() => window.location.href = `/admin/orders?id=${order.id}`}
                      >
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-[12px]" style={{ color: 'var(--color-primary)' }}>
                            {order.order_number || order.id.slice(0, 8).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-[12px] font-medium" style={{ color: 'var(--color-on-surface)' }}>
                          {order.customer_name || '—'}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-[13px]" style={{ color: 'var(--color-on-surface)' }}>
                          ₹{order.total_amount}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[6px]" style={{ background: statusCfg.bg }}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusCfg.dot }} />
                            <span className="text-[10px] font-bold capitalize" style={{ color: statusCfg.color }}>
                              {order.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-[11px]" style={{ color: 'var(--color-outline)' }}>
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
            className="rounded-[16px] p-5"
            style={{
              background: 'var(--color-surface-container-lowest)',
              border: '1px solid rgba(195,201,187,0.25)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[15px]" style={{ color: 'var(--color-on-surface)' }}>Top Products</h2>
              <Link href="/admin/products" className="text-[12px] font-semibold" style={{ color: 'var(--color-primary)' }}>
                All Products
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {data.topProducts.map((product, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                      style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-primary)' }}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                        {product.name} ({product.weight})
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--color-outline)' }}>
                        {product.total_sold} units sold
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-[13px]" style={{ color: 'var(--color-primary)' }}>
                    ₹{parseFloat(product.revenue as any).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
