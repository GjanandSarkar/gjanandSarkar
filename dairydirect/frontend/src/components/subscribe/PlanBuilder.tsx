"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Loader2,
  MapPin,
  Milk,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import type { PlanAddress, PlanProduct } from '@/lib/subscriptions/types';
import {
  CADENCES,
  DELIVERY_SLOTS,
  earliestStartDate,
  monthlyEstimate,
  perDeliveryPrice,
  todayInIST,
  type DeliverySlotId,
  type PlanCadence,
} from '@/lib/subscriptions/schedule';

interface Props {
  products: PlanProduct[];
  addresses: PlanAddress[];
  userName?: string;
}

const STEPS = ['Choose milk', 'Quantity & days', 'Delivery', 'Review'] as const;
const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

function formatDay(iso: string): string {
  if (!iso) return '';
  const date = new Date(`${iso.slice(0, 10)}T12:00:00+05:30`);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function PlanBuilder({ products, addresses }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [productId, setProductId] = useState<string | null>(products[0]?.id ?? null);
  const [variantId, setVariantId] = useState<string | null>(products[0]?.variants[0]?.id ?? null);
  const [volume, setVolume] = useState(1);
  const [plan, setPlan] = useState<PlanCadence>('daily');
  const [startDate, setStartDate] = useState(earliestStartDate());
  const [slot, setSlot] = useState<DeliverySlotId>('morning_6_8');
  const [addressId, setAddressId] = useState<string | null>(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? null
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; nextDate: string; productName: string } | null>(null);

  const product = products.find((p) => p.id === productId) ?? null;
  const variant = product?.variants.find((v) => v.id === variantId) ?? product?.variants[0] ?? null;

  const price = variant?.price ?? 0;
  const perDelivery = perDeliveryPrice(price, volume);
  const monthly = monthlyEstimate(price, volume, plan);

  const canContinue = useMemo(() => {
    if (step === 0) return Boolean(product && variant);
    if (step === 1) return Boolean(product) && volume >= 1;
    if (step === 2) return Boolean(startDate) && Boolean(slot);
    return true;
  }, [step, product, variant, volume, startDate, slot]);

  if (products.length === 0) {
    return (
      <div className="w-full max-w-[720px] mx-auto px-4 py-10">
        <div className="rounded-2xl border border-border bg-surface p-6 text-center">
          <Milk className="w-10 h-10 text-foreground-muted mx-auto mb-3" aria-hidden />
          <h1 className="text-lg font-extrabold text-foreground">Milk plans are resting</h1>
          <p className="text-sm text-foreground-muted mt-1.5">
            The dairy catalogue could not be loaded just now. Try again in a moment, or shop one-off packs.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => router.refresh()}
              className="inline-flex items-center gap-1.5 min-h-[44px] rounded-xl bg-primary px-4 text-sm font-bold text-on-primary hover:bg-primary-hover"
            >
              Retry
            </button>
            <Link
              href="/products"
              className="inline-flex items-center min-h-[44px] rounded-xl border border-border px-4 text-sm font-bold text-foreground hover:bg-surface-muted"
            >
              Shop dairy
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (created) {
    return <SuccessState data={created} />;
  }

  async function submit() {
    if (!product || !variant) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          variantId: variant.id,
          volume,
          plan,
          startDate,
          addressId: addressId ?? undefined,
          deliverySlot: slot,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Could not start your plan. Please try again.');
      }
      setCreated({
        id: json.id,
        nextDate: startDate,
        productName: product.name,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[1120px] mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-28 lg:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/subscribe"
          className="w-10 h-10 rounded-xl border border-border bg-surface flex items-center justify-center text-foreground hover:bg-surface-muted"
          aria-label="Back to my plans"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">Build your milk plan</h1>
          <p className="text-xs sm:text-sm text-foreground-muted">Four quick steps. Change or cancel whenever you want.</p>
        </div>
      </div>

      <Stepper current={step} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 mt-5">
        <div>
          {/* ── Step 1: choose milk ───────────────────────────────────── */}
          {step === 0 && (
            <section aria-labelledby="step-products">
              <h2 id="step-products" className="text-base font-bold text-foreground mb-1">
                What should we deliver?
              </h2>
              <p className="text-sm text-foreground-muted mb-3">Farm-fresh, chilled and sealed. Pick one to start.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {products.map((p) => {
                  const selected = p.id === productId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setProductId(p.id);
                        setVariantId(p.variants[0]?.id ?? null);
                      }}
                      aria-pressed={selected}
                      className={`text-left rounded-2xl border bg-surface p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        selected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-border-hover'
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="w-16 h-16 rounded-xl bg-surface-muted overflow-hidden shrink-0 flex items-center justify-center">
                          {p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.imageUrl} alt="" width={64} height={64} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <Milk className="w-7 h-7 text-foreground-muted" aria-hidden />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-foreground truncate">{p.name}</p>
                          <p className="text-[11px] text-foreground-muted">{p.brand || p.category}</p>
                          <p className="text-sm font-extrabold text-foreground mt-1.5">
                            ₹{inr.format(p.variants[0]?.price ?? 0)}
                            <span className="text-[11px] font-semibold text-foreground-muted"> / {p.variants[0]?.weight}</span>
                          </p>
                        </div>
                        <span
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            selected ? 'bg-primary border-primary text-on-primary' : 'border-border'
                          }`}
                          aria-hidden
                        >
                          {selected && <Check className="w-3 h-3" />}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {product && product.variants.length > 1 && (
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-foreground-muted mb-2">Pack size</p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVariantId(v.id)}
                        aria-pressed={v.id === variant?.id}
                        className={`min-h-[44px] rounded-xl border px-3 text-sm font-bold transition-colors ${
                          v.id === variant?.id
                            ? 'border-primary bg-primary-fixed text-primary'
                            : 'border-border bg-surface text-foreground hover:bg-surface-muted'
                        }`}
                      >
                        {v.weight} · ₹{inr.format(v.price)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ── Step 2: quantity & cadence ────────────────────────────── */}
          {step === 1 && (
            <section aria-labelledby="step-quantity">
              <h2 id="step-quantity" className="text-base font-bold text-foreground mb-1">
                How much, how often?
              </h2>
              <p className="text-sm text-foreground-muted mb-4">You can change both later from My plans.</p>

              <div className="rounded-2xl border border-border bg-surface p-4 mb-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">Packs per delivery</p>
                    <p className="text-xs text-foreground-muted">
                      {variant?.weight} each · ₹{inr.format(price)} per pack
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-xl border border-border p-1">
                    <button
                      type="button"
                      onClick={() => setVolume((v) => Math.max(1, v - 1))}
                      disabled={volume <= 1}
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-foreground hover:bg-surface-muted disabled:opacity-40"
                      aria-label="Decrease packs"
                    >
                      <Minus className="w-4 h-4" aria-hidden />
                    </button>
                    <span className="w-8 text-center text-base font-extrabold" aria-live="polite">
                      {volume}
                    </span>
                    <button
                      type="button"
                      onClick={() => setVolume((v) => Math.min(10, v + 1))}
                      disabled={volume >= 10}
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-foreground hover:bg-surface-muted disabled:opacity-40"
                      aria-label="Increase packs"
                    >
                      <Plus className="w-4 h-4" aria-hidden />
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-sm font-bold text-foreground">
                  ₹{inr.format(perDelivery)} <span className="font-semibold text-foreground-muted">per delivery</span>
                </p>
              </div>

              <fieldset>
                <legend className="text-xs font-bold uppercase tracking-wider text-foreground-muted mb-2">
                  Delivery frequency
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(Object.keys(CADENCES) as PlanCadence[])
                    .filter((key) => key !== 'custom')
                    .map((key) => {
                      const meta = CADENCES[key];
                      const selected = plan === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setPlan(key)}
                          aria-pressed={selected}
                          className={`relative rounded-2xl border p-3 text-left transition-colors ${
                            selected
                              ? 'border-primary bg-primary-fixed'
                              : 'border-border bg-surface hover:border-border-hover'
                          }`}
                        >
                          {meta.badge && (
                            <span className="absolute top-2 right-2 rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-on-secondary">
                              {meta.badge}
                            </span>
                          )}
                          <p className={`text-sm font-bold pr-12 ${selected ? 'text-primary' : 'text-foreground'}`}>
                            {meta.label}
                          </p>
                          <p className="text-[11px] text-foreground-muted mt-0.5">{meta.blurb}</p>
                          <p className="text-[11px] font-semibold text-foreground-muted mt-2">
                            ≈ ₹{inr.format(perDeliveryPrice(price, volume) * meta.perMonth)} / month
                          </p>
                        </button>
                      );
                    })}
                </div>
              </fieldset>
            </section>
          )}

          {/* ── Step 3: when & where ──────────────────────────────────── */}
          {step === 2 && (
            <section aria-labelledby="step-delivery">
              <h2 id="step-delivery" className="text-base font-bold text-foreground mb-1">
                When and where?
              </h2>
              <p className="text-sm text-foreground-muted mb-4">
                First delivery {formatDay(startDate)}. Choose a date or keep the earliest slot.
              </p>

              <div className="rounded-2xl border border-border bg-surface p-4 mb-4">
                <label htmlFor="start-date" className="text-sm font-bold text-foreground flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-primary" aria-hidden />
                  Start date
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  min={earliestStartDate()}
                  max={todayInIST(new Date(Date.now() + 45 * 86_400_000))}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-2 w-full min-h-[44px] rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                <p className="text-[11px] text-foreground-muted mt-1.5">
                  We shop before 9 PM for next-morning delivery. Start dates are always tomorrow or later.
                </p>
              </div>

              <fieldset className="mb-4">
                <legend className="text-xs font-bold uppercase tracking-wider text-foreground-muted mb-2">
                  Delivery window
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {DELIVERY_SLOTS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSlot(s.id)}
                      aria-pressed={slot === s.id}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        slot === s.id ? 'border-primary bg-primary-fixed' : 'border-border bg-surface hover:border-border-hover'
                      }`}
                    >
                      <p className={`text-sm font-bold ${slot === s.id ? 'text-primary' : 'text-foreground'}`}>{s.label}</p>
                      <p className="text-[11px] text-foreground-muted">{s.hint}</p>
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-xs font-bold uppercase tracking-wider text-foreground-muted mb-2">
                  Deliver to
                </legend>
                {addresses.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-surface p-4 text-sm text-foreground-muted">
                    No saved address yet. Add one from{' '}
                    <Link href="/profile" className="font-bold text-primary hover:underline">
                      your profile
                    </Link>{' '}
                    and come back — your plan stays here.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {addresses.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setAddressId(a.id)}
                        aria-pressed={addressId === a.id}
                        className={`w-full text-left rounded-xl border p-3 transition-colors ${
                          addressId === a.id ? 'border-primary bg-primary-fixed' : 'border-border bg-surface hover:border-border-hover'
                        }`}
                      >
                        <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-primary" aria-hidden />
                          {a.label}
                          {a.isDefault && (
                            <span className="rounded bg-surface px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-foreground-muted">
                              Default
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-foreground-muted mt-0.5">{a.line}</p>
                      </button>
                    ))}
                  </div>
                )}
              </fieldset>
            </section>
          )}

          {/* ── Step 4: review ────────────────────────────────────────── */}
          {step === 3 && (
            <section aria-labelledby="step-review">
              <h2 id="step-review" className="text-base font-bold text-foreground mb-1">
                One last look
              </h2>
              <p className="text-sm text-foreground-muted mb-4">Nothing is charged now. You pay per delivery.</p>

              <div className="rounded-2xl border border-border bg-surface divide-y divide-border">
                <Row label="Milk" value={`${product?.name ?? ''}${variant ? ` · ${variant.weight}` : ''}`} />
                <Row label="Each delivery" value={`${volume} × ${variant?.weight ?? ''}`} />
                <Row label="Frequency" value={CADENCES[plan].label} />
                <Row label="Delivery window" value={DELIVERY_SLOTS.find((s) => s.id === slot)?.label ?? ''} />
                <Row label="Starts" value={formatDay(startDate)} />
                <Row
                  label="Address"
                  value={addresses.find((a) => a.id === addressId)?.line ?? 'Add an address from your profile'}
                />
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-bold text-foreground">Per delivery</span>
                  <span className="text-lg font-extrabold text-foreground">₹{inr.format(perDelivery)}</span>
                </div>
              </div>

              {error && (
                <p role="alert" className="mt-3 rounded-xl border border-error/20 bg-error-bg px-3.5 py-2.5 text-sm font-semibold text-error">
                  {error}
                </p>
              )}

              <div className="mt-4 flex items-start gap-2 rounded-xl bg-primary-fixed px-3.5 py-3 text-xs text-primary">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                <p>
                  <strong className="font-extrabold">No lock-in.</strong> Skip a delivery before 9 PM the previous day,
                  pause for weeks, or cancel instantly. You only pay for milk actually delivered.
                </p>
              </div>
            </section>
          )}

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center justify-between gap-3 mt-6">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="inline-flex items-center gap-1.5 min-h-[44px] rounded-xl border border-border px-4 text-sm font-bold text-foreground hover:bg-surface-muted disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden />
              Back
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(3, s + 1))}
                disabled={!canContinue}
                className="inline-flex items-center gap-2 min-h-[48px] rounded-xl bg-primary px-6 text-sm font-bold text-on-primary hover:bg-primary-hover disabled:opacity-40"
              >
                Continue
                <ArrowRight className="w-4 h-4" aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="inline-flex items-center gap-2 min-h-[48px] rounded-xl bg-primary px-6 text-sm font-bold text-on-primary hover:bg-primary-hover disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Check className="w-4 h-4" aria-hidden />}
                {submitting ? 'Starting…' : 'Start my plan'}
              </button>
            )}
          </div>
        </div>

        {/* ── Summary rail ────────────────────────────────────────────── */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-border bg-surface p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted mb-2">Your plan</p>
            {product && variant ? (
              <>
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-lg bg-surface-muted overflow-hidden flex items-center justify-center shrink-0">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.imageUrl} alt="" width={48} height={48} className="w-full h-full object-cover" />
                    ) : (
                      <Milk className="w-5 h-5 text-foreground-muted" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{product.name}</p>
                    <p className="text-xs text-foreground-muted">
                      {volume} × {variant.weight} · {CADENCES[plan].label}
                    </p>
                  </div>
                </div>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-foreground-muted">Per delivery</dt>
                    <dd className="font-bold text-foreground">₹{inr.format(perDelivery)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-foreground-muted">Monthly estimate</dt>
                    <dd className="font-bold text-foreground">₹{inr.format(monthly)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-foreground-muted">First delivery</dt>
                    <dd className="font-bold text-foreground">{formatDay(startDate)}</dd>
                  </div>
                </dl>
                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-foreground-muted">
                  <Truck className="w-3.5 h-3.5" aria-hidden />
                  Chilled 5–9 AM · pay on delivery
                </p>
              </>
            ) : (
              <p className="text-sm text-foreground-muted">Pick a milk to see your plan.</p>
            )}
          </div>
        </aside>
      </div>

      {/* ── Mobile sticky action bar ─────────────────────────────────── */}
      <div className="lg:hidden fixed inset-x-0 bottom-[var(--bottom-nav-h)] z-40 border-t border-border bg-surface/95 backdrop-blur px-4 py-3 pb-safe">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
              {step < 3 ? 'Per delivery' : 'Start plan'}
            </p>
            <p className="text-base font-extrabold text-foreground">₹{inr.format(perDelivery)}</p>
          </div>
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(3, s + 1))}
              disabled={!canContinue}
              className="ml-auto inline-flex items-center gap-1.5 min-h-[48px] rounded-xl bg-primary px-5 text-sm font-bold text-on-primary disabled:opacity-40"
            >
              Continue
              <ArrowRight className="w-4 h-4" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="ml-auto inline-flex items-center gap-1.5 min-h-[48px] rounded-xl bg-primary px-5 text-sm font-bold text-on-primary disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Check className="w-4 h-4" aria-hidden />}
              {submitting ? 'Starting…' : 'Start plan'}
            </button>
          )}
        </div>
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="mt-1.5 text-xs font-semibold text-foreground-muted hover:text-foreground"
          >
            Back to {STEPS[step - 1].toLowerCase()}
          </button>
        )}
      </div>
    </div>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-1.5" aria-label="Plan progress">
      {STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} className="flex-1 min-w-0">
            <div
              className={`h-1.5 rounded-full ${done || active ? 'bg-primary' : 'bg-surface-muted'}`}
              aria-hidden
            />
            <p
              className={`mt-1.5 text-[10px] sm:text-[11px] font-bold truncate ${
                active ? 'text-foreground' : done ? 'text-primary' : 'text-foreground-muted'
              }`}
              aria-current={active ? 'step' : undefined}
            >
              {done ? <Check className="w-3 h-3 inline mr-0.5" aria-hidden /> : null}
              {index + 1}. {label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3">
      <span className="text-sm text-foreground-muted">{label}</span>
      <span className="text-sm font-semibold text-foreground text-right">{value}</span>
    </div>
  );
}

function SuccessState({ data }: { data: { id: string; nextDate: string; productName: string } }) {
  return (
    <div className="w-full max-w-[560px] mx-auto px-4 py-12 text-center">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-primary-fixed flex items-center justify-center mb-4">
        <Check className="w-8 h-8 text-primary" aria-hidden />
      </div>
      <h1 className="text-2xl font-extrabold text-foreground">Your plan is live</h1>
      <p className="text-sm text-foreground-muted mt-2">
        {data.productName} arrives {formatDay(data.nextDate)} morning. We&apos;ll ping you before every delivery.
      </p>
      <div className="mt-5 flex flex-col sm:flex-row justify-center gap-2">
        <Link
          href="/subscribe"
          className="inline-flex items-center justify-center gap-1.5 min-h-[48px] rounded-xl bg-primary px-5 text-sm font-bold text-on-primary hover:bg-primary-hover"
        >
          Manage my plan
          <ChevronRight className="w-4 h-4" aria-hidden />
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center justify-center min-h-[48px] rounded-xl border border-border px-5 text-sm font-bold text-foreground hover:bg-surface-muted"
        >
          Add something extra
        </Link>
      </div>
      <p className="mt-4 text-[11px] text-foreground-muted">Reference {data.id.slice(0, 8).toUpperCase()}</p>
    </div>
  );
}
