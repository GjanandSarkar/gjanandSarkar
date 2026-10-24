/**
 * Experiment assignment and analytics forwarding.
 *
 * Comparison and significance testing happen in an external product analytics
 * tool (PostHog-compatible capture API), so this file does not try to compute
 * winners. Its job is to assign a stable variant and make sure every
 * recommendation and ad event carries that variant, because an experiment
 * whose events are not tagged can never be settled afterwards.
 *
 * The integration is configuration-driven, not a hard dependency: with no key
 * set, bucketing still works locally and forwarding is a no-op. That keeps
 * local development and CI free of network calls to a third party.
 */

export const EXPERIMENTS = {
  /**
   * The headline question: is the blended recommender actually better than
   * simply showing what is popular? Without this comparison there is no
   * evidence that personalisation earns its complexity.
   */
  RECOMMENDATION_STRATEGY: 'rec_strategy',
} as const;

export type ExperimentKey = (typeof EXPERIMENTS)[keyof typeof EXPERIMENTS];

export const RECOMMENDATION_VARIANTS = ['hybrid', 'popularity'] as const;
export type RecommendationVariant = (typeof RECOMMENDATION_VARIANTS)[number];

/**
 * Deterministic 32-bit hash (FNV-1a).
 *
 * Bucketing must be stable: the same visitor has to land in the same variant
 * on every request and on every server instance, or the experiment measures
 * nothing but its own randomness. A hash of the identity does that without
 * storing assignments anywhere.
 */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * Assign a visitor to a variant.
 *
 * Salted with the experiment key so that a visitor unlucky enough to land in
 * the control group of one experiment is not systematically in the control
 * group of every other one.
 */
export function assignVariant<T extends readonly string[]>(
  identity: string,
  experiment: ExperimentKey,
  variants: T
): T[number] {
  if (!identity) return variants[0];
  return variants[hash(`${experiment}:${identity}`) % variants.length];
}

export function assignRecommendationVariant(identity: string): RecommendationVariant {
  return assignVariant(
    identity,
    EXPERIMENTS.RECOMMENDATION_STRATEGY,
    RECOMMENDATION_VARIANTS
  );
}

// ─── Forwarding to the external analytics tool ──────────────────────────────

interface AnalyticsEvent {
  event: string;
  distinctId: string;
  properties?: Record<string, unknown>;
}

/**
 * Read the analytics credentials.
 *
 * `POSTHOG_KEY` is deliberately *not* prefixed `NEXT_PUBLIC_`. Every caller of
 * `captureEvent` is an API route, so this never needs to reach the browser,
 * and Next.js inlines `NEXT_PUBLIC_*` values into the bundle at build time —
 * which would both ship the key to every visitor and require a full redeploy
 * before a key change took effect. A server-only variable is read at runtime.
 *
 * The `NEXT_PUBLIC_` names are still accepted so that setting either one works
 * rather than silently doing nothing.
 */
function analyticsConfig() {
  const key = process.env.POSTHOG_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY;
  // Must match the region the PostHog project was created in: US Cloud is
  // us.i.posthog.com, EU Cloud is eu.i.posthog.com. The older app.posthog.com
  // is the legacy domain and is not the documented capture host.
  const host =
    process.env.POSTHOG_HOST ||
    process.env.NEXT_PUBLIC_POSTHOG_HOST ||
    'https://us.i.posthog.com';
  return key ? { key, host } : null;
}

/** Whether experiment results will actually reach the analytics tool. */
export function isAnalyticsConfigured(): boolean {
  return analyticsConfig() !== null;
}

/**
 * Send one event to the analytics tool.
 *
 * Fire-and-forget by design. Analytics is never allowed to slow down or break
 * a page: if the capture endpoint is down, the request is dropped and the
 * customer sees nothing. The first-party `product_events` / `ad_events` tables
 * remain the authoritative record, so a dropped forward loses reporting
 * convenience, not data.
 */
export async function captureEvent(evt: AnalyticsEvent): Promise<void> {
  const config = analyticsConfig();
  if (!config) return;

  try {
    await fetch(`${config.host}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: config.key,
        event: evt.event,
        distinct_id: evt.distinctId,
        properties: {
          ...evt.properties,
          $lib: 'gjanand-server',
        },
        timestamp: new Date().toISOString(),
      }),
      // Never let a third party hold a request open.
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    // Intentionally swallowed; see above.
  }
}
