"use client";

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Users, Mail, Phone, Search, X, ChevronRight, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api/client';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTable } from '@/components/admin/AdminTable';

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
    <div className="flex flex-col min-h-screen">
      {/* Standard Admin Header */}
      <AdminHeader
        title="Customer Directory"
        subtitle={`${total} registered customer accounts`}
        onRefresh={() => fetchCustomers(search)}
        isRefreshing={isLoading}
      >
        {/* Search Bar matching Categories/Products standard */}
        <div className="flex items-center rounded-[12px] px-3.5 h-11 border border-border/80 bg-surface shadow-xs">
          <Search className="w-4 h-4 text-foreground-muted shrink-0 mr-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone number..."
            className="flex-1 bg-transparent border-none outline-none text-[13px] text-foreground font-medium placeholder:text-foreground-muted/60"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="p-1 text-foreground-muted hover:text-foreground rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </AdminHeader>

      <div className="px-6 md:px-10 py-6">
        <AdminTable
          columns={[
            { header: 'Customer' },
            { header: 'Contact' },
            { header: 'Total Spent' },
            { header: 'Orders / Subs' },
            { header: 'Joined' },
            { header: 'Actions', align: 'right' },
          ]}
          isLoading={isLoading}
          isEmpty={!isLoading && customers.length === 0}
          emptyIcon={Users}
          emptyTitle="No customers found"
          emptyDescription={search ? `No customer matched "${search}".` : 'No customers registered in database yet.'}
        >
          {customers.map((c) => (
            <tr
              key={c.id}
              onClick={() => setSelectedCustomer(c)}
              className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
            >
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-xs"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    {(c.name || c.email || 'C')[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-[13px] text-foreground block">
                      {c.name || 'Anonymous Customer'}
                    </span>
                    <span className="text-[11px] text-foreground-muted font-mono block">
                      ID: {c.id?.slice(0, 8)}
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3.5">
                <div className="flex flex-col gap-0.5 text-xs">
                  {c.phone && (
                    <span className="flex items-center gap-1.5 text-foreground">
                      <Phone className="w-3 h-3 text-foreground-muted" /> +91 {c.phone}
                    </span>
                  )}
                  {c.email && (
                    <span className="flex items-center gap-1.5 text-foreground-muted">
                      <Mail className="w-3 h-3 text-foreground-muted" /> {c.email}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-5 py-3.5 font-bold text-[13px] text-foreground">
                ₹{parseFloat(c.total_spent || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </td>
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                    {c.total_orders || 0} Orders
                  </span>
                  {parseInt(c.active_subscriptions || '0') > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                      {c.active_subscriptions} Subs
                    </span>
                  )}
                </div>
              </td>
              <td className="px-5 py-3.5 text-xs text-foreground-muted">
                {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
              </td>
              <td className="px-5 py-3.5 text-right">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCustomer(c);
                  }}
                  className="p-1.5 rounded-lg hover:bg-surface-muted text-primary cursor-pointer transition-colors"
                  title="View Profile Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </AdminTable>
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
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-surface rounded-[20px] overflow-hidden shadow-2xl p-6 flex flex-col gap-5 border border-border"
              style={{ background: 'var(--color-surface)' }}
            >
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-base shadow-xs"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    {(selectedCustomer.name || selectedCustomer.email || 'C')[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-semibold text-[17px] text-foreground">
                      {selectedCustomer.name || 'Customer'}
                    </h2>
                    <p className="text-xs text-foreground-muted">
                      Member since {new Date(selectedCustomer.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 rounded-full hover:bg-surface-muted text-foreground-muted hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-[12px] bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/40 text-center">
                  <p className="text-[11px] font-bold uppercase text-green-800 dark:text-green-300">Total Spent</p>
                  <p className="font-bold text-[15px] text-green-900 dark:text-green-200 mt-0.5">
                    ₹{parseFloat(selectedCustomer.total_spent || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="p-3 rounded-[12px] bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-center">
                  <p className="text-[11px] font-bold uppercase text-blue-800 dark:text-blue-300">Orders</p>
                  <p className="font-bold text-[15px] text-blue-900 dark:text-blue-200 mt-0.5">{selectedCustomer.total_orders || 0}</p>
                </div>
                <div className="p-3 rounded-[12px] bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-center">
                  <p className="text-[11px] font-bold uppercase text-amber-800 dark:text-amber-300">Active Subs</p>
                  <p className="font-bold text-[15px] text-amber-900 dark:text-amber-200 mt-0.5">{selectedCustomer.active_subscriptions || 0}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 text-[13px] pt-1">
                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <span className="text-foreground-muted">Phone</span>
                  <span className="font-semibold text-foreground">+91 {selectedCustomer.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <span className="text-foreground-muted">Email</span>
                  <span className="font-semibold text-foreground">{selectedCustomer.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <span className="text-foreground-muted">Loyalty Points</span>
                  <span className="font-bold text-primary">{selectedCustomer.loyalty_points || 0} pts</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-foreground-muted">Last Login</span>
                  <span className="font-semibold text-foreground">
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
