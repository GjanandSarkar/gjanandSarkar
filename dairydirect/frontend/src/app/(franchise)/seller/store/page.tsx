"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Save, 
  Store, 
  Image as ImageIcon, 
  CreditCard, 
  ShieldCheck, 
  AlertCircle,
  LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { getSellerDashboard } from '@/lib/api/sellers';
import { PageShell } from '@/components/franchise/PageShell';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

export default function SellerStoreSettings() {
  const { user, isAuthLoading } = useStore();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeId, setStoreId] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
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
      router.push('/login?redirect=/seller/store');
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    if (user?.id) {
      getSellerDashboard(user.id).then((res) => {
        if (res?.store) {
          setStoreId(res.store.id);
          fetch(`/api/sellers/${res.store.id}`)
            .then((r) => r.json())
            .then((data) => {
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
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/sellers/${storeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Store settings updated successfully!' });
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMessage({ type: 'error', text: err.error || 'Failed to update store settings' });
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e.message || 'Failed to update store settings' });
    } finally {
      setSaving(false);
    }
  };

  if (isAuthLoading || loading) {
    return (
      <PageShell
        title="Products & Store Settings"
        subtitle="Manage public storefront branding, legal compliance, and payout bank accounts."
      >
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-36 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-36 w-full rounded-[var(--radius-lg)]" />
        </div>
      </PageShell>
    );
  }

  if (!storeId) {
    return (
      <PageShell
        title="Products & Store Settings"
        subtitle="Manage public storefront branding, legal compliance, and payout bank accounts."
      >
        <EmptyState
          icon={<Store className="w-8 h-8 text-foreground-muted" />}
          title="No active store found"
          description="You do not currently have an active seller profile associated with this account."
          action={
            <Link href="/become-seller">
              <Button variant="navy">Apply to Become a Seller</Button>
            </Link>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Store Settings & Live Profile"
      subtitle="Configure your public storefront branding, legal tax compliance, and direct settlement accounts."
      actions={
        <Link href="/seller/dashboard">
          <Button variant="outline" size="sm" leftIcon={<LayoutDashboard className="w-4 h-4" />}>
            Console Overview
          </Button>
        </Link>
      }
    >
      {statusMessage && (
        <div
          role="alert"
          className={`flex items-start gap-2.5 rounded-[var(--radius-md)] p-3 text-xs border ${
            statusMessage.type === 'success'
              ? 'bg-success-bg border-success/20 text-success'
              : 'bg-danger-bg border-danger/20 text-danger'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-surface rounded-[var(--radius-xl)] border border-border p-5 sm:p-7 space-y-7 shadow-xs">
        {/* Section 1: Store Brand */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Store className="w-4 h-4 text-secondary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Store Identity & Branding
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Store Name *
              </label>
              <input 
                type="text" 
                required 
                value={form.store_name} 
                onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                className="w-full h-11 px-3.5 rounded-[var(--radius-md)] bg-surface border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Store Category *
              </label>
              <input 
                type="text" 
                required 
                value={form.category} 
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full h-11 px-3.5 rounded-[var(--radius-md)] bg-surface border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-colors"
                placeholder="e.g. A2 Organic Dairy, Pure Ghee, Sweets"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Operating State *
            </label>
            <input 
              type="text" 
              required 
              value={form.state} 
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="w-full h-11 px-3.5 rounded-[var(--radius-md)] bg-surface border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Store Description
            </label>
            <textarea 
              rows={3} 
              value={form.description} 
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full p-3 rounded-[var(--radius-md)] bg-surface border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-colors"
              placeholder="Tell customers about your dairy farm, purity certifications, and product standards..."
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Logo Image URL
              </label>
              <div className="flex gap-3 items-center">
                <input 
                  type="url" 
                  value={form.logo_url} 
                  onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  className="flex-1 h-11 px-3.5 rounded-[var(--radius-md)] bg-surface border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-colors"
                  placeholder="https://..."
                />
                {form.logo_url ? (
                  <img 
                    src={form.logo_url} 
                    alt="Logo preview" 
                    className="w-11 h-11 rounded-full object-cover border border-border shrink-0" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-surface-muted border border-border flex items-center justify-center shrink-0">
                    <ImageIcon className="w-5 h-5 text-foreground-muted" />
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Banner Image URL
              </label>
              <div className="flex gap-3 items-center">
                <input 
                  type="url" 
                  value={form.banner_url} 
                  onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
                  className="flex-1 h-11 px-3.5 rounded-[var(--radius-md)] bg-surface border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-colors"
                  placeholder="https://..."
                />
                {form.banner_url ? (
                  <img 
                    src={form.banner_url} 
                    alt="Banner preview" 
                    className="w-16 h-11 rounded-[var(--radius-sm)] object-cover border border-border shrink-0" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-11 rounded-[var(--radius-sm)] bg-surface-muted border border-border flex items-center justify-center shrink-0">
                    <ImageIcon className="w-5 h-5 text-foreground-muted" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Legal & Compliance */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <ShieldCheck className="w-4 h-4 text-secondary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Tax & Legal Information
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                GSTIN Number
              </label>
              <input 
                type="text" 
                value={form.gstin} 
                onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                className="w-full h-11 px-3.5 rounded-[var(--radius-md)] bg-surface border border-border text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-colors uppercase"
                placeholder="24AAAAA0000A1Z5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                FSSAI License Number
              </label>
              <input 
                type="text" 
                value={form.fssai_number} 
                onChange={(e) => setForm({ ...form, fssai_number: e.target.value })}
                className="w-full h-11 px-3.5 rounded-[var(--radius-md)] bg-surface border border-border text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-colors"
                placeholder="14-digit FSSAI Number"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Banking & Payouts */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <CreditCard className="w-4 h-4 text-secondary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Direct Settlement Bank Details
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Bank Account Number
              </label>
              <input 
                type="text" 
                value={form.bank_account} 
                onChange={(e) => setForm({ ...form, bank_account: e.target.value })}
                className="w-full h-11 px-3.5 rounded-[var(--radius-md)] bg-surface border border-border text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-colors tabular"
                placeholder="Account number for NEFT"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Bank IFSC Code
              </label>
              <input 
                type="text" 
                value={form.ifsc_code} 
                onChange={(e) => setForm({ ...form, ifsc_code: e.target.value.toUpperCase() })}
                className="w-full h-11 px-3.5 rounded-[var(--radius-md)] bg-surface border border-border text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-colors uppercase"
                placeholder="SBIN0001234"
              />
            </div>
          </div>
        </div>
        
        {/* Actions Bar */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-end gap-3">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => router.push('/seller/dashboard')}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="navy" 
            loading={saving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Live Store Settings
          </Button>
        </div>
      </form>
    </PageShell>
  );
}
