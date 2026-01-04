'use server';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { z } from 'zod';
import {
  getLeaderboard,
  getLeaderboardSummaries,
  type LeaderboardType,
  type LeaderboardPeriod,
} from '@/lib/leaderboard/service';
import { apiRatelimit } from '@/lib/ratelimit';

const leaderboardTypes: LeaderboardType[] = [
  'streak',
  'courses_completed',
  'badges_earned',
  'sessions_attended',
  'goals_achieved',
  'fights_logged',
];

const periods: LeaderboardPeriod[] = ['all_time', 'monthly', 'weekly'];

const querySchema = z.object({
  type: z.enum(leaderboardTypes as [LeaderboardType, ...LeaderboardType[]]).optional(),
  period: z.enum(periods as [LeaderboardPeriod, ...LeaderboardPeriod[]]).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  summary: z.coerce.boolean().optional(),
});

/**
 * GET /api/leaderboard?type=streak&period=weekly&limit=50
 * Get leaderboard data
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
    const params = {
      type: searchParams.get('type') || undefined,
      period: searchParams.get('period') || undefined,
      limit: searchParams.get('limit') || undefined,
      summary: searchParams.get('summary') || undefined,
    };

    const result = querySchema.safeParse(params);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { type, period = 'all_time', limit = 50, summary } = result.data;
    const currentUserId = session?.user?.id;

    // Return summary of all leaderboards
    if (summary) {
      const summaries = await getLeaderboardSummaries(currentUserId);
      return NextResponse.json({ summaries });
    }

    // Return specific leaderboard
    if (!type) {
      return NextResponse.json(
        { error: 'Type parameter is required when not requesting summary' },
        { status: 400 }
      );
    }

    const leaderboard = await getLeaderboard(type, period, limit, currentUserId);

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
