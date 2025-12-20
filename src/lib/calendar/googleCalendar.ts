/**
 * Google Calendar Integration
 * Handles OAuth 2.0 authentication and Calendar API operations
 */

import { db } from '@/db/client';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/calendar/google/callback';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
];

/**
 * Check if Google Calendar is configured
 */
export function isGoogleCalendarConfigured(): boolean {
  return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}

/**
 * Generate OAuth 2.0 authorization URL
 */
export function getAuthorizationUrl(state: string): string {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google Calendar not configured');
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
  email?: string;
}> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google Calendar not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: GOOGLE_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Token exchange error:', error);
    throw new Error('Failed to exchange code for tokens');
  }

  const data = await response.json();

  // Get user email
  let email: string | undefined;
  try {
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      }
    );
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json();
      email = userInfo.email;
    }
  } catch (e) {
    console.error('Failed to get user info:', e);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || null,
    expiresIn: data.expires_in,
    email,
  };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google Calendar not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Get valid access token (refresh if expired)
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const connection = await db.connectedCalendar.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: 'GOOGLE',
      },
    },
  });

  if (!connection || !connection.isActive) {
    return null;
  }

  // Check if token is expired (with 5 minute buffer)
  const now = new Date();
  const expiryBuffer = new Date(now.getTime() + 5 * 60 * 1000);

  if (connection.tokenExpiry && connection.tokenExpiry > expiryBuffer) {
    return connection.accessToken;
  }

  // Token expired, try to refresh
  if (!connection.refreshToken) {
    // No refresh token, mark as inactive
    await db.connectedCalendar.update({
      where: { id: connection.id },
      data: {
        isActive: false,
        lastSyncError: 'Token expired and no refresh token available',
      },
    });
    return null;
  }

  try {
    const { accessToken, expiresIn } = await refreshAccessToken(connection.refreshToken);

    await db.connectedCalendar.update({
      where: { id: connection.id },
      data: {
        accessToken,
        tokenExpiry: new Date(Date.now() + expiresIn * 1000),
        syncErrors: 0,
        lastSyncError: null,
      },
    });

    return accessToken;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    await db.connectedCalendar.update({
      where: { id: connection.id },
      data: {
        syncErrors: { increment: 1 },
        lastSyncError: error instanceof Error ? error.message : 'Token refresh failed',
      },
    });
    return null;
  }
}

/**
 * List user's calendars
 */
export async function listCalendars(accessToken: string): Promise<
  Array<{
    id: string;
    summary: string;
    primary: boolean;
    backgroundColor?: string;
  }>
> {
  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to list calendars');
  }

  const data = await response.json();
  return data.items.map((cal: any) => ({
    id: cal.id,
    summary: cal.summary,
    primary: cal.primary || false,
    backgroundColor: cal.backgroundColor,
  }));
}

/**
 * Create a calendar event
 */
export async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: {
    summary: string;
    description?: string;
    location?: string;
    start: Date;
    end: Date;
    reminders?: { minutes: number }[];
  }
): Promise<string> {
  const eventBody = {
    summary: event.summary,
    description: event.description,
    location: event.location,
    start: {
      dateTime: event.start.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: event.end.toISOString(),
      timeZone: 'UTC',
    },
    reminders: event.reminders
      ? {
          useDefault: false,
          overrides: event.reminders.map((r) => ({
            method: 'popup',
            minutes: r.minutes,
          })),
        }
      : { useDefault: true },
  };

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventBody),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to create event:', error);
    throw new Error('Failed to create calendar event');
  }

  const data = await response.json();
  return data.id;
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    throw new Error('Failed to delete calendar event');
  }
}

/**
 * Sync training schedules to Google Calendar
 */
export async function syncSchedulesToCalendar(
  userId: string,
  weeksAhead: number = 4
): Promise<{ synced: number; errors: number }> {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) {
    throw new Error('No valid Google Calendar connection');
  }

  const connection = await db.connectedCalendar.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: 'GOOGLE',
      },
    },
  });

  if (!connection?.calendarId) {
    throw new Error('No calendar selected for sync');
  }

  // Get active training schedules
  const schedules = await db.trainingSchedule.findMany({
    where: {
      userId,
      isActive: true,
    },
    include: {
      course: { select: { title: true } },
      discipline: { select: { name: true } },
    },
  });

  let synced = 0;
  let errors = 0;

  const now = new Date();
  const endDate = new Date(now.getTime() + weeksAhead * 7 * 24 * 60 * 60 * 1000);

  for (const schedule of schedules) {
    const [hours, minutes] = schedule.timeOfDay.split(':').map(Number);
    const current = new Date(schedule.startDate > now ? schedule.startDate : now);
    current.setHours(hours, minutes, 0, 0);

    const scheduleEnd = schedule.endDate || endDate;

    while (current <= scheduleEnd && current <= endDate) {
      const dayOfWeek = current.getDay();

      if (schedule.daysOfWeek.includes(dayOfWeek)) {
        const eventStart = new Date(current);
        const eventEnd = new Date(current.getTime() + schedule.durationMinutes * 60 * 1000);

        let description = schedule.description || '';
        if (schedule.course?.title) {
          description = `Course: ${schedule.course.title}\n${description}`;
        }
        if (schedule.discipline?.name) {
          description = `${schedule.discipline.name}\n${description}`;
        }

        try {
          await createCalendarEvent(accessToken, connection.calendarId, {
            summary: `🥊 ${schedule.title}`,
            description: description.trim(),
            start: eventStart,
            end: eventEnd,
            reminders: schedule.reminderMinutes ? [{ minutes: schedule.reminderMinutes }] : undefined,
          });
          synced++;
        } catch (error) {
          console.error('Failed to create event:', error);
          errors++;
        }
      }

      current.setDate(current.getDate() + 1);
    }
  }

  // Update last sync time
  await db.connectedCalendar.update({
    where: { id: connection.id },
    data: {
      lastSyncAt: new Date(),
      syncErrors: errors,
    },
  });

  return { synced, errors };
}

/**
 * Disconnect Google Calendar
 */
export async function disconnectCalendar(userId: string): Promise<void> {
  await db.connectedCalendar.deleteMany({
    where: {
      userId,
      provider: 'GOOGLE',
    },
  });
}
