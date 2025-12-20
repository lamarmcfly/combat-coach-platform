import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/db/client';
import { getOrCreateCustomer, createSubscriptionCheckout } from '@/lib/stripe/client';
import { TIER_CONFIG } from '@/lib/stripe/config';
import { SubscriptionTier } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tier } = await req.json();

    if (!tier || !Object.values(SubscriptionTier).includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    if (tier === SubscriptionTier.FREE) {
      return NextResponse.json({ error: 'Cannot checkout for free tier' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(
      user.id,
      user.email,
      user.stripeCustomerId
    );

    // Update user with Stripe customer ID if newly created
    if (!user.stripeCustomerId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const tierConfig = TIER_CONFIG[tier as SubscriptionTier];
    const priceId = tierConfig.stripePriceId;

    if (!priceId) {
      return NextResponse.json(
        { error: `No price configured for tier: ${tier}` },
        { status: 500 }
      );
    }

    // Create checkout session
    const checkoutSession = await createSubscriptionCheckout({
      customerId,
      priceId,
      successUrl: `${process.env.NEXTAUTH_URL}/my/subscription?success=true`,
      cancelUrl: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
      userId: user.id,
      tier,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Subscription checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
