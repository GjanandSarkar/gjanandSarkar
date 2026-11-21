"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Ticket } from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTable } from '@/components/admin/AdminTable';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: '',
    type: 'flat' as 'flat' | 'percentage',
    discount_amount: 0,
    min_order_amount: 0,
    max_discount: '',
    valid_until: '',
    is_active: true,
    max_usage: 100
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/coupons?admin=true');
      const data = await res.json();
      if (data.coupons) {
        setCoupons(data.coupons);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (coupon?: any) => {
    if (coupon) {
      setEditingId(coupon.id);
      setForm({
        code: coupon.code,
        type: coupon.type === 'percentage' ? 'percentage' : 'flat',
        discount_amount: coupon.discount_amount ?? coupon.value ?? 0,
        min_order_amount: coupon.min_order_amount ?? coupon.min_order_value ?? 0,
        max_discount: coupon.max_discount != null ? String(coupon.max_discount) : '',
        valid_until: (coupon.valid_until || coupon.expiry_date) ? (coupon.valid_until || coupon.expiry_date).split('T')[0] : '',
        is_active: coupon.is_active ?? true,
        max_usage: coupon.max_usage ?? coupon.max_uses ?? 100
      });
    } else {
      setEditingId(null);
      setForm({
        code: '',
        type: 'flat',
        discount_amount: 0,
        min_order_amount: 0,
        max_discount: '',
        valid_until: '',
        is_active: true,
        max_usage: 100
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.discount_amount),
        discount_amount: Number(form.discount_amount),
        min_order_value: Number(form.min_order_amount),
        min_order_amount: Number(form.min_order_amount),
        max_discount: form.type === 'percentage' && form.max_discount ? Number(form.max_discount) : null,
        max_uses: Number(form.max_usage),
        max_usage: Number(form.max_usage),
        is_active: form.is_active,
        expiry_date: form.valid_until ? new Date(form.valid_until).toISOString() : null,
        valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null
      };

      const res = await fetch('/api/coupons', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload)
      });
      if (res.ok) {
        setShowModal(false);
        fetchCoupons();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'Failed to save coupon'}`);
      }
    } catch (e) {
      console.error(e);
      alert('An unexpected error occurred while saving.');
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !currentStatus })
      });
      if (res.ok) fetchCoupons();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon ${code}?`)) return;
    try {
      const res = await fetch(`/api/coupons?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchCoupons();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'Failed to delete'}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
<<<<<<< HEAD
    <div className="flex flex-col min-h-screen">
      {/* Standard Admin Header */}
      <AdminHeader
        title="Coupons Management"
        subtitle="Create and manage customer promotional discount vouchers"
        onRefresh={fetchCoupons}
        isRefreshing={loading}
        actions={
          <button
            onClick={() => handleOpen()}
            className="flex items-center gap-2 px-4 py-2 rounded-[12px] font-bold text-[13px] text-white transition-all shadow-xs active:scale-95 cursor-pointer"
            style={{ background: 'var(--color-primary)' }}
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>Add Coupon</span>
          </button>
        }
      />
=======
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons Management</h1>
          <p className="text-gray-500">Create and manage discount codes.</p>
        </div>
        <button 
          type="button"
          onClick={() => handleOpen()} 
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Coupon</span>
        </button>
      </div>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613

      <div className="px-6 md:px-10 py-6">
        <AdminTable
          columns={[
            { header: 'Coupon Code' },
            { header: 'Discount' },
            { header: 'Min Order' },
            { header: 'Valid Until' },
            { header: 'Usage Limit' },
            { header: 'Status' },
            { header: 'Actions', align: 'right' },
          ]}
          isLoading={loading}
          isEmpty={!loading && coupons.length === 0}
          emptyIcon={Ticket}
          emptyTitle="No coupons created yet"
          emptyDescription="Add promotional discount codes to incentivize your customers."
        >
          {coupons.map((c) => {
            const isPercentage = c.type === 'percentage';
            const discountText = isPercentage 
              ? `${c.value ?? c.discount_amount}%` 
              : `₹${c.value ?? c.discount_amount}`;

<<<<<<< HEAD
            return (
              <tr key={c.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                <td className="px-5 py-3.5 font-bold text-foreground">
                  <span className="font-mono bg-surface-container px-2.5 py-1 rounded-[8px] text-[13px] font-bold border border-border/60">
                    {c.code}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-bold text-[13px] text-primary">
                  {discountText}
                  {isPercentage && c.max_discount ? ` (up to ₹${c.max_discount})` : ''}
                </td>
                <td className="px-5 py-3.5 text-xs font-semibold text-foreground">
                  ₹{c.min_order_value ?? c.min_order_amount ?? 0}
                </td>
                <td className="px-5 py-3.5 text-xs text-foreground-muted">
                  {(c.expiry_date || c.valid_until) ? new Date(c.expiry_date || c.valid_until).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-5 py-3.5 text-xs text-foreground-muted">
                  {c.used_count ?? c.usage_count ?? 0} / {c.max_uses ?? c.max_usage ?? '∞'}
                </td>
                <td className="px-5 py-3.5">
                  <button
                    onClick={() => toggleStatus(c.id, c.is_active)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer transition-opacity hover:opacity-80 ${
                      c.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                    }`}
                  >
                    {c.is_active ? <CheckCircle2 className="w-3.5 h-3.5"/> : <XCircle className="w-3.5 h-3.5"/>}
                    <span>{c.is_active ? 'Active' : 'Inactive'}</span>
                  </button>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpen(c)}
                      className="p-1.5 rounded-lg hover:bg-surface-muted text-primary cursor-pointer transition-colors"
                      title="Edit Coupon"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.code)}
                      className="p-1.5 rounded-lg hover:bg-surface-muted text-error cursor-pointer transition-colors"
                      title="Delete Coupon"
                    >
=======
              return (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-gray-900">
                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-sm">{c.code}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-emerald-700">
                    {discountText}
                    {isPercentage && c.max_discount ? ` (up to ₹${c.max_discount})` : ''}
                  </td>
                  <td className="px-6 py-4">₹{c.min_order_value ?? c.min_order_amount ?? 0}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {(c.expiry_date || c.valid_until) ? new Date(c.expiry_date || c.valid_until).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {c.used_count ?? c.usage_count ?? 0} / {c.max_uses ?? c.max_usage ?? '∞'}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleStatus(c.id, c.is_active)} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${c.is_active ? 'bg-green-100 text-success' : 'bg-red-100 text-danger'}`}>
                      {c.is_active ? <CheckCircle2 className="w-3.5 h-3.5"/> : <XCircle className="w-3.5 h-3.5"/>}
                      {c.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 flex items-center gap-3">
                    <button onClick={() => handleOpen(c)} className="text-info hover:text-info" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id, c.code)} className="text-danger hover:text-danger" title="Delete">
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </AdminTable>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md p-6 border border-border" style={{ background: 'var(--color-surface)' }}>
            <h2 className="text-xl font-bold mb-4 text-foreground">{editingId ? 'Edit Coupon' : 'Create Coupon'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground-muted mb-1 uppercase tracking-wide">Coupon Code</label>
                <input
                  required
                  type="text"
                  value={form.code}
                  onChange={e => setForm({...form, code: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-border rounded-xl uppercase font-mono bg-surface-container-low text-foreground outline-none focus:border-primary text-sm font-bold"
                  placeholder="e.g. WELCOME50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground-muted mb-1 uppercase tracking-wide">Discount Type</label>
                  <select 
                    value={form.type} 
                    onChange={e => setForm({...form, type: e.target.value as any})}
                    className="w-full px-3 py-2 border border-border rounded-xl bg-surface-container-low text-foreground text-sm outline-none"
                  >
                    <option value="flat">Flat Amount (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground-muted mb-1 uppercase tracking-wide">
                    {form.type === 'percentage' ? 'Discount (%)' : 'Discount (₹)'}
                  </label>
                  <input
                    required
                    type="number"
                    value={form.discount_amount}
                    onChange={e => setForm({...form, discount_amount: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-border rounded-xl bg-surface-container-low text-foreground text-sm outline-none"
                    min="1"
                    max={form.type === 'percentage' ? 100 : undefined}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground-muted mb-1 uppercase tracking-wide">Min Order (₹)</label>
                  <input
                    type="number"
                    value={form.min_order_amount}
                    onChange={e => setForm({...form, min_order_amount: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-border rounded-xl bg-surface-container-low text-foreground text-sm outline-none"
                    min="0"
                  />
                </div>
                {form.type === 'percentage' ? (
                  <div>
                    <label className="block text-xs font-bold text-foreground-muted mb-1 uppercase tracking-wide">Max Discount (₹)</label>
                    <input
                      type="number"
                      value={form.max_discount}
                      onChange={e => setForm({...form, max_discount: e.target.value})}
                      className="w-full px-3 py-2 border border-border rounded-xl bg-surface-container-low text-foreground text-sm outline-none"
                      placeholder="Optional"
                      min="1"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-foreground-muted mb-1 uppercase tracking-wide">Max Usage Count</label>
                    <input
                      type="number"
                      value={form.max_usage}
                      onChange={e => setForm({...form, max_usage: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-border rounded-xl bg-surface-container-low text-foreground text-sm outline-none"
                      min="1"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground-muted mb-1 uppercase tracking-wide">Valid Until</label>
                  <input
                    type="date"
                    value={form.valid_until}
                    onChange={e => setForm({...form, valid_until: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-xl bg-surface-container-low text-foreground text-sm outline-none"
                  />
                </div>
                {form.type === 'percentage' && (
                  <div>
                    <label className="block text-xs font-bold text-foreground-muted mb-1 uppercase tracking-wide">Max Usage Count</label>
                    <input
                      type="number"
                      value={form.max_usage}
                      onChange={e => setForm({...form, max_usage: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-border rounded-xl bg-surface-container-low text-foreground text-sm outline-none"
                      min="1"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-4">
<<<<<<< HEAD
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.is_active}
                  onChange={e => setForm({...form, is_active: e.target.checked})}
                  className="w-4 h-4 rounded text-primary"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-foreground cursor-pointer">Coupon is active</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-container-low hover:bg-surface-muted text-foreground transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  Save Coupon
                </button>
=======
                <input type="checkbox" id="isActive" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="w-4 h-4 rounded text-primary focus:ring-primary" />
                <label htmlFor="isActive" className="text-sm font-medium">Coupon is active</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-xs font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg shadow-2xs transition text-xs font-bold cursor-pointer">Save</button>
>>>>>>> c80e27e54a7a9fd8b6f001d1c284f29909639613
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
