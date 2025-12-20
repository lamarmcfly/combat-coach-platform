import { NextResponse } from 'next/server';
import { prisma } from '@/db/client';

// GET - Fetch all approved coaches
export async function GET() {
  try {
    const coaches = await prisma.coachProfile.findMany({
      where: {
        status: 'APPROVED',
      },
      select: {
        id: true,
        displayName: true,
        tagline: true,
        avatarUrl: true,
        yearsCoaching: true,
        location: true,
        disciplines: {
          include: {
            discipline: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        displayName: 'asc',
      },
    });

    return NextResponse.json({ coaches });
  } catch (error) {
    console.error('Error fetching coaches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coaches' },
      { status: 500 }
    );
  }
}
