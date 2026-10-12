"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';

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

  if (loading) return <div className="p-8">Loading coupons...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons Management</h1>
          <p className="text-gray-500">Create and manage discount codes.</p>
        </div>
        <button onClick={() => handleOpen()} className="flex items-center gap-2 bg-[#0f3e26] text-white px-4 py-2 rounded-lg hover:bg-emerald-900 transition">
          <Plus className="w-4 h-4" /> Add Coupon
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4 font-medium">Code</th>
              <th className="px-6 py-4 font-medium">Discount</th>
              <th className="px-6 py-4 font-medium">Min Order</th>
              <th className="px-6 py-4 font-medium">Valid Until</th>
              <th className="px-6 py-4 font-medium">Usage</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {coupons.map(c => {
              const isPercentage = c.type === 'percentage';
              const discountText = isPercentage 
                ? `${c.value ?? c.discount_amount}%` 
                : `₹${c.value ?? c.discount_amount}`;

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
                    <button onClick={() => toggleStatus(c.id, c.is_active)} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {c.is_active ? <CheckCircle2 className="w-3.5 h-3.5"/> : <XCircle className="w-3.5 h-3.5"/>}
                      {c.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 flex items-center gap-3">
                    <button onClick={() => handleOpen(c)} className="text-blue-600 hover:text-blue-800" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id, c.code)} className="text-red-500 hover:text-red-700" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {coupons.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No coupons found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Coupon' : 'Create Coupon'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Coupon Code</label>
                <input required type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border rounded-lg uppercase font-mono" placeholder="e.g. WELCOME50"/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Discount Type</label>
                  <select 
                    value={form.type} 
                    onChange={e => setForm({...form, type: e.target.value as any})}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="flat">Flat Amount (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {form.type === 'percentage' ? 'Discount (%)' : 'Discount (₹)'}
                  </label>
                  <input required type="number" value={form.discount_amount} onChange={e => setForm({...form, discount_amount: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" min="1" max={form.type === 'percentage' ? 100 : undefined}/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Min Order (₹)</label>
                  <input type="number" value={form.min_order_amount} onChange={e => setForm({...form, min_order_amount: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" min="0"/>
                </div>
                {form.type === 'percentage' ? (
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Discount (₹)</label>
                    <input type="number" value={form.max_discount} onChange={e => setForm({...form, max_discount: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Optional" min="1"/>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Usage Count</label>
                    <input type="number" value={form.max_usage} onChange={e => setForm({...form, max_usage: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" min="1"/>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Valid Until</label>
                  <input type="date" value={form.valid_until} onChange={e => setForm({...form, valid_until: e.target.value})} className="w-full px-3 py-2 border rounded-lg"/>
                </div>
                {form.type === 'percentage' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Usage Count</label>
                    <input type="number" value={form.max_usage} onChange={e => setForm({...form, max_usage: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" min="1"/>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input type="checkbox" id="isActive" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="w-4 h-4 rounded text-[#0f3e26]" />
                <label htmlFor="isActive" className="text-sm font-medium">Coupon is active</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#0f3e26] text-white rounded-lg hover:bg-emerald-900 transition">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
