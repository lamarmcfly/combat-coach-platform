import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { CoachingService } from '@/services/coachingService';
import { prisma } from '@/db/client';

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

// GET - Get coaching statistics for coach
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get coach profile
    const coachProfile = await prisma.coachProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!coachProfile) {
      return NextResponse.json(
        { error: 'Coach profile not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const stats = await CoachingService.getCoachStats(coachProfile.id, days);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching coach stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
