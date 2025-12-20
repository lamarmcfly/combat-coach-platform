import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db/client';

// POST - Create or update weight goal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetWeight, unit, targetDate, weightClass, notes } = body;

    if (!targetWeight || targetWeight <= 0) {
      return NextResponse.json({ error: 'Valid target weight is required' }, { status: 400 });
    }

    // Get current weight from latest entry
    const latestEntry = await db.weightEntry.findFirst({
      where: { userId: session.user.id },
      orderBy: { loggedAt: 'desc' },
    });

    const goal = await db.weightGoal.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        targetWeight: parseFloat(targetWeight),
        unit: unit || 'LBS',
        targetDate: targetDate ? new Date(targetDate) : null,
        weightClass: weightClass || null,
        currentWeight: latestEntry?.weight || null,
        startWeight: latestEntry?.weight || null,
        notes: notes || null,
      },
      update: {
        targetWeight: parseFloat(targetWeight),
        unit: unit || 'LBS',
        targetDate: targetDate ? new Date(targetDate) : null,
        weightClass: weightClass || null,
        notes: notes || null,
        isActive: true,
      },
    });

    return NextResponse.json({ goal });
  } catch (error) {
    console.error('Error saving weight goal:', error);
    return NextResponse.json({ error: 'Failed to save weight goal' }, { status: 500 });
  }
}

// DELETE - Remove weight goal
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.weightGoal.deleteMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting weight goal:', error);
    return NextResponse.json({ error: 'Failed to delete weight goal' }, { status: 500 });
  }
}
