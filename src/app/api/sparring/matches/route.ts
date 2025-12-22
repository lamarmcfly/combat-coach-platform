import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db/client';

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

interface MatchScore {
  userId: string;
  displayName: string;
  weightClass: string | null;
  disciplines: string[];
  location: string | null;
  skillLevel: string | null;
  gymName: string | null;
  preferredDays: string[];
  preferredTime: string | null;
  notes: string | null;
  matchScore: number;
  matchReasons: string[];
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const discipline = searchParams.get('discipline');
    const weightClass = searchParams.get('weightClass');

    // Get current user's preferences
    const myPreferences = await db.sparringPreference.findUnique({
      where: { userId },
    });

    if (!myPreferences) {
      return NextResponse.json({
        matches: [],
        message: 'Please set your sparring preferences first',
      });
    }

    // Build where clause for potential matches
    const whereClause: any = {
      userId: { not: userId },
      isAvailable: true,
    };

    // Filter by discipline if specified
    if (discipline) {
      whereClause.disciplines = { has: discipline };
    }

    // Filter by weight class if specified
    if (weightClass) {
      whereClause.weightClass = weightClass;
    }

    // Find potential partners
    const potentialPartners = await db.sparringPreference.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            trainingLineage: {
              select: {
                discipline: true,
                startYear: true,
              },
            },
            weightEntries: {
              orderBy: { loggedAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      take: 100, // Get more to filter and score
    });

    // Score and rank matches
    const scoredMatches: MatchScore[] = potentialPartners.map((partner) => {
      let score = 0;
      const reasons: string[] = [];

      // Weight class match (highest priority for safety)
      if (myPreferences.weightClass && partner.weightClass) {
        if (myPreferences.weightClass === partner.weightClass) {
          score += 40;
          reasons.push('Same weight class');
        }
      }

      // Discipline overlap
      const disciplineOverlap = myPreferences.disciplines.filter((d) =>
        partner.disciplines.includes(d)
      );
      if (disciplineOverlap.length > 0) {
        score += 10 * disciplineOverlap.length;
        reasons.push(`Trains ${disciplineOverlap.join(', ')}`);
      }

      // Skill level match
      if (myPreferences.skillLevel && partner.skillLevel) {
        if (myPreferences.skillLevel === partner.skillLevel) {
          score += 15;
          reasons.push('Similar skill level');
        }
      }

      // Location match
      if (myPreferences.location && partner.location) {
        if (
          myPreferences.location.toLowerCase() ===
          partner.location.toLowerCase()
        ) {
          score += 20;
          reasons.push('Same area');
        }
      }

      // Same gym bonus
      if (myPreferences.gymName && partner.gymName) {
        if (
          myPreferences.gymName.toLowerCase() === partner.gymName.toLowerCase()
        ) {
          score += 25;
          reasons.push('Same gym');
        }
      }

      // Schedule overlap
      const dayOverlap = myPreferences.preferredDays.filter((d) =>
        partner.preferredDays.includes(d)
      );
      if (dayOverlap.length > 0) {
        score += 5 * dayOverlap.length;
        reasons.push(`Available ${dayOverlap.join(', ')}`);
      }

      // Time preference match
      if (myPreferences.preferredTime && partner.preferredTime) {
        if (myPreferences.preferredTime === partner.preferredTime) {
          score += 10;
          reasons.push(`Prefers ${partner.preferredTime.toLowerCase()}`);
        }
      }

      const user = partner.user;
      const displayName =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.firstName || 'Anonymous';

      return {
        userId: partner.userId,
        displayName,
        weightClass: partner.weightClass,
        disciplines: partner.disciplines,
        location: partner.location,
        skillLevel: partner.skillLevel,
        gymName: partner.gymName,
        preferredDays: partner.preferredDays,
        preferredTime: partner.preferredTime,
        notes: partner.notes,
        matchScore: score,
        matchReasons: reasons,
      };
    });

    // Sort by score and limit results
    const matches = scoredMatches
      .filter((m) => m.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    return NextResponse.json({ matches, total: matches.length });
  } catch (error) {
    console.error('Error finding sparring matches:', error);
    return NextResponse.json(
      { error: 'Failed to find matches' },
      { status: 500 }
    );
  }
}
