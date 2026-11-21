"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, AlertTriangle, CheckCircle2, TrendingDown, Edit3,
  Save, X, ChevronDown, Search, Filter, Loader2, ArrowLeft,
  RefreshCw, Boxes
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminToolbar } from '@/components/admin/AdminToolbar';

type VariantInventory = {
  variant_id: string;
  product_id: string;
  product_name: string;
  category: string;
  weight: string;
  price: number;
  cost_price: number;
  stock: number;
  low_stock_threshold: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  is_available: boolean;
  expiry_date: string | null;
  batch_number: string | null;
  image_url: string | null;
  product_active: boolean;
};

type InventoryStats = {
  out_of_stock: string;
  low_stock: string;
  in_stock: string;
  total_inventory_value: string;
};

export default function AdminInventoryPage() {
  const [variants, setVariants] = useState<VariantInventory[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'low_stock' | 'out_of_stock'>('all');
  const [search, setSearch] = useState('');
  const [editMap, setEditMap] = useState<Record<string, { stock: number; threshold: number; batch?: string; expiry?: string }>>({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/inventory${filter !== 'all' ? `?filter=${filter}` : ''}`);
      const data = await res.json();
      setVariants(data.variants || []);
      setStats(data.stats || null);
    } catch (e) {
      setError('Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, [filter]);

  const handleEdit = (variant: VariantInventory) => {
    setEditMap(prev => ({
      ...prev,
      [variant.variant_id]: {
        stock: variant.stock,
        threshold: variant.low_stock_threshold,
        batch: variant.batch_number || '',
        expiry: variant.expiry_date || '',
      },
    }));
  };

  const handleCancel = (id: string) => {
    setEditMap(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleSave = async (variantId: string) => {
    const edit = editMap[variantId];
    if (!edit) return;

    setSavingIds(prev => new Set([...prev, variantId]));
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: [{
            variantId,
            stock: edit.stock,
            low_stock_threshold: edit.threshold,
            batch_number: edit.batch || null,
            expiry_date: edit.expiry || null,
          }],
        }),
      });

      if (!res.ok) throw new Error('Update failed');

      setVariants(prev =>
        prev.map(v =>
          v.variant_id === variantId
            ? {
                ...v,
                stock: edit.stock,
                low_stock_threshold: edit.threshold,
                batch_number: edit.batch || null,
                expiry_date: edit.expiry || null,
                stock_status: edit.stock === 0 ? 'out_of_stock' : edit.stock <= edit.threshold ? 'low_stock' : 'in_stock',
              }
            : v
        )
      );

      handleCancel(variantId);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSavingIds(prev => { const n = new Set(prev); n.delete(variantId); return n; });
    }
  };

  const filtered = variants.filter(v =>
    v.product_name.toLowerCase().includes(search.toLowerCase()) ||
    v.weight.toLowerCase().includes(search.toLowerCase()) ||
    v.category.toLowerCase().includes(search.toLowerCase())
  );

  const statusStyle = {
<<<<<<< HEAD
    in_stock: { bg: '#dcfce7', text: '#15803d', label: 'In Stock' },
    low_stock: { bg: '#fef3c7', text: '#b45309', label: 'Low Stock' },
    out_of_stock: { bg: '#fee2e2', text: '#b91c1c', label: 'Out of Stock' },
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Standard Admin Header */}
      <AdminHeader
        title="Inventory & Stock"
        subtitle="Live tracking of warehouse batches, stock levels, and safety thresholds"
        onRefresh={fetchInventory}
        isRefreshing={isLoading}
      >
        {/* Quick Summary Cards */}
=======
    in_stock: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'In Stock' },
    low_stock: { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Low Stock' },
    out_of_stock: { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Out of Stock' },
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 sm:px-8 pt-6 pb-5 bg-surface border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <Link 
            href="/admin" 
            className="p-2 rounded-lg border border-border bg-surface hover:bg-surface-muted text-foreground-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Inventory & Realtime Stock
            </h1>
            <p className="text-xs text-foreground-muted mt-0.5">
              Live stock levels, SKU thresholds, batch numbers, and reorder alerts
            </p>
          </div>
        </div>

        {/* Stats Row */}
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1">
            {[
<<<<<<< HEAD
              { label: 'Out of Stock', value: stats.out_of_stock, bg: 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/40', icon: X },
              { label: 'Low Stock', value: stats.low_stock, bg: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40', icon: AlertTriangle },
              { label: 'In Stock', value: stats.in_stock, bg: 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40', icon: CheckCircle2 },
              { label: 'Inventory Value', value: `₹${parseFloat(stats.total_inventory_value || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, bg: 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/40', icon: Package },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={`rounded-[12px] px-3.5 py-2.5 flex items-center gap-3 border ${s.bg}`}>
                  <Icon className="w-5 h-5 shrink-0" strokeWidth={2.2} />
                  <div>
                    <p className="font-bold text-[17px] leading-tight">{s.value}</p>
                    <p className="text-[11px] font-bold opacity-80">{s.label}</p>
=======
              { label: 'Out of Stock', value: stats.out_of_stock, iconClass: 'text-rose-600 bg-rose-50', icon: X },
              { label: 'Low Stock', value: stats.low_stock, iconClass: 'text-amber-600 bg-amber-50', icon: AlertTriangle },
              { label: 'In Stock', value: stats.in_stock, iconClass: 'text-primary bg-primary-fixed', icon: CheckCircle2 },
              { label: 'Inventory Value', value: `₹${parseFloat(stats.total_inventory_value || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, iconClass: 'text-info bg-blue-50', icon: Package },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-xl p-3.5 bg-surface border border-border flex items-center gap-3 shadow-2xs">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.iconClass} shrink-0`}>
                    <Icon className="w-4 h-4" strokeWidth={2.2} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground leading-none">{s.value}</p>
                    <p className="text-[10px] text-foreground-muted font-medium mt-1">{s.label}</p>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AdminHeader>

<<<<<<< HEAD
      <div className="px-6 md:px-10 py-6 flex flex-col gap-5">
        {/* Standard Search & Filter Toolbar */}
        <AdminToolbar
          pills={[
            { id: 'all', label: 'All Stock' },
            { id: 'low_stock', label: 'Low Stock', count: stats ? parseInt(stats.low_stock) : undefined },
            { id: 'out_of_stock', label: 'Out of Stock', count: stats ? parseInt(stats.out_of_stock) : undefined },
          ]}
          activePill={filter}
          onPillChange={(id) => setFilter(id as any)}
          searchPlaceholder="Search by product name, weight, or category..."
          searchValue={search}
          onSearchChange={setSearch}
        />

        {error && (
          <div className="px-4 py-3 rounded-[12px] flex items-center gap-2 text-[13px] bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto text-amber-700 hover:text-amber-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Standardized AdminTable */}
        <AdminTable
          columns={[
            { header: 'Product' },
            { header: 'Category' },
            { header: 'Weight' },
            { header: 'Price' },
            { header: 'Stock Units' },
            { header: 'Status' },
            { header: 'Batch / Expiry' },
            { header: 'Action', align: 'right' },
          ]}
          isLoading={isLoading}
          isEmpty={!isLoading && filtered.length === 0}
          emptyIcon={Boxes}
          emptyTitle="No inventory matches found"
          emptyDescription={search ? `No items matched "${search}".` : 'No product stock items currently registered.'}
        >
          {filtered.map((variant) => {
            const isEditing = !!editMap[variant.variant_id];
            const editData = editMap[variant.variant_id];
            const isSaving = savingIds.has(variant.variant_id);
            const ss = statusStyle[variant.stock_status] || statusStyle.in_stock;

            return (
              <tr
                key={variant.variant_id}
                className={isEditing ? 'bg-primary-fixed/20' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors'}
              >
                <td className="px-5 py-3.5 font-bold text-[13px] text-foreground">
                  {variant.product_name}
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-container text-foreground">
                    {variant.category}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs font-medium text-foreground">
                  {variant.weight}
                </td>
                <td className="px-5 py-3.5 text-xs font-bold text-foreground">
                  ₹{variant.price}
                </td>
                <td className="px-5 py-3.5">
                  {isEditing ? (
                    <input
                      type="number"
                      min={0}
                      value={editData.stock}
                      onChange={e => setEditMap(prev => ({ ...prev, [variant.variant_id]: { ...editData, stock: parseInt(e.target.value) || 0 } }))}
                      className="w-20 px-2 py-1.5 rounded-[8px] text-[13px] font-bold outline-none border border-primary bg-surface text-foreground"
                    />
                  ) : (
                    <span className={`font-bold text-[14px] ${variant.stock === 0 ? 'text-error' : variant.stock <= variant.low_stock_threshold ? 'text-amber-600' : 'text-foreground'}`}>
                      {variant.stock}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: ss.bg, color: ss.text }}>
                    {ss.label}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {isEditing ? (
                    <input
                      type="text"
                      placeholder="Batch #"
                      value={editData.batch}
                      onChange={e => setEditMap(prev => ({ ...prev, [variant.variant_id]: { ...editData, batch: e.target.value } }))}
                      className="w-28 px-2 py-1.5 rounded-[8px] text-xs outline-none border border-border bg-surface text-foreground"
                    />
                  ) : (
                    <p className="text-xs text-foreground-muted">
                      {variant.batch_number || '—'}
                      {variant.expiry_date && <span className="block text-[11px]">{format(new Date(variant.expiry_date), 'dd MMM yy')}</span>}
                    </p>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right">
                  {isEditing ? (
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleSave(variant.variant_id)}
                        disabled={isSaving}
                        className="p-1.5 rounded-[8px] text-white bg-primary hover:opacity-90 transition-opacity cursor-pointer"
                        title="Save Changes"
                      >
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleCancel(variant.variant_id)}
                        className="p-1.5 rounded-[8px] text-foreground-muted hover:bg-surface-muted transition-colors cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit(variant)}
                      className="p-1.5 rounded-[8px] hover:bg-surface-muted text-primary cursor-pointer transition-colors"
                      title="Edit Stock"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </AdminTable>
=======
      <div className="px-5 sm:px-8 py-5">
        {/* Controls */}
        <div className="flex flex-wrap gap-2.5 mb-5 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input
              type="text"
              placeholder="Search products by title, SKU, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-foreground placeholder:text-foreground-muted transition-all"
            />
          </div>

          {/* Filter */}
          {(['all', 'low_stock', 'out_of_stock'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                filter === f
                  ? 'bg-primary text-white border-primary shadow-2xs font-bold'
                  : 'bg-surface text-foreground-muted border-border hover:text-foreground hover:bg-surface-muted'
              }`}
            >
              {f === 'all' ? 'All Items' : f === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
            </button>
          ))}

          <button
            type="button"
            onClick={fetchInventory}
            title="Refresh Inventory"
            className="p-2 rounded-xl border border-border bg-surface hover:bg-surface-muted text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl flex items-center gap-2 text-xs bg-rose-50 border border-rose-200 text-rose-700">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} className="ml-auto cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
        ) : (
          <div className="rounded-xl overflow-hidden bg-surface border border-border shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-muted/50 border-b border-border text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">
                    {['Product', 'Category', 'Weight', 'Price', 'Stock', 'Status', 'Batch / Expiry', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((variant, i) => {
                    const isEditing = !!editMap[variant.variant_id];
                    const editData = editMap[variant.variant_id];
                    const isSaving = savingIds.has(variant.variant_id);
                    const ss = statusStyle[variant.stock_status] || statusStyle.in_stock;

                    return (
                      <motion.tr
                        key={variant.variant_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(i * 0.02, 0.3) }}
                        className={isEditing ? 'bg-primary-fixed/20' : 'hover:bg-surface-muted/40 transition-colors'}
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-xs text-foreground">{variant.product_name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-surface-muted text-foreground-muted border border-border">
                            {variant.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-foreground">
                          {variant.weight}
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-foreground">
                          ₹{variant.price}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="number"
                              min={0}
                              value={editData.stock}
                              onChange={e => setEditMap(prev => ({ ...prev, [variant.variant_id]: { ...editData, stock: parseInt(e.target.value) || 0 } }))}
                              className="w-20 px-2 py-1 rounded-lg text-xs font-bold bg-surface border border-primary outline-none text-foreground"
                            />
                          ) : (
                            <span className={`font-bold text-xs ${variant.stock === 0 ? 'text-rose-600' : variant.stock <= variant.low_stock_threshold ? 'text-amber-600' : 'text-foreground'}`}>
                              {variant.stock}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${ss.bg}`}>
                            {ss.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="text"
                              placeholder="Batch #"
                              value={editData.batch}
                              onChange={e => setEditMap(prev => ({ ...prev, [variant.variant_id]: { ...editData, batch: e.target.value } }))}
                              className="w-24 px-2 py-1 rounded-lg text-xs bg-surface border border-border outline-none text-foreground"
                            />
                          ) : (
                            <div className="text-[11px] text-foreground-muted">
                              <span>{variant.batch_number || '—'}</span>
                              {variant.expiry_date && <span className="block text-[10px]">{format(new Date(variant.expiry_date), 'dd MMM yy')}</span>}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSave(variant.variant_id)}
                                disabled={isSaving}
                                className="p-1.5 rounded-md bg-primary hover:bg-primary-hover text-white transition-colors cursor-pointer"
                                title="Save"
                              >
                                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleCancel(variant.variant_id)} 
                                className="p-1.5 rounded-md bg-surface-muted hover:bg-border text-foreground-muted transition-colors cursor-pointer"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button 
                              type="button"
                              onClick={() => handleEdit(variant)} 
                              className="p-1.5 rounded-md border border-border bg-surface hover:bg-surface-muted text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                              title="Edit Stock"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-16">
                  <Package className="w-8 h-8 mx-auto mb-2 text-foreground-muted opacity-40" strokeWidth={1.5} />
                  <p className="font-semibold text-xs text-foreground">
                    {search ? 'No products match your search' : 'No inventory data found'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
      </div>
    </div>
  );
}
