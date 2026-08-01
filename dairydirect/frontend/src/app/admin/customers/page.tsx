"use client";

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { Users, Loader2, Mail, Phone, Search, X, Package, Repeat, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllOrders } from '@/lib/api/orders';
import { getAllSubscriptions } from '@/lib/api/subscriptions';

export default function AdminCustomersPage() {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [
        { data: profiles },
        allOrders,
        allSubs
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false }),
        getAllOrders(),
        getAllSubscriptions()
      ]);
      setCustomers(profiles ?? []);
      setOrders(allOrders);
      setSubscriptions(allSubs);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const filteredCustomers = customers.filter(c => {
    const q = search.toLowerCase();
    const name = c.name?.toLowerCase() || '';
    const email = c.email?.toLowerCase() || '';
    const phone = c.phone || '';
    return name.includes(q) || email.includes(q) || phone.includes(q);
  });

  const getCustomerStats = (userId: string) => {
    const userOrders = orders.filter(o => o.user_id === userId);
    const userSubs = subscriptions.filter(s => s.user_id === userId);
    const ltv = userOrders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total_amount, 0);
    return { userOrders, userSubs, ltv };
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
        <h1 className="font-extrabold text-[24px] tracking-tight mb-4" style={{ color: 'var(--color-on-surface)' }}>
          Customers
        </h1>
        <div className="flex items-center bg-white rounded-[12px] px-4 h-12"
          style={{ border: '1px solid rgba(195,201,187,0.5)' }}>
          <Search className="w-5 h-5" style={{ color: 'var(--color-outline)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="flex-1 bg-transparent border-none outline-none px-3 text-[14px] font-medium"
            style={{ color: 'var(--color-on-surface)' }}
          />
        </div>
      </div>

      <div className="px-6 md:px-10 py-5">
        {filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Users className="w-12 h-12 mb-4" style={{ color: 'var(--color-outline)' }} strokeWidth={1.5} />
            <p className="font-bold text-[18px]" style={{ color: 'var(--color-on-surface)' }}>No customers found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredCustomers.map((customer, i) => {
              const { userOrders, userSubs } = getCustomerStats(customer.id);
              return (
                <motion.div key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  className="rounded-[14px] p-4 flex items-center gap-4 cursor-pointer hover:bg-black/5 transition-colors"
                  style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(195,201,187,0.3)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #3f6530, #577f46)' }}>
                    {(customer.name || customer.email || 'C')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[14px] truncate" style={{ color: 'var(--color-on-surface)' }}>
                      {customer.name || customer.email || 'Unknown'}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {customer.email && (
                        <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--color-outline)' }}>
                          <Mail className="w-3 h-3" /> {customer.email}
                        </span>
                      )}
                      {customer.phone && (
                        <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--color-outline)' }}>
                          <Phone className="w-3 h-3" /> +91 {customer.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {userOrders.length} Orders
                    </span>
                    {userSubs.length > 0 && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                        {userSubs.length} Subs
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4 sm:p-6"
            onClick={() => setSelectedCustomer(null)}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-t-[24px] sm:rounded-[24px] overflow-hidden flex flex-col max-h-[85vh]"
            >
              {(() => {
                const { userOrders, userSubs, ltv } = getCustomerStats(selectedCustomer.id);
                return (
                  <>
                    <div className="p-5 flex justify-between items-center border-b border-black/5 bg-surface">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white bg-primary">
                          {(selectedCustomer.name || selectedCustomer.email || 'C')[0].toUpperCase()}
                        </div>
                        <div>
                          <h2 className="font-bold text-[16px] text-on-surface">{selectedCustomer.name || 'Customer'}</h2>
                          <p className="text-[12px] text-outline">{selectedCustomer.email || selectedCustomer.phone}</p>
                        </div>
                      </div>
                      <button onClick={() => setSelectedCustomer(null)} className="p-2 rounded-full hover:bg-black/5 text-outline">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="overflow-y-auto p-5 flex flex-col gap-6">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-[12px] bg-surface-container-low border border-black/5">
                          <DollarSign className="w-4 h-4 mb-1 text-primary" />
                          <p className="text-[11px] font-bold text-outline uppercase">LTV</p>
                          <p className="font-bold text-[15px] text-on-surface">{t('currency')}{ltv}</p>
                        </div>
                        <div className="p-3 rounded-[12px] bg-surface-container-low border border-black/5">
                          <Package className="w-4 h-4 mb-1 text-primary" />
                          <p className="text-[11px] font-bold text-outline uppercase">Orders</p>
                          <p className="font-bold text-[15px] text-on-surface">{userOrders.length}</p>
                        </div>
                        <div className="p-3 rounded-[12px] bg-surface-container-low border border-black/5">
                          <Repeat className="w-4 h-4 mb-1 text-primary" />
                          <p className="text-[11px] font-bold text-outline uppercase">Active Subs</p>
                          <p className="font-bold text-[15px] text-on-surface">
                            {userSubs.filter(s => s.status === 'active').length}
                          </p>
                        </div>
                      </div>

                      {userSubs.length > 0 && (
                        <div>
                          <h3 className="font-bold text-[14px] mb-3 text-on-surface">Subscriptions</h3>
                          <div className="flex flex-col gap-2">
                            {userSubs.map(s => (
                              <div key={s.id} className="p-3 rounded-[10px] bg-surface-container-lowest border border-black/5 flex justify-between items-center">
                                <div>
                                  <p className="font-semibold text-[13px] text-on-surface">{s.products?.name || 'Product'} ({s.volume}{t('volume_unit')})</p>
                                  <p className="text-[11px] text-outline capitalize">{s.plan} · {s.status}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h3 className="font-bold text-[14px] mb-3 text-on-surface">Recent Orders</h3>
                        {userOrders.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {userOrders.slice(0, 5).map(o => (
                              <div key={o.id} className="p-3 rounded-[10px] bg-surface-container-lowest border border-black/5 flex justify-between items-center">
                                <div>
                                  <p className="font-semibold text-[13px] text-on-surface">{o.id.slice(0,8).toUpperCase()}</p>
                                  <p className="text-[11px] text-outline capitalize">{o.status.replace(/_/g, ' ')}</p>
                                </div>
                                <span className="font-bold text-[13px] text-primary">{t('currency')}{o.total_amount}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[13px] text-outline">No orders found.</p>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
