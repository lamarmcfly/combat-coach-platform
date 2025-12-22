import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { exchangeCodeForTokens, listCalendars } from '@/lib/calendar/googleCalendar';
import { db } from '@/db/client';

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.redirect(
        new URL('/auth/signin?error=unauthorized', request.url)
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/my/schedule?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/my/schedule?error=missing_params', request.url)
      );
    }

    // Validate state parameter
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());

      // Check state is not too old (10 minutes max)
      if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
        return NextResponse.redirect(
          new URL('/my/schedule?error=expired', request.url)
        );
      }

      // Verify user ID matches
      if (stateData.userId !== session.user.id) {
        return NextResponse.redirect(
          new URL('/my/schedule?error=invalid_state', request.url)
        );
      }
    } catch (e) {
      return NextResponse.redirect(
        new URL('/my/schedule?error=invalid_state', request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Get list of calendars to find primary
    let primaryCalendarId = 'primary';
    let primaryCalendarName = 'Primary Calendar';

    try {
      const calendars = await listCalendars(tokens.accessToken);
      const primary = calendars.find((c) => c.primary) || calendars[0];
      if (primary) {
        primaryCalendarId = primary.id;
        primaryCalendarName = primary.summary;
      }
    } catch (e) {
      console.error('Failed to list calendars:', e);
    }

    // Save or update connection
    await db.connectedCalendar.upsert({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider: 'GOOGLE',
        },
      },
      create: {
        userId: session.user.id,
        provider: 'GOOGLE',
        email: tokens.email,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000),
        calendarId: primaryCalendarId,
        calendarName: primaryCalendarName,
        isActive: true,
      },
      update: {
        email: tokens.email,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || undefined,
        tokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000),
        calendarId: primaryCalendarId,
        calendarName: primaryCalendarName,
        isActive: true,
        syncErrors: 0,
        lastSyncError: null,
      },
    });

    return NextResponse.redirect(
      new URL('/my/schedule?calendar=connected', request.url)
    );
  } catch (error) {
    console.error('Error in Google Calendar callback:', error);
    return NextResponse.redirect(
      new URL('/my/schedule?error=connection_failed', request.url)
    );
  }
}
