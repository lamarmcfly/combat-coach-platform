import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/db/client';
import { strictRatelimit, checkRateLimit } from '@/lib/ratelimit';

/**
 * GET /api/user/export
 * Export all user data for GDPR compliance
 */
export async function GET(req: NextRequest) {
  try {
    // Apply strict rate limiting (data export is expensive)
    const rateLimitResult = await checkRateLimit(req, strictRatelimit);
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all user data
    const [
      user,
      coursePurchases,
      sessionBookings,
      officeHoursBookings,
      coachingRequests,
      goals,
      weightEntries,
      weightGoal,
      fights,
      reviews,
      badges,
      certificates,
    ] = await Promise.all([
      // Basic user info (excluding sensitive data like passwordHash)
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          subscriptionTier: true,
          createdAt: true,
          updatedAt: true,
          coachProfile: {
            select: {
              displayName: true,
              tagline: true,
              shortBio: true,
              longBio: true,
              gymName: true,
              gymLocation: true,
              yearsCoaching: true,
              status: true,
              createdAt: true,
            },
          },
          subscription: {
            select: {
              tier: true,
              status: true,
              currentPeriodStart: true,
              currentPeriodEnd: true,
              cancelAtPeriodEnd: true,
              createdAt: true,
            },
          },
          notificationPreferences: true,
        },
      }),

      // Course purchases
      prisma.coursePurchase.findMany({
        where: { userId },
        select: {
          id: true,
          status: true,
          progressPercent: true,
          purchasedAt: true,
          course: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
      }),

      // Session bookings
      prisma.liveSessionBooking.findMany({
        where: { userId },
        select: {
          id: true,
          status: true,
          createdAt: true,
          liveSession: {
            select: {
              title: true,
              startTime: true,
            },
          },
        },
      }),

      // Office hours bookings
      prisma.officeHoursBooking.findMany({
        where: { userId },
        select: {
          id: true,
          status: true,
          notes: true,
          createdAt: true,
          slot: {
            select: {
              startTime: true,
              endTime: true,
            },
          },
        },
      }),

      // Coaching requests
      prisma.coachingRequest.findMany({
        where: { userId },
        select: {
          id: true,
          type: true,
          status: true,
          priority: true,
          title: true,
          description: true,
          submittedAt: true,
          completedAt: true,
          messages: {
            select: {
              content: true,
              isCoachResponse: true,
              createdAt: true,
            },
          },
        },
      }),

      // Goals
      prisma.goal.findMany({
        where: { userId },
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          status: true,
          targetValue: true,
          currentValue: true,
          targetDate: true,
          createdAt: true,
          completedAt: true,
        },
      }),

      // Weight entries
      prisma.weightEntry.findMany({
        where: { userId },
        select: {
          id: true,
          weight: true,
          unit: true,
          notes: true,
          loggedAt: true,
        },
        orderBy: { loggedAt: 'desc' },
      }),

      // Weight goal
      prisma.weightGoal.findUnique({
        where: { userId },
        select: {
          targetWeight: true,
          unit: true,
          targetDate: true,
          weightClass: true,
          notes: true,
          isActive: true,
        },
      }),

      // Fights
      prisma.fight.findMany({
        where: { userId },
        select: {
          id: true,
          type: true,
          result: true,
          eventName: true,
          eventDate: true,
          location: true,
          opponentName: true,
          discipline: true,
          summaryNotes: true,
          lessonsLearned: true,
          createdAt: true,
        },
      }),

      // Reviews
      prisma.courseReview.findMany({
        where: { userId },
        select: {
          id: true,
          rating: true,
          title: true,
          content: true,
          createdAt: true,
          course: {
            select: {
              title: true,
            },
          },
        },
      }),

      // Badges
      prisma.userBadge.findMany({
        where: { userId },
        select: {
          earnedAt: true,
          badge: {
            select: {
              name: true,
              description: true,
              category: true,
            },
          },
        },
      }),

      // Certificates
      prisma.certificate.findMany({
        where: { userId },
        select: {
          certificateNumber: true,
          courseName: true,
          coachName: true,
          completionDate: true,
          verificationUrl: true,
        },
      }),
    ]);

    // Compile export data
    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        ...user,
        passwordHash: undefined, // Explicitly exclude
      },
      coursePurchases,
      sessionBookings,
      officeHoursBookings,
      coachingRequests,
      goals,
      weightTracking: {
        entries: weightEntries,
        goal: weightGoal,
      },
      fights,
      reviews,
      badges,
      certificates,
    };

    // Return as downloadable JSON
    const response = new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="corner-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });

    return response;
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
