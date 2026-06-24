"use client";

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { Truck, Loader2, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function AdminDeliveryPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDeliveries = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, profiles:user_id(name, phone), order_items(*)')
        .neq('status', 'delivered')
        .neq('status', 'cancelled')
        .order('delivery_date', { ascending: true });
      setOrders(data ?? []);
      setIsLoading(false);
    };
    fetchDeliveries();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <Clock className="w-4 h-4" />;
      case 'out_for_delivery': return <Truck className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center pt-20 px-6" style={{ background: 'var(--color-surface)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-6 md:px-10 pt-6 pb-5" style={{ background: 'var(--color-surface-container-lowest)' }}>
        <h1 className="font-extrabold text-[24px] tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
          Deliveries
        </h1>
        <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-outline)' }}>
          {orders.length} active deliveries
        </p>
      </div>

      <div className="px-6 md:px-10 py-5">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <CheckCircle2 className="w-12 h-12 mb-4" style={{ color: 'var(--color-outline)' }} strokeWidth={1.5} />
            <p className="font-bold text-[18px]" style={{ color: 'var(--color-on-surface)' }}>All caught up!</p>
            <p className="text-[13px] mt-1" style={{ color: 'var(--color-outline)' }}>
              No pending deliveries.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order, i) => (
              <motion.div key={order.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
                className="rounded-[14px] p-5"
                style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(195,201,187,0.3)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-[14px]" style={{ color: 'var(--color-primary)' }}>{order.id}</p>
                    <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-on-surface)' }}>
                      {order.profiles?.name || 'Customer'}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase"
                    style={{
                      background: order.status === 'out_for_delivery' ? '#fff8e6' : '#c2efac',
                      color: order.status === 'out_for_delivery' ? '#7d5200' : '#042100',
                    }}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex flex-col gap-2 text-[12px]" style={{ color: 'var(--color-outline)' }}>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Order #{order.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{order.delivery_date ? format(new Date(order.delivery_date), 'MMM d, hh:mm a') : 'Today'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    <span>{order.order_items?.length || 0} items</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
