import { prisma } from '@/db/client';
import { BadgeCategory, BadgeRarity } from '@prisma/client';
import { sendPushToUser } from '@/lib/push/service';

/**
 * Check and award badges for a user based on their activity
 */
export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const awardedBadges: string[] = [];

  // Get user with related data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      coursePurchases: true,
      liveSessionBookings: { where: { status: 'CONFIRMED' } },
      goals: { where: { status: 'COMPLETED' } },
      courseReviews: true,
      badges: { include: { badge: true } },
    },
  });

  if (!user) return [];

  const earnedBadgeSlugs = user.badges.map(ub => ub.badge.slug);

  // Check streak badges
  const streakBadges = await checkStreakBadges(userId, earnedBadgeSlugs);
  awardedBadges.push(...streakBadges);

  // Check course completion badges
  const courseBadges = await checkCourseBadges(
    userId,
    user.coursePurchases.length,
    earnedBadgeSlugs
  );
  awardedBadges.push(...courseBadges);

  // Check session badges
  const sessionBadges = await checkSessionBadges(
    userId,
    user.liveSessionBookings.length,
    earnedBadgeSlugs
  );
  awardedBadges.push(...sessionBadges);

  // Check goal badges
  const goalBadges = await checkGoalBadges(
    userId,
    user.goals.length,
    earnedBadgeSlugs
  );
  awardedBadges.push(...goalBadges);

  // Check community badges
  const communityBadges = await checkCommunityBadges(
    userId,
    user.courseReviews.length,
    earnedBadgeSlugs
  );
  awardedBadges.push(...communityBadges);

  // Send push notification for new badges
  for (const badgeSlug of awardedBadges) {
    const badge = await prisma.badge.findUnique({ where: { slug: badgeSlug } });
    if (badge) {
      await sendPushToUser(userId, {
        title: 'New Badge Earned!',
        body: `You earned the "${badge.name}" badge!`,
        tag: 'badge',
        url: '/my/achievements',
        data: { type: 'badge_earned', badgeSlug },
      });
    }
  }

  return awardedBadges;
}

async function checkStreakBadges(
  userId: string,
  earnedSlugs: string[]
): Promise<string[]> {
  const awarded: string[] = [];

  // Get current streak from adherence stats
  const adherence = await prisma.adherenceStats.findFirst({
    where: { userId },
    orderBy: { weekStart: 'desc' },
  });

  const streak = adherence?.streak || 0;

  const streakMilestones = [
    { days: 3, slug: 'streak-3-days' },
    { days: 7, slug: 'streak-7-days' },
    { days: 14, slug: 'streak-14-days' },
    { days: 30, slug: 'streak-30-days' },
    { days: 60, slug: 'streak-60-days' },
    { days: 100, slug: 'streak-100-days' },
  ];

  for (const milestone of streakMilestones) {
    if (streak >= milestone.days && !earnedSlugs.includes(milestone.slug)) {
      const awarded_badge = await awardBadge(userId, milestone.slug);
      if (awarded_badge) awarded.push(milestone.slug);
    }
  }

  return awarded;
}

async function checkCourseBadges(
  userId: string,
  courseCount: number,
  earnedSlugs: string[]
): Promise<string[]> {
  const awarded: string[] = [];

  const milestones = [
    { count: 1, slug: 'first-course' },
    { count: 5, slug: 'courses-5' },
    { count: 10, slug: 'courses-10' },
    { count: 25, slug: 'courses-25' },
  ];

  for (const milestone of milestones) {
    if (courseCount >= milestone.count && !earnedSlugs.includes(milestone.slug)) {
      const awarded_badge = await awardBadge(userId, milestone.slug);
      if (awarded_badge) awarded.push(milestone.slug);
    }
  }

  return awarded;
}

async function checkSessionBadges(
  userId: string,
  sessionCount: number,
  earnedSlugs: string[]
): Promise<string[]> {
  const awarded: string[] = [];

  const milestones = [
    { count: 1, slug: 'first-session' },
    { count: 5, slug: 'sessions-5' },
    { count: 10, slug: 'sessions-10' },
    { count: 25, slug: 'sessions-25' },
  ];

  for (const milestone of milestones) {
    if (sessionCount >= milestone.count && !earnedSlugs.includes(milestone.slug)) {
      const awarded_badge = await awardBadge(userId, milestone.slug);
      if (awarded_badge) awarded.push(milestone.slug);
    }
  }

  return awarded;
}

async function checkGoalBadges(
  userId: string,
  completedGoals: number,
  earnedSlugs: string[]
): Promise<string[]> {
  const awarded: string[] = [];

  const milestones = [
    { count: 1, slug: 'first-goal' },
    { count: 5, slug: 'goals-5' },
    { count: 10, slug: 'goals-10' },
  ];

  for (const milestone of milestones) {
    if (completedGoals >= milestone.count && !earnedSlugs.includes(milestone.slug)) {
      const awarded_badge = await awardBadge(userId, milestone.slug);
      if (awarded_badge) awarded.push(milestone.slug);
    }
  }

  return awarded;
}

async function checkCommunityBadges(
  userId: string,
  reviewCount: number,
  earnedSlugs: string[]
): Promise<string[]> {
  const awarded: string[] = [];

  const milestones = [
    { count: 1, slug: 'first-review' },
    { count: 5, slug: 'reviews-5' },
    { count: 10, slug: 'reviews-10' },
  ];

  for (const milestone of milestones) {
    if (reviewCount >= milestone.count && !earnedSlugs.includes(milestone.slug)) {
      const awarded_badge = await awardBadge(userId, milestone.slug);
      if (awarded_badge) awarded.push(milestone.slug);
    }
  }

  return awarded;
}

/**
 * Award a badge to a user
 */
export async function awardBadge(
  userId: string,
  badgeSlug: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  try {
    const badge = await prisma.badge.findUnique({
      where: { slug: badgeSlug },
    });

    if (!badge || !badge.isActive) {
      return false;
    }

    // Check if already awarded
    const existing = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: { userId, badgeId: badge.id },
      },
    });

    if (existing) {
      return false;
    }

    // Award the badge
    await prisma.userBadge.create({
      data: {
        userId,
        badgeId: badge.id,
        metadata: metadata || undefined,
      },
    });

    return true;
  } catch (error) {
    console.error('Error awarding badge:', error);
    return false;
  }
}

/**
 * Get user's badges with totals
 */
export async function getUserBadges(userId: string) {
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
    orderBy: { earnedAt: 'desc' },
  });

  const totalPoints = userBadges.reduce((sum, ub) => sum + ub.badge.points, 0);

  const byCategory = userBadges.reduce((acc, ub) => {
    const cat = ub.badge.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ub);
    return acc;
  }, {} as Record<string, typeof userBadges>);

  return {
    badges: userBadges,
    totalPoints,
    totalBadges: userBadges.length,
    byCategory,
  };
}

/**
 * Get all available badges
 */
export async function getAllBadges() {
  return prisma.badge.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { rarity: 'asc' }],
  });
}
