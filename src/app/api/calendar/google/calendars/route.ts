import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db/client';
import { getValidAccessToken, listCalendars } from '@/lib/calendar/googleCalendar';

/**
 * GET - List available Google Calendars
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = await getValidAccessToken(session.user.id);
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Google Calendar not connected' },
        { status: 400 }
      );
    }

    const calendars = await listCalendars(accessToken);

    // Get current selection
    const connection = await db.connectedCalendar.findUnique({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider: 'GOOGLE',
        },
      },
      select: {
        calendarId: true,
      },
    });

    return NextResponse.json({
      calendars,
      selectedId: connection?.calendarId,
    });
  } catch (error) {
    console.error('Error listing calendars:', error);
    return NextResponse.json(
      { error: 'Failed to list calendars' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Select a calendar for syncing
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { calendarId, calendarName } = body;

    if (!calendarId) {
      return NextResponse.json(
        { error: 'Calendar ID is required' },
        { status: 400 }
      );
    }

    await db.connectedCalendar.update({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider: 'GOOGLE',
        },
      },
      data: {
        calendarId,
        calendarName: calendarName || calendarId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Calendar selected',
    });
  } catch (error) {
    console.error('Error selecting calendar:', error);
    return NextResponse.json(
      { error: 'Failed to select calendar' },
      { status: 500 }
    );
  }
}
