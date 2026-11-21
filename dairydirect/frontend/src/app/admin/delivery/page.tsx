"use client";

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { Truck, Loader2, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTable } from '@/components/admin/AdminTable';

export default function AdminDeliveryPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDeliveries = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*, profiles:user_id(name, phone), order_items(*)')
      .neq('status', 'delivered')
      .neq('status', 'cancelled')
      .order('delivery_date', { ascending: true });
    setOrders(data ?? []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'out_for_delivery':
        return { bg: '#fff8e6', text: '#b45309', label: 'Out for Delivery' };
      case 'confirmed':
        return { bg: '#dcfce7', text: '#15803d', label: 'Confirmed' };
      default:
        return { bg: '#f1f5f9', text: '#475569', label: status.replace(/_/g, ' ') };
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Standard Admin Header */}
      <AdminHeader
        title="Active Deliveries"
        subtitle={`${orders.length} shipments scheduled for dispatch & delivery`}
        onRefresh={fetchDeliveries}
        isRefreshing={isLoading}
      />

      <div className="px-6 md:px-10 py-6">
        <AdminTable
          columns={[
            { header: 'Order #' },
            { header: 'Customer' },
            { header: 'Contact' },
            { header: 'Delivery Schedule' },
            { header: 'Package Items' },
            { header: 'Status', align: 'right' },
          ]}
          isLoading={isLoading}
          isEmpty={!isLoading && orders.length === 0}
          emptyIcon={Truck}
          emptyTitle="All caught up!"
          emptyDescription="There are no active or pending deliveries requiring dispatch right now."
        >
          {orders.map((order) => {
            const ss = getStatusStyle(order.status);
            return (
              <tr
                key={order.id}
                className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
                onClick={() => window.location.href = `/admin/orders?id=${order.id}`}
              >
                <td className="px-5 py-3.5 font-bold text-[13px] text-primary">
                  {order.id?.slice(0, 8).toUpperCase()}
                </td>
                <td className="px-5 py-3.5 text-[13px] font-semibold text-foreground">
                  {order.profiles?.name || 'Customer'}
                </td>
                <td className="px-5 py-3.5 text-xs text-foreground-muted">
                  {order.profiles?.phone ? `+91 ${order.profiles.phone}` : '—'}
                </td>
                <td className="px-5 py-3.5 text-xs text-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-foreground-muted" />
                    <span>{order.delivery_date ? format(new Date(order.delivery_date), 'MMM d, h:mm a') : 'Scheduled Today'}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-xs font-semibold text-foreground">
                  {order.order_items?.length || 0} items
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize"
                    style={{ background: ss.bg, color: ss.text }}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>{ss.label}</span>
                  </span>
                </td>
              </tr>
            );
          })}
        </AdminTable>
      </div>
    </div>
  );
}
