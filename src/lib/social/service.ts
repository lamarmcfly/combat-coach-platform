import { ActivityType } from '@prisma/client';
import { prisma } from '@/db/client';

export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  isCoach: boolean;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isFollowedBy: boolean;
}

export interface ActivityItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: ActivityType;
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  likesCount: number;
  commentsCount: number;
  hasLiked: boolean;
  createdAt: Date;
}

/**
 * Follow a user
 */
export async function followUser(followerId: string, followingId: string): Promise<void> {
  if (followerId === followingId) {
    throw new Error('Cannot follow yourself');
  }

  await prisma.follow.create({
    data: {
      followerId,
      followingId,
    },
  });

  // Create activity feed item
  const follower = await prisma.user.findUnique({
    where: { id: followerId },
    select: { firstName: true, lastName: true },
  });

  const following = await prisma.user.findUnique({
    where: { id: followingId },
    select: { firstName: true, lastName: true },
  });

  await prisma.activityFeedItem.create({
    data: {
      userId: followerId,
      type: ActivityType.STARTED_FOLLOWING,
      title: `${follower?.firstName || 'User'} started following ${following?.firstName || 'someone'}`,
      targetUserId: followingId,
      linkUrl: `/profile/${followingId}`,
    },
  });
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  await prisma.follow.deleteMany({
    where: {
      followerId,
      followingId,
    },
  });
}

/**
 * Check if user is following another user
 */
export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  });

  return !!follow;
}

/**
 * Get followers of a user
 */
export async function getFollowers(
  userId: string,
  currentUserId?: string,
  limit: number = 50
): Promise<UserProfile[]> {
  const followers = await prisma.follow.findMany({
    where: { followingId: userId },
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: { followerId: true },
  });

  const followerIds = followers.map((f) => f.followerId);

  const users = await prisma.user.findMany({
    where: { id: { in: followerIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      role: true,
      coachProfile: {
        select: { avatarUrl: true },
      },
      _count: {
        select: {
          // Follows where this user is the follower
        },
      },
    },
  });

  // Get follow counts and relationship status
  const profiles = await Promise.all(
    users.map(async (user) => {
      const [followersCount, followingCount, isFollowingUser, isFollowedByUser] =
        await Promise.all([
          prisma.follow.count({ where: { followingId: user.id } }),
          prisma.follow.count({ where: { followerId: user.id } }),
          currentUserId
            ? prisma.follow.findUnique({
                where: {
                  followerId_followingId: {
                    followerId: currentUserId,
                    followingId: user.id,
                  },
                },
              })
            : null,
          currentUserId
            ? prisma.follow.findUnique({
                where: {
                  followerId_followingId: {
                    followerId: user.id,
                    followingId: currentUserId,
                  },
                },
              })
            : null,
        ]);

      return {
        id: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
        avatar: user.coachProfile?.avatarUrl || undefined,
        role: user.role,
        isCoach: !!user.coachProfile,
        followersCount,
        followingCount,
        isFollowing: !!isFollowingUser,
        isFollowedBy: !!isFollowedByUser,
      };
    })
  );

  return profiles;
}

/**
 * Get users that a user is following
 */
export async function getFollowing(
  userId: string,
  currentUserId?: string,
  limit: number = 50
): Promise<UserProfile[]> {
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: { followingId: true },
  });

  const followingIds = following.map((f) => f.followingId);

  const users = await prisma.user.findMany({
    where: { id: { in: followingIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      role: true,
      coachProfile: {
        select: { avatarUrl: true },
      },
    },
  });

  const profiles = await Promise.all(
    users.map(async (user) => {
      const [followersCount, followingCount, isFollowingUser, isFollowedByUser] =
        await Promise.all([
          prisma.follow.count({ where: { followingId: user.id } }),
          prisma.follow.count({ where: { followerId: user.id } }),
          currentUserId
            ? prisma.follow.findUnique({
                where: {
                  followerId_followingId: {
                    followerId: currentUserId,
                    followingId: user.id,
                  },
                },
              })
            : null,
          currentUserId
            ? prisma.follow.findUnique({
                where: {
                  followerId_followingId: {
                    followerId: user.id,
                    followingId: currentUserId,
                  },
                },
              })
            : null,
        ]);

      return {
        id: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
        avatar: user.coachProfile?.avatarUrl || undefined,
        role: user.role,
        isCoach: !!user.coachProfile,
        followersCount,
        followingCount,
        isFollowing: !!isFollowingUser,
        isFollowedBy: !!isFollowedByUser,
      };
    })
  );

  return profiles;
}

/**
 * Get activity feed for a user (from people they follow)
 */
export async function getActivityFeed(
  userId: string,
  cursor?: string,
  limit: number = 20
): Promise<{ items: ActivityItem[]; nextCursor: string | null }> {
  // Get users this person follows
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  const followingIds = [userId, ...following.map((f) => f.followingId)];

  const activities = await prisma.activityFeedItem.findMany({
    where: {
      userId: { in: followingIds },
      isPublic: true,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
  });

  const hasMore = activities.length > limit;
  const activityList = hasMore ? activities.slice(0, limit) : activities;

  // Get user info for activities
  const userIds = [...new Set(activityList.map((a) => a.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      coachProfile: {
        select: { avatarUrl: true },
      },
    },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  // Check which activities user has liked
  const activityIds = activityList.map((a) => a.id);
  const userLikes = await prisma.activityLike.findMany({
    where: {
      activityId: { in: activityIds },
      userId,
    },
    select: { activityId: true },
  });

  const likedSet = new Set(userLikes.map((l) => l.activityId));

  const items: ActivityItem[] = activityList.map((activity) => {
    const user = userMap.get(activity.userId);
    return {
      id: activity.id,
      userId: activity.userId,
      userName: user
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown'
        : 'Unknown',
      userAvatar: user?.coachProfile?.avatarUrl || undefined,
      type: activity.type,
      title: activity.title,
      description: activity.description || undefined,
      imageUrl: activity.imageUrl || undefined,
      linkUrl: activity.linkUrl || undefined,
      likesCount: activity.likesCount,
      commentsCount: activity.commentsCount,
      hasLiked: likedSet.has(activity.id),
      createdAt: activity.createdAt,
    };
  });

  return {
    items,
    nextCursor: hasMore ? activityList[activityList.length - 1].createdAt.toISOString() : null,
  };
}

/**
 * Get public activity feed (for explore)
 */
export async function getPublicFeed(
  currentUserId?: string,
  cursor?: string,
  limit: number = 20
): Promise<{ items: ActivityItem[]; nextCursor: string | null }> {
  const activities = await prisma.activityFeedItem.findMany({
    where: {
      isPublic: true,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
  });

  const hasMore = activities.length > limit;
  const activityList = hasMore ? activities.slice(0, limit) : activities;

  const userIds = [...new Set(activityList.map((a) => a.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      coachProfile: {
        select: { avatarUrl: true },
      },
    },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  // Check likes if user is logged in
  let likedSet = new Set<string>();
  if (currentUserId) {
    const activityIds = activityList.map((a) => a.id);
    const userLikes = await prisma.activityLike.findMany({
      where: {
        activityId: { in: activityIds },
        userId: currentUserId,
      },
      select: { activityId: true },
    });
    likedSet = new Set(userLikes.map((l) => l.activityId));
  }

  const items: ActivityItem[] = activityList.map((activity) => {
    const user = userMap.get(activity.userId);
    return {
      id: activity.id,
      userId: activity.userId,
      userName: user
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown'
        : 'Unknown',
      userAvatar: user?.coachProfile?.avatarUrl || undefined,
      type: activity.type,
      title: activity.title,
      description: activity.description || undefined,
      imageUrl: activity.imageUrl || undefined,
      linkUrl: activity.linkUrl || undefined,
      likesCount: activity.likesCount,
      commentsCount: activity.commentsCount,
      hasLiked: likedSet.has(activity.id),
      createdAt: activity.createdAt,
    };
  });

  return {
    items,
    nextCursor: hasMore ? activityList[activityList.length - 1].createdAt.toISOString() : null,
  };
}

/**
 * Like an activity
 */
export async function likeActivity(activityId: string, userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.activityLike.create({
      data: {
        activityId,
        userId,
      },
    }),
    prisma.activityFeedItem.update({
      where: { id: activityId },
      data: { likesCount: { increment: 1 } },
    }),
  ]);
}

/**
 * Unlike an activity
 */
export async function unlikeActivity(activityId: string, userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.activityLike.deleteMany({
      where: {
        activityId,
        userId,
      },
    }),
    prisma.activityFeedItem.update({
      where: { id: activityId },
      data: { likesCount: { decrement: 1 } },
    }),
  ]);
}

/**
 * Create an activity feed item (for internal use)
 */
export async function createActivity(params: {
  userId: string;
  type: ActivityType;
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  courseId?: string;
  badgeId?: string;
  goalId?: string;
  fightId?: string;
  targetUserId?: string;
  isPublic?: boolean;
}): Promise<void> {
  await prisma.activityFeedItem.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      description: params.description,
      imageUrl: params.imageUrl,
      linkUrl: params.linkUrl,
      courseId: params.courseId,
      badgeId: params.badgeId,
      goalId: params.goalId,
      fightId: params.fightId,
      targetUserId: params.targetUserId,
      isPublic: params.isPublic ?? true,
    },
  });
}

/**
 * Get follow counts for a user
 */
export async function getFollowCounts(
  userId: string
): Promise<{ followers: number; following: number }> {
  const [followers, following] = await Promise.all([
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);

  return { followers, following };
}
