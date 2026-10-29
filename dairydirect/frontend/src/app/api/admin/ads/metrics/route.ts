/**
 * GET /api/admin/ads/metrics
 *
 * Campaign performance: impressions, clicks, conversions and ROAS.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { getCampaignMetrics } from '@/lib/ads/serving';
import { isAnalyticsConfigured } from '@/lib/analytics/experiments';

export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth?.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const metrics = await getCampaignMetrics();
    return NextResponse.json({
      metrics,
      // The UI warns when experiment data is not reaching the analytics tool,
      // so nobody concludes an A/B test is running when it is not.
      analyticsConfigured: isAnalyticsConfigured(),
    });
  } catch (err: any) {
    console.error('[AdMetrics GET] Error:', err?.message);
    return NextResponse.json({ error: 'Failed to load metrics' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
