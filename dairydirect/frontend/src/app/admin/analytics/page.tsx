"use client";

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { BarChart3, Loader2, TrendingUp, Package, ShoppingBag, Truck, Clock, Repeat } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminAnalyticsPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
    avgOrderValue: 0,
    activeSubscribers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, status');

      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      const { count: subsCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const totalRevenue = orders?.reduce((sum: number, o: any) => sum + (o.status !== 'cancelled' ? o.total_amount : 0), 0) || 0;
      const deliveredOrders = orders?.filter((o: any) => o.status === 'delivered').length || 0;
      const pendingOrders = orders?.filter((o: any) => o.status === 'pending' || o.status === 'confirmed').length || 0;

      setStats({
        totalRevenue,
        totalOrders: orders?.length || 0,
        totalProducts: productsCount || 0,
        deliveredOrders,
        pendingOrders,
        avgOrderValue: orders?.length ? totalRevenue / orders.length : 0,
        activeSubscribers: subsCount || 0,
      });
      setIsLoading(false);
    };
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center pt-20 px-6" style={{ background: 'var(--color-surface)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  const cards = [
    { label: 'Total Revenue', value: `${t('currency')}${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: '#3f6530', bg: '#eaf4e2' },
    { label: 'Total Orders', value: stats.totalOrders.toString(), icon: ShoppingBag, color: '#4a90d9', bg: '#e8f4fd' },
    { label: 'Active Subscribers', value: stats.activeSubscribers.toString(), icon: Repeat, color: '#d4712a', bg: '#ffdcc7' },
    { label: 'Products', value: stats.totalProducts.toString(), icon: Package, color: '#c78c2e', bg: '#fff8e6' },
    { label: 'Avg Order Value', value: `${t('currency')}${stats.avgOrderValue.toFixed(0)}`, icon: BarChart3, color: '#7d5200', bg: '#fff8e6' },
    { label: 'Delivered / Pending', value: `${stats.deliveredOrders} / ${stats.pendingOrders}`, icon: Truck, color: '#2a4f1d', bg: '#eaf4e2' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-6 md:px-10 pt-6 pb-5" style={{ background: 'var(--color-surface-container-lowest)' }}>
        <h1 className="font-extrabold text-[24px] tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
          Analytics
        </h1>
        <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-outline)' }}>
          Business overview and metrics
        </p>
      </div>

      <div className="px-6 md:px-10 py-6">
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden" animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.06 } }
          }}>
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div key={i}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="rounded-[16px] p-5 flex flex-col gap-3"
                style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(195,201,187,0.3)' }}>
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-[10px] flex items-center justify-center"
                    style={{ background: card.bg, color: card.color }}>
                    <Icon className="w-5 h-5" strokeWidth={2} />
                  </div>
                </div>
                <div>
                  <p className="font-extrabold text-[22px] leading-tight" style={{ color: 'var(--color-on-surface)' }}>
                    {card.value}
                  </p>
                  <p className="text-[12px] font-semibold mt-0.5" style={{ color: 'var(--color-outline)' }}>
                    {card.label}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
