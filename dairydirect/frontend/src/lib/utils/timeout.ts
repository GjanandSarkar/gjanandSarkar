/**
 * Hard upper bound on an upstream call.
 *
 * Server Components are only as fast as the slowest dependency they await,
 * and a Supabase/Redis/Razorpay call has no default deadline. A network
 * partition therefore turns into an unbounded render: the browser sees a
 * blank page while Node waits on a socket. Locally, `/products` took 7.3 s
 * with an unreachable database for exactly this reason.
 *
 * The promise is not cancelled (the caller cannot cancel a supabase-js
 * builder), but the request stops waiting and can render a degraded state.
 * Prefer this over a bare `await` for anything that crosses the network.
 */
export class UpstreamTimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(`${label} did not respond within ${ms}ms`);
    this.name = 'UpstreamTimeoutError';
  }
}

export function withTimeout<T>(
  operation: () => PromiseLike<T>,
  ms = 3000,
  label = 'upstream call'
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new UpstreamTimeoutError(label, ms)), ms);

    // The thunk is invoked *inside* the promise so a synchronous throw from a
    // misconfigured client rejects instead of escaping as an uncaught error.
    // Supabase's builder is a PromiseLike whose overloaded `then` defeats
    // generic inference when passed directly; an async thunk resolves it.
    let pending: PromiseLike<T>;
    try {
      pending = operation();
    } catch (error) {
      clearTimeout(timer);
      reject(error);
      return;
    }

    Promise.resolve(pending).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

/** Default deadlines, tuned for an Indian 4G customer on a warm cache. */
export const TIMEOUTS = {
  /** Catalogue reads that block a page render. */
  pageData: 3000,
  /** Small settings/lookup reads. */
  settings: 1500,
  /** Server-to-server payment verification. */
  payment: 8000,
} as const;
