"use client";

import { useCallback, useEffect, useState } from 'react';
import {
  Megaphone,
  Loader2,
  AlertCircle,
  Plus,
  TrendingUp,
  MousePointerClick,
  Eye,
  IndianRupee,
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  objective: string;
  status: string;
  placements: string[];
  product_ids: string[];
  target_category: string | null;
  priority: number;
  spend_amount: number;
  daily_frequency_cap: number | null;
  starts_at: string | null;
  ends_at: string | null;
}

interface Metrics {
  campaignId: string;
  name: string;
  objective: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number | null;
  conversionRate: number | null;
  roas: number | null;
}

const PLACEMENTS = ['home', 'product', 'category', 'cart', 'search'] as const;
const OBJECTIVES = ['awareness', 'traffic', 'conversions', 'clearance'] as const;

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-success-bg text-success border-success/20',
  paused: 'bg-warning-bg text-warning border-warning/20',
  draft: 'bg-surface-muted text-foreground-muted border-border',
  ended: 'bg-surface-muted text-foreground-muted border-border',
};

/** Percentages are shown as "—" when the denominator is zero. */
function pct(value: number | null): string {
  return value === null ? '—' : `${(value * 100).toFixed(1)}%`;
}

function money(value: number): string {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [metrics, setMetrics] = useState<Metrics[]>([]);
  const [analyticsConfigured, setAnalyticsConfigured] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [cRes, mRes] = await Promise.all([
        fetch('/api/admin/campaigns', { credentials: 'include' }),
        fetch('/api/admin/ads/metrics', { credentials: 'include' }),
      ]);
      const cBody = await cRes.json();
      const mBody = await mRes.json();
      if (!cRes.ok) throw new Error(cBody.error || 'Could not load campaigns');

      setCampaigns(cBody.campaigns ?? []);
      setMetrics(mBody.metrics ?? []);
      setAnalyticsConfigured(mBody.analyticsConfigured !== false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const metricsFor = (id: string) => metrics.find((m) => m.campaignId === id);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not update the campaign');
      }
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  // Totals across every campaign, so the overall picture is visible without
  // mentally adding up rows.
  const totals = metrics.reduce(
    (acc, m) => ({
      spend: acc.spend + m.spend,
      impressions: acc.impressions + m.impressions,
      clicks: acc.clicks + m.clicks,
      revenue: acc.revenue + m.revenue,
    }),
    { spend: 0, impressions: 0, clicks: 0, revenue: 0 }
  );
  const blendedRoas = totals.spend > 0 ? totals.revenue / totals.spend : null;

  return (
    <div className="px-1 py-2">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Megaphone className="w-5 h-5 text-primary" />
            <h1 className="text-xl sm:text-2xl font-black text-foreground">Ad Campaigns</h1>
          </div>
          <p className="text-sm text-foreground-muted">
            House promotions across the storefront, with impression, click and ROAS tracking.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          {showForm ? 'Close' : 'New Campaign'}
        </button>
      </div>

      {!analyticsConfigured && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-warning/20 bg-warning-bg px-3 py-2.5 text-[13px] text-warning">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            External analytics is not configured, so A/B results are not being forwarded for
            analysis. Set <code className="font-mono">POSTHOG_KEY</code> to enable it.
            The figures below are still recorded first-party and are accurate.
          </span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-xl border border-error/20 bg-error-bg px-3 py-2.5 text-[13px] text-error"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {showForm && <CampaignForm onCreated={() => { setShowForm(false); void load(); }} />}

      {/* ─── Totals ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <SummaryCard icon={Eye} label="Impressions" value={totals.impressions.toLocaleString('en-IN')} />
        <SummaryCard icon={MousePointerClick} label="Clicks" value={totals.clicks.toLocaleString('en-IN')} />
        <SummaryCard icon={IndianRupee} label="Attributed revenue" value={money(totals.revenue)} />
        <SummaryCard
          icon={TrendingUp}
          label="Blended ROAS"
          value={blendedRoas === null ? '—' : `${blendedRoas.toFixed(2)}x`}
          hint={blendedRoas === null ? 'No spend recorded yet' : undefined}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 justify-center py-14 text-sm text-foreground-muted">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading campaigns…
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-14 rounded-2xl border border-border bg-surface">
          <Megaphone className="w-10 h-10 mx-auto mb-3 text-foreground-muted" />
          <p className="font-bold text-foreground mb-1">No campaigns yet</p>
          <p className="text-sm text-foreground-muted">
            Create one to start promoting products on the storefront.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[920px] text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-muted/60">
                {['Campaign', 'Objective', 'Placements', 'Impr.', 'Clicks', 'CTR', 'Conv.', 'Spend', 'ROAS', 'Status'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-foreground-muted whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const m = metricsFor(c.id);
                return (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-muted/50">
                    <td className="px-3 py-3 text-[13px] font-bold text-foreground">
                      {c.name}
                      {c.target_category && (
                        <span className="block text-[11px] font-medium text-foreground-muted">
                          {c.target_category}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-foreground-muted capitalize">{c.objective}</td>
                    <td className="px-3 py-3 text-[11px] text-foreground-muted">{c.placements?.join(', ')}</td>
                    <td className="px-3 py-3 text-[13px] text-foreground tabular-nums">
                      {(m?.impressions ?? 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-3 text-[13px] text-foreground tabular-nums">
                      {(m?.clicks ?? 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-3 text-[13px] text-foreground tabular-nums">{pct(m?.ctr ?? null)}</td>
                    <td className="px-3 py-3 text-[13px] text-foreground tabular-nums">
                      {(m?.conversions ?? 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-3 text-[13px] text-foreground tabular-nums">
                      {money(m?.spend ?? 0)}
                    </td>
                    <td className="px-3 py-3 text-[13px] font-bold tabular-nums">
                      {m?.roas == null ? (
                        <span className="text-foreground-muted">—</span>
                      ) : (
                        <span className={m.roas >= 1 ? 'text-success' : 'text-error'}>
                          {m.roas.toFixed(2)}x
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={c.status}
                        onChange={(e) => updateStatus(c.id, e.target.value)}
                        aria-label={`Status for ${c.name}`}
                        className={`text-[11px] font-bold uppercase tracking-wide rounded-lg border px-2 py-1 cursor-pointer ${
                          STATUS_STYLES[c.status] ?? STATUS_STYLES.draft
                        }`}
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="ended">Ended</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: any;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-foreground-muted" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted">{label}</span>
      </div>
      <p className="text-xl font-black text-foreground tabular-nums">{value}</p>
      {hint && <p className="text-[11px] text-foreground-muted mt-0.5">{hint}</p>}
    </div>
  );
}

function CampaignForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [objective, setObjective] = useState<string>('conversions');
  const [placements, setPlacements] = useState<string[]>(['home']);
  const [targetCategory, setTargetCategory] = useState('');
  const [productIds, setProductIds] = useState('');
  const [spendAmount, setSpendAmount] = useState('0');
  const [frequencyCap, setFrequencyCap] = useState('5');
  const [priority, setPriority] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const togglePlacement = (p: string) =>
    setPlacements((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validated here as well as on the server so the admin gets an immediate
    // answer instead of a round trip.
    if (name.trim().length < 2) return setFormError('Give the campaign a name.');
    if (placements.length === 0) return setFormError('Choose at least one placement.');

    const ids = productIds
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (!ids.length && !targetCategory.trim()) {
      return setFormError('Enter product IDs or a target category.');
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          objective,
          status: 'draft',
          placements,
          productIds: ids,
          targetCategory: targetCategory.trim() || null,
          priority: Number(priority) || 0,
          spendAmount: Number(spendAmount) || 0,
          dailyFrequencyCap: frequencyCap ? Number(frequencyCap) : null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Could not create the campaign');
      onCreated();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-primary';

  return (
    <form onSubmit={submit} className="mb-6 rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-4">
      {formError && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-error/20 bg-error-bg px-3 py-2 text-[13px] text-error">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-1.5">
            Campaign name
          </span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Diwali electronics push" />
        </label>

        <label className="block">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-1.5">
            Objective
          </span>
          <select value={objective} onChange={(e) => setObjective(e.target.value)} className={inputClass}>
            {OBJECTIVES.map((o) => (
              <option key={o} value={o}>
                {o.charAt(0).toUpperCase() + o.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <span className="block text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-1.5">
          Placements
        </span>
        <div className="flex flex-wrap gap-2">
          {PLACEMENTS.map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => togglePlacement(p)}
              aria-pressed={placements.includes(p)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-bold capitalize border transition-colors ${
                placements.includes(p)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface text-foreground-muted border-border hover:bg-surface-muted'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-1.5">
            Target category
          </span>
          <input value={targetCategory} onChange={(e) => setTargetCategory(e.target.value)} className={inputClass} placeholder="Ghee" />
        </label>

        <label className="block">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-1.5">
            Product IDs
          </span>
          <input value={productIds} onChange={(e) => setProductIds(e.target.value)} className={inputClass} placeholder="Comma separated UUIDs" />
        </label>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <label className="block">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-1.5">
            Budget (₹)
          </span>
          <input type="number" min="0" value={spendAmount} onChange={(e) => setSpendAmount(e.target.value)} className={inputClass} />
          <span className="block text-[11px] text-foreground-muted mt-1">Used as the denominator for ROAS.</span>
        </label>

        <label className="block">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-1.5">
            Daily frequency cap
          </span>
          <input type="number" min="1" value={frequencyCap} onChange={(e) => setFrequencyCap(e.target.value)} className={inputClass} />
          <span className="block text-[11px] text-foreground-muted mt-1">Max views per visitor per day.</span>
        </label>

        <label className="block">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-1.5">
            Priority
          </span>
          <input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass} />
          <span className="block text-[11px] text-foreground-muted mt-1">Breaks ties only; relevance wins.</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover disabled:opacity-60 flex items-center gap-2 transition-colors"
      >
        {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        Create campaign as draft
      </button>
    </form>
  );
}
