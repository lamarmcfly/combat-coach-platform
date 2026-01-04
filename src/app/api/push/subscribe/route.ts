import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/db/client';
import { z } from 'zod';

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

/**
 * POST /api/push/subscribe
 * Subscribe to push notifications
 */
export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = subscriptionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    const { endpoint, keys } = result.data;
    const userAgent = req.headers.get('user-agent') || undefined;

    // Upsert the subscription
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: session.user.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
      },
    });

    // Enable push notifications in preferences
    await prisma.notificationPreferences.upsert({
      where: { userId: session.user.id },
      update: { pushEnabled: true },
      create: {
        userId: session.user.id,
        pushEnabled: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/push/subscribe
 * Unsubscribe from push notifications
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { endpoint } = await req.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    // Delete the subscription
    await prisma.pushSubscription.deleteMany({
      where: {
        userId: session.user.id,
        endpoint,
      },
    });

    // Check if user has any remaining subscriptions
    const remainingSubscriptions = await prisma.pushSubscription.count({
      where: { userId: session.user.id },
    });

    // If no subscriptions left, disable push in preferences
    if (remainingSubscriptions === 0) {
      await prisma.notificationPreferences.update({
        where: { userId: session.user.id },
        data: { pushEnabled: false },
      }).catch(() => {}); // Ignore if preferences don't exist
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}
