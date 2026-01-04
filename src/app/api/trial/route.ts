import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { SubscriptionTier } from '@prisma/client';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/db/client';
import { checkTrialEligibility, getTrialInfo } from '@/lib/trial';
import { getOrCreateCustomer, createTrialCheckout } from '@/lib/stripe/client';
import { getPriceId, TRIAL_CONFIG } from '@/lib/stripe/config';
import { authRatelimit, checkRateLimit } from '@/lib/ratelimit';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const startTrialSchema = z.object({
  tier: z.enum(['BASIC', 'PRO', 'ELITE']),
  billingInterval: z.enum(['monthly', 'annual']).optional().default('monthly'),
});

/**
 * GET /api/trial
 * Get trial eligibility and info for current user
 */
export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [trialInfo, basicEligibility, proEligibility, eliteEligibility] = await Promise.all([
      getTrialInfo(session.user.id),
      checkTrialEligibility(session.user.id, SubscriptionTier.BASIC),
      checkTrialEligibility(session.user.id, SubscriptionTier.PRO),
      checkTrialEligibility(session.user.id, SubscriptionTier.ELITE),
    ]);

    return NextResponse.json({
      trialInfo,
      eligibility: {
        [SubscriptionTier.BASIC]: basicEligibility,
        [SubscriptionTier.PRO]: proEligibility,
        [SubscriptionTier.ELITE]: eliteEligibility,
      },
      config: {
        durationDays: TRIAL_CONFIG.durationDays,
        requirePaymentMethod: TRIAL_CONFIG.requirePaymentMethod,
      },
    });
  } catch (error) {
    console.error('Error checking trial eligibility:', error);
    return NextResponse.json(
      { error: 'Failed to check trial eligibility' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/trial
 * Start a free trial checkout session
 */
export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await checkRateLimit(req, authRatelimit);
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const validation = startTrialSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const { tier, billingInterval } = validation.data;
    const subscriptionTier = SubscriptionTier[tier];

    // Check eligibility
    const eligibility = await checkTrialEligibility(session.user.id, subscriptionTier);
    if (!eligibility.eligible) {
      return NextResponse.json(
        { error: eligibility.reason || 'Not eligible for trial' },
        { status: 400 }
      );
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, stripeCustomerId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(
      session.user.id,
      user.email,
      user.stripeCustomerId
    );

    // Update user with Stripe customer ID if new
    if (!user.stripeCustomerId) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Get price ID
    const priceId = getPriceId(subscriptionTier, billingInterval);
    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid subscription tier or billing interval' },
        { status: 400 }
      );
    }

    // Create checkout session with trial
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const checkoutSession = await createTrialCheckout({
      customerId,
      priceId,
      successUrl: `${baseUrl}/my/subscription?trial=started`,
      cancelUrl: `${baseUrl}/pricing?trial=canceled`,
      userId: session.user.id,
      tier,
      trialDays: TRIAL_CONFIG.durationDays,
      billingInterval,
    });

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error('Error starting trial:', error);
    return NextResponse.json(
      { error: 'Failed to start trial' },
      { status: 500 }
    );
  }
}
