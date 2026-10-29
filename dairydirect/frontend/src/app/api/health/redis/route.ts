import { NextResponse } from 'next/server';

import { getRedisStatus, pingRedis } from '@/lib/aws/redis';

/**
 * Redis health check.
 *
 * Visit /api/health/redis to see, in one place, whether REDIS_URL is set,
 * what state the connection is in, and whether a real command round-trips.
 * Without this the only signal was whether log lines said [mem], which is
 * easy to miss and impossible to check on a deployed environment.
 *
 * Deliberately exposes no credentials: the URL itself is never returned.
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = getRedisStatus();
  const ping = await pingRedis();

  // Unreachable Redis is NOT a 500: the app degrades to the in-memory
  // fallback and keeps serving. 503 signals "configured but not usable".
  const httpStatus = !status.configured ? 200 : ping.ok ? 200 : 503;

  return NextResponse.json(
    {
      configured: status.configured,
      connectionState: status.status,
      ready: status.ready,
      circuitOpen: status.circuitOpen,
      ping: ping.ok ? 'PONG' : null,
      latencyMs: ping.latencyMs ?? null,
      error: ping.error ?? null,
      usingFallback: !ping.ok,
      hint: !status.configured
        ? 'REDIS_URL is not set. The app is using its in-memory fallback: caching is per instance and rate limits are not shared.'
        : status.circuitOpen
          ? 'Redis answered, but the circuit breaker is open after repeated failures. It will retry shortly; the in-memory fallback is serving requests meanwhile.'
          : ping.ok
            ? 'Redis is connected and serving cache, OTP storage and distributed rate limiting.'
          : 'REDIS_URL is set but the server cannot reach Redis. Check the URL, the password, and that the scheme is rediss:// for a TLS provider such as Upstash.',
    },
    { status: httpStatus }
  );
}
