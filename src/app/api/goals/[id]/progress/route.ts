import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { GoalService } from '@/services/goalService';
import { prisma } from '@/db/client';

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

// POST - Log progress
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: goalId } = await params;
    const body = await request.json();
    const { value, notes, mood, difficulty, attachments } = body;

    // Verify ownership
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      select: { userId: true },
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (goal.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const log = await GoalService.logProgress({
      goalId,
      value,
      notes,
      mood,
      difficulty,
      attachments,
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    console.error('Error logging progress:', error);
    return NextResponse.json(
      { error: 'Failed to log progress' },
      { status: 500 }
    );
  }
}
