/**
 * Subscription cadence maths.
 *
 * One pure module so the plan builder (client), the hub (server-rendered
 * previews) and the API (`action: 'skip'`) can never disagree about when the
 * next bottle arrives. Dates are handled as UTC calendar days to avoid the
 * classic off-by-one that appears when a `DATE` column is parsed in IST.
 */

export type PlanCadence = 'daily' | 'alternate' | 'weekly' | 'custom';

export interface CadenceMeta {
  id: PlanCadence;
  label: string;
  /** Short line used on the plan card. */
  blurb: string;
  /** Days between deliveries. `custom` is driven by the customer's weekdays. */
  stepDays: number;
  /** Deliveries per 30-day month, used for the monthly estimate. */
  perMonth: number;
  badge?: string;
}

export const CADENCES: Record<PlanCadence, CadenceMeta> = {
  daily: { id: 'daily', label: 'Every day', blurb: 'Fresh at your door each morning', stepDays: 1, perMonth: 30, badge: 'Most popular' },
  alternate: { id: 'alternate', label: 'Alternate days', blurb: 'Every other morning', stepDays: 2, perMonth: 15 },
  weekly: { id: 'weekly', label: 'Weekly', blurb: 'One delivery a week', stepDays: 7, perMonth: 4 },
  custom: { id: 'custom', label: 'Custom', blurb: 'Pick your own days', stepDays: 1, perMonth: 30 },
};

export const DELIVERY_SLOTS = [
  { id: 'morning_5_7', label: '5:00 – 7:00 AM', hint: 'Before the kettle boils' },
  { id: 'morning_6_8', label: '6:00 – 8:00 AM', hint: 'Most chosen' },
  { id: 'morning_7_9', label: '7:00 – 9:00 AM', hint: 'With breakfast' },
] as const;

export type DeliverySlotId = (typeof DELIVERY_SLOTS)[number]['id'];

/** Parse a `YYYY-MM-DD` or ISO timestamp into a UTC midnight Date. */
export function toUtcDay(value: string | Date): Date {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(value: string | Date, days: number): string {
  const d = toUtcDay(value);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateString(d);
}

/** Today in Asia/Kolkata, as `YYYY-MM-DD`. */
export function todayInIST(now: Date = new Date()): string {
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return toDateString(ist);
}

/**
 * The earliest a new plan can start.
 *
 * Orders placed after 9 PM IST cannot be picked, packed and routed for the
 * next morning, so the first delivery rolls to the day after. This is the
 * promise customers actually remember, so it lives in one place.
 */
export function earliestStartDate(now: Date = new Date()): string {
  const istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const afterCutoff = istNow.getUTCHours() >= 21;
  return addDays(todayInIST(now), afterCutoff ? 2 : 1);
}

/** Next delivery date after `from`, honouring the cadence. */
export function nextDeliveryDate(from: string, plan: PlanCadence): string {
  return addDays(from, CADENCES[plan]?.stepDays ?? 1);
}

export interface ScheduleInput {
  next_delivery_date?: string | null;
  start_date?: string | null;
  plan: PlanCadence | string;
  status: string;
}

/**
 * The next `count` delivery dates for a plan, starting from today.
 *
 * Paused plans return `[]` — the hub renders "Paused" instead of a promise it
 * cannot keep.
 */
export function upcomingDeliveries(sub: ScheduleInput, count = 3, now: Date = new Date()): string[] {
  if (sub.status !== 'active') return [];

  const today = todayInIST(now);
  const anchor = sub.next_delivery_date || sub.start_date || today;
  const anchored = toUtcDay(anchor);
  let cursor: Date = anchored.getTime() < toUtcDay(today).getTime() ? toUtcDay(today) : anchored;

  const plan = (sub.plan as PlanCadence) in CADENCES ? (sub.plan as PlanCadence) : 'daily';
  const step = CADENCES[plan].stepDays;
  const dates: string[] = [];

  for (let i = 0; i < count; i++) {
    dates.push(toDateString(cursor));
    cursor = new Date(cursor.getTime() + step * 86_400_000);
  }
  return dates;
}

/** ₹ per delivery for a plan. */
export function perDeliveryPrice(unitPrice: number, volume: number): number {
  return Math.max(0, Math.round(unitPrice * volume));
}

/** Estimated monthly spend, shown as "about ₹X / month". */
export function monthlyEstimate(unitPrice: number, volume: number, plan: PlanCadence): number {
  return perDeliveryPrice(unitPrice, volume) * CADENCES[plan].perMonth;
}
