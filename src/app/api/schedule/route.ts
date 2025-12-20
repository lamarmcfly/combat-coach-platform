import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { ScheduleService } from '@/services/scheduleService';
import { ScheduleFrequency } from '@prisma/client';

// GET - Get user's schedules
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const occurrences = await ScheduleService.getUpcomingOccurrences(session.user.id, 20);

    return NextResponse.json({ occurrences });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
  }
}

// POST - Create new schedule
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      frequency,
      startDate,
      endDate,
      daysOfWeek,
      timeOfDay,
      durationMinutes,
      reminderMinutes,
      courseId,
      disciplineId,
      notes,
    } = body;

    if (!title || !frequency || !startDate || !daysOfWeek || !timeOfDay) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const schedule = await ScheduleService.createSchedule({
      userId: session.user.id,
      title,
      description,
      frequency: frequency as ScheduleFrequency,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      daysOfWeek,
      timeOfDay,
      durationMinutes: durationMinutes || 60,
      reminderMinutes,
      courseId,
      disciplineId,
      notes,
    });

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}
