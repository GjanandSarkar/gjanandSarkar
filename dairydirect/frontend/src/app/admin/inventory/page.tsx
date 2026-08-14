"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, AlertTriangle, CheckCircle2, TrendingDown, Edit3,
  Save, X, ChevronDown, Search, Filter, Loader2, ArrowLeft,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

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
            ? { ...v, stock: edit.stock, low_stock_threshold: edit.threshold, batch_number: edit.batch || null, expiry_date: edit.expiry || null,
                stock_status: edit.stock === 0 ? 'out_of_stock' : edit.stock <= edit.threshold ? 'low_stock' : 'in_stock',
                is_available: edit.stock > 0 }
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
    in_stock: { bg: '#c2efac', text: '#2d5a27', label: 'In Stock' },
    low_stock: { bg: '#fff8e6', text: '#7d5200', label: 'Low Stock' },
    out_of_stock: { bg: '#ffdcc7', text: '#774117', label: 'Out of Stock' },
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-background)' }}>
      {/* Header */}
      <div
        className="px-6 md:px-10 pt-8 pb-6"
        style={{ background: 'var(--color-surface-container-lowest)', borderBottom: '1px solid rgba(195,201,187,0.2)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Link href="/admin" className="p-1.5 rounded-[8px] hover:opacity-70 transition-opacity" style={{ background: 'var(--color-surface-container-low)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--color-on-surface)' }} />
          </Link>
          <div>
            <h1 className="font-extrabold text-[24px]" style={{ color: 'var(--color-on-surface)' }}>Inventory Management</h1>
            <p className="text-[12px]" style={{ color: 'var(--color-outline)' }}>Monitor and update stock levels for all products</p>
          </div>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Out of Stock', value: stats.out_of_stock, bg: '#ffdcc7', text: '#774117', icon: X },
              { label: 'Low Stock', value: stats.low_stock, bg: '#fff8e6', text: '#7d5200', icon: AlertTriangle },
              { label: 'In Stock', value: stats.in_stock, bg: '#c2efac', text: '#2d5a27', icon: CheckCircle2 },
              { label: 'Inventory Value', value: `₹${parseFloat(stats.total_inventory_value || '0').toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, bg: '#dce8ff', text: '#4a6fa5', icon: Package },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-[12px] px-4 py-3 flex items-center gap-3" style={{ background: s.bg }}>
                  <Icon className="w-5 h-5 shrink-0" style={{ color: s.text }} strokeWidth={2} />
                  <div>
                    <p className="font-extrabold text-[18px] leading-none" style={{ color: s.text }}>{s.value}</p>
                    <p className="text-[10px] font-semibold mt-0.5" style={{ color: s.text, opacity: 0.7 }}>{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-6 md:px-10 py-5">
        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-5">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-outline)' }} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-[10px] text-[13px] outline-none"
              style={{
                background: 'var(--color-surface-container-lowest)',
                border: '1px solid rgba(195,201,187,0.4)',
                color: 'var(--color-on-surface)',
              }}
            />
          </div>

          {/* Filter */}
          {(['all', 'low_stock', 'out_of_stock'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-2 rounded-[10px] text-[12px] font-semibold transition-all"
              style={{
                background: filter === f ? 'var(--color-primary)' : 'var(--color-surface-container-low)',
                color: filter === f ? '#fff' : 'var(--color-on-surface)',
              }}
            >
              {f === 'all' ? 'All Items' : f === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
            </button>
          ))}

          <button
            onClick={fetchInventory}
            className="p-2 rounded-[10px]"
            style={{ background: 'var(--color-surface-container-low)' }}
          >
            <RefreshCw className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-[10px] flex items-center gap-2 text-[13px]"
            style={{ background: '#ffdcc7', color: '#774117' }}>
            <AlertTriangle className="w-4 h-4" />
            {error}
            <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
        ) : (
          <div className="rounded-[16px] overflow-hidden" style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(195,201,187,0.25)' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'var(--color-surface-container-low)' }}>
                    {['Product', 'Category', 'Weight', 'Price', 'Stock', 'Status', 'Batch / Expiry', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
                        style={{ color: 'var(--color-outline)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((variant, i) => {
                    const isEditing = !!editMap[variant.variant_id];
                    const editData = editMap[variant.variant_id];
                    const isSaving = savingIds.has(variant.variant_id);
                    const ss = statusStyle[variant.stock_status];

                    return (
                      <motion.tr
                        key={variant.variant_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        style={{ borderTop: i > 0 ? '1px solid rgba(195,201,187,0.15)' : undefined }}
                        className={isEditing ? '' : 'hover:bg-black/[0.01]'}
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[13px]" style={{ color: 'var(--color-on-surface)' }}>{variant.product_name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface)' }}>
                            {variant.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[12px] font-medium" style={{ color: 'var(--color-on-surface)' }}>
                          {variant.weight}
                        </td>
                        <td className="px-4 py-3 text-[12px] font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                          ₹{variant.price}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="number"
                              min={0}
                              value={editData.stock}
                              onChange={e => setEditMap(prev => ({ ...prev, [variant.variant_id]: { ...editData, stock: parseInt(e.target.value) || 0 } }))}
                              className="w-20 px-2 py-1.5 rounded-[8px] text-[13px] font-bold outline-none"
                              style={{ background: 'var(--color-surface-container)', border: '1.5px solid var(--color-primary)', color: 'var(--color-on-surface)' }}
                            />
                          ) : (
                            <span className="font-bold text-[14px]" style={{ color: variant.stock === 0 ? '#774117' : variant.stock <= variant.low_stock_threshold ? '#7d5200' : 'var(--color-on-surface)' }}>
                              {variant.stock}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] text-[10px] font-bold" style={{ background: ss.bg, color: ss.text }}>
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
                              className="w-24 px-2 py-1.5 rounded-[8px] text-[11px] outline-none"
                              style={{ background: 'var(--color-surface-container)', border: '1px solid rgba(195,201,187,0.4)', color: 'var(--color-on-surface)' }}
                            />
                          ) : (
                            <p className="text-[11px]" style={{ color: 'var(--color-outline)' }}>
                              {variant.batch_number || '—'}
                              {variant.expiry_date && <span className="block">{format(new Date(variant.expiry_date), 'dd MMM yy')}</span>}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleSave(variant.variant_id)}
                                disabled={isSaving}
                                className="p-1.5 rounded-[6px] transition-opacity hover:opacity-80"
                                style={{ background: 'var(--color-primary)' }}
                              >
                                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Save className="w-3.5 h-3.5 text-white" />}
                              </button>
                              <button onClick={() => handleCancel(variant.variant_id)} className="p-1.5 rounded-[6px]" style={{ background: '#e3e3dc' }}>
                                <X className="w-3.5 h-3.5" style={{ color: '#43493e' }} />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => handleEdit(variant)} className="p-1.5 rounded-[6px] hover:opacity-70 transition-opacity" style={{ background: 'var(--color-surface-container-low)' }}>
                              <Edit3 className="w-3.5 h-3.5" style={{ color: 'var(--color-on-surface)' }} />
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
                  <Package className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--color-outline)' }} strokeWidth={1.5} />
                  <p className="font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                    {search ? 'No products match your search' : 'No inventory data'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
