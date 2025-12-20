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

    const coachProfile = await db.coachProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!coachProfile) {
      return NextResponse.json({ error: 'Coach profile not found' }, { status: 404 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get all earnings data in parallel
    const [
      coursePurchases,
      sessionBookings,
      payouts,
      monthlyCoursePurchases,
      lastMonthCoursePurchases,
      monthlySessionBookings,
      lastMonthSessionBookings,
    ] = await Promise.all([
      // All time course purchases
      db.coursePurchase.findMany({
        where: {
          course: { coachId: coachProfile.id },
          status: 'ACTIVE',
        },
        include: {
          course: {
            select: { id: true, title: true },
          },
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { purchasedAt: 'desc' },
      }),
      // All time session bookings
      db.liveSessionBooking.findMany({
        where: {
          liveSession: { coachId: coachProfile.id },
          status: 'CONFIRMED',
        },
        include: {
          liveSession: {
            select: { id: true, title: true, priceCents: true },
          },
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Payout history
      db.payout.findMany({
        where: { coachId: coachProfile.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // This month's course purchases
      db.coursePurchase.aggregate({
        where: {
          course: { coachId: coachProfile.id },
          status: 'ACTIVE',
          purchasedAt: { gte: startOfMonth },
        },
        _sum: { amountCents: true },
        _count: true,
      }),
      // Last month's course purchases
      db.coursePurchase.aggregate({
        where: {
          course: { coachId: coachProfile.id },
          status: 'ACTIVE',
          purchasedAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { amountCents: true },
        _count: true,
      }),
      // This month's session bookings
      db.liveSessionBooking.findMany({
        where: {
          liveSession: { coachId: coachProfile.id },
          status: 'CONFIRMED',
          createdAt: { gte: startOfMonth },
        },
        include: {
          liveSession: {
            select: { priceCents: true },
          },
        },
      }),
      // Last month's session bookings
      db.liveSessionBooking.findMany({
        where: {
          liveSession: { coachId: coachProfile.id },
          status: 'CONFIRMED',
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        include: {
          liveSession: {
            select: { priceCents: true },
          },
        },
      }),
    ]);

    // Calculate totals
    const totalCourseRevenue = coursePurchases.reduce((sum, p) => sum + p.amountCents, 0);
    const totalSessionRevenue = sessionBookings.reduce(
      (sum, b) => sum + (b.liveSession.priceCents ?? 0),
      0
    );
    const totalRevenue = totalCourseRevenue + totalSessionRevenue;

    const thisMonthCourseRevenue = monthlyCoursePurchases._sum.amountCents ?? 0;
    const thisMonthSessionRevenue = monthlySessionBookings.reduce(
      (sum, b) => sum + (b.liveSession.priceCents ?? 0),
      0
    );
    const thisMonthRevenue = thisMonthCourseRevenue + thisMonthSessionRevenue;

    const lastMonthCourseRevenue = lastMonthCoursePurchases._sum.amountCents ?? 0;
    const lastMonthSessionRevenue = lastMonthSessionBookings.reduce(
      (sum, b) => sum + (b.liveSession.priceCents ?? 0),
      0
    );
    const lastMonthRevenue = lastMonthCourseRevenue + lastMonthSessionRevenue;

    // Calculate pending payout (rough estimate - platform takes ~20%)
    const platformFee = 0.20;
    const pendingPayout = Math.round(thisMonthRevenue * (1 - platformFee));

    // Calculate month-over-month growth
    const monthGrowth = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : thisMonthRevenue > 0 ? 100 : 0;

    // Build revenue by month for chart (last 6 months)
    const revenueByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthName = monthStart.toLocaleDateString('en-US', { month: 'short' });

      const monthCourses = coursePurchases.filter(
        (p) => new Date(p.purchasedAt) >= monthStart && new Date(p.purchasedAt) <= monthEnd
      );
      const monthSessions = sessionBookings.filter(
        (b) => new Date(b.createdAt) >= monthStart && new Date(b.createdAt) <= monthEnd
      );

      const courseTotal = monthCourses.reduce((sum, p) => sum + p.amountCents, 0);
      const sessionTotal = monthSessions.reduce(
        (sum, b) => sum + (b.liveSession.priceCents ?? 0),
        0
      );

      revenueByMonth.push({
        month: monthName,
        courses: courseTotal / 100,
        sessions: sessionTotal / 100,
        total: (courseTotal + sessionTotal) / 100,
      });
    }

    // Recent transactions
    const recentTransactions = [
      ...coursePurchases.slice(0, 10).map((p) => ({
        id: p.id,
        type: 'course' as const,
        title: p.course.title,
        customer: `${p.user.firstName ?? ''} ${p.user.lastName ?? ''}`.trim() || p.user.email,
        amount: p.amountCents,
        date: p.purchasedAt,
      })),
      ...sessionBookings.slice(0, 10).map((b) => ({
        id: b.id,
        type: 'session' as const,
        title: b.liveSession.title,
        customer: `${b.user.firstName ?? ''} ${b.user.lastName ?? ''}`.trim() || b.user.email,
        amount: b.liveSession.priceCents ?? 0,
        date: b.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    const stats = {
      totalRevenue: totalRevenue / 100,
      thisMonthRevenue: thisMonthRevenue / 100,
      lastMonthRevenue: lastMonthRevenue / 100,
      monthGrowth: Math.round(monthGrowth * 10) / 10,
      pendingPayout: pendingPayout / 100,
      totalCoursesSold: coursePurchases.length,
      totalSessionsBooked: sessionBookings.length,
      platformFee: platformFee * 100,
    };

    return NextResponse.json({
      stats,
      revenueByMonth,
      recentTransactions,
      payouts: payouts.map((p) => ({
        id: p.id,
        amount: p.amountCents / 100,
        status: p.status,
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        payoutDate: p.payoutDate,
      })),
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    return NextResponse.json({ error: 'Failed to fetch earnings' }, { status: 500 });
  }
}
