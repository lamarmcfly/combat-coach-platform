import { NextResponse } from 'next/server';

/**
 * GET /api/push/vapid-key
 * Get the VAPID public key for push subscriptions
 */
export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return NextResponse.json(
      { error: 'Push notifications not configured' },
      { status: 503 }
    );
  }

  return NextResponse.json({ publicKey });
}
