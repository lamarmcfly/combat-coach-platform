'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { z } from 'zod';
import { likeActivity, unlikeActivity } from '@/lib/social/service';
import { apiRatelimit } from '@/lib/ratelimit';

const likeSchema = z.object({
  activityId: z.string().min(1, 'Activity ID is required'),
});

/**
 * POST /api/social/like
 * Like an activity
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
    const result = likeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { activityId } = result.data;

    await likeActivity(activityId, session.user.id);

    return NextResponse.json({ success: true, liked: true });
  } catch (error) {
    console.error('Error liking activity:', error);

    // Handle duplicate like attempt
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Already liked this activity' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to like activity' }, { status: 500 });
  }
}

/**
 * DELETE /api/social/like
 * Unlike an activity
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
    const result = likeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { activityId } = result.data;

    await unlikeActivity(activityId, session.user.id);

    return NextResponse.json({ success: true, liked: false });
  } catch (error) {
    console.error('Error unliking activity:', error);
    return NextResponse.json({ error: 'Failed to unlike activity' }, { status: 500 });
  }
}
