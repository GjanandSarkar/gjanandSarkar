"use client";

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { format } from 'date-fns';
import { ShoppingBag, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllOrders, updateOrderStatus } from '@/lib/api/orders';
import type { OrderWithItems } from '@/lib/api/orders';

const STATUS_STYLES: Record<string, { bg: string; color: string; dot: string }> = {
  'pending':          { bg: '#ffdcc7', color: '#774117', dot: '#d4712a' },
  'confirmed':        { bg: '#c2efac', color: '#042100', dot: '#3f6530' },
  'out_for_delivery': { bg: '#fff8e6', color: '#7d5200', dot: '#c78c2e' },
  'delivered':        { bg: '#eaf4e2', color: '#2a4f1d', dot: '#3f6530' },
  'cancelled':        { bg: '#e3e3dc', color: '#43493e', dot: '#73796d' },
};

const ORDER_STATUSES: OrderWithItems['status'][] = ['pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    getAllOrders().then(data => {
      setOrders(data);
      setIsLoading(false);
    });
  }, []);

  const handleUpdateStatus = async (orderId: string, status: OrderWithItems['status'], userId: string | null) => {
    setIsUpdating(orderId);
    const result = await updateOrderStatus(orderId, status, userId || undefined);
    if (result.success) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    }
    setIsUpdating(null);
  };

  const filtered = activeTab === 'all' ? orders : orders.filter(o => o.status === activeTab);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center pt-20 px-6" style={{ background: 'var(--color-surface)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-30 glass-surface">
        <div className="px-6 md:px-10 pt-6 pb-0">
          <h1 className="font-extrabold text-[24px] tracking-tight mb-4"
            style={{ color: 'var(--color-on-surface)' }}>
            Orders
            <span className="ml-2 text-[15px] font-normal" style={{ color: 'var(--color-outline)' }}>
              ({filtered.length})
            </span>
          </h1>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-6 px-6 pb-1">
            {['all', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="whitespace-nowrap px-4 py-2 rounded-full text-[12px] font-semibold transition-all duration-200 shrink-0 capitalize"
                style={activeTab === tab ? {
                  background: 'var(--cta-gradient)',
                  color: 'white',
                  boxShadow: '0 3px 10px rgba(12, 60, 38, 0.25)',
                } : {
                  background: 'var(--color-surface-container-low)',
                  color: 'var(--color-on-surface-variant)',
                }}>
                {tab.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="h-px mt-2 opacity-25" style={{ background: 'var(--color-outline-variant)' }} />
      </div>

      <div className="px-6 md:px-10 py-5 flex flex-col gap-3">
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'var(--color-surface-container-low)' }}>
                <ShoppingBag className="w-7 h-7" style={{ color: 'var(--color-outline)' }} strokeWidth={1.5} />
              </div>
              <p className="font-bold text-[18px]" style={{ color: 'var(--color-on-surface)' }}>No orders</p>
              <p className="text-[13px] mt-1" style={{ color: 'var(--color-outline)' }}>
                Orders will appear when customers place them.
              </p>
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col gap-3">
              {filtered.map((order, i) => {
                const statusStyle = STATUS_STYLES[order.status] || STATUS_STYLES['cancelled'];
                const isExpanded = expandedId === order.id;
                return (
                  <motion.div key={order.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: i * 0.04 }}
                    className="rounded-[16px] overflow-hidden"
                    style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(195,201,187,0.3)' }}>

                    <div className="flex items-center justify-between px-5 py-4 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-bold text-[14px]" style={{ color: 'var(--color-primary)' }}>{order.id}</p>
                          <p className="text-[11px]" style={{ color: 'var(--color-outline)' }}>
                            {order.profiles?.name || 'Customer'} · {format(new Date(order.created_at), 'MMM d, hh:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-[15px]" style={{ color: 'var(--color-primary)' }}>
                          {t('currency')}{order.total_amount}
                        </span>
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
                          style={{ background: statusStyle.bg, color: statusStyle.color }}>
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusStyle.dot }} />
                          <span className="text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <ChevronDown className="w-4 h-4 shrink-0 transition-transform duration-200"
                          style={{
                            color: 'var(--color-outline)',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          }} />
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          style={{ overflow: 'hidden', borderTop: '1px solid rgba(195, 201, 187, 0.3)' }}>
                          <div className="px-5 py-4">
                            <div className="rounded-[10px] p-3 mb-4"
                              style={{ background: 'var(--color-surface-container-low)' }}>
                              {order.order_items?.map((item, j) => {
                                const pName = item.product_name || item.products?.name || (item.product_id ? `Product #${item.product_id.slice(0, 6)}` : 'Dairy Product');
                                const pWeight = item.weight || item.product_variants?.weight || '';
                                return (
                                  <div key={j} className="flex justify-between text-[13px] py-1"
                                    style={{ borderTop: j > 0 ? '1px solid rgba(195, 201, 187, 0.25)' : undefined }}>
                                    <span style={{ color: 'var(--color-on-surface-variant)' }}>
                                      {item.quantity}× {pName}{pWeight ? ` (${pWeight})` : ''}
                                    </span>
                                    <span className="font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                                      {t('currency')}{item.price * item.quantity}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="relative">
                              {isUpdating === order.id && (
                                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                </div>
                              )}
                              <p className="text-[11px] font-bold uppercase tracking-wider mb-4"
                                style={{ color: 'var(--color-outline)' }}>Order Timeline & Status</p>
                              
                              <div className="flex items-center gap-2 mb-6 w-full max-w-xl">
                                {['pending', 'confirmed', 'out_for_delivery', 'delivered'].map((status, idx, arr) => {
                                  const isActive = order.status === status || arr.indexOf(order.status as any) > idx && order.status !== 'cancelled';
                                  const isCurrent = order.status === status;
                                  return (
                                    <div key={status} className="flex items-center flex-1 last:flex-none">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-primary text-white' : 'bg-surface text-outline border border-outline/30'}`}
                                           style={{ boxShadow: isCurrent ? '0 0 0 3px rgba(12, 60, 38, 0.20)' : 'none' }}>
                                        {idx + 1}
                                      </div>
                                      {idx < arr.length - 1 && (
                                        <div className={`flex-1 h-1 mx-2 rounded-full transition-colors ${isActive && !isCurrent ? 'bg-primary' : 'bg-outline/20'}`} />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {ORDER_STATUSES.map(status => {
                                  const sStyle = STATUS_STYLES[status];
                                  const isCurrentStatus = order.status === status;
                                  return (
                                    <button key={status}
                                      onClick={() => handleUpdateStatus(order.id, status, order.user_id)}
                                      disabled={isUpdating === order.id}
                                      className="px-3 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95 disabled:opacity-50"
                                      style={isCurrentStatus ? {
                                        background: sStyle.bg,
                                        color: sStyle.color,
                                        outline: `2px solid ${sStyle.dot}`,
                                      } : {
                                        background: 'var(--color-surface-container)',
                                        color: 'var(--color-on-surface-variant)',
                                      }}>
                                      <span className="capitalize">{status.replace(/_/g, ' ')}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
