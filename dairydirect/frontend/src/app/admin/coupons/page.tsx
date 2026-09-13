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
    discount_amount: 0,
    min_order_amount: 0,
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
        discount_amount: coupon.discount_amount,
        min_order_amount: coupon.min_order_amount || 0,
        valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : '',
        is_active: coupon.is_active,
        max_usage: coupon.max_usage || 100
      });
    } else {
      setEditingId(null);
      setForm({
        code: '',
        discount_amount: 0,
        min_order_amount: 0,
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
        ...form,
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
        alert(`Error: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
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
            {coupons.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-bold text-gray-900">{c.code}</td>
                <td className="px-6 py-4">₹{c.discount_amount}</td>
                <td className="px-6 py-4">₹{c.min_order_amount}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {c.valid_until ? new Date(c.valid_until).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{c.usage_count} / {c.max_usage}</td>
                <td className="px-6 py-4">
                  <button onClick={() => toggleStatus(c.id, c.is_active)} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {c.is_active ? <CheckCircle2 className="w-3.5 h-3.5"/> : <XCircle className="w-3.5 h-3.5"/>}
                    {c.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 flex items-center gap-3">
                  <button onClick={() => handleOpen(c)} className="text-blue-600 hover:text-blue-800"><Edit2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
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
                <input required type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border rounded-lg uppercase" placeholder="e.g. WELCOME50"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Discount (₹)</label>
                  <input required type="number" value={form.discount_amount} onChange={e => setForm({...form, discount_amount: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" min="0"/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Min Order (₹)</label>
                  <input type="number" value={form.min_order_amount} onChange={e => setForm({...form, min_order_amount: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" min="0"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Valid Until</label>
                  <input type="date" value={form.valid_until} onChange={e => setForm({...form, valid_until: e.target.value})} className="w-full px-3 py-2 border rounded-lg"/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Usage</label>
                  <input type="number" value={form.max_usage} onChange={e => setForm({...form, max_usage: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" min="1"/>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input type="checkbox" id="isActive" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="w-4 h-4 rounded text-[#0f3e26]" />
                <label htmlFor="isActive" className="text-sm font-medium">Coupon is active</label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#0f3e26] text-white rounded-lg">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
