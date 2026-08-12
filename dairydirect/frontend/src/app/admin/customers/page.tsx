"use client";

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '@/lib/i18n';
import { 
  Users, 
  Loader2, 
  Mail, 
  Phone, 
  Search, 
  X, 
  Package, 
  Repeat, 
  IndianRupee, 
  ArrowLeft, 
  RefreshCw, 
  Calendar, 
  Award, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  Filter, 
  ExternalLink 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useStore } from '@/store/useStore';

export default function AdminCustomersPage() {
  const { t } = useTranslation();
  const user = useStore((s) => s.user);

  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [metrics, setMetrics] = useState<{ totalCustomers: number; newThisMonth: number; totalSpent: number }>({
    totalCustomers: 0,
    newThisMonth: 0,
    totalSpent: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'subs' | 'orders' | 'loyalty'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const fetchCustomers = async (query = '', showRefreshSpin = false) => {
    if (showRefreshSpin) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-admin-role': 'true',
      };
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const res = await fetch(`/api/admin/customers?search=${encodeURIComponent(query)}`, {
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.customers) {
          setCustomers(data.customers);
          setTotal(data.total || data.customers.length);
          if (data.metrics) {
            setMetrics(data.metrics);
          }
        }
      } else {
        console.warn('[AdminCustomers] Request returned status:', res.status);
      }
    } catch (e) {
      console.error('Failed to fetch customers:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Client-side quick filter tabs
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (filterTab === 'subs') return (parseInt(c.active_subscriptions) || 0) > 0;
      if (filterTab === 'orders') return (parseInt(c.total_orders) || 0) > 0;
      if (filterTab === 'loyalty') return (parseInt(c.loyalty_points) || 0) > 100;
      return true;
    });
  }, [customers, filterTab]);

  const activeSubCount = useMemo(() => {
    return customers.reduce((sum, c) => sum + (parseInt(c.active_subscriptions) || 0), 0);
  }, [customers]);

  const totalSpentAcrossCustomers = useMemo(() => {
    return customers.reduce((sum, c) => sum + (parseFloat(c.total_spent) || 0), 0);
  }, [customers]);

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8]">
      {/* Top Header */}
      <div className="px-6 md:px-10 pt-8 pb-6 bg-white border-b border-gray-200/70 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link 
              href="/admin" 
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              title="Back to Admin Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-2xl text-[#0f3e26] tracking-tight">Customer Directory</h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#0f3e26]/10 text-[#0f3e26]">
                  {total} Registered
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Real-time directory of all customer profiles, lifetime spends, order history & subscriptions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => fetchCustomers(search, true)}
              disabled={isRefreshing || isLoading}
              className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 shadow-2xs cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#0f3e26]' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Live'}</span>
            </button>
          </div>
        </div>

        {/* KPI Metric Highlights */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Customers</span>
              <Users className="w-4 h-4 text-[#0f3e26]" />
            </div>
            <p className="text-2xl font-black text-gray-900">{total}</p>
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">All registered buyers</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Active Subs</span>
              <Repeat className="w-4 h-4 text-[#c88a23]" />
            </div>
            <p className="text-2xl font-black text-[#c88a23]">{activeSubCount}</p>
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Daily milk deliveries</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Customer Spends</span>
              <IndianRupee className="w-4 h-4 text-emerald-700" />
            </div>
            <p className="text-2xl font-black text-emerald-900">
              ₹{totalSpentAcrossCustomers.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Lifetime gross revenue</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">New This Month</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-blue-900">{metrics.newThisMonth || total}</p>
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Joined past 30 days</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 flex items-center bg-gray-50 rounded-xl px-3.5 h-11 border border-gray-200 focus-within:border-[#0f3e26] focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name, email, or 10-digit mobile number..."
              className="flex-1 bg-transparent border-none outline-none px-3 text-xs font-semibold text-gray-900 placeholder:text-gray-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-gray-100/90 rounded-xl text-xs font-bold shrink-0">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterTab === 'all' ? 'bg-white text-[#0f3e26] shadow-2xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              All ({customers.length})
            </button>
            <button
              onClick={() => setFilterTab('subs')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterTab === 'subs' ? 'bg-white text-[#c88a23] shadow-2xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Subscribers
            </button>
            <button
              onClick={() => setFilterTab('orders')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterTab === 'orders' ? 'bg-white text-blue-700 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Ordered
            </button>
            <button
              onClick={() => setFilterTab('loyalty')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterTab === 'loyalty' ? 'bg-white text-purple-700 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Loyalty VIP
            </button>
          </div>
        </div>
      </div>

      {/* Customer Directory List */}
      <div className="px-6 md:px-10 py-6 max-w-[1400px] w-full mx-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#0f3e26] mb-3" />
            <p className="text-xs font-bold text-gray-500">Fetching customer records from database...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-gray-200 p-8 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3 text-gray-400">
              <Users className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <h3 className="font-extrabold text-base text-gray-900 mb-1">
              {search ? 'No matching customers found' : 'No customers found'}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm">
              {search 
                ? `No customer profile matches "${search}". Try searching with a different name, phone or email.` 
                : 'No customer accounts registered in the database yet.'}
            </p>
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="mt-4 px-4 py-2 rounded-xl bg-[#0f3e26] text-white text-xs font-bold hover:bg-[#144f31] transition-all"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((c, i) => {
              const displayName = c.name || (c.email ? c.email.split('@')[0] : (c.phone ? `Customer ${c.phone.slice(-4)}` : 'Customer'));
              const initial = (displayName || 'C')[0].toUpperCase();
              const spent = parseFloat(c.total_spent || '0');
              const ordersCount = parseInt(c.total_orders || '0', 10);
              const subsCount = parseInt(c.active_subscriptions || '0', 10);
              const points = parseInt(c.loyalty_points || '100', 10);

              return (
                <motion.div
                  key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.02 }}
                  className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-2xs hover:shadow-md hover:border-[#0f3e26]/40 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Avatar + Name + Status */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0f3e26] to-[#1c5f3b] text-white font-extrabold text-base flex items-center justify-center shadow-xs">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-sm text-gray-900 truncate group-hover:text-[#0f3e26] transition-colors">
                            {displayName}
                          </h3>
                          <span className="text-[10px] text-gray-400 font-medium">
                            Joined {new Date(c.created_at || Date.now()).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 shrink-0">
                        {points} pts
                      </span>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-1.5 py-2 border-y border-gray-100 my-2 text-[11px] text-gray-600">
                      {c.phone && (
                        <div className="flex items-center gap-2 truncate">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="font-medium truncate">{c.phone.startsWith('+91') ? c.phone : `+91 ${c.phone}`}</span>
                        </div>
                      )}
                      {c.email && (
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="font-medium truncate">{c.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Stats Summary */}
                  <div className="flex items-center justify-between pt-2 mt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                        {ordersCount} {ordersCount === 1 ? 'Order' : 'Orders'}
                      </span>
                      {subsCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                          {subsCount} Subs
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 font-semibold block leading-tight">Total Spent</span>
                      <span className="font-black text-sm text-[#0f3e26]">
                        ₹{spent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer Full Detail Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
            onClick={() => setSelectedCustomer(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 flex flex-col gap-6"
            >
              {/* Header */}
              <div className="flex justify-between items-start pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0f3e26] to-[#1c5f3b] text-white font-black text-xl flex items-center justify-center shadow-md">
                    {(selectedCustomer.name || selectedCustomer.email || 'C')[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-black text-xl text-gray-900">
                      {selectedCustomer.name || 'Customer'}
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">
                      Member since {new Date(selectedCustomer.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCustomer(null)} 
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* KPI Matrix */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
                  <p className="text-[10px] font-bold uppercase text-emerald-800">Total Spent</p>
                  <p className="font-black text-lg text-emerald-950 mt-0.5">
                    ₹{parseFloat(selectedCustomer.total_spent || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-center">
                  <p className="text-[10px] font-bold uppercase text-blue-800">Orders</p>
                  <p className="font-black text-lg text-blue-950 mt-0.5">
                    {selectedCustomer.total_orders || 0}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100 text-center">
                  <p className="text-[10px] font-bold uppercase text-amber-800">Active Subs</p>
                  <p className="font-black text-lg text-amber-950 mt-0.5">
                    {selectedCustomer.active_subscriptions || 0}
                  </p>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-3 text-xs bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div className="flex justify-between items-center py-1.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-medium">Customer ID</span>
                  <span className="font-mono text-[11px] font-semibold text-gray-700">{selectedCustomer.id}</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-medium">Phone</span>
                  {selectedCustomer.phone ? (
                    <a 
                      href={`tel:${selectedCustomer.phone}`} 
                      className="font-bold text-[#0f3e26] hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {selectedCustomer.phone.startsWith('+91') ? selectedCustomer.phone : `+91 ${selectedCustomer.phone}`}
                    </a>
                  ) : (
                    <span className="text-gray-400 font-medium">Not provided</span>
                  )}
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-medium">Email</span>
                  {selectedCustomer.email ? (
                    <a 
                      href={`mailto:${selectedCustomer.email}`} 
                      className="font-bold text-[#0f3e26] hover:underline flex items-center gap-1"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {selectedCustomer.email}
                    </a>
                  ) : (
                    <span className="text-gray-400 font-medium">Not provided</span>
                  )}
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-gray-200/60">
                  <span className="text-gray-500 font-medium">Loyalty Balance</span>
                  <span className="font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                    {selectedCustomer.loyalty_points || 100} Coins
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5">
                  <span className="text-gray-500 font-medium">Last Login</span>
                  <span className="font-semibold text-gray-700">
                    {selectedCustomer.last_login_at ? new Date(selectedCustomer.last_login_at).toLocaleString('en-IN') : 'Recently active'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                {selectedCustomer.phone && (
                  <a
                    href={`tel:${selectedCustomer.phone}`}
                    className="flex-1 py-3 rounded-xl bg-[#0f3e26] text-white text-xs font-bold hover:bg-[#144f31] flex items-center justify-center gap-2 transition-all shadow-xs text-center"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Customer</span>
                  </a>
                )}
                {selectedCustomer.email && (
                  <a
                    href={`mailto:${selectedCustomer.email}`}
                    className="flex-1 py-3 rounded-xl bg-white border border-gray-300 text-gray-800 text-xs font-bold hover:bg-gray-50 flex items-center justify-center gap-2 transition-all shadow-2xs text-center"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send Email</span>
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
