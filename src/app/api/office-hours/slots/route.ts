import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/db/client';
import { SubscriptionTier } from '@prisma/client';

// Get available office hours slots
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get('coachId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!coachId) {
      return NextResponse.json({ error: 'Missing coachId' }, { status: 400 });
    }

    // Build query filters
    const where: any = {
      coachId,
      startTime: {
        gte: startDate ? new Date(startDate) : new Date(),
      },
    };

    if (endDate) {
      where.startTime.lte = new Date(endDate);
    }

    const slots = await prisma.officeHoursSlot.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: {
        coach: {
          include: {
            user: true,
          },
        },
        bookings: {
          where: { status: 'CONFIRMED' },
        },
      },
    });

    // Filter to only return slots that aren't full
    const availableSlots = slots.filter(
      (slot) => slot.bookings.length < slot.maxAttendees
    );

    return NextResponse.json({ slots: availableSlots });
  } catch (error) {
    console.error('Error fetching office hours slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch office hours slots' },
      { status: 500 }
    );
  }
}

// Create office hours slots (coach only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a coach
    const coach = await prisma.coachProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!coach) {
      return NextResponse.json({ error: 'Only coaches can create office hours slots' }, { status: 403 });
    }

    const { startTime, endTime, maxAttendees = 1, meetingUrl, notes } = await request.json();

    if (!startTime || !endTime) {
      return NextResponse.json({ error: 'Missing startTime or endTime' }, { status: 400 });
    }

    // Create slot
    const slot = await prisma.officeHoursSlot.create({
      data: {
        coachId: coach.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        maxAttendees,
        meetingUrl,
        notes,
      },
    });

    return NextResponse.json({ slot });
  } catch (error) {
    console.error('Error creating office hours slot:', error);
    return NextResponse.json(
      { error: 'Failed to create office hours slot' },
      { status: 500 }
    );
  }
}
