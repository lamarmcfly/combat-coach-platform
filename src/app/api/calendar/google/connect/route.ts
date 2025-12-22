import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { getAuthorizationUrl, isGoogleCalendarConfigured } from '@/lib/calendar/googleCalendar';
import { randomBytes } from 'crypto';

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isGoogleCalendarConfigured()) {
      return NextResponse.json(
        { error: 'Google Calendar integration not configured' },
        { status: 503 }
      );
    }

    // Generate state parameter with user ID for security
    const state = Buffer.from(
      JSON.stringify({
        userId: session.user.id,
        nonce: randomBytes(16).toString('hex'),
        timestamp: Date.now(),
      })
    ).toString('base64');

    const authUrl = getAuthorizationUrl(state);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Google Calendar connection:', error);
    return NextResponse.json(
      { error: 'Failed to initiate connection' },
      { status: 500 }
    );
  }
}
