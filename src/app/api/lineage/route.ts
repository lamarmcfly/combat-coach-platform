import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db/client';

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

// GET - Fetch user's training lineage
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;

    const lineage = await db.trainingLineage.findMany({
      where: { userId },
      include: {
        coachProfile: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            userId: true,
          },
        },
      },
      orderBy: [{ orderIndex: 'asc' }, { startYear: 'desc' }],
    });

    return NextResponse.json({ lineage });
  } catch (error) {
    console.error('Error fetching lineage:', error);
    return NextResponse.json({ error: 'Failed to fetch lineage' }, { status: 500 });
  }
}

// POST - Add new lineage entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      coachName,
      coachProfileId,
      gymName,
      location,
      discipline,
      startYear,
      endYear,
      beltOrRank,
      notes,
    } = body;

    if (!coachName || !discipline) {
      return NextResponse.json(
        { error: 'Coach name and discipline are required' },
        { status: 400 }
      );
    }

    // Get current max order index
    const maxOrder = await db.trainingLineage.aggregate({
      where: { userId: session.user.id },
      _max: { orderIndex: true },
    });

    const lineageEntry = await db.trainingLineage.create({
      data: {
        userId: session.user.id,
        coachName,
        coachProfileId: coachProfileId || null,
        gymName: gymName || null,
        location: location || null,
        discipline,
        startYear: startYear ? parseInt(startYear) : null,
        endYear: endYear ? parseInt(endYear) : null,
        beltOrRank: beltOrRank || null,
        notes: notes || null,
        orderIndex: (maxOrder._max.orderIndex ?? -1) + 1,
      },
      include: {
        coachProfile: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ lineage: lineageEntry }, { status: 201 });
  } catch (error) {
    console.error('Error creating lineage entry:', error);
    return NextResponse.json({ error: 'Failed to create lineage entry' }, { status: 500 });
  }
}

// DELETE - Remove lineage entry
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Lineage ID is required' }, { status: 400 });
    }

    // Verify ownership
    const entry = await db.trainingLineage.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!entry || entry.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    await db.trainingLineage.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lineage entry:', error);
    return NextResponse.json({ error: 'Failed to delete lineage entry' }, { status: 500 });
  }
}
