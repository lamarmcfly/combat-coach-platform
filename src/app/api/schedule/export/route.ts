import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db/client';
import {
  generateScheduleICS,
  TrainingScheduleInput,
} from '@/lib/calendar/icsGenerator';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const weeksAhead = parseInt(searchParams.get('weeks') || '4');

    // Fetch active training schedules
    const schedules = await db.trainingSchedule.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        course: {
          select: { title: true },
        },
        discipline: {
          select: { name: true },
        },
      },
    });

    // Convert to ICS format input
    const scheduleInputs: TrainingScheduleInput[] = schedules.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description || undefined,
      daysOfWeek: s.daysOfWeek,
      timeOfDay: s.timeOfDay,
      durationMinutes: s.durationMinutes,
      startDate: s.startDate,
      endDate: s.endDate || undefined,
      reminderMinutes: s.reminderMinutes,
      courseName: s.course?.title,
      disciplineName: s.discipline?.name,
    }));

    // Generate ICS content
    const icsContent = generateScheduleICS(scheduleInputs, weeksAhead);

    // Return as downloadable file
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="training-schedule.ics"',
      },
    });
  } catch (error) {
    console.error('Error exporting schedule:', error);
    return NextResponse.json(
      { error: 'Failed to export schedule' },
      { status: 500 }
    );
  }
}
