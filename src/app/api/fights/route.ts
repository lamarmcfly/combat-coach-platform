import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db/client';

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const result = searchParams.get('result');
    const limit = parseInt(searchParams.get('limit') || '50');

    const whereClause: any = { userId };
    if (type) whereClause.type = type;
    if (result) whereClause.result = result;

    const fights = await db.fight.findMany({
      where: whereClause,
      include: {
        rounds: {
          orderBy: { roundNumber: 'asc' },
        },
        techniques: true,
      },
      orderBy: { eventDate: 'desc' },
      take: limit,
    });

    // Calculate overall stats
    const stats = {
      total: fights.length,
      wins: fights.filter((f) => f.result === 'WIN').length,
      losses: fights.filter((f) => f.result === 'LOSS').length,
      draws: fights.filter((f) => f.result === 'DRAW').length,
      competitions: fights.filter((f) => f.type === 'COMPETITION').length,
      sparringSessions: fights.filter((f) => f.type === 'SPARRING').length,
      koTkoWins: fights.filter((f) => f.result === 'WIN' && (f.finishType === 'KO' || f.finishType === 'TKO')).length,
      submissionWins: fights.filter((f) => f.result === 'WIN' && f.finishType === 'SUBMISSION').length,
      decisionWins: fights.filter((f) => f.result === 'WIN' && f.finishType?.startsWith('DECISION')).length,
    };

    return NextResponse.json({ fights, stats });
  } catch (error) {
    console.error('Error fetching fights:', error);
    return NextResponse.json({ error: 'Failed to fetch fights' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

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

    const fight = await db.fight.create({
      data: {
        userId,
        type: type || 'SPARRING',
        eventName,
        eventDate: new Date(eventDate),
        location,
        weightClass,
        opponentName,
        opponentRecord,
        opponentNotes,
        result: result || 'IN_PROGRESS',
        finishType: finishType || 'NONE',
        finishRound,
        finishTime,
        videoUrl,
        totalRounds: totalRounds || 3,
        roundMinutes: roundMinutes || 5,
        discipline,
        tags: tags || [],
        gameplanNotes,
        summaryNotes,
        lessonsLearned,
        isPublic: isPublic || false,
      },
    });

    return NextResponse.json(fight, { status: 201 });
  } catch (error) {
    console.error('Error creating fight:', error);
    return NextResponse.json({ error: 'Failed to create fight' }, { status: 500 });
  }
}
