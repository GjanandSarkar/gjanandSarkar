/**
 * GET /api/health
 * Health check endpoint — verifies AWS RDS PostgreSQL and Redis connections.
 * Used by monitoring tools (CloudWatch, UptimeRobot, ALB Health Checks)
 */

import { NextResponse } from 'next/server';
import { checkDbConnection } from '@/lib/aws/rds';
import { checkRedisConnection } from '@/lib/aws/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();

  const [dbOk, redisOk] = await Promise.all([
    checkDbConnection(),
    checkRedisConnection(),
  ]);

  const status = {
    status: dbOk ? (redisOk ? 'healthy' : 'degraded') : 'unhealthy',
    services: {
      database: dbOk ? 'up' : 'down',
      redis: redisOk ? 'up' : 'down',
    },
    responseTime: `${Date.now() - startTime}ms`,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '2.0.0',
    environment: process.env.NODE_ENV,
    region: process.env.AWS_REGION || 'ap-south-1',
  };

  const httpStatus = !dbOk ? 503 : 200;

  return NextResponse.json(status, { status: httpStatus });
}
