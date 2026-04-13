"use client";

import { useStore } from '@/store/useStore';
import { useTranslation } from '@/lib/i18n';
import { useState, useEffect } from 'react';
import { getAllOrders } from '@/lib/api/orders';
import { getProducts } from '@/lib/api/products';
import type { OrderWithItems } from '@/lib/api/orders';
import type { ProductWithVariants } from '@/lib/api/products';
import {
  TrendingUp, ShoppingBag, Truck, Package, ArrowRight,
  Clock, CheckCircle2, AlertCircle, BarChart3, Leaf, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
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
  'Out for Delivery': { bg: '#fff8e6', color: '#7d5200', dot: '#c78c2e', icon: Truck },
  'Delivered':        { bg: '#eaf4e2', color: '#2a4f1d', dot: '#3f6530', icon: CheckCircle2 },
  'Pending':          { bg: '#ffdcc7', color: '#774117', dot: '#d4712a', icon: Clock },
  'Cancelled':        { bg: '#e3e3dc', color: '#43493e', dot: '#73796d', icon: AlertCircle },
};

export default function AdminDashboard() {
  const { t } = useTranslation();
  const user = useStore(state => state.user);

  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [productsCount, setProductsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAllOrders(),
      getProducts({ activeOnly: false }),
    ]).then(([ordersData, productsData]) => {
      setOrders(ordersData);
      setProductsCount(productsData.length);
      setIsLoading(false);
    });
  }, []);

  const totalRevenue = orders.reduce((s, o) => s + (o.status !== 'Cancelled' ? o.total : 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Confirmed').length;
  const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;
  const recentOrders = [...orders].slice(0, 8);

  const stats = [
    {
      label: 'Total Revenue',
      value: `${t('currency')}${totalRevenue.toLocaleString()}`,
      sub: `${orders.length} orders total`,
      icon: TrendingUp,
      color: 'var(--color-primary)',
      bg: 'var(--color-primary-fixed)',
      trend: '+12%',
    },
    {
      label: 'Active Orders',
      value: pendingOrders.toString(),
      sub: 'Pending & Confirmed',
      icon: ShoppingBag,
      color: '#c78c2e',
      bg: '#fff8e6',
      trend: '+3',
    },
    {
      label: 'Delivered Today',
      value: deliveredOrders.toString(),
      sub: 'Successfully completed',
      icon: Truck,
      color: 'var(--color-tertiary)',
      bg: 'var(--color-tertiary-fixed)',
      trend: '+8',
    },
    {
      label: 'Products',
      value: productsCount.toString(),
      sub: 'In catalogue',
      icon: Package,
      color: '#4a90d9',
      bg: '#e8f4fd',
      trend: 'Active',
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
        <div className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-[12px]"
          style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)' }}>
          <BarChart3 className="w-4 h-4" />
          <span className="text-[13px] font-semibold">Live Dashboard</span>
        </div>
      </div>

      <div className="px-6 md:px-10 py-6 flex flex-col gap-6">

        {/* ═══ STAT CARDS ═══ */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
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
                    {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: 'var(--color-outline)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, i) => {
                    const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['Pending'];
                    return (
                      <tr key={order.id}
                        className="transition-all hover:bg-black/5"
                        style={{ borderTop: i > 0 ? '1px solid rgba(195, 201, 187, 0.25)' : undefined }}>
                        <td className="px-5 py-4">
                          <span className="font-bold text-[13px]" style={{ color: 'var(--color-primary)' }}>
                            {order.id}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-[13px]" style={{ color: 'var(--color-on-surface)' }}>
                            {order.customer_name || 'Customer'}
                          </p>
                          <p className="text-[11px]" style={{ color: 'var(--color-outline)' }}>
                            {order.customer_phone ? `+91 ${order.customer_phone}` : '—'}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-[12px] max-w-[180px] truncate" style={{ color: 'var(--color-on-surface-variant)' }}>
                            {order.order_items.map(i => `${i.quantity}× ${i.product_name}`).join(', ')}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-extrabold text-[14px]" style={{ color: 'var(--color-primary)' }}>
                            {t('currency')}{order.total}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 w-fit px-2.5 py-1.5 rounded-full"
                            style={{ background: statusCfg.bg, color: statusCfg.color }}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusCfg.dot }} />
                            <span className="text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">
                              {order.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-[12px]" style={{ color: 'var(--color-outline)' }}>
                            {format(new Date(order.created_at), 'MMM d, hh:mm a')}
                          </span>
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
