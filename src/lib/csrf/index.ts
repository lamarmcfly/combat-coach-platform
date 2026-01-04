import { cookies } from 'next/headers';
import { randomBytes, createHmac } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const SECRET = process.env.NEXTAUTH_SECRET || 'default-secret-change-me';

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  const randomValue = randomBytes(32).toString('hex');
  const timestamp = Date.now().toString();
  const signature = createHmac('sha256', SECRET)
    .update(`${randomValue}:${timestamp}`)
    .digest('hex');

  return `${randomValue}:${timestamp}:${signature}`;
}

/**
 * Validate a CSRF token
 */
export function validateCsrfToken(token: string): boolean {
  if (!token) return false;

  const parts = token.split(':');
  if (parts.length !== 3) return false;

  const [randomValue, timestamp, signature] = parts;

  // Check token age (valid for 24 hours)
  const tokenAge = Date.now() - parseInt(timestamp, 10);
  if (tokenAge > 24 * 60 * 60 * 1000) return false;

  // Verify signature
  const expectedSignature = createHmac('sha256', SECRET)
    .update(`${randomValue}:${timestamp}`)
    .digest('hex');

  return signature === expectedSignature;
}

/**
 * Get or create CSRF token from cookies
 */
export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!token || !validateCsrfToken(token)) {
    token = generateCsrfToken();
    // Note: Setting cookie should be done in the response, not here
  }

  return token;
}

/**
 * Middleware to validate CSRF token
 */
export async function validateCsrfRequest(request: NextRequest): Promise<{
  valid: boolean;
  error?: string;
  response?: NextResponse;
}> {
  // Skip CSRF validation for safe methods
  const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(request.method);
  if (safeMethod) {
    return { valid: true };
  }

  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

  // Both must be present and match
  if (!headerToken || !cookieToken) {
    return {
      valid: false,
      error: 'CSRF token missing',
      response: NextResponse.json(
        { error: 'CSRF token required' },
        { status: 403 }
      ),
    };
  }

  if (headerToken !== cookieToken) {
    return {
      valid: false,
      error: 'CSRF token mismatch',
      response: NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      ),
    };
  }

  if (!validateCsrfToken(cookieToken)) {
    return {
      valid: false,
      error: 'CSRF token invalid or expired',
      response: NextResponse.json(
        { error: 'CSRF token expired' },
        { status: 403 }
      ),
    };
  }

  return { valid: true };
}

/**
 * Wrapper for routes that need CSRF protection
 */
export function withCsrfProtection<T>(
  handler: (request: NextRequest) => Promise<T>
) {
  return async (request: NextRequest): Promise<T | NextResponse> => {
    const csrfResult = await validateCsrfRequest(request);
    if (!csrfResult.valid && csrfResult.response) {
      return csrfResult.response;
    }
    return handler(request);
  };
}
