import { prisma } from '@/db/client';

export type LeaderboardType =
  | 'streak'
  | 'courses_completed'
  | 'badges_earned'
  | 'sessions_attended'
  | 'goals_achieved'
  | 'fights_logged';

export type LeaderboardPeriod = 'all_time' | 'monthly' | 'weekly';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  isCoach: boolean;
  value: number;
  change?: number; // Position change from previous period
}

export interface LeaderboardResult {
  type: LeaderboardType;
  period: LeaderboardPeriod;
  entries: LeaderboardEntry[];
  userRank?: LeaderboardEntry;
  lastUpdated: Date;
}

/**
 * Get streak leaderboard (from AdherenceStats)
 */
async function getStreakLeaderboard(
  period: LeaderboardPeriod,
  limit: number
): Promise<LeaderboardEntry[]> {
  // Get latest adherence stats per user with highest streak
  const adherenceStats = await prisma.adherenceStats.findMany({
    where: {
      streak: { gt: 0 },
    },
    orderBy: [{ streak: 'desc' }, { weekStart: 'desc' }],
    distinct: ['userId'],
    take: limit,
    select: {
      userId: true,
      streak: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          coachProfile: {
            select: { avatarUrl: true },
          },
        },
      },
    },
  });

  return adherenceStats.map((stat, index) => ({
    rank: index + 1,
    userId: stat.userId,
    userName: `${stat.user.firstName || ''} ${stat.user.lastName || ''}`.trim() || 'Unknown',
    userAvatar: stat.user.coachProfile?.avatarUrl || undefined,
    isCoach: !!stat.user.coachProfile,
    value: stat.streak,
  }));
}

/**
 * Get courses completed leaderboard (from CoursePurchase)
 */
async function getCoursesCompletedLeaderboard(
  period: LeaderboardPeriod,
  limit: number
): Promise<LeaderboardEntry[]> {
  const dateFilter = getDateFilter(period);

  const purchases = await prisma.coursePurchase.groupBy({
    by: ['userId'],
    where: dateFilter ? { purchasedAt: { gte: dateFilter } } : {},
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit,
  });

  const userIds = purchases.map((p) => p.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      coachProfile: { select: { avatarUrl: true } },
    },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return purchases.map((purchase, index) => {
    const user = userMap.get(purchase.userId);
    return {
      rank: index + 1,
      userId: purchase.userId,
      userName: user
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown'
        : 'Unknown',
      userAvatar: user?.coachProfile?.avatarUrl || undefined,
      isCoach: !!user?.coachProfile,
      value: purchase._count.id,
    };
  });
}

/**
 * Get badges earned leaderboard
 */
async function getBadgesEarnedLeaderboard(
  period: LeaderboardPeriod,
  limit: number
): Promise<LeaderboardEntry[]> {
  const dateFilter = getDateFilter(period);

  const badges = await prisma.userBadge.groupBy({
    by: ['userId'],
    where: dateFilter ? { earnedAt: { gte: dateFilter } } : {},
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit,
  });

  const userIds = badges.map((b) => b.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      coachProfile: { select: { avatarUrl: true } },
    },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return badges.map((badge, index) => {
    const user = userMap.get(badge.userId);
    return {
      rank: index + 1,
      userId: badge.userId,
      userName: user
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown'
        : 'Unknown',
      userAvatar: user?.coachProfile?.avatarUrl || undefined,
      isCoach: !!user?.coachProfile,
      value: badge._count.id,
    };
  });
}

/**
 * Get sessions attended leaderboard (from LiveSessionBooking)
 */
async function getSessionsAttendedLeaderboard(
  period: LeaderboardPeriod,
  limit: number
): Promise<LeaderboardEntry[]> {
  const dateFilter = getDateFilter(period);

  const bookings = await prisma.liveSessionBooking.groupBy({
    by: ['userId'],
    where: {
      status: 'CONFIRMED',
      ...(dateFilter && { createdAt: { gte: dateFilter } }),
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit,
  });

  const userIds = bookings.map((b) => b.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      coachProfile: { select: { avatarUrl: true } },
    },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return bookings.map((booking, index) => {
    const user = userMap.get(booking.userId);
    return {
      rank: index + 1,
      userId: booking.userId,
      userName: user
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown'
        : 'Unknown',
      userAvatar: user?.coachProfile?.avatarUrl || undefined,
      isCoach: !!user?.coachProfile,
      value: booking._count.id,
    };
  });
}

/**
 * Get goals achieved leaderboard (from Goal)
 */
async function getGoalsAchievedLeaderboard(
  period: LeaderboardPeriod,
  limit: number
): Promise<LeaderboardEntry[]> {
  const dateFilter = getDateFilter(period);

  const goals = await prisma.goal.groupBy({
    by: ['userId'],
    where: {
      status: 'COMPLETED',
      ...(dateFilter && { completedAt: { gte: dateFilter } }),
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit,
  });

  const userIds = goals.map((g) => g.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      coachProfile: { select: { avatarUrl: true } },
    },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return goals.map((goal, index) => {
    const user = userMap.get(goal.userId);
    return {
      rank: index + 1,
      userId: goal.userId,
      userName: user
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown'
        : 'Unknown',
      userAvatar: user?.coachProfile?.avatarUrl || undefined,
      isCoach: !!user?.coachProfile,
      value: goal._count.id,
    };
  });
}

/**
 * Get fights logged leaderboard
 */
async function getFightsLoggedLeaderboard(
  period: LeaderboardPeriod,
  limit: number
): Promise<LeaderboardEntry[]> {
  const dateFilter = getDateFilter(period);

  const fights = await prisma.fight.groupBy({
    by: ['userId'],
    where: dateFilter ? { eventDate: { gte: dateFilter } } : {},
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit,
  });

  const userIds = fights.map((f) => f.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      coachProfile: { select: { avatarUrl: true } },
    },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return fights.map((fight, index) => {
    const user = userMap.get(fight.userId);
    return {
      rank: index + 1,
      userId: fight.userId,
      userName: user
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown'
        : 'Unknown',
      userAvatar: user?.coachProfile?.avatarUrl || undefined,
      isCoach: !!user?.coachProfile,
      value: fight._count.id,
    };
  });
}

/**
 * Get date filter based on period
 */
function getDateFilter(period: LeaderboardPeriod): Date | null {
  const now = new Date();

  switch (period) {
    case 'weekly':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'all_time':
    default:
      return null;
  }
}

/**
 * Get leaderboard data
 */
export async function getLeaderboard(
  type: LeaderboardType,
  period: LeaderboardPeriod = 'all_time',
  limit: number = 50,
  currentUserId?: string
): Promise<LeaderboardResult> {
  let entries: LeaderboardEntry[];

  switch (type) {
    case 'streak':
      entries = await getStreakLeaderboard(period, limit);
      break;
    case 'courses_completed':
      entries = await getCoursesCompletedLeaderboard(period, limit);
      break;
    case 'badges_earned':
      entries = await getBadgesEarnedLeaderboard(period, limit);
      break;
    case 'sessions_attended':
      entries = await getSessionsAttendedLeaderboard(period, limit);
      break;
    case 'goals_achieved':
      entries = await getGoalsAchievedLeaderboard(period, limit);
      break;
    case 'fights_logged':
      entries = await getFightsLoggedLeaderboard(period, limit);
      break;
    default:
      entries = [];
  }

  // Find current user's rank if not in top results
  let userRank: LeaderboardEntry | undefined;
  if (currentUserId) {
    const existingEntry = entries.find((e) => e.userId === currentUserId);
    if (existingEntry) {
      userRank = existingEntry;
    } else {
      // Get user's rank separately
      userRank = await getUserRank(type, period, currentUserId);
    }
  }

  return {
    type,
    period,
    entries,
    userRank,
    lastUpdated: new Date(),
  };
}

/**
 * Get a specific user's rank for a leaderboard type
 */
async function getUserRank(
  type: LeaderboardType,
  period: LeaderboardPeriod,
  userId: string
): Promise<LeaderboardEntry | undefined> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      coachProfile: { select: { avatarUrl: true } },
    },
  });

  if (!user) return undefined;

  let value = 0;
  let totalAbove = 0;

  const dateFilter = getDateFilter(period);

  switch (type) {
    case 'streak':
      const latestAdherence = await prisma.adherenceStats.findFirst({
        where: { userId },
        orderBy: { weekStart: 'desc' },
        select: { streak: true },
      });
      value = latestAdherence?.streak || 0;
      totalAbove = await prisma.adherenceStats.count({
        where: { streak: { gt: value } },
      });
      break;
    case 'courses_completed':
      value = await prisma.coursePurchase.count({
        where: {
          userId,
          ...(dateFilter && { purchasedAt: { gte: dateFilter } }),
        },
      });
      break;
    case 'badges_earned':
      value = await prisma.userBadge.count({
        where: {
          userId,
          ...(dateFilter && { earnedAt: { gte: dateFilter } }),
        },
      });
      break;
    case 'sessions_attended':
      value = await prisma.liveSessionBooking.count({
        where: {
          userId,
          status: 'CONFIRMED',
          ...(dateFilter && { createdAt: { gte: dateFilter } }),
        },
      });
      break;
    case 'goals_achieved':
      value = await prisma.goal.count({
        where: {
          userId,
          status: 'COMPLETED',
          ...(dateFilter && { completedAt: { gte: dateFilter } }),
        },
      });
      break;
    case 'fights_logged':
      value = await prisma.fight.count({
        where: {
          userId,
          ...(dateFilter && { eventDate: { gte: dateFilter } }),
        },
      });
      break;
  }

  return {
    rank: totalAbove + 1,
    userId: user.id,
    userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
    userAvatar: user.coachProfile?.avatarUrl || undefined,
    isCoach: !!user.coachProfile,
    value,
  };
}

/**
 * Get multiple leaderboard summaries
 */
export async function getLeaderboardSummaries(
  currentUserId?: string
): Promise<Record<LeaderboardType, LeaderboardEntry[]>> {
  const types: LeaderboardType[] = [
    'streak',
    'courses_completed',
    'badges_earned',
    'sessions_attended',
  ];

  const results: Record<string, LeaderboardEntry[]> = {};

  for (const type of types) {
    const leaderboard = await getLeaderboard(type, 'all_time', 5, currentUserId);
    results[type] = leaderboard.entries;
  }

  return results as Record<LeaderboardType, LeaderboardEntry[]>;
}
