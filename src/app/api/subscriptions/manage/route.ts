import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { SubscriptionService } from '@/services/subscriptionService';
import { SubscriptionTier } from '@prisma/client';
import { compareTiers } from '@/lib/stripe/config';

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, tier } = await req.json();

    switch (action) {
      case 'upgrade':
        if (!tier) {
          return NextResponse.json({ error: 'Tier required for upgrade' }, { status: 400 });
        }

        const currentSubscription = await SubscriptionService.getActiveSubscription(session.user.id);

        if (!currentSubscription) {
          return NextResponse.json({ error: 'No active subscription' }, { status: 400 });
        }

        if (compareTiers(tier, currentSubscription.tier) <= 0) {
          return NextResponse.json({ error: 'New tier must be higher than current tier' }, { status: 400 });
        }

        const upgraded = await SubscriptionService.upgradeSubscription({
          userId: session.user.id,
          newTier: tier,
        });

        return NextResponse.json({ success: true, subscription: upgraded });

      case 'downgrade':
        if (!tier) {
          return NextResponse.json({ error: 'Tier required for downgrade' }, { status: 400 });
        }

        const downgraded = await SubscriptionService.downgradeSubscription({
          userId: session.user.id,
          newTier: tier,
        });

        return NextResponse.json({
          success: true,
          subscription: downgraded,
          message: 'Downgrade scheduled for next billing period',
        });

      case 'cancel':
        const canceled = await SubscriptionService.cancelSubscription(session.user.id);

        return NextResponse.json({
          success: true,
          subscription: canceled,
          message: 'Subscription will be canceled at the end of the billing period',
        });

      case 'reactivate':
        const reactivated = await SubscriptionService.reactivateSubscription(session.user.id);

        return NextResponse.json({
          success: true,
          subscription: reactivated,
          message: 'Subscription reactivated',
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Subscription management error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to manage subscription' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await SubscriptionService.getActiveSubscription(session.user.id);

    if (!subscription) {
      return NextResponse.json({ subscription: null });
    }

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve subscription' },
      { status: 500 }
    );
  }
}
