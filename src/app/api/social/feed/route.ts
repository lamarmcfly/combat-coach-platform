'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { getActivityFeed, getPublicFeed } from '@/lib/social/service';
import { apiRatelimit } from '@/lib/ratelimit';

/**
 * GET /api/social/feed?type=personal|public&cursor=xxx
 * Get activity feed
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Rate limiting
    const identifier = session?.user?.id || 'anonymous';
    const { success: rateLimitSuccess } = await apiRatelimit.limit(identifier);
    if (!rateLimitSuccess) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'public';
    const cursor = searchParams.get('cursor') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    let result;

    if (type === 'personal') {
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      result = await getActivityFeed(session.user.id, cursor, limit);
    } else {
      result = await getPublicFeed(session?.user?.id, cursor, limit);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    return NextResponse.json({ error: 'Failed to fetch activity feed' }, { status: 500 });
  }
}
