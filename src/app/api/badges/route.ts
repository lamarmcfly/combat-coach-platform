import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { getUserBadges, getAllBadges, checkAndAwardBadges } from '@/lib/badges/service';

/**
 * GET /api/badges
 * Get user's badges or all available badges
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (type === 'all') {
      // Get all available badges
      const badges = await getAllBadges();
      return NextResponse.json({ badges });
    }

    // Get user's badges
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await getUserBadges(session.user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/badges/check
 * Check and award any badges the user has earned
 */
export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const awardedBadges = await checkAndAwardBadges(session.user.id);

    return NextResponse.json({
      awardedBadges,
      count: awardedBadges.length,
    });
  } catch (error) {
    console.error('Error checking badges:', error);
    return NextResponse.json(
      { error: 'Failed to check badges' },
      { status: 500 }
    );
  }
}
