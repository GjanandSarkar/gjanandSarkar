"use client";

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { getSellerDashboard } from '@/lib/api/sellers';
import { Save, Store, Image as ImageIcon } from 'lucide-react';

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
    banner_url: ''
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
                  banner_url: data.seller.banner_url || ''
                });
              }
              setLoading(false);
            });
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
    return <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">Loading...</div>;
  }

  if (!storeId) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center flex-col gap-4">
        <Store className="w-16 h-16 text-gray-300" />
        <p className="text-gray-500">You don't have an active store.</p>
        <button onClick={() => router.push('/')} className="text-emerald-600 font-bold hover:underline">Go to Home</button>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#fafaf8] min-h-screen pb-16">
      <div className="max-w-[800px] mx-auto px-4 md:px-8 py-8 pt-24 md:pt-32">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Store Settings</h1>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
            <input 
              type="text" required value={form.store_name} onChange={e => setForm({...form, store_name: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Description</label>
            <textarea 
              rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Tell customers about your farm and products..."
            ></textarea>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
              <div className="flex gap-4 items-start">
                <input 
                  type="url" value={form.logo_url} onChange={e => setForm({...form, logo_url: e.target.value})}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="https://example.com/logo.png"
                />
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo preview" className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Banner URL</label>
              <div className="flex gap-4 items-start">
                <input 
                  type="url" value={form.banner_url} onChange={e => setForm({...form, banner_url: e.target.value})}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="https://example.com/banner.png"
                />
                {form.banner_url ? (
                  <img src={form.banner_url} alt="Banner preview" className="w-20 h-12 rounded object-cover border border-gray-200" />
                ) : (
                  <div className="w-20 h-12 rounded bg-gray-100 border border-gray-200 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-gray-100 flex justify-end gap-4">
            <button 
              type="button" onClick={() => router.push('/seller/dashboard')}
              className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button 
              type="submit" disabled={saving}
              className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
