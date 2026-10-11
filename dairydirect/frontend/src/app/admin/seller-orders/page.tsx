"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from '@/lib/i18n';
import { format } from 'date-fns';
import { 
  ChevronDown, 
  Loader2, 
  Store, 
  Phone, 
  Ban, 
  RefreshCw,
  Search,
  Filter,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllOrders } from '@/lib/api/orders';
import { getAllSellers } from '@/lib/api/sellers';
import type { OrderWithItems } from '@/lib/api/orders';
import type { SellerLifecycleRecord } from '@/lib/api/sellers';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/constants/brand';

const STATUS_STYLES: Record<string, { bg: string; color: string; dot: string; label: string }> = {
  'pending':          { bg: '#ffdcc7', color: '#774117', dot: '#d4712a', label: 'Pending' },
  'confirmed':        { bg: '#c2efac', color: '#042100', dot: '#3f6530', label: 'Confirmed' },
  'out_for_delivery': { bg: '#fff8e6', color: '#7d5200', dot: '#c78c2e', label: 'Out for Delivery' },
  'delivered':        { bg: '#eaf4e2', color: '#2a4f1d', dot: '#3f6530', label: 'Delivered' },
  'cancelled':        { bg: '#e3e3dc', color: '#43493e', dot: '#73796d', label: 'Cancelled' },
};

export default function AllSellerOrdersListPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [sellers, setSellers] = useState<SellerLifecycleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [activeTab, setActiveTab] = useState('all');
  const [selectedSellerId, setSelectedSellerId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Card states
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchSellers = async () => {
    try {
      const res = await getAllSellers({ limit: 100 });
      setSellers(res.sellers || []);
    } catch (e) {
      console.error('Failed to load sellers list:', e);
    }
  };

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getAllOrders({ type: 'seller' });
      // Keep only orders that contain seller products
      const sellerOnlyOrders = data.filter(order =>
        (order.order_items || []).some(item => item.products?.seller_id || item.products?.sellers)
      );
      setOrders(sellerOnlyOrders);
    } catch (err) {
      console.error('Failed to fetch seller orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSellers();
    fetchOrders();

    // Supabase Realtime synchronization
    let isCancelled = false;
    let activeChannel: any = null;
    import('@/lib/supabase/lazy').then(({ getSupabaseLazy }) => {
      getSupabaseLazy().then(supabase => {
        if (isCancelled) return;
        const channelName = `admin-seller-orders-live-sync-${Math.random().toString(36).slice(2, 9)}`;
        activeChannel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            () => {
              getAllOrders({ type: 'seller' }).then(data => {
                const sellerOnlyOrders = data.filter(order =>
                  (order.order_items || []).some(item => item.products?.seller_id || item.products?.sellers)
                );
                setOrders(sellerOnlyOrders);
              });
            }
          )
          .subscribe();

        if (isCancelled) {
          supabase.removeChannel(activeChannel);
        }
      });
    });

    return () => {
      isCancelled = true;
      if (activeChannel) {
        import('@/lib/supabase/lazy').then(({ getSupabaseLazy }) => {
          getSupabaseLazy().then(supabase => {
            supabase.removeChannel(activeChannel);
          });
        });
      }
    };
  }, [fetchOrders]);

  // Compute distinct seller stores present in these orders
  const sellerOptions = useMemo(() => {
    const sellerMap = new Map<string, { id: string; name: string; count: number }>();

    orders.forEach(order => {
      (order.order_items || []).forEach(item => {
        const sId = item.products?.sellers?.id || item.products?.seller_id;
        const sName = item.products?.sellers?.store_name;
        if (sId) {
          const current = sellerMap.get(sId);
          if (!current) {
            sellerMap.set(sId, { id: sId, name: sName || 'Vendor Store', count: 1 });
          } else {
            current.count += 1;
          }
        }
      });
    });

    // Also include any registered sellers from API that might have 0 orders
    sellers.forEach(s => {
      if (!sellerMap.has(s.id)) {
        sellerMap.set(s.id, { id: s.id, name: s.store_name, count: 0 });
      }
    });

    return Array.from(sellerMap.values());
  }, [orders, sellers]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Status Filter
      const matchesStatus = activeTab === 'all' ? true : order.status === activeTab;

      // 2. Seller Filter
      let matchesSeller = true;
      if (selectedSellerId !== 'all') {
        matchesSeller = (order.order_items || []).some(
          item => (item.products?.sellers?.id === selectedSellerId || item.products?.seller_id === selectedSellerId)
        );
      }

      // 3. Search Query
      const query = searchQuery.trim().toLowerCase();
      let matchesSearch = true;
      if (query) {
        const matchesId = order.id.toLowerCase().includes(query) || (order.order_number && order.order_number.toLowerCase().includes(query));
        const matchesCustomer = order.profiles?.name?.toLowerCase().includes(query) || order.profiles?.phone?.includes(query);
        const matchesStore = (order.order_items || []).some(
          item => item.products?.sellers?.store_name?.toLowerCase().includes(query)
        );
        const matchesProduct = (order.order_items || []).some(
          item => item.product_name?.toLowerCase().includes(query) || item.products?.name?.toLowerCase().includes(query)
        );
        matchesSearch = matchesId || matchesCustomer || matchesStore || matchesProduct;
      }

      return matchesStatus && matchesSeller && matchesSearch;
    });
  }, [orders, activeTab, selectedSellerId, searchQuery]);

  // Metrics
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const inTransitCount = orders.filter(o => o.status === 'out_for_delivery').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const totalSellerRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center pt-20 px-6" style={{ background: 'var(--color-surface)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* ─── Header & Top Controls ─── */}
      <div className="sticky top-0 z-30 glass-surface">
        <div className="px-6 md:px-10 pt-6 pb-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Store className="w-3 h-3 text-purple-700" />
                  <span>Vendor Marketplace</span>
                </span>
              </div>
              <h1 className="font-extrabold text-[24px] tracking-tight mt-1"
                style={{ color: 'var(--color-on-surface)' }}>
                All Seller Orders List
                <span className="ml-2 text-[15px] font-normal" style={{ color: 'var(--color-outline)' }}>
                  ({filteredOrders.length})
                </span>
              </h1>
              <p className="text-[12px] text-gray-500 mt-0.5">
                Overview of vendor store orders across all marketplace sellers. Order fulfillment and status changes are managed directly by each seller.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">

              <button
                onClick={() => {
                  setIsLoading(true);
                  fetchOrders();
                  fetchSellers();
                }}
                title="Refresh Orders"
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ─── Filter Bar: Seller Dropdown, Search & Status Tabs ─── */}
          <div className="bg-white/80 backdrop-blur-xs rounded-2xl border border-gray-200/80 p-3 mb-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-2xs">
            {/* Seller Filter Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                <Filter className="w-4 h-4 text-purple-700" />
                <span>Filter by Seller:</span>
              </div>
              <select
                value={selectedSellerId}
                onChange={e => setSelectedSellerId(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
              >
                <option value="all">All Sellers ({orders.length} orders)</option>
                {sellerOptions.map(seller => (
                  <option key={seller.id} value={seller.id}>
                    {seller.name} ({seller.count} orders)
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search order ID, store, customer, product..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0f3e26]/20 focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-6 px-6 pb-1">
            {['all', 'pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'].map(tab => (
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

      {/* ─── Orders List ─── */}
      <div className="px-6 md:px-10 py-5 flex flex-col gap-3">
        <AnimatePresence mode="wait">
          {filteredOrders.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-purple-50">
                <Store className="w-7 h-7 text-purple-700" strokeWidth={1.5} />
              </div>
              <p className="font-bold text-[18px]" style={{ color: 'var(--color-on-surface)' }}>No seller orders found</p>
              <p className="text-[13px] mt-1 max-w-sm" style={{ color: 'var(--color-outline)' }}>
                {selectedSellerId !== 'all' 
                  ? 'No orders found for the selected seller. Try changing the seller filter.'
                  : 'Seller orders will appear here when customers purchase vendor products.'}
              </p>
              {(selectedSellerId !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedSellerId('all');
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800 rounded-xl"
                >
                  Reset Filters
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col gap-3">
              {filteredOrders.map((order, i) => {
                const statusStyle = STATUS_STYLES[order.status] || STATUS_STYLES['cancelled'];
                const isExpanded = expandedId === order.id;

                // Extract all distinct sellers from order items
                const sellerStores = Array.from(
                  new Set(
                    (order.order_items || [])
                      .map(item => item.products?.sellers?.store_name)
                      .filter(Boolean)
                  )
                );

                return (
                  <motion.div key={order.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: i * 0.04 }}
                    className="rounded-[16px] overflow-hidden"
                    style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(195,201,187,0.3)' }}>

                    {/* Order Header Summary */}
                    <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-[14px]" style={{ color: 'var(--color-primary)' }}>
                              {order.order_number || order.id}
                            </p>

                            {/* Seller Store Tag Badge */}
                            {sellerStores.length > 0 ? (
                              sellerStores.map(storeName => (
                                <span
                                  key={storeName}
                                  className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 flex items-center gap-1 border border-purple-200"
                                >
                                  <Store className="w-3 h-3 text-purple-700" />
                                  <span>Store: {storeName}</span>
                                </span>
                              ))
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700">
                                Seller Product
                              </span>
                            )}

                            {/* Payment Status */}
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {order.payment_status === 'paid' ? 'Paid' : `Payment: ${order.payment_status || 'Pending'}`} ({order.payment_method || 'COD'})
                            </span>
                          </div>

                          <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-outline)' }}>
                            {order.profiles?.name || 'Customer'} {order.profiles?.phone ? `(${order.profiles.phone})` : ''} · {format(new Date(order.created_at), 'MMM d, hh:mm a')}
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
                          <div className="px-5 py-4 space-y-4">

                            {/* Customer Delivery Details Box */}
                            <div className="p-3.5 rounded-xl border border-gray-200/80 bg-gray-50/70 text-xs grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Customer Information</span>
                                <p className="font-bold text-gray-900 mt-0.5">{order.profiles?.name || 'Customer'}</p>
                                <p className="text-gray-600">{order.profiles?.email || 'N/A'}</p>
                                {order.profiles?.phone && (
                                  <p className="text-gray-700 flex items-center gap-1 mt-0.5 font-medium">
                                    <Phone className="w-3 h-3 text-gray-400" />
                                    <span>+91 {order.profiles.phone}</span>
                                  </p>
                                )}
                              </div>

                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Shipping Destination</span>
                                <p className="text-gray-800 mt-0.5 leading-relaxed font-medium">
                                  {order.user_addresses?.address || order.shipping_address || 'Address on file'}
                                </p>
                                {order.user_addresses?.apartment && (
                                  <p className="text-gray-500 text-[11px]">Apt/Flat: {order.user_addresses.apartment}</p>
                                )}
                                {order.delivery_slot && (
                                  <p className="text-emerald-700 font-semibold mt-1 text-[11px]">Slot: {order.delivery_slot}</p>
                                )}
                              </div>
                            </div>

                            {/* Ordered Items with Seller Store Attribution */}
                            <div className="rounded-[10px] p-3 mb-2"
                              style={{ background: 'var(--color-surface-container-low)' }}>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">Vendor Products & Order Items</span>
                              {order.order_items?.map((item, j) => {
                                const pName = item.product_name || item.products?.name || (item.product_id ? `Product #${item.product_id.slice(0, 6)}` : 'Dairy Product');
                                const pWeight = item.weight || item.product_variants?.weight || '';
                                const storeName = item.products?.sellers?.store_name;
                                const img = item.products?.image_url || item.product_image || PLACEHOLDER_PRODUCT_IMAGE;

                                return (
                                  <div key={j} className="flex items-center justify-between text-[13px] py-2"
                                    style={{ borderTop: j > 0 ? '1px solid rgba(195, 201, 187, 0.25)' : undefined }}>
                                    <div className="flex items-center gap-2.5">
                                      <img
                                        src={img}
                                        alt={pName}
                                        className="w-10 h-10 rounded-lg object-cover bg-white border border-gray-200 shrink-0"
                                        onError={e => {
                                          (e.target as HTMLImageElement).src = PLACEHOLDER_PRODUCT_IMAGE;
                                        }}
                                      />
                                      <div>
                                        <span className="font-semibold" style={{ color: 'var(--color-on-surface-variant)' }}>
                                          {item.quantity}× {pName}{pWeight ? ` (${pWeight})` : ''}
                                        </span>
                                        {storeName && (
                                          <div className="flex items-center gap-1 mt-0.5">
                                            <Store className="w-3.5 h-3.5 text-purple-600" />
                                            <span className="text-[11px] font-bold text-purple-700">Seller: {storeName}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <span className="font-bold" style={{ color: 'var(--color-on-surface)' }}>
                                      {t('currency')}{item.price * item.quantity}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Cancellation Reason Display */}
                            {order.status === 'cancelled' && (
                              <div className="p-3 rounded-xl bg-gray-100 border border-gray-200 text-xs text-gray-700 space-y-1">
                                <span className="font-bold text-gray-900 block flex items-center gap-1">
                                  <Ban className="w-3.5 h-3.5 text-gray-500" />
                                  <span>Cancellation Reason & Audit Log:</span>
                                </span>
                                <p className="text-gray-600 font-mono text-[11px]">
                                  {order.notes || 'Order cancelled and stock inventory restored.'}
                                </p>
                              </div>
                            )}

                            {/* Seller-Managed Order Notice */}
                            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-50/70 border border-purple-200/80 text-xs text-purple-900 mt-2">
                              <Store className="w-4 h-4 text-purple-700 shrink-0" />
                              <span className="text-[11px] font-medium text-purple-900">
                                <strong>Seller-Managed Order:</strong> Order fulfillment and status updates are managed directly by the seller in their seller portal.
                              </span>
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
