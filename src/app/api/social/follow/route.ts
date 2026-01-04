'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { z } from 'zod';
import { followUser, unfollowUser, isFollowing, getFollowCounts } from '@/lib/social/service';
import { apiRatelimit } from '@/lib/ratelimit';

const followSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

/**
 * GET /api/social/follow?userId=xxx
 * Check if current user follows a specific user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const { success: rateLimitSuccess } = await apiRatelimit.limit(session.user.id);
    if (!rateLimitSuccess) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const [following, counts] = await Promise.all([
      isFollowing(session.user.id, userId),
      getFollowCounts(userId),
    ]);

    return NextResponse.json({
      isFollowing: following,
      followersCount: counts.followers,
      followingCount: counts.following,
    });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json({ error: 'Failed to check follow status' }, { status: 500 });
  }
}

/**
 * POST /api/social/follow
 * Follow a user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const { success: rateLimitSuccess } = await apiRatelimit.limit(session.user.id);
    if (!rateLimitSuccess) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const result = followSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { userId } = result.data;

    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    await followUser(session.user.id, userId);

    const counts = await getFollowCounts(userId);

    return NextResponse.json({
      success: true,
      isFollowing: true,
      followersCount: counts.followers,
    });
  } catch (error) {
    console.error('Error following user:', error);

    // Handle duplicate follow attempt
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Already following this user' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 });
  }
}

/**
 * DELETE /api/social/follow
 * Unfollow a user
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const { success: rateLimitSuccess } = await apiRatelimit.limit(session.user.id);
    if (!rateLimitSuccess) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const result = followSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { userId } = result.data;

    await unfollowUser(session.user.id, userId);

    const counts = await getFollowCounts(userId);

    return NextResponse.json({
      success: true,
      isFollowing: false,
      followersCount: counts.followers,
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 });
  }
}
