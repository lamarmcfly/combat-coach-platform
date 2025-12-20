import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { GoalService } from '@/services/goalService';
import { prisma } from '@/db/client';
import { MilestoneStatus } from '@prisma/client';

// PATCH - Update milestone
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, status, targetDate, notes } = body;

    // Verify ownership
    const milestone = await prisma.goalMilestone.findUnique({
      where: { id },
      include: { goal: { select: { userId: true } } },
    });

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    if (milestone.goal.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await GoalService.updateMilestone(id, {
      title,
      description,
      status: status as MilestoneStatus | undefined,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      notes,
    });

    return NextResponse.json({ milestone: updated });
  } catch (error) {
    console.error('Error updating milestone:', error);
    return NextResponse.json(
      { error: 'Failed to update milestone' },
      { status: 500 }
    );
  }
}
