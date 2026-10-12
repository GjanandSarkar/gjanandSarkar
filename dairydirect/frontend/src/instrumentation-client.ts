/**
 * Sentry browser instrumentation — deferred.
 *
 * Previously this did a top-level `import * as Sentry from "@sentry/nextjs"`,
 * which pulled ~525KB of Sentry (SDK + browser tracing) into the critical
 * bundle of EVERY route and ran `Sentry.init` before the page became
 * interactive. Error monitoring is important but it is never more urgent than
 * the user's first paint.
 *
 * Now Sentry is code-split into its own chunk and loaded once the browser is
 * idle (or after a short timeout as a fallback). Errors thrown before Sentry
 * finishes loading are buffered below and replayed into Sentry on arrival, so
 * we do not lose early crashes — which are the ones that matter most.
 */

type BufferedEvent =
  | { kind: 'error'; error: unknown }
  | { kind: 'rejection'; reason: unknown };

const buffer: BufferedEvent[] = [];
const MAX_BUFFERED = 10;

function bufferError(e: ErrorEvent) {
  if (buffer.length < MAX_BUFFERED) buffer.push({ kind: 'error', error: e.error ?? e.message });
}
function bufferRejection(e: PromiseRejectionEvent) {
  if (buffer.length < MAX_BUFFERED) buffer.push({ kind: 'rejection', reason: e.reason });
}

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || '';

if (typeof window !== 'undefined' && DSN) {
  window.addEventListener('error', bufferError);
  window.addEventListener('unhandledrejection', bufferRejection);

  const boot = async () => {
    try {
      const Sentry = await import('@sentry/nextjs');

      Sentry.init({
        dsn: DSN,
        // Was 1 (100%). At launch traffic that is both a large runtime cost on
        // the client and a fast way to burn the Sentry quota. 10% in
        // production is plenty to spot regressions; keep 100% locally.
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
        environment: process.env.NODE_ENV,
        // Don't report noise we can't act on (browser extensions, cancelled
        // navigations, offline users).
        ignoreErrors: [
          'ResizeObserver loop limit exceeded',
          'ResizeObserver loop completed with undelivered notifications',
          'Non-Error promise rejection captured',
          'AbortError',
          'Failed to fetch',
          'NetworkError when attempting to fetch resource',
        ],
        debug: false,
      });

      // Replay anything that broke while Sentry was still loading.
      for (const ev of buffer) {
        if (ev.kind === 'error') Sentry.captureException(ev.error);
        else Sentry.captureException(ev.reason);
      }
      buffer.length = 0;

      window.removeEventListener('error', bufferError);
      window.removeEventListener('unhandledrejection', bufferRejection);
    } catch {
      // Monitoring must never break the app.
    }
  };

  if ('requestIdleCallback' in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void, o?: { timeout: number }) => void })
      .requestIdleCallback(boot, { timeout: 5000 });
  } else {
    setTimeout(boot, 3000);
  }
}

/**
 * Next calls this on every client-side navigation. It must exist synchronously,
 * so we forward to Sentry only if the SDK has finished loading.
 */
export function onRouterTransitionStart(
  ...args: Parameters<
    typeof import('@sentry/nextjs')['captureRouterTransitionStart']
  >
) {
  const sentryOnWindow = (
    window as unknown as {
      __SENTRY__?: unknown;
    }
  ).__SENTRY__;
  if (!sentryOnWindow) return;
  void import('@sentry/nextjs').then((Sentry) => {
    try {
      Sentry.captureRouterTransitionStart(...args);
    } catch {
      /* no-op */
    }
  });
}
