import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db/client';
import {
  syncSchedulesToCalendar,
  disconnectCalendar,
  isGoogleCalendarConfigured,
  getValidAccessToken,
  listCalendars,
} from '@/lib/calendar/googleCalendar';

/**
 * GET - Get Google Calendar connection status
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isConfigured = isGoogleCalendarConfigured();

    if (!isConfigured) {
      return NextResponse.json({
        configured: false,
        connected: false,
        message: 'Google Calendar integration not configured on server',
      });
    }

    const connection = await db.connectedCalendar.findUnique({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider: 'GOOGLE',
        },
      },
      select: {
        email: true,
        calendarName: true,
        isActive: true,
        lastSyncAt: true,
        syncErrors: true,
        lastSyncError: true,
      },
    });

    if (!connection || !connection.isActive) {
      return NextResponse.json({
        configured: true,
        connected: false,
      });
    }

    return NextResponse.json({
      configured: true,
      connected: true,
      email: connection.email,
      calendarName: connection.calendarName,
      lastSyncAt: connection.lastSyncAt,
      syncErrors: connection.syncErrors,
      lastSyncError: connection.lastSyncError,
    });
  } catch (error) {
    console.error('Error getting calendar status:', error);
    return NextResponse.json(
      { error: 'Failed to get calendar status' },
      { status: 500 }
    );
  }
}

/**
 * POST - Sync schedules to Google Calendar
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const weeksAhead = body.weeksAhead || 4;

    const result = await syncSchedulesToCalendar(session.user.id, weeksAhead);

    return NextResponse.json({
      success: true,
      synced: result.synced,
      errors: result.errors,
      message: `Synced ${result.synced} events${result.errors > 0 ? ` with ${result.errors} errors` : ''}`,
    });
  } catch (error) {
    console.error('Error syncing calendar:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync calendar' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Disconnect Google Calendar
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await disconnectCalendar(session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Google Calendar disconnected',
    });
  } catch (error) {
    console.error('Error disconnecting calendar:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect calendar' },
      { status: 500 }
    );
  }
}
