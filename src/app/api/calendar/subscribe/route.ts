import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db/client';
import { randomBytes } from 'crypto';

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

/**
 * GET - Get current subscription status and URL
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await db.calendarSubscription.findUnique({
      where: { userId: session.user.id },
      select: {
        token: true,
        isActive: true,
        lastAccessedAt: true,
        createdAt: true,
      },
    });

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
      });
    }

    // Build subscription URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const subscriptionUrl = `${baseUrl}/api/calendar/subscribe/${subscription.token}`;

    // For webcal:// protocol (auto-subscribe in calendar apps)
    const webcalUrl = subscriptionUrl.replace(/^https?:/, 'webcal:');

    return NextResponse.json({
      hasSubscription: true,
      isActive: subscription.isActive,
      subscriptionUrl,
      webcalUrl,
      lastAccessedAt: subscription.lastAccessedAt,
      createdAt: subscription.createdAt,
    });
  } catch (error) {
    console.error('Error getting subscription:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create or regenerate subscription token
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate a secure token
    const token = randomBytes(32).toString('hex');

    // Upsert subscription (create or update)
    const subscription = await db.calendarSubscription.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        token,
        isActive: true,
      },
      update: {
        token,
        isActive: true,
      },
    });

    // Build subscription URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const subscriptionUrl = `${baseUrl}/api/calendar/subscribe/${subscription.token}`;
    const webcalUrl = subscriptionUrl.replace(/^https?:/, 'webcal:');

    return NextResponse.json({
      success: true,
      subscriptionUrl,
      webcalUrl,
      message: 'Calendar subscription created',
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Revoke subscription
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.calendarSubscription.update({
      where: { userId: session.user.id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Calendar subscription revoked',
    });
  } catch (error) {
    console.error('Error revoking subscription:', error);
    return NextResponse.json(
      { error: 'Failed to revoke subscription' },
      { status: 500 }
    );
  }
}
