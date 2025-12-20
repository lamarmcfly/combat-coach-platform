import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { generateScheduleICS, TrainingScheduleInput } from '@/lib/calendar/icsGenerator';

/**
 * Public calendar subscription endpoint
 * Returns ICS feed for any calendar app to subscribe to
 *
 * This works with:
 * - Apple Calendar (via Add Subscription)
 * - Microsoft Outlook
 * - Google Calendar (via Add by URL)
 * - Any CalDAV-compatible app
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Find user by subscription token
    const subscription = await db.calendarSubscription.findUnique({
      where: { token },
      include: {
        user: {
          select: { id: true },
        },
      },
    });

    if (!subscription || !subscription.isActive) {
      return new NextResponse('Calendar not found', { status: 404 });
    }

    // Update last accessed
    await db.calendarSubscription.update({
      where: { id: subscription.id },
      data: { lastAccessedAt: new Date() },
    });

    // Fetch active training schedules
    const schedules = await db.trainingSchedule.findMany({
      where: {
        userId: subscription.userId,
        isActive: true,
      },
      include: {
        course: { select: { title: true } },
        discipline: { select: { name: true } },
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

    // Generate ICS content (8 weeks ahead for subscriptions)
    const icsContent = generateScheduleICS(scheduleInputs, 8);

    // Return as calendar feed
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="training-schedule.ics"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error serving calendar subscription:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
