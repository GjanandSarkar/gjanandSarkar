"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Loader2,
  Milk,
  Pause,
  Play,
  Plus,
  ShieldCheck,
  SkipForward,
  Truck,
  X,
} from 'lucide-react';
import type { SubscriptionPlan } from '@/lib/subscriptions/types';
import {
  CADENCES,
  DELIVERY_SLOTS,
  monthlyEstimate,
  perDeliveryPrice,
  upcomingDeliveries,
  type PlanCadence,
} from '@/lib/subscriptions/schedule';

interface Props {
  initialPlans: SubscriptionPlan[];
}

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

function formatDay(iso: string, style: 'short' | 'long' = 'short'): string {
  if (!iso) return '—';
  const date = new Date(`${iso.slice(0, 10)}T12:00:00+05:30`);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: style === 'long' ? 'long' : 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function slotLabel(slot: string): string {
  return DELIVERY_SLOTS.find((s) => s.id === slot)?.label ?? '6:00 – 8:00 AM';
}

function cadenceLabel(plan: PlanCadence): string {
  return CADENCES[plan]?.label ?? 'Every day';
}

export function SubscriptionHub({ initialPlans }: Props) {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>(initialPlans);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const active = plans.filter((p) => p.status === 'active');
  const paused = plans.filter((p) => p.status === 'paused');

  const monthlyTotal = useMemo(
    () =>
      active.reduce((sum, plan) => {
        const price = plan.variant?.price ?? 0;
        return sum + monthlyEstimate(price, plan.volume, plan.plan);
      }, 0),
    [active]
  );

  const nextDelivery = useMemo(() => {
    const dates = active
      .flatMap((p) => upcomingDeliveries({ ...p }, 1))
      .filter(Boolean)
      .sort();
    return dates[0] ?? null;
  }, [active]);

  const week = useMemo(() => {
    const byDate = new Map<string, { plan: SubscriptionPlan; label: string }[]>();
    for (const plan of active) {
      for (const date of upcomingDeliveries({ ...plan }, 7)) {
        const entry = byDate.get(date) ?? [];
        entry.push({ plan, label: `${plan.volume} × ${plan.variant?.weight ?? ''} ${plan.product.name}` });
        byDate.set(date, entry);
      }
    }
    return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(0, 5);
  }, [active]);

  async function updatePlan(subId: string, action: 'pause' | 'resume' | 'skip' | 'cancel') {
    setBusyId(subId);
    setError(null);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subId, action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Could not update your plan');

      if (action === 'cancel') {
        setPlans((prev) => prev.filter((p) => p.id !== subId));
        setToast('Plan cancelled. No further deliveries will be charged.');
      } else {
        setPlans((prev) =>
          prev.map((p) => {
            if (p.id !== subId) return p;
            if (action === 'pause') return { ...p, status: 'paused' };
            if (action === 'resume') return { ...p, status: 'active' };
            return {
              ...p,
              nextDeliveryDate: json.next_delivery_date ?? p.nextDeliveryDate,
            };
          })
        );
        setToast(
          action === 'pause'
            ? 'Plan paused. Resume whenever you like.'
            : action === 'resume'
              ? 'Plan resumed — see you next morning.'
              : 'Next delivery skipped.'
        );
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusyId(null);
      setConfirmCancel(null);
    }
  }

  return (
    <div className="w-full max-w-[1120px] mx-auto px-4 sm:px-6 py-5 sm:py-8">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-fixed px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary mb-2">
            <Milk className="w-3.5 h-3.5" aria-hidden />
            Dairy subscriptions
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Your morning plan
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Pause, skip or change a plan in two taps. No lock-in, pay per delivery.
          </p>
        </div>
        <Link
          href="/subscribe/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 min-h-[44px] text-sm font-bold text-on-primary hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Plus className="w-4 h-4" aria-hidden />
          New plan
        </Link>
      </div>

      {/* ── Toast / error ──────────────────────────────────────────────── */}
      <div aria-live="polite" className="empty:hidden">
        {toast && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary-fixed px-3.5 py-2.5 text-sm font-semibold text-primary">
            <Check className="w-4 h-4 shrink-0" aria-hidden />
            <span className="flex-1">{toast}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="p-1.5 rounded-lg hover:bg-primary/10"
              aria-label="Dismiss message"
            >
              <X className="w-4 h-4" aria-hidden />
            </button>
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-xl border border-error/20 bg-error-bg px-3.5 py-2.5 text-sm font-semibold text-error">
            {error}
          </div>
        )}
      </div>

      {plans.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* ── Snapshot ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
            <Stat label="Active plans" value={String(active.length)} />
            <Stat label="Next delivery" value={nextDelivery ? formatDay(nextDelivery) : 'Paused'} />
            <Stat label="Monthly" value={`₹${inr.format(monthlyTotal)}`} />
          </div>

          <h2 className="text-base font-bold text-foreground mb-3">Your plans</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-8">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                busy={busyId === plan.id}
                confirming={confirmCancel === plan.id}
                onAskCancel={() => setConfirmCancel(plan.id)}
                onDismissCancel={() => setConfirmCancel(null)}
                onAction={updatePlan}
              />
            ))}
          </div>

          {week.length > 0 && (
            <section aria-labelledby="upcoming-heading" className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 id="upcoming-heading" className="text-base font-bold text-foreground">
                  Upcoming deliveries
                </h2>
                <span className="text-xs font-semibold text-foreground-muted">Next 7 days</span>
              </div>
              <ol className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
                {week.map(([date, items], index) => (
                  <li key={date} className="flex items-center gap-3 px-4 py-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                        index === 0 ? 'bg-primary text-on-primary' : 'bg-surface-muted text-foreground'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase leading-none tracking-wide">
                        {formatDay(date).split(' ')[0]}
                      </span>
                      <span className="text-sm font-extrabold leading-tight">{formatDay(date).split(' ')[1]}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {items.map((i) => i.label).join(' · ')}
                      </p>
                      <p className="text-xs text-foreground-muted mt-0.5">
                        <Truck className="w-3.5 h-3.5 inline mr-1" aria-hidden />
                        {slotLabel(items[0].plan.deliverySlot)}
                      </p>
                    </div>
                    {index === 0 && (
                      <span className="hidden sm:inline-flex rounded-full bg-primary-fixed px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                        Next up
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {paused.length > 0 && (
            <p className="text-xs text-foreground-muted mb-6">
              {paused.length} paused {paused.length === 1 ? 'plan' : 'plans'} — resume any time, no charge while paused.
            </p>
          )}
        </>
      )}

      {/* ── Reassurance ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <Trust icon={<ShieldCheck className="w-4 h-4" aria-hidden />} title="No lock-in" body="Cancel from the app, instantly." />
        <Trust icon={<CalendarDays className="w-4 h-4" aria-hidden />} title="Skip a day" body="Going out of town? Skip in one tap." />
        <Trust icon={<Truck className="w-4 h-4" aria-hidden />} title="Pay per delivery" body="Charged only when milk arrives." />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2.5">
      <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-foreground-muted">{label}</p>
      <p className="text-base sm:text-lg font-extrabold text-foreground mt-0.5 truncate">{value}</p>
    </div>
  );
}

function Trust({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-border bg-surface px-3 py-2.5">
      <span className="mt-0.5 text-primary">{icon}</span>
      <div>
        <p className="text-xs font-bold text-foreground">{title}</p>
        <p className="text-[11px] text-foreground-muted leading-snug">{body}</p>
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  busy,
  confirming,
  onAskCancel,
  onDismissCancel,
  onAction,
}: {
  plan: SubscriptionPlan;
  busy: boolean;
  confirming: boolean;
  onAskCancel: () => void;
  onDismissCancel: () => void;
  onAction: (id: string, action: 'pause' | 'resume' | 'skip' | 'cancel') => void;
}) {
  const paused = plan.status === 'paused';
  const price = plan.variant?.price ?? 0;
  const perDelivery = perDeliveryPrice(price, plan.volume);

  return (
    <article className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-xl bg-surface-muted overflow-hidden shrink-0 flex items-center justify-center">
          {plan.product.imageUrl ? (
            // Product imagery is served from partner CDNs; a plain img keeps the
            // hub independent of next/image remote-pattern configuration.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={plan.product.imageUrl}
              alt=""
              width={56}
              height={56}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <Milk className="w-6 h-6 text-foreground-muted" aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-foreground truncate">{plan.product.name}</h3>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                paused ? 'bg-warning-bg text-warning' : 'bg-primary-fixed text-primary'
              }`}
            >
              {paused ? 'Paused' : 'Active'}
            </span>
          </div>
          <p className="text-xs text-foreground-muted mt-0.5">
            {plan.volume} × {plan.variant?.weight || '1 pack'} · {cadenceLabel(plan.plan)}
          </p>
          <p className="text-xs text-foreground-muted mt-1.5">
            {paused ? 'Resumes when you say' : `Next ${formatDay(plan.nextDeliveryDate, 'long')}`} · {slotLabel(plan.deliverySlot)}
          </p>
          <p className="mt-2 flex items-baseline gap-1.5">
            <span className="text-lg font-extrabold text-foreground">₹{inr.format(perDelivery)}</span>
            <span className="text-[11px] font-semibold text-foreground-muted">/ delivery</span>
            <span className="ml-auto text-[11px] text-foreground-muted">
              ≈ ₹{inr.format(monthlyEstimate(price, plan.volume, plan.plan))}/mo
            </span>
          </p>
        </div>
      </div>

      {confirming ? (
        <div className="mt-3 rounded-xl border border-error/20 bg-error-bg p-3">
          <p className="text-xs font-semibold text-error">Cancel this plan? Deliveries stop immediately.</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => onAction(plan.id, 'cancel')}
              disabled={busy}
              className="inline-flex items-center justify-center gap-1.5 min-h-[40px] flex-1 rounded-lg bg-error text-on-error text-xs font-bold hover:opacity-90 disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : null}
              Yes, cancel
            </button>
            <button
              type="button"
              onClick={onDismissCancel}
              className="min-h-[40px] flex-1 rounded-lg border border-border bg-surface text-xs font-bold text-foreground hover:bg-surface-muted"
            >
              Keep plan
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3">
          {!paused && (
            <button
              type="button"
              onClick={() => onAction(plan.id, 'skip')}
              disabled={busy}
              className="inline-flex items-center gap-1.5 min-h-[40px] rounded-lg px-2.5 text-xs font-bold text-foreground hover:bg-surface-muted disabled:opacity-60"
            >
              <SkipForward className="w-3.5 h-3.5" aria-hidden />
              Skip next
            </button>
          )}
          <button
            type="button"
            onClick={() => onAction(plan.id, paused ? 'resume' : 'pause')}
            disabled={busy}
            className="inline-flex items-center gap-1.5 min-h-[40px] rounded-lg px-2.5 text-xs font-bold text-foreground hover:bg-surface-muted disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
            ) : paused ? (
              <Play className="w-3.5 h-3.5" aria-hidden />
            ) : (
              <Pause className="w-3.5 h-3.5" aria-hidden />
            )}
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            type="button"
            onClick={onAskCancel}
            className="ml-auto min-h-[40px] rounded-lg px-2.5 text-xs font-bold text-foreground-muted hover:text-error hover:bg-error-bg"
          >
            Cancel
          </button>
        </div>
      )}
    </article>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 text-center">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-primary-fixed flex items-center justify-center mb-4">
        <Milk className="w-8 h-8 text-primary" aria-hidden />
      </div>
      <h2 className="text-lg font-extrabold text-foreground">Start your morning ritual</h2>
      <p className="text-sm text-foreground-muted mt-1.5 max-w-md mx-auto">
        Fresh A2 milk at your door before breakfast. Choose a plan in under a minute — pause or skip any day.
      </p>
      <ul className="mt-4 inline-flex flex-col items-start gap-1.5 text-sm text-foreground">
        <li className="flex items-center gap-2">
          <Check className="w-4 h-4 text-primary" aria-hidden /> Delivered 5–7 AM, every day you choose
        </li>
        <li className="flex items-center gap-2">
          <Check className="w-4 h-4 text-primary" aria-hidden /> No upfront payment, no lock-in
        </li>
        <li className="flex items-center gap-2">
          <Check className="w-4 h-4 text-primary" aria-hidden /> Pause or skip in two taps
        </li>
      </ul>
      <div className="mt-5">
        <Link
          href="/subscribe/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 min-h-[48px] text-sm font-bold text-on-primary hover:bg-primary-hover"
        >
          Build my plan
          <ArrowRight className="w-4 h-4" aria-hidden />
        </Link>
      </div>
      <p className="mt-3 text-[11px] text-foreground-muted">
        Prefer one-off?{' '}
        <Link href="/products" className="font-bold text-primary hover:underline">
          Shop dairy
          <ChevronRight className="w-3 h-3 inline" aria-hidden />
        </Link>
      </p>
    </div>
  );
}
