"use client";

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Users, Loader2, Mail, Phone, Search, X, Package, Repeat, IndianRupee, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api/client';

export default function AdminCustomersPage() {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const fetchCustomers = async (query = '') => {
    setIsLoading(true);
    try {
      const data = await api.customers.get(query);
      if (data.customers) {
        setCustomers(data.customers);
        setTotal(data.total ?? data.customers.length);
      }
    } catch (e) {
      console.error('Failed to fetch customers with api client, trying fallback:', e);
      try {
        const res = await fetch(`/api/admin/customers?search=${encodeURIComponent(query)}`, { credentials: 'include' });
        const data = await res.json();
        if (data.customers) {
          setCustomers(data.customers);
          setTotal(data.total ?? data.customers.length);
        }
      } catch (err) {
        console.error('Fallback fetch failed:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-background)' }}>
      {/* Header */}
      <div className="px-6 md:px-10 pt-8 pb-6" style={{ background: 'var(--color-surface-container-lowest)', borderBottom: '1px solid rgba(195,201,187,0.2)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-1.5 rounded-[8px] hover:opacity-70 transition-opacity" style={{ background: 'var(--color-surface-container-low)' }}>
              <ArrowLeft className="w-4 h-4" style={{ color: 'var(--color-on-surface)' }} />
            </Link>
            <div>
              <h1 className="font-extrabold text-[24px]" style={{ color: 'var(--color-on-surface)' }}>Customer Directory</h1>
              <p className="text-[12px]" style={{ color: 'var(--color-outline)' }}>{total} registered customers</p>
            </div>
          </div>
        </div>

        <div className="flex items-center bg-white rounded-[12px] px-4 h-12"
          style={{ border: '1px solid rgba(195,201,187,0.5)' }}>
          <Search className="w-5 h-5" style={{ color: 'var(--color-outline)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone number..."
            className="flex-1 bg-transparent border-none outline-none px-3 text-[14px] font-medium"
            style={{ color: 'var(--color-on-surface)' }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="px-6 md:px-10 py-6">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Users className="w-12 h-12 mb-4" style={{ color: 'var(--color-outline)' }} strokeWidth={1.5} />
            <p className="font-bold text-[18px]" style={{ color: 'var(--color-on-surface)' }}>No customers found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {customers.map((c, i) => (
              <motion.div
                key={c.id}
                onClick={() => setSelectedCustomer(c)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
                className="rounded-[14px] p-4 flex items-center gap-4 cursor-pointer hover:shadow-sm transition-all"
                style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(195,201,187,0.3)' }}
              >
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-[15px]"
                  style={{ background: 'var(--cta-gradient)' }}>
                  {(c.name || c.email || 'C')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[14px] truncate" style={{ color: 'var(--color-on-surface)' }}>
                    {c.name || 'Anonymous Customer'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    {c.phone && (
                      <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--color-outline)' }}>
                        <Phone className="w-3 h-3" /> +91 {c.phone}
                      </span>
                    )}
                    {c.email && (
                      <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--color-outline)' }}>
                        <Mail className="w-3 h-3" /> {c.email}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="font-extrabold text-[14px]" style={{ color: 'var(--color-primary)' }}>
                    ₹{parseFloat(c.total_spent || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#dce8ff', color: '#4a6fa5' }}>
                      {c.total_orders} Orders
                    </span>
                    {parseInt(c.active_subscriptions) > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#ffdcc7', color: '#774117' }}>
                        {c.active_subscriptions} Subs
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setSelectedCustomer(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-[20px] overflow-hidden shadow-2xl p-6 flex flex-col gap-6"
            >
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-[18px]" style={{ background: '#4a8c3f' }}>
                    {(selectedCustomer.name || selectedCustomer.email || 'C')[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-extrabold text-[18px]" style={{ color: 'var(--color-on-surface)' }}>
                      {selectedCustomer.name || 'Customer'}
                    </h2>
                    <p className="text-[12px]" style={{ color: 'var(--color-outline)' }}>
                      Member since {new Date(selectedCustomer.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-[12px] bg-green-50 border border-green-100 text-center">
                  <p className="text-[10px] font-bold uppercase text-green-800">Total Spent</p>
                  <p className="font-extrabold text-[16px] text-green-900 mt-1">
                    ₹{parseFloat(selectedCustomer.total_spent || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="p-3 rounded-[12px] bg-blue-50 border border-blue-100 text-center">
                  <p className="text-[10px] font-bold uppercase text-blue-800">Orders</p>
                  <p className="font-extrabold text-[16px] text-blue-900 mt-1">{selectedCustomer.total_orders}</p>
                </div>
                <div className="p-3 rounded-[12px] bg-orange-50 border border-orange-100 text-center">
                  <p className="text-[10px] font-bold uppercase text-orange-800">Active Subs</p>
                  <p className="font-extrabold text-[16px] text-orange-900 mt-1">{selectedCustomer.active_subscriptions}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 text-[13px]">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Phone</span>
                  <span className="font-semibold">+91 {selectedCustomer.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Email</span>
                  <span className="font-semibold">{selectedCustomer.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Loyalty Points</span>
                  <span className="font-bold text-[#4a8c3f]">{selectedCustomer.loyalty_points || 0} pts</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Last Login</span>
                  <span className="font-semibold">
                    {selectedCustomer.last_login_at ? new Date(selectedCustomer.last_login_at).toLocaleString('en-IN') : 'Never'}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
