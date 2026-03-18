import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const encoder = new TextEncoder();

// Security: Require NEXTAUTH_SECRET to be configured - no fallback allowed
function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      'NEXTAUTH_SECRET environment variable must be configured for CSRF protection. ' +
      'Generate one with: openssl rand -base64 32'
    );
  }
  return secret;
}

function getWebCrypto(): Crypto {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto API is required for CSRF protection.');
  }
  return globalThis.crypto;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return mismatch === 0;
}

async function signPayload(payload: string): Promise<string> {
  const key = await getWebCrypto().subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await getWebCrypto().subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );

  return toHex(new Uint8Array(signature));
}

/**
 * Generate a CSRF token
 */
export async function generateCsrfToken(): Promise<string> {
  const randomBytes = new Uint8Array(32);
  getWebCrypto().getRandomValues(randomBytes);
  const randomValue = toHex(randomBytes);
  const timestamp = Date.now().toString();
  const signature = await signPayload(`${randomValue}:${timestamp}`);

  return `${randomValue}:${timestamp}:${signature}`;
}

/**
 * Validate a CSRF token
 */
export async function validateCsrfToken(token: string): Promise<boolean> {
  if (!token) return false;

  const parts = token.split(':');
  if (parts.length !== 3) return false;

  const [randomValue, timestamp, signature] = parts;
  const parsedTimestamp = parseInt(timestamp, 10);
  if (!Number.isFinite(parsedTimestamp)) return false;

  // Check token age (valid for 24 hours)
  const tokenAge = Date.now() - parsedTimestamp;
  if (tokenAge < 0 || tokenAge > CSRF_TOKEN_MAX_AGE_MS) return false;

  // Verify signature
  const expectedSignature = await signPayload(`${randomValue}:${timestamp}`);

  return timingSafeEqual(signature, expectedSignature);
}

/**
 * Read the current CSRF token from cookies.
 * Token generation and cookie persistence is handled by middleware.ts.
 * If no valid token exists yet (e.g., first request), generates one for inline use
 * but the middleware will persist it on the response.
 */
export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (token && await validateCsrfToken(token)) {
    return token;
  }

  // Fallback: generate a token for this request cycle.
  // The middleware will set the cookie on the response.
  return await generateCsrfToken();
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

  if (!await validateCsrfToken(cookieToken)) {
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
