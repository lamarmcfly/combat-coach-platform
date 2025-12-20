import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a coach
    const coachProfile = await db.coachProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!coachProfile) {
      return NextResponse.json({ error: 'Coach profile not found' }, { status: 404 });
    }

    // Get unique clients from various sources
    const [
      coursePurchases,
      sessionBookings,
      coachingRequests,
    ] = await Promise.all([
      // Students who purchased courses
      db.coursePurchase.findMany({
        where: {
          course: { coachId: coachProfile.id },
          status: 'ACTIVE',
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              createdAt: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Students who booked live sessions
      db.liveSessionBooking.findMany({
        where: {
          liveSession: { coachId: coachProfile.id },
          status: 'CONFIRMED',
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              createdAt: true,
            },
          },
          liveSession: {
            select: {
              id: true,
              title: true,
              startTime: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Students who requested coaching
      db.coachingRequest.findMany({
        where: { coachId: coachProfile.id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              createdAt: true,
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
      }),
    ]);

    // Build a map of unique clients with their engagement data
    const clientMap = new Map<string, {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      joinedAt: Date;
      coursesOwned: number;
      sessionsBooked: number;
      coachingRequests: number;
      lastActivity: Date;
      courses: { id: string; title: string }[];
    }>();

    // Process course purchases
    for (const purchase of coursePurchases) {
      const user = purchase.user;
      const existing = clientMap.get(user.id);
      if (existing) {
        existing.coursesOwned++;
        existing.courses.push({ id: purchase.course.id, title: purchase.course.title });
        if (purchase.createdAt > existing.lastActivity) {
          existing.lastActivity = purchase.createdAt;
        }
      } else {
        clientMap.set(user.id, {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          joinedAt: user.createdAt,
          coursesOwned: 1,
          sessionsBooked: 0,
          coachingRequests: 0,
          lastActivity: purchase.createdAt,
          courses: [{ id: purchase.course.id, title: purchase.course.title }],
        });
      }
    }

    // Process session bookings
    for (const booking of sessionBookings) {
      const user = booking.user;
      const existing = clientMap.get(user.id);
      if (existing) {
        existing.sessionsBooked++;
        if (booking.createdAt > existing.lastActivity) {
          existing.lastActivity = booking.createdAt;
        }
      } else {
        clientMap.set(user.id, {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          joinedAt: user.createdAt,
          coursesOwned: 0,
          sessionsBooked: 1,
          coachingRequests: 0,
          lastActivity: booking.createdAt,
          courses: [],
        });
      }
    }

    // Process coaching requests
    for (const request of coachingRequests) {
      const user = request.user;
      const existing = clientMap.get(user.id);
      if (existing) {
        existing.coachingRequests++;
        if (request.submittedAt > existing.lastActivity) {
          existing.lastActivity = request.submittedAt;
        }
      } else {
        clientMap.set(user.id, {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          joinedAt: user.createdAt,
          coursesOwned: 0,
          sessionsBooked: 0,
          coachingRequests: 1,
          lastActivity: request.submittedAt,
          courses: [],
        });
      }
    }

    // Convert to array and sort by last activity
    const clients = Array.from(clientMap.values())
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());

    // Calculate summary stats
    const stats = {
      totalClients: clients.length,
      activeThisMonth: clients.filter(
        (c) => c.lastActivity > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length,
      totalCoursePurchases: coursePurchases.length,
      totalSessionBookings: sessionBookings.length,
      totalCoachingRequests: coachingRequests.length,
    };

    return NextResponse.json({ clients, stats });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}
