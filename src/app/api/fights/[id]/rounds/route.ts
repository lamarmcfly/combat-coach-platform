import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db/client';

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
      strikesLanded,
      strikesAttempted,
      sigStrikesLanded,
      sigStrikesAttempted,
      knockdowns,
      takedownsLanded,
      takedownsAttempted,
      submissionAttempts,
      sweeps,
      reversals,
      controlTimeTop,
      controlTimeBack,
      controlTimeClinch,
      timeInGuard,
      strikesAbsorbed,
      takedownsDefended,
      submissionsDefended,
      roundWinner,
      notes,
      keyMoments,
    } = body;

    // Upsert the round
    const round = await db.fightRound.upsert({
      where: {
        fightId_roundNumber: {
          fightId,
          roundNumber,
        },
      },
      update: {
        strikesLanded: strikesLanded ?? 0,
        strikesAttempted: strikesAttempted ?? 0,
        sigStrikesLanded: sigStrikesLanded ?? 0,
        sigStrikesAttempted: sigStrikesAttempted ?? 0,
        knockdowns: knockdowns ?? 0,
        takedownsLanded: takedownsLanded ?? 0,
        takedownsAttempted: takedownsAttempted ?? 0,
        submissionAttempts: submissionAttempts ?? 0,
        sweeps: sweeps ?? 0,
        reversals: reversals ?? 0,
        controlTimeTop: controlTimeTop ?? 0,
        controlTimeBack: controlTimeBack ?? 0,
        controlTimeClinch: controlTimeClinch ?? 0,
        timeInGuard: timeInGuard ?? 0,
        strikesAbsorbed: strikesAbsorbed ?? 0,
        takedownsDefended: takedownsDefended ?? 0,
        submissionsDefended: submissionsDefended ?? 0,
        roundWinner,
        notes,
        keyMoments,
      },
      create: {
        fightId,
        roundNumber,
        strikesLanded: strikesLanded ?? 0,
        strikesAttempted: strikesAttempted ?? 0,
        sigStrikesLanded: sigStrikesLanded ?? 0,
        sigStrikesAttempted: sigStrikesAttempted ?? 0,
        knockdowns: knockdowns ?? 0,
        takedownsLanded: takedownsLanded ?? 0,
        takedownsAttempted: takedownsAttempted ?? 0,
        submissionAttempts: submissionAttempts ?? 0,
        sweeps: sweeps ?? 0,
        reversals: reversals ?? 0,
        controlTimeTop: controlTimeTop ?? 0,
        controlTimeBack: controlTimeBack ?? 0,
        controlTimeClinch: controlTimeClinch ?? 0,
        timeInGuard: timeInGuard ?? 0,
        strikesAbsorbed: strikesAbsorbed ?? 0,
        takedownsDefended: takedownsDefended ?? 0,
        submissionsDefended: submissionsDefended ?? 0,
        roundWinner,
        notes,
        keyMoments,
      },
    });

    return NextResponse.json(round, { status: 201 });
  } catch (error) {
    console.error('Error saving round:', error);
    return NextResponse.json({ error: 'Failed to save round' }, { status: 500 });
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
    const roundNumber = parseInt(searchParams.get('roundNumber') || '0');

    // Verify ownership
    const fight = await db.fight.findFirst({
      where: { id: fightId, userId },
    });

    if (!fight) {
      return NextResponse.json({ error: 'Fight not found' }, { status: 404 });
    }

    await db.fightRound.delete({
      where: {
        fightId_roundNumber: {
          fightId,
          roundNumber,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting round:', error);
    return NextResponse.json({ error: 'Failed to delete round' }, { status: 500 });
  }
}
