import { NextResponse } from 'next/server';
import { db } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {};

  // Database connectivity
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  // Stripe configuration
  checks.stripe = process.env.STRIPE_SECRET_KEY ? 'ok' : 'error';

  // Optional services
  checks.email = process.env.SENDGRID_API_KEY ? 'ok' : 'error';
  checks.video = process.env.MUX_TOKEN_ID ? 'ok' : 'error';
  checks.rateLimit = process.env.UPSTASH_REDIS_REST_URL ? 'ok' : 'error';
  checks.errorTracking = process.env.NEXT_PUBLIC_SENTRY_DSN ? 'ok' : 'error';

  const allCriticalOk = checks.database === 'ok' && checks.stripe === 'ok';

  return NextResponse.json(
    {
      status: allCriticalOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allCriticalOk ? 200 : 503 }
  );
}
