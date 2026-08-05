"use client";

import { useState, useEffect } from 'react';
import {
  Settings, Shield, Clock, Truck, Percent, Save,
  ArrowLeft, CheckCircle2, AlertCircle, Loader2, IndianRupee
} from 'lucide-react';
import Link from 'next/link';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>({
    min_profit_margin_percent: 20,
    delivery_fee: 30,
    free_delivery_threshold: 300,
    tax_rate_percent: 0,
    morning_cutoff_time: '21:00',
    evening_cutoff_time: '14:00',
    is_ordering_enabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) setSettings(data.settings);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setToast(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          min_profit_margin_percent: Number(settings.min_profit_margin_percent),
          delivery_fee: Number(settings.delivery_fee),
          free_delivery_threshold: Number(settings.free_delivery_threshold),
          tax_rate_percent: Number(settings.tax_rate_percent),
          morning_cutoff_time: settings.morning_cutoff_time,
          evening_cutoff_time: settings.evening_cutoff_time,
          is_ordering_enabled: settings.is_ordering_enabled,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save');

      setToast({ type: 'success', message: 'Settings successfully updated!' });
    } catch (err: any) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-background)' }}>
      {/* Header */}
      <div className="px-6 md:px-10 pt-8 pb-6" style={{ background: 'var(--color-surface-container-lowest)', borderBottom: '1px solid rgba(195,201,187,0.2)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-1.5 rounded-[8px] hover:opacity-70 transition-opacity" style={{ background: 'var(--color-surface-container-low)' }}>
              <ArrowLeft className="w-4 h-4" style={{ color: 'var(--color-on-surface)' }} />
            </Link>
            <div>
              <h1 className="font-extrabold text-[24px]" style={{ color: 'var(--color-on-surface)' }}>Business Configuration</h1>
              <p className="text-[12px]" style={{ color: 'var(--color-outline)' }}>Profit protection rules, cutoff timings, and delivery fees</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-10 py-6 max-w-4xl">
        {toast && (
          <div className="mb-6 p-4 rounded-[12px] flex items-center gap-3" style={{
            background: toast.type === 'success' ? '#c2efac' : '#ffdad6',
            color: toast.type === 'success' ? '#2d5a27' : '#93000a',
          }}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-[13px] font-semibold">{toast.message}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--color-primary)' }} /></div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-6">
            {/* Profit Margin Protection Card */}
            <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(195,201,187,0.25)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                <h2 className="font-bold text-[16px]" style={{ color: 'var(--color-on-surface)' }}>Profit Margin Protection</h2>
              </div>
              <p className="text-[12px] mb-4" style={{ color: 'var(--color-outline)' }}>
                System-level guard: No product or coupon will be allowed to sell below this margin over cost price.
              </p>
              <div>
                <label className="block text-[12px] font-bold mb-1" style={{ color: 'var(--color-on-surface)' }}>
                  Minimum Profit Margin (%)
                </label>
                <div className="flex items-center gap-2 max-w-xs">
                  <input
                    type="number"
                    min="5"
                    max="100"
                    step="0.5"
                    value={settings.min_profit_margin_percent}
                    onChange={e => setSettings({ ...settings, min_profit_margin_percent: e.target.value })}
                    className="w-full px-3 py-2 rounded-[10px] text-[14px] font-bold border"
                    style={{ background: 'var(--color-surface-container-low)', borderColor: 'rgba(195,201,187,0.4)', color: 'var(--color-on-surface)' }}
                  />
                  <span className="font-bold text-[14px]" style={{ color: 'var(--color-outline)' }}>%</span>
                </div>
              </div>
            </div>

            {/* Delivery Fees & Thresholds */}
            <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(195,201,187,0.25)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Truck className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                <h2 className="font-bold text-[16px]" style={{ color: 'var(--color-on-surface)' }}>Delivery & Free Shipping Thresholds</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold mb-1" style={{ color: 'var(--color-on-surface)' }}>
                    Standard Delivery Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.delivery_fee}
                    onChange={e => setSettings({ ...settings, delivery_fee: e.target.value })}
                    className="w-full px-3 py-2 rounded-[10px] text-[14px] font-bold border"
                    style={{ background: 'var(--color-surface-container-low)', borderColor: 'rgba(195,201,187,0.4)', color: 'var(--color-on-surface)' }}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold mb-1" style={{ color: 'var(--color-on-surface)' }}>
                    Free Delivery Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.free_delivery_threshold}
                    onChange={e => setSettings({ ...settings, free_delivery_threshold: e.target.value })}
                    className="w-full px-3 py-2 rounded-[10px] text-[14px] font-bold border"
                    style={{ background: 'var(--color-surface-container-low)', borderColor: 'rgba(195,201,187,0.4)', color: 'var(--color-on-surface)' }}
                  />
                </div>
              </div>
            </div>

            {/* Order Cutoff Timings */}
            <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(195,201,187,0.25)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                <h2 className="font-bold text-[16px]" style={{ color: 'var(--color-on-surface)' }}>Delivery Cutoff Timings</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold mb-1" style={{ color: 'var(--color-on-surface)' }}>
                    Morning Slot Cutoff (e.g. 21:00 for next morning)
                  </label>
                  <input
                    type="time"
                    value={settings.morning_cutoff_time || '21:00'}
                    onChange={e => setSettings({ ...settings, morning_cutoff_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-[10px] text-[14px] font-bold border"
                    style={{ background: 'var(--color-surface-container-low)', borderColor: 'rgba(195,201,187,0.4)', color: 'var(--color-on-surface)' }}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold mb-1" style={{ color: 'var(--color-on-surface)' }}>
                    Evening Slot Cutoff (e.g. 14:00 for same evening)
                  </label>
                  <input
                    type="time"
                    value={settings.evening_cutoff_time || '14:00'}
                    onChange={e => setSettings({ ...settings, evening_cutoff_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-[10px] text-[14px] font-bold border"
                    style={{ background: 'var(--color-surface-container-low)', borderColor: 'rgba(195,201,187,0.4)', color: 'var(--color-on-surface)' }}
                  />
                </div>
              </div>
            </div>

            {/* Ordering Toggle */}
            <div className="rounded-[16px] p-6 flex items-center justify-between" style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(195,201,187,0.25)' }}>
              <div>
                <h2 className="font-bold text-[15px]" style={{ color: 'var(--color-on-surface)' }}>Accepting Customer Orders</h2>
                <p className="text-[12px]" style={{ color: 'var(--color-outline)' }}>Toggle off during stock counts or holiday closures</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.is_ordering_enabled}
                  onChange={e => setSettings({ ...settings, is_ordering_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4a8c3f]"></div>
              </label>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center justify-center gap-2 py-3 rounded-[12px] font-bold text-[14px] text-white shadow-md transition-opacity"
              style={{ background: 'var(--color-primary)', opacity: isSaving ? 0.7 : 1 }}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Saving Changes...' : 'Save Configuration'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
