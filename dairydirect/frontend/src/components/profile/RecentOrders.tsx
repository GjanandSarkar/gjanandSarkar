"use client";

import Link from 'next/link';
import { ChevronRight, Package, Truck, CheckCircle2, Clock, Repeat, ArrowRight } from 'lucide-react';
import type { OrderWithItems } from '@/lib/api/orders';
import { format } from 'date-fns';

interface RecentOrdersProps {
  orders: OrderWithItems[];
  onReorder: (order: OrderWithItems) => void;
  hideHeader?: boolean;
}

<<<<<<< HEAD
const STATUS_STYLES: Record<string, { bg: string; color: string; dot: string; icon: any; label: string }> = {
  'pending':          { bg: '#ffdcc7', color: 'var(--warning)', dot: '#d4712a', icon: Clock, label: 'Received' },
  'confirmed':        { bg: '#c2efac', color: '#042100', dot: '#3f6530', icon: CheckCircle2, label: 'Preparing' },
  'out_for_delivery': { bg: '#fff8e6', color: 'var(--warning)', dot: '#c78c2e', icon: Truck, label: 'Arriving Soon' },
  'delivered':        { bg: '#eaf4e2', color: '#2a4f1d', dot: '#3f6530', icon: CheckCircle2, label: 'Delivered' },
  'cancelled':        { bg: '#fef2f2', color: '#991b1b', dot: '#dc2626', icon: Package, label: 'Cancelled' },
=======
const STATUS_CONFIG: Record<string, { badgeClass: string; icon: any; label: string }> = {
  'pending':          { badgeClass: 'bg-amber-500/10 text-amber-700 border-amber-500/20', icon: Clock, label: 'Received' },
  'confirmed':        { badgeClass: 'bg-primary/10 text-primary border-primary/20', icon: CheckCircle2, label: 'Confirmed' },
  'out_for_delivery': { badgeClass: 'bg-primary text-foreground-inverse border-primary', icon: Truck, label: 'Out for Delivery' },
  'delivered':        { badgeClass: 'bg-primary/10 text-primary border-primary/20', icon: CheckCircle2, label: 'Delivered' },
  'cancelled':        { badgeClass: 'bg-rose-500/10 text-rose-600 border-rose-500/20', icon: Package, label: 'Cancelled' },
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
};

export function RecentOrders({ orders, onReorder, hideHeader = false }: RecentOrdersProps) {
  const recentOrders = orders.slice(0, 3);

  return (
    <div>
      {!hideHeader && (
<<<<<<< HEAD
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-dark tracking-wide">Recent Orders</h2>
=======
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold text-foreground">Recent Orders</h2>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
          {orders.length > 3 && (
            <Link href="/orders" className="text-primary text-xs font-bold flex items-center hover:underline">
              View All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          )}
        </div>
      )}

      {recentOrders.length === 0 ? (
<<<<<<< HEAD
        <div className="bg-surface rounded-[24px] p-6 border border-sand/50 text-center shadow-sm">
          <Package className="w-10 h-10 text-muted mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-bold text-dark mb-1">No Orders Yet</h3>
          <p className="text-sm text-muted mb-4 font-medium">Looks like you haven't placed any orders.</p>
          <Link href="/home">
            <Button size="sm" className="shadow-active">Start Shopping</Button>
=======
        <div className="bg-surface rounded-xl p-6 border border-border text-center">
          <Package className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
          <h3 className="text-xs font-bold text-foreground mb-0.5">No Orders Yet</h3>
          <p className="text-[11px] text-muted mb-3">Looks like you haven't placed any orders.</p>
          <Link href="/home" className="inline-block px-4 py-2 bg-primary text-foreground-inverse font-bold text-xs rounded-lg">
            Start Shopping
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {recentOrders.map(order => {
            const conf = STATUS_CONFIG[order.status] || STATUS_CONFIG['pending'];
            const Icon = conf.icon;
            const itemCount = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
            const isCompleted = order.status === 'delivered' || order.status === 'cancelled';

            return (
<<<<<<< HEAD
              <div key={order.id} className="bg-surface rounded-[20px] p-4 border border-sand/50 shadow-sm flex flex-col gap-3">
=======
              <div key={order.id} className="bg-surface rounded-xl p-3.5 border border-border flex flex-col gap-2.5">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-surface-muted border border-border flex items-center justify-center text-primary shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-bold text-foreground text-xs leading-tight">{conf.label}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${conf.badgeClass}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted">
                        {format(new Date(order.created_at), 'MMM d, yyyy')} • {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
<<<<<<< HEAD
                    <span className="text-sm font-semibold text-dark">₹{order.total_amount}</span>
                    <div className="mt-1 flex items-center justify-end gap-1">
                      <span className={`inline-flex items-center text-[10px] font-semibold tracking-wider px-1.5 py-0.5 rounded-full ${
                        order.payment_status === 'paid' 
                          ? 'bg-mint/40 text-primary' 
                          : 'bg-sand/40 text-muted'
                      }`}>
                        {(order.payment_method || 'COD').toUpperCase()}
                      </span>
                    </div>
=======
                    <span className="text-xs sm:text-sm font-extrabold text-primary tabular-nums">₹{order.total_amount}</span>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                  </div>
                </div>

                <div className="flex gap-2 pt-1 border-t border-border/60">
                  {isCompleted ? (
                    <button 
                      className="flex-1 py-1.5 px-3 rounded-lg border border-border text-xs font-bold text-foreground hover:bg-surface-muted transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      onClick={() => onReorder(order)}
                    >
                      <Repeat className="w-3 h-3" /> Reorder
                    </button>
                  ) : (
                    <Link href={`/tracking/${order.id}`} className="flex-1">
                      <button 
                        className="w-full py-1.5 px-3 rounded-lg bg-primary hover:bg-primary-hover text-foreground-inverse text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                      >
                        Track Order <ArrowRight className="w-3 h-3" />
                      </button>
                    </Link>
                  )}
                  {isCompleted && (
                    <Link href={`/tracking/${order.id}`} className="flex-1">
                      <button className="w-full py-1.5 px-3 rounded-lg border border-border text-xs font-bold text-muted hover:text-foreground transition-colors cursor-pointer">
                        Details
                      </button>
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
