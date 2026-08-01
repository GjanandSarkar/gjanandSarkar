"use client";

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '@/lib/i18n';
import { getBusinessIntelligence, BIOrder, BIProfile, BISubscription } from '@/lib/api/analytics';
import { SimpleBarChart, HorizontalBarChart } from '@/components/admin/charts';
import { BarChart3, Loader2, TrendingUp, Package, ShoppingBag, Users, CalendarDays, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { isToday, isThisWeek, isThisMonth, format, subDays, startOfWeek } from 'date-fns';

export default function AdminAnalyticsPage() {
  const { t } = useTranslation();
  
  const [data, setData] = useState<{
    orders: BIOrder[];
    profiles: BIProfile[];
    subscriptions: BISubscription[];
  }>({ orders: [], profiles: [], subscriptions: [] });
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getBusinessIntelligence().then((res) => {
      setData(res);
      setIsLoading(false);
    });
  }, []);

  const metrics = useMemo(() => {
    const validOrders = data.orders.filter(o => o.status !== 'cancelled');
    
    // Revenue & Orders
    const totalRevenue = validOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const revenueToday = validOrders.filter(o => isToday(new Date(o.created_at))).reduce((sum, o) => sum + o.total_amount, 0);
    const revenueWeek = validOrders.filter(o => isThisWeek(new Date(o.created_at))).reduce((sum, o) => sum + o.total_amount, 0);
    const revenueMonth = validOrders.filter(o => isThisMonth(new Date(o.created_at))).reduce((sum, o) => sum + o.total_amount, 0);
    
    const ordersToday = validOrders.filter(o => isToday(new Date(o.created_at))).length;
    const ordersWeek = validOrders.filter(o => isThisWeek(new Date(o.created_at))).length;
    const ordersMonth = validOrders.filter(o => isThisMonth(new Date(o.created_at))).length;

    // Subscriptions
    const activeSubs = data.subscriptions.filter(s => s.status === 'active');
    const pausedSubs = data.subscriptions.filter(s => s.status === 'paused');
    const cancelledSubs = data.subscriptions.filter(s => s.status === 'cancelled');
    
    // Customers
    const totalCustomers = data.profiles.length;
    const orderCountsByUser = validOrders.reduce((acc, o) => {
      acc[o.user_id] = (acc[o.user_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const repeatCustomers = Object.values(orderCountsByUser).filter(count => count > 1).length;
    const newCustomers = totalCustomers - repeatCustomers;

    // Products
    const productSales = validOrders.reduce((acc, o) => {
      o.order_items?.forEach(item => {
        if (!item.products?.name) return;
        const name = item.products.name;
        if (!acc[name]) acc[name] = { revenue: 0, units: 0 };
        acc[name].revenue += item.price * item.quantity;
        acc[name].units += item.quantity;
      });
      return acc;
    }, {} as Record<string, { revenue: number, units: number }>);

    const productRanking = Object.entries(productSales)
      .map(([name, stats]) => ({ label: name, ...stats }))
      .sort((a, b) => b.units - a.units);

    // Charts - Daily Orders (Last 7 Days)
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(new Date(), 6 - i);
      return {
        label: format(d, 'EEE'),
        date: format(d, 'yyyy-MM-dd')
      };
    });
    
    const dailyOrdersChart = last7Days.map(day => ({
      label: day.label,
      value: validOrders.filter(o => format(new Date(o.created_at), 'yyyy-MM-dd') === day.date).length
    }));

    const dailyRevenueChart = last7Days.map(day => ({
      label: day.label,
      value: validOrders.filter(o => format(new Date(o.created_at), 'yyyy-MM-dd') === day.date).reduce((s, o) => s + o.total_amount, 0)
    }));

    // Charts - Product Performance
    const top5Products = productRanking.slice(0, 5).map(p => ({
      label: p.label,
      value: p.units,
      subLabel: `${p.units} units`
    }));
    
    const top5RevenueProducts = [...productRanking].sort((a, b) => b.revenue - a.revenue).slice(0, 5).map(p => ({
      label: p.label,
      value: p.revenue,
      subLabel: `${t('currency')}${p.revenue.toLocaleString()}`
    }));

    return {
      totalRevenue, revenueToday, revenueWeek, revenueMonth,
      totalOrders: validOrders.length, ordersToday, ordersWeek, ordersMonth,
      activeSubs: activeSubs.length, pausedSubs: pausedSubs.length, cancelledSubs: cancelledSubs.length,
      totalCustomers, repeatCustomers, newCustomers,
      dailyOrdersChart, dailyRevenueChart,
      top5Products, top5RevenueProducts
    };
  }, [data, t]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center pt-20 px-6" style={{ background: 'var(--color-surface)' }}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const StatBox = ({ title, value, sub }: { title: string, value: string | number, sub?: string }) => (
    <div className="bg-surface-container-lowest border border-sand/30 rounded-2xl p-5 flex flex-col gap-1 shadow-sm">
      <span className="text-muted text-xs font-semibold uppercase tracking-wider">{title}</span>
      <span className="text-on-surface text-2xl font-extrabold">{value}</span>
      {sub && <span className="text-muted text-[11px] mt-1">{sub}</span>}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-low pb-20">
      <div className="px-6 md:px-10 pt-8 pb-6 bg-surface-container-lowest border-b border-sand/30">
        <h1 className="font-extrabold text-[28px] tracking-tight text-on-surface flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Business Intelligence
        </h1>
        <p className="text-[14px] mt-1 text-muted">
          Real-time analytics and operational metrics
        </p>
      </div>

      <div className="px-6 md:px-10 py-6 flex flex-col gap-8 max-w-7xl mx-auto w-full">
        
        {/* 1. REVENUE ANALYTICS */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-on-surface">Revenue Analytics</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox title="Revenue Today" value={`${t('currency')}${metrics.revenueToday.toLocaleString()}`} />
            <StatBox title="This Week" value={`${t('currency')}${metrics.revenueWeek.toLocaleString()}`} />
            <StatBox title="This Month" value={`${t('currency')}${metrics.revenueMonth.toLocaleString()}`} />
            <StatBox title="Total Revenue" value={`${t('currency')}${metrics.totalRevenue.toLocaleString()}`} />
          </div>
          <div className="mt-4 bg-surface-container-lowest border border-sand/30 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-on-surface mb-2">Revenue Trend (Last 7 Days)</h3>
            <SimpleBarChart data={metrics.dailyRevenueChart} height={180} valuePrefix={t('currency')} />
          </div>
        </section>

        {/* 2. ORDER ANALYTICS */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-5 h-5 text-tertiary" />
            <h2 className="text-lg font-bold text-on-surface">Order Analytics</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox title="Orders Today" value={metrics.ordersToday} />
            <StatBox title="This Week" value={metrics.ordersWeek} />
            <StatBox title="This Month" value={metrics.ordersMonth} />
            <StatBox title="Total Orders" value={metrics.totalOrders} />
          </div>
          <div className="mt-4 bg-surface-container-lowest border border-sand/30 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-on-surface mb-2">Order Volume (Last 7 Days)</h3>
            <SimpleBarChart data={metrics.dailyOrdersChart} height={180} color="var(--color-tertiary)" />
          </div>
        </section>

        {/* 3. PRODUCT ANALYTICS */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-on-surface">Product Performance</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest border border-sand/30 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-on-surface mb-6">Top Selling (Units)</h3>
              <HorizontalBarChart data={metrics.top5Products} color="#f97316" />
            </div>
            <div className="bg-surface-container-lowest border border-sand/30 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-on-surface mb-6">Highest Revenue</h3>
              <HorizontalBarChart data={metrics.top5RevenueProducts} color="#f97316" valuePrefix={t('currency')} />
            </div>
          </div>
        </section>

        {/* 4. CUSTOMER ANALYTICS */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-on-surface">Customer Analytics</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatBox title="Total Customers" value={metrics.totalCustomers} />
            <StatBox title="Repeat Customers" value={metrics.repeatCustomers} sub={`${((metrics.repeatCustomers / (metrics.totalCustomers || 1)) * 100).toFixed(1)}% of base`} />
            <StatBox title="New Customers" value={metrics.newCustomers} sub="1 order only" />
          </div>
        </section>

        {/* 5. SUBSCRIPTION ANALYTICS */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-bold text-on-surface">Subscription Analytics</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatBox title="Active Subscriptions" value={metrics.activeSubs} sub="Generating recurring revenue" />
            <StatBox title="Paused" value={metrics.pausedSubs} />
            <StatBox title="Cancelled" value={metrics.cancelledSubs} sub="Churned subscriptions" />
          </div>
        </section>

      </div>
    </div>
  );
}
