import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db/client';

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id } = await params;

    const fight = await db.fight.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        rounds: {
          orderBy: { roundNumber: 'asc' },
        },
        techniques: {
          orderBy: { roundNumber: 'asc' },
        },
      },
    });

    if (!fight) {
      return NextResponse.json({ error: 'Fight not found' }, { status: 404 });
    }

    // Calculate aggregate stats
    const aggregateStats = {
      totalStrikesLanded: fight.rounds.reduce((sum, r) => sum + r.strikesLanded, 0),
      totalStrikesAttempted: fight.rounds.reduce((sum, r) => sum + r.strikesAttempted, 0),
      totalSigStrikesLanded: fight.rounds.reduce((sum, r) => sum + r.sigStrikesLanded, 0),
      totalSigStrikesAttempted: fight.rounds.reduce((sum, r) => sum + r.sigStrikesAttempted, 0),
      totalTakedownsLanded: fight.rounds.reduce((sum, r) => sum + r.takedownsLanded, 0),
      totalTakedownsAttempted: fight.rounds.reduce((sum, r) => sum + r.takedownsAttempted, 0),
      totalSubmissionAttempts: fight.rounds.reduce((sum, r) => sum + r.submissionAttempts, 0),
      totalKnockdowns: fight.rounds.reduce((sum, r) => sum + r.knockdowns, 0),
      totalControlTime: fight.rounds.reduce(
        (sum, r) => sum + r.controlTimeTop + r.controlTimeBack + r.controlTimeClinch,
        0
      ),
      strikeAccuracy:
        fight.rounds.reduce((sum, r) => sum + r.strikesAttempted, 0) > 0
          ? (
              (fight.rounds.reduce((sum, r) => sum + r.strikesLanded, 0) /
                fight.rounds.reduce((sum, r) => sum + r.strikesAttempted, 0)) *
              100
            ).toFixed(1)
          : 0,
      takedownAccuracy:
        fight.rounds.reduce((sum, r) => sum + r.takedownsAttempted, 0) > 0
          ? (
              (fight.rounds.reduce((sum, r) => sum + r.takedownsLanded, 0) /
                fight.rounds.reduce((sum, r) => sum + r.takedownsAttempted, 0)) *
              100
            ).toFixed(1)
          : 0,
      roundsWon: fight.rounds.filter((r) => r.roundWinner === 'self').length,
      roundsLost: fight.rounds.filter((r) => r.roundWinner === 'opponent').length,
    };

    return NextResponse.json({ fight, aggregateStats });
  } catch (error) {
    console.error('Error fetching fight:', error);
    return NextResponse.json({ error: 'Failed to fetch fight' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id } = await params;

    // Verify ownership
    const existingFight = await db.fight.findFirst({
      where: { id, userId },
    });

    if (!existingFight) {
      return NextResponse.json({ error: 'Fight not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      type,
      eventName,
      eventDate,
      location,
      weightClass,
      opponentName,
      opponentRecord,
      opponentNotes,
      result,
      finishType,
      finishRound,
      finishTime,
      videoUrl,
      totalRounds,
      roundMinutes,
      discipline,
      tags,
      gameplanNotes,
      summaryNotes,
      lessonsLearned,
      isPublic,
    } = body;

    const fight = await db.fight.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(eventName !== undefined && { eventName }),
        ...(eventDate && { eventDate: new Date(eventDate) }),
        ...(location !== undefined && { location }),
        ...(weightClass !== undefined && { weightClass }),
        ...(opponentName !== undefined && { opponentName }),
        ...(opponentRecord !== undefined && { opponentRecord }),
        ...(opponentNotes !== undefined && { opponentNotes }),
        ...(result && { result }),
        ...(finishType && { finishType }),
        ...(finishRound !== undefined && { finishRound }),
        ...(finishTime !== undefined && { finishTime }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(totalRounds && { totalRounds }),
        ...(roundMinutes && { roundMinutes }),
        ...(discipline !== undefined && { discipline }),
        ...(tags && { tags }),
        ...(gameplanNotes !== undefined && { gameplanNotes }),
        ...(summaryNotes !== undefined && { summaryNotes }),
        ...(lessonsLearned !== undefined && { lessonsLearned }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    return NextResponse.json(fight);
  } catch (error) {
    console.error('Error updating fight:', error);
    return NextResponse.json({ error: 'Failed to update fight' }, { status: 500 });
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
    const { id } = await params;

    // Verify ownership
    const existingFight = await db.fight.findFirst({
      where: { id, userId },
    });

    if (!existingFight) {
      return NextResponse.json({ error: 'Fight not found' }, { status: 404 });
    }

    await db.fight.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting fight:', error);
    return NextResponse.json({ error: 'Failed to delete fight' }, { status: 500 });
  }
}
