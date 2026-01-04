'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { getFollowers, getFollowing } from '@/lib/social/service';
import { apiRatelimit } from '@/lib/ratelimit';

/**
 * GET /api/social/followers?userId=xxx&type=followers|following
 * Get followers or following list for a user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Rate limiting (even for anonymous users)
    const identifier = session?.user?.id || 'anonymous';
    const { success: rateLimitSuccess } = await apiRatelimit.limit(identifier);
    if (!rateLimitSuccess) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'followers';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const currentUserId = session?.user?.id;

    let users;
    if (type === 'following') {
      users = await getFollowing(userId, currentUserId, limit);
    } else {
      users = await getFollowers(userId, currentUserId, limit);
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching followers:', error);
    return NextResponse.json({ error: 'Failed to fetch followers' }, { status: 500 });
  }
}
