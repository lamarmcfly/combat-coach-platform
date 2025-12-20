import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db/client';

// GET - Fetch weight entries and goal
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');

    const [entries, goal] = await Promise.all([
      db.weightEntry.findMany({
        where: { userId: session.user.id },
        orderBy: { loggedAt: 'desc' },
        take: limit,
      }),
      db.weightGoal.findUnique({
        where: { userId: session.user.id },
      }),
    ]);

    // Calculate stats
    const stats = {
      currentWeight: entries[0]?.weight || null,
      lowestWeight: entries.length ? Math.min(...entries.map((e) => e.weight)) : null,
      highestWeight: entries.length ? Math.max(...entries.map((e) => e.weight)) : null,
      averageWeight: entries.length
        ? Math.round((entries.reduce((sum, e) => sum + e.weight, 0) / entries.length) * 10) / 10
        : null,
      totalEntries: entries.length,
    };

    return NextResponse.json({
      entries: entries.reverse(), // Chronological order for chart
      goal,
      stats,
    });
  } catch (error) {
    console.error('Error fetching weight data:', error);
    return NextResponse.json({ error: 'Failed to fetch weight data' }, { status: 500 });
  }
}

// POST - Log new weight entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { weight, unit, notes, isFightWeight, eventName } = body;

    if (!weight || weight <= 0) {
      return NextResponse.json({ error: 'Valid weight is required' }, { status: 400 });
    }

    const entry = await db.weightEntry.create({
      data: {
        userId: session.user.id,
        weight: parseFloat(weight),
        unit: unit || 'LBS',
        notes: notes || null,
        isFightWeight: isFightWeight || false,
        eventName: eventName || null,
      },
    });

    // Update goal's current weight if exists
    await db.weightGoal.updateMany({
      where: { userId: session.user.id, isActive: true },
      data: { currentWeight: parseFloat(weight) },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('Error logging weight:', error);
    return NextResponse.json({ error: 'Failed to log weight' }, { status: 500 });
  }
}

// DELETE - Remove weight entry
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    const entry = await db.weightEntry.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!entry || entry.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    await db.weightEntry.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting weight entry:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
