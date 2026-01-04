import { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/db/client';
import { GamificationDashboard } from '@/components/gamification';

export const metadata: Metadata = {
  title: 'Achievements | Corner',
  description: 'Track your training achievements and badges',
};

async function getAchievementsData(userId: string) {
  const [earnedBadges, allBadges, userCounts, latestAdherence, goalsAchieved] = await Promise.all([
    prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    }),
    prisma.badge.findMany({
      orderBy: [{ rarity: 'desc' }, { points: 'desc' }],
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        _count: {
          select: {
            coursePurchases: true,
            liveSessionBookings: true,
            courseReviews: true,
          },
        },
      },
    }),
    prisma.adherenceStats.findFirst({
      where: { userId },
      orderBy: { weekStart: 'desc' },
      select: { streak: true },
    }),
    prisma.goal.count({
      where: {
        userId,
        status: 'COMPLETED',
      },
    }),
  ]);

  // Calculate total points from earned badges
  const totalPoints = earnedBadges.reduce((sum, ub) => sum + ub.badge.points, 0);

  // Get current streak from adherence stats
  const currentStreak = latestAdherence?.streak || 0;

  // Get longest streak from badge achievements or current streak
  const longestStreak = earnedBadges
    .filter((ub) => ub.badge.category === 'STREAK')
    .reduce((max, ub) => {
      const match = ub.badge.slug.match(/streak-(\d+)/);
      if (match) {
        return Math.max(max, parseInt(match[1], 10));
      }
      return max;
    }, currentStreak);

  return {
    earnedBadges,
    allBadges,
    totalPoints,
    stats: {
      currentStreak,
      longestStreak,
      coursesCompleted: userCounts?._count.coursePurchases || 0,
      sessionsAttended: userCounts?._count.liveSessionBookings || 0,
      reviewsWritten: userCounts?._count.courseReviews || 0,
      goalsAchieved,
    },
  };
}

export default async function AchievementsPage() {
  const session = (await getServerSession(authOptions)) as Session | null;

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/my/achievements');
  }

  const data = await getAchievementsData(session.user.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Achievements</h1>
        <p className="mt-2 text-gray-600">
          Track your progress and collect badges as you train
        </p>
      </div>

      <GamificationDashboard
        earnedBadges={data.earnedBadges}
        allBadges={data.allBadges}
        totalPoints={data.totalPoints}
        stats={data.stats}
      />
    </div>
  );
}
