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

const STATUS_CONFIG: Record<string, { badgeClass: string; icon: any; label: string }> = {
  'pending':          { badgeClass: 'bg-amber-500/10 text-amber-700 border-amber-500/20', icon: Clock, label: 'Received' },
  'confirmed':        { badgeClass: 'bg-primary/10 text-primary border-primary/20', icon: CheckCircle2, label: 'Confirmed' },
  'out_for_delivery': { badgeClass: 'bg-primary text-foreground-inverse border-primary', icon: Truck, label: 'Out for Delivery' },
  'delivered':        { badgeClass: 'bg-primary/10 text-primary border-primary/20', icon: CheckCircle2, label: 'Delivered' },
  'cancelled':        { badgeClass: 'bg-rose-500/10 text-rose-600 border-rose-500/20', icon: Package, label: 'Cancelled' },
};

export function RecentOrders({ orders, onReorder, hideHeader = false }: RecentOrdersProps) {
  const recentOrders = orders.slice(0, 3);

  return (
    <div>
      {!hideHeader && (
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold text-foreground">Recent Orders</h2>
          {orders.length > 3 && (
            <Link href="/orders" className="text-primary text-xs font-bold flex items-center hover:underline">
              View All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          )}
        </div>
      )}

      {recentOrders.length === 0 ? (
        <div className="bg-surface rounded-xl p-6 border border-border text-center">
          <Package className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
          <h3 className="text-xs font-bold text-foreground mb-0.5">No Orders Yet</h3>
          <p className="text-[11px] text-muted mb-3">Looks like you haven't placed any orders.</p>
          <Link href="/home" className="inline-block px-4 py-2 bg-primary text-foreground-inverse font-bold text-xs rounded-lg">
            Start Shopping
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
              <div key={order.id} className="bg-surface rounded-xl p-3.5 border border-border flex flex-col gap-2.5">
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
                    <span className="text-xs sm:text-sm font-extrabold text-primary tabular-nums">₹{order.total_amount}</span>
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
