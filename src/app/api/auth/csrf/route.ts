import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken, validateCsrfToken } from '@/lib/csrf';

const CSRF_COOKIE_NAME = 'csrf_token';

/**
 * GET /api/auth/csrf
 * Get a CSRF token for the client
 */
export async function GET(request: NextRequest) {
  // Check if we have a valid existing token
  const existingToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

  let token: string;
  if (existingToken && await validateCsrfToken(existingToken)) {
    token = existingToken;
  } else {
    token = await generateCsrfToken();
  }

  const response = NextResponse.json({ csrfToken: token });

  // Set the token as an HTTP-only cookie (for server verification)
  // and return it in the response (for client to use in headers)
  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 24 * 60 * 60, // 24 hours
  });

  return response;
}
