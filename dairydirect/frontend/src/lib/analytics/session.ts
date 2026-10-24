/**
 * Browser-side visitor session id and activity tracking helpers.
 *
 * A session id lets the recommender personalise for someone who has not
 * signed in yet, which on a marketplace is most first-time visitors. It is a
 * random opaque value in localStorage with no personal data in it.
 */

const SESSION_KEY = 'gj_session_id';

/**
 * Stable per-browser id, created on first use.
 *
 * Returns an empty string during server rendering so callers can skip
 * tracking rather than crash; every caller treats "" as "not ready yet".
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  try {
    let id = window.localStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `s${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // Private browsing or blocked storage: fall back to a per-tab id so the
    // page still works, it just will not remember across reloads.
    return `anon-${Math.random().toString(36).slice(2, 12)}`;
  }
}

export type TrackableEvent = 'view' | 'add_to_cart' | 'purchase';

/**
 * Record a product interaction.
 *
 * Fire-and-forget with `keepalive` so an event fired as the customer
 * navigates away still reaches the server. Tracking must never delay a click
 * or surface an error, so all failures are swallowed.
 */
export function trackProductEvent(
  productId: string,
  eventType: TrackableEvent,
  options: { source?: string; variant?: string; quantity?: number } = {}
): void {
  if (typeof window === 'undefined' || !productId) return;

  const sessionId = getSessionId();
  if (!sessionId) return;

  try {
    void fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      keepalive: true,
      body: JSON.stringify({ productId, eventType, sessionId, ...options }),
    }).catch(() => {});
  } catch {
    // Ignored by design.
  }
}

/** Record an ad impression, click or conversion. */
export function trackAdEvent(
  campaignId: string,
  eventType: 'impression' | 'click' | 'conversion',
  options: {
    productId?: string;
    placement?: string;
    variant?: string;
    orderId?: string;
  } = {}
): void {
  if (typeof window === 'undefined' || !campaignId) return;

  const sessionId = getSessionId();
  if (!sessionId) return;

  try {
    void fetch('/api/ads/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      keepalive: true,
      body: JSON.stringify({ campaignId, eventType, sessionId, ...options }),
    }).catch(() => {});
  } catch {
    // Ignored by design.
  }
}
