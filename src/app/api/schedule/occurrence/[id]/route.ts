import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { ScheduleService } from '@/services/scheduleService';
import { prisma } from '@/db/client';

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

// PATCH - Complete or skip occurrence
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, durationActual, notes } = body;

    // Verify occurrence belongs to user
    const occurrence = await prisma.scheduleOccurrence.findUnique({
      where: { id },
      include: { schedule: true },
    });

    if (!occurrence || occurrence.schedule.userId !== session.user.id) {
      return NextResponse.json({ error: 'Occurrence not found' }, { status: 404 });
    }

    let updatedOccurrence;
    if (action === 'complete') {
      updatedOccurrence = await ScheduleService.completeOccurrence(
        id,
        durationActual,
        notes
      );
    } else if (action === 'skip') {
      updatedOccurrence = await ScheduleService.skipOccurrence(id);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ occurrence: updatedOccurrence });
  } catch (error) {
    console.error('Error updating occurrence:', error);
    return NextResponse.json({ error: 'Failed to update occurrence' }, { status: 500 });
  }
}
