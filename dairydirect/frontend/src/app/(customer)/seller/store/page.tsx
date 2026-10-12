"use client";

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { getSellerDashboard } from '@/lib/api/sellers';
import { Save, Store, Image as ImageIcon, Building, CreditCard, ShieldCheck } from 'lucide-react';

export default function SellerStoreSettings() {
  const { user, isAuthLoading } = useStore();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeId, setStoreId] = useState('');
  
  const [form, setForm] = useState({
    store_name: '',
    description: '',
    logo_url: '',
    banner_url: '',
    state: 'Gujarat',
    category: 'A2 Organic Dairy',
    gstin: '',
    fssai_number: '',
    bank_account: '',
    ifsc_code: '',
  });

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/auth/login?redirect=/seller/store');
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    if (user?.id) {
      getSellerDashboard(user.id).then(res => {
        if (res.store) {
          setStoreId(res.store.id);
          // Fetch full details
          fetch(`/api/sellers/${res.store.id}`)
            .then(r => r.json())
            .then(data => {
              if (data.seller) {
                setForm({
                  store_name: data.seller.store_name || '',
                  description: data.seller.description || '',
                  logo_url: data.seller.logo_url || '',
                  banner_url: data.seller.banner_url || '',
                  state: data.seller.state || 'Gujarat',
                  category: data.seller.category || 'A2 Organic Dairy',
                  gstin: data.seller.gstin || '',
                  fssai_number: data.seller.fssai_number || '',
                  bank_account: data.seller.bank_account || '',
                  ifsc_code: data.seller.ifsc_code || '',
                });
              }
              setLoading(false);
            })
            .catch(() => setLoading(false));
        } else {
          setLoading(false);
        }
      });
    }
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/sellers/${storeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        alert('Store settings updated successfully!');
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to update store settings');
    } finally {
      setSaving(false);
    }
  };

  if (isAuthLoading || loading) {
    return <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center font-bold text-gray-500">Loading store settings...</div>;
  }

  if (!storeId) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center flex-col gap-4">
        <Store className="w-16 h-16 text-gray-300" />
        <p className="text-gray-500 font-medium">You don't have an active store.</p>
        <button onClick={() => router.push('/become-seller')} className="text-emerald-600 font-bold hover:underline">
          Apply to Become a Seller
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#fafaf8] min-h-screen pb-16">
      <div className="max-w-[860px] mx-auto px-4 md:px-8 py-8 pt-24 md:pt-32">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">Store Settings & Live Profile</h1>
            <p className="text-xs text-gray-500 mt-1">Configure your public storefront branding, legal compliance, and payout bank account</p>
          </div>
          <button 
            type="button" 
            onClick={() => router.push('/seller/dashboard')}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 transition"
          >
            ← Back to Dashboard
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-8">
          {/* Section 1: Store Brand */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b pb-2 flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-600" />
              Store Identity
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Store Name *</label>
                <input 
                  type="text" required value={form.store_name} onChange={e => setForm({...form, store_name: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Store Category *</label>
                <input 
                  type="text" required value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g. A2 Organic Dairy, Sweets, Pure Ghee"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Operating State *</label>
              <input 
                type="text" required value={form.state} onChange={e => setForm({...form, state: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Store Description</label>
              <textarea 
                rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Tell customers about your farm, purity standards, and products..."
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Logo Image URL</label>
                <div className="flex gap-3 items-center">
                  <input 
                    type="url" value={form.logo_url} onChange={e => setForm({...form, logo_url: e.target.value})}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="https://..."
                  />
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="Logo" className="w-12 h-12 rounded-full object-cover border border-gray-200 shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Banner Image URL</label>
                <div className="flex gap-3 items-center">
                  <input 
                    type="url" value={form.banner_url} onChange={e => setForm({...form, banner_url: e.target.value})}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="https://..."
                  />
                  {form.banner_url ? (
                    <img src={form.banner_url} alt="Banner" className="w-20 h-12 rounded-lg object-cover border border-gray-200 shrink-0" />
                  ) : (
                    <div className="w-20 h-12 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Legal & Compliance */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b pb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Tax & Legal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">GSTIN Number</label>
                <input 
                  type="text" value={form.gstin} onChange={e => setForm({...form, gstin: e.target.value.toUpperCase()})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                  placeholder="e.g. 24AAAAA0000A1Z5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">FSSAI License Number</label>
                <input 
                  type="text" value={form.fssai_number} onChange={e => setForm({...form, fssai_number: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                  placeholder="14-digit FSSAI Number"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Banking & Payouts */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b pb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Direct Bank Settlement Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Bank Account Number</label>
                <input 
                  type="text" value={form.bank_account} onChange={e => setForm({...form, bank_account: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                  placeholder="Account number for NEFT"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Bank IFSC Code</label>
                <input 
                  type="text" value={form.ifsc_code} onChange={e => setForm({...form, ifsc_code: e.target.value.toUpperCase()})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                  placeholder="e.g. SBIN0001234"
                />
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
            <button 
              type="button" onClick={() => router.push('/seller/dashboard')}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button 
              type="submit" disabled={saving}
              className="px-6 py-2.5 bg-[#0f3e26] text-white text-xs font-bold rounded-xl hover:bg-[#144f31] transition flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving Live Changes...' : 'Save Live Store Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
