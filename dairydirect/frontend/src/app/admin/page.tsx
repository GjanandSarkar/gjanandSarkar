"use client";

import { useStore } from '@/store/useStore';
import { useTranslation } from '@/lib/i18n';
import { useState, useEffect } from 'react';
import { getBusinessIntelligence, BIOrder } from '@/lib/api/analytics';
import {
  TrendingUp, ShoppingBag, Truck, Package, ArrowRight,
  Clock, CheckCircle2, AlertCircle, BarChart3, Leaf, Loader2
} from 'lucide-react';
import { format, isToday } from 'date-fns';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
};
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }
};

const STATUS_CONFIG: Record<string, { bg: string; color: string; dot: string; icon: any }> = {
  'Confirmed':        { bg: '#c2efac', color: '#042100', dot: '#3f6530', icon: CheckCircle2 },
  'Preparing':        { bg: '#bfedce', color: '#002111', dot: '#3b644c', icon: Package },
  'out_for_delivery': { bg: '#fff8e6', color: '#7d5200', dot: '#c78c2e', icon: Truck },
  'delivered':        { bg: '#eaf4e2', color: '#2a4f1d', dot: '#3f6530', icon: CheckCircle2 },
  'pending':          { bg: '#ffdcc7', color: '#774117', dot: '#d4712a', icon: Clock },
  'cancelled':        { bg: '#e3e3dc', color: '#43493e', dot: '#73796d', icon: AlertCircle },
};

export default function AdminDashboard() {
  const { t } = useTranslation();
  const user = useStore(state => state.user);

  const [orders, setOrders] = useState<BIOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getBusinessIntelligence().then((data) => {
      setOrders(data.orders);
      setIsLoading(false);
    });
  }, []);

  const totalRevenue = orders.reduce((s, o) => s + (o.status !== 'cancelled' ? o.total_amount : 0), 0);
  const revenueToday = orders.filter(o => isToday(new Date(o.created_at))).reduce((s, o) => s + (o.status !== 'cancelled' ? o.total_amount : 0), 0);
  
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
  const outForDelivery = orders.filter(o => o.status === 'out_for_delivery').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
  
  const recentOrders = [...orders].slice(0, 8);

  const stats = [
    {
      label: 'Revenue Today',
      value: `${t('currency')}${revenueToday.toLocaleString()}`,
      sub: `Lifetime: ${t('currency')}${totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'var(--color-primary)',
      bg: 'var(--color-primary-fixed)',
      trend: 'Today',
    },
    {
      label: 'Pending',
      value: pendingOrders.toString(),
      sub: 'Action required',
      icon: Clock,
      color: '#d4712a',
      bg: '#ffdcc7',
      trend: 'Alert',
    },
    {
      label: 'Confirmed',
      value: confirmedOrders.toString(),
      sub: 'Ready for fulfillment',
      icon: CheckCircle2,
      color: '#3f6530',
      bg: '#c2efac',
      trend: 'Active',
    },
    {
      label: 'Out For Delivery',
      value: outForDelivery.toString(),
      sub: 'In transit',
      icon: Truck,
      color: '#c78c2e',
      bg: '#fff8e6',
      trend: 'Moving',
    },
    {
      label: 'Delivered',
      value: deliveredOrders.toString(),
      sub: 'Successfully completed',
      icon: Package,
      color: '#2a4f1d',
      bg: '#eaf4e2',
      trend: 'Done',
    },
    {
      label: 'Cancelled',
      value: cancelledOrders.toString(),
      sub: 'Failed or rejected',
      icon: AlertCircle,
      color: '#43493e',
      bg: '#e3e3dc',
      trend: 'Alert',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* ═══ HEADER ═══ */}
      <div className="px-6 md:px-10 pt-7 pb-6 flex items-center justify-between"
        style={{ background: 'var(--color-surface-container-lowest)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Leaf className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} strokeWidth={2.5} />
            <span className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--color-primary)' }}>Admin Panel</span>
          </div>
          <h1 className="font-extrabold text-[26px] tracking-tight"
            style={{ color: 'var(--color-on-surface)' }}>
            Good morning, {user?.name?.split(' ')[0] || 'Admin'}
          </h1>
          <p className="text-[14px] mt-0.5" style={{ color: 'var(--color-outline)' }}>
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <Link href="/admin/analytics" className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-primary text-on-primary transition-opacity hover:opacity-90">
          <BarChart3 className="w-4 h-4" />
          <span className="text-[13px] font-semibold">Business Intelligence</span>
        </Link>
      </div>

      <div className="px-6 md:px-10 py-6 flex flex-col gap-6">
        {/* ═══ STAT CARDS ═══ */}
        <div>
          <h2 className="font-bold text-[16px] mb-4 text-on-surface">Operational Health</h2>
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-3 gap-4"
            variants={container} initial="hidden" animate="show">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={i} variants={item}
                  className="rounded-[16px] p-5 flex flex-col gap-3"
                  style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(195,201,187,0.3)' }}>
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-[10px] flex items-center justify-center"
                      style={{ background: stat.bg, color: stat.color }}>
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <span className="text-[11px] font-bold px-2 py-1 rounded-full"
                      style={{ background: '#eaf4e2', color: '#3f6530' }}>
                      {stat.trend}
                    </span>
                  </div>
                  <div>
                    <p className="font-extrabold text-[22px] leading-tight tracking-tight"
                      style={{ color: 'var(--color-on-surface)' }}>{stat.value}</p>
                    <p className="text-[12px] font-semibold leading-tight mt-0.5"
                      style={{ color: 'var(--color-on-surface)' }}>{stat.label}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-outline)' }}>
                      {stat.sub}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* ═══ RECENT ORDERS ═══ */}
        <div className="rounded-[16px] overflow-hidden" 
          style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(195,201,187,0.3)' }}>
          <div className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid rgba(195, 201, 187, 0.3)' }}>
            <h2 className="font-bold text-[16px]" style={{ color: 'var(--color-on-surface)' }}>
              Recent Orders
            </h2>
            <Link href="/admin/orders"
              className="flex items-center gap-1 text-[12px] font-semibold"
              style={{ color: 'var(--color-primary)' }}>
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'var(--color-surface-container-low)' }}>
                <ShoppingBag className="w-6 h-6" style={{ color: 'var(--color-outline)' }} strokeWidth={1.5} />
              </div>
              <p className="font-semibold text-[15px]" style={{ color: 'var(--color-on-surface)' }}>
                No orders yet
              </p>
              <p className="text-[13px] mt-1" style={{ color: 'var(--color-outline)' }}>
                Customer orders will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'var(--color-surface-container-low)' }}>
                    {['Order ID', 'Total', 'Status', 'Date'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, i) => {
                    const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['pending'];
                    return (
                      <tr key={order.id}
                        className="transition-all hover:bg-black/5"
                        style={{ borderTop: i > 0 ? '1px solid rgba(195, 201, 187, 0.25)' : undefined }}>
                        <td className="px-5 py-4">
                          <span className="font-bold text-[13px]" style={{ color: 'var(--color-primary)' }}>
                            {order.id}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold text-[13px] text-on-surface">
                          {t('currency')}{order.total_amount}
                        </td>
                        <td className="px-5 py-4">
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[6px]"
                            style={{ background: statusCfg.bg }}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusCfg.dot }} />
                            <span className="text-[11px] font-bold capitalize" style={{ color: statusCfg.color }}>
                              {order.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-[12px] font-medium text-muted">
                          {format(new Date(order.created_at), 'MMM d, h:mm a')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
