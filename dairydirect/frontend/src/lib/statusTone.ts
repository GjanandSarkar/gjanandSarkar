export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export const statusTone: Record<string, StatusTone> = {
  // Orders & Fulfillment
  pending: 'warning',
  confirmed: 'info',
  processing: 'info',
  packed: 'info',
  in_transit: 'info',
  out_for_delivery: 'info',
  delivered: 'success',
  completed: 'success',
  cancelled: 'neutral',
  refunded: 'neutral',

  // Products & Catalog
  active: 'success',
  approved: 'success',
  draft: 'neutral',
  inactive: 'neutral',
  rejected: 'danger',
  suspended: 'danger',
  out_of_stock: 'danger',
  low_stock: 'warning',

  // Subscriptions
  paused: 'warning',
  expired: 'neutral',

  // Sellers, Franchises & Inquiries
  under_review: 'warning',
  contacted: 'info',
  pending_inquiry: 'warning',
  pending_review: 'warning',
  deactivated: 'danger',
  permanently_deactivated: 'danger',
  reactivation_requested: 'warning',

  // Payments & Settlements
  paid: 'success',
  settled: 'success',
  failed: 'danger',

  // Returns & Claims
  submitted: 'warning',
  open: 'warning',
  resolved: 'success',
  closed: 'neutral',
};

/**
 * Returns a semantic badge tone for any status string with a safe 'neutral' fallback.
 */
export function toneFor(status?: string | null): StatusTone {
  if (!status) return 'neutral';
  const normalized = status.toLowerCase().trim().replace(/[\s-]+/g, '_');
  return statusTone[normalized] ?? 'neutral';
}

