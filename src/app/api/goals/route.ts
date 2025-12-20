import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { GoalService } from '@/services/goalService';
import { GoalType, GoalStatus } from '@prisma/client';

// GET - Fetch user's goals
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as GoalStatus | null;
    const type = searchParams.get('type') as GoalType | null;
    const disciplineId = searchParams.get('disciplineId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await GoalService.getUserGoals(session.user.id, {
      status: status || undefined,
      type: type || undefined,
      disciplineId: disciplineId ? parseInt(disciplineId) : undefined,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

// POST - Create new goal
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      title,
      description,
      targetDate,
      targetValue,
      unit,
      disciplineId,
      courseId,
      tags,
      milestones,
    } = body;

    if (!type || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const goal = await GoalService.createGoal({
      userId: session.user.id,
      type,
      title,
      description,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      targetValue,
      unit,
      disciplineId,
      courseId,
      tags: tags || [],
      milestones: milestones || [],
    });

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}
