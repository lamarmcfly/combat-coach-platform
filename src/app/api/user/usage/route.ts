import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/db/client';

/**
 * GET /api/user/usage
 * Get current user's feature usage for the billing period
 */
export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the start of the current billing period (or current month for free users)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        subscription: {
          select: {
            currentPeriodStart: true,
            currentPeriodEnd: true,
          },
        },
      },
    });

    const periodStart = user?.subscription?.currentPeriodStart || getMonthStart();
    const periodEnd = user?.subscription?.currentPeriodEnd || getMonthEnd();

    // Count usage in current billing period
    const [
      coursesEnrolled,
      sessionsBooked,
      coachingRequests,
      officeHoursBooked,
    ] = await Promise.all([
      prisma.coursePurchase.count({
        where: {
          userId: session.user.id,
          purchasedAt: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
      }),
      prisma.liveSessionBooking.count({
        where: {
          userId: session.user.id,
          createdAt: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
      }),
      prisma.coachingRequest.count({
        where: {
          userId: session.user.id,
          createdAt: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
      }),
      prisma.officeHoursBooking.count({
        where: {
          userId: session.user.id,
          createdAt: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
      }),
    ]);

    return NextResponse.json({
      usage: {
        coursesEnrolled,
        sessionsBooked,
        coachingRequests,
        officeHoursBooked,
      },
      period: {
        start: periodStart,
        end: periodEnd,
      },
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}

function getMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function getMonthEnd(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
}
