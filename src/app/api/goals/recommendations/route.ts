import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { GoalService } from '@/services/goalService';
import { RecommendationType } from '@prisma/client';

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

// GET - Get recommendations
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('goalId') || undefined;
    const type = searchParams.get('type') as RecommendationType | null;
    const limit = parseInt(searchParams.get('limit') || '10');

    const recommendations = await GoalService.getRecommendations(
      session.user.id,
      {
        goalId,
        type: type || undefined,
        limit,
      }
    );

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
