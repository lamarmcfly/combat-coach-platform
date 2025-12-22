import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db/client';

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: fightId } = await params;

    // Verify ownership
    const fight = await db.fight.findFirst({
      where: { id: fightId, userId },
    });

    if (!fight) {
      return NextResponse.json({ error: 'Fight not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      roundNumber,
      techniqueName,
      category,
      attempted,
      successful,
      timestamp,
      notes,
      wasEffective,
      needsWork,
    } = body;

    const technique = await db.fightTechnique.create({
      data: {
        fightId,
        roundNumber,
        techniqueName,
        category,
        attempted: attempted ?? 0,
        successful: successful ?? 0,
        timestamp,
        notes,
        wasEffective: wasEffective ?? true,
        needsWork: needsWork ?? false,
      },
    });

    return NextResponse.json(technique, { status: 201 });
  } catch (error) {
    console.error('Error adding technique:', error);
    return NextResponse.json({ error: 'Failed to add technique' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: fightId } = await params;
    const { searchParams } = new URL(request.url);
    const techniqueId = searchParams.get('techniqueId');

    if (!techniqueId) {
      return NextResponse.json({ error: 'Technique ID required' }, { status: 400 });
    }

    // Verify ownership
    const fight = await db.fight.findFirst({
      where: { id: fightId, userId },
    });

    if (!fight) {
      return NextResponse.json({ error: 'Fight not found' }, { status: 404 });
    }

    await db.fightTechnique.delete({
      where: { id: techniqueId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting technique:', error);
    return NextResponse.json({ error: 'Failed to delete technique' }, { status: 500 });
  }
}
