"use client";

import Link from 'next/link';
import { ChevronRight, Package, Truck, CheckCircle2, Clock, Repeat, ArrowRight } from 'lucide-react';
import type { OrderWithItems } from '@/lib/api/orders';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';

interface RecentOrdersProps {
  orders: OrderWithItems[];
  onReorder: (order: OrderWithItems) => void;
}

const STATUS_STYLES: Record<string, { bg: string; color: string; dot: string; icon: any; label: string }> = {
  'pending':          { bg: '#ffdcc7', color: '#774117', dot: '#d4712a', icon: Clock, label: 'Received' },
  'confirmed':        { bg: '#c2efac', color: '#042100', dot: '#3f6530', icon: CheckCircle2, label: 'Preparing' },
  'out_for_delivery': { bg: '#fff8e6', color: '#7d5200', dot: '#c78c2e', icon: Truck, label: 'Arriving Soon' },
  'delivered':        { bg: '#eaf4e2', color: '#2a4f1d', dot: '#3f6530', icon: CheckCircle2, label: 'Delivered' },
  'cancelled':        { bg: '#fef2f2', color: '#991b1b', dot: '#dc2626', icon: Package, label: 'Cancelled' },
};

export function RecentOrders({ orders, onReorder }: RecentOrdersProps) {
  const recentOrders = orders.slice(0, 3);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-black text-dark tracking-wide">Recent Orders</h2>
        {orders.length > 3 && (
          <Link href="/orders" className="text-primary text-sm font-bold flex items-center hover:opacity-80 transition-opacity">
            View All <ChevronRight className="w-4 h-4 ml-0.5" />
          </Link>
        )}
      </div>

      {recentOrders.length === 0 ? (
        <div className="bg-white rounded-[24px] p-6 border border-sand/50 text-center shadow-sm">
          <Package className="w-10 h-10 text-muted mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-bold text-dark mb-1">No Orders Yet</h3>
          <p className="text-sm text-muted mb-4 font-medium">Looks like you haven't placed any orders.</p>
          <Link href="/home">
            <Button size="sm" className="shadow-active">Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {recentOrders.map(order => {
            const style = STATUS_STYLES[order.status] || STATUS_STYLES['pending'];
            const Icon = style.icon;
            const itemCount = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
            const isCompleted = order.status === 'delivered' || order.status === 'cancelled';

            return (
              <div key={order.id} className="bg-white rounded-[20px] p-4 border border-sand/50 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: style.bg, color: style.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-dark text-sm mb-0.5">{style.label}</h3>
                      <p className="text-xs font-medium text-muted">
                        {format(new Date(order.created_at), 'MMM d, yyyy')} • {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-dark">₹{order.total_amount}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-1">
                  {isCompleted ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 h-9 text-xs shadow-sm bg-sand/10 border-sand"
                      onClick={() => onReorder(order)}
                    >
                      <Repeat className="w-3.5 h-3.5 mr-1.5" /> Reorder
                    </Button>
                  ) : (
                    <Link href={`/tracking/${order.id}`} className="flex-1">
                      <Button 
                        size="sm" 
                        className="w-full h-9 text-xs shadow-active bg-mint text-primary hover:bg-mint/80 border border-mint/50"
                      >
                        Track Order <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  )}
                  {isCompleted && (
                    <Link href={`/tracking/${order.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full h-9 text-xs shadow-sm">
                        View Details
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
