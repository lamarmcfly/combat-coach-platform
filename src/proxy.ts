import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { generateCsrfToken, validateCsrfToken } from '@/lib/csrf';

const CSRF_COOKIE_NAME = 'csrf_token';

// Routes that require authentication
const PROTECTED_PREFIXES = ['/my', '/coach', '/admin', '/onboarding'];

// Routes that require admin role
const ADMIN_PREFIXES = ['/admin'];

// Routes that require coach role
const COACH_PREFIXES = ['/coach/dashboard', '/coach/clients', '/coach/earnings', '/coach/coaching', '/coach/courses', '/coach/setup', '/coach/invite'];

// Security headers applied to all responses
const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-DNS-Prefetch-Control': 'on',
};

// Only apply HSTS in production
const HSTS_HEADER = 'max-age=31536000; includeSubDomains';

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isCoachRoute(pathname: string): boolean {
  return COACH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // --- 1. Security Headers ---
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    response.headers.set('Strict-Transport-Security', HSTS_HEADER);
  }

  // --- 2. CSRF Cookie Management ---
  // Ensure CSRF cookie exists on every response
  const existingCsrfToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (!existingCsrfToken || !await validateCsrfToken(existingCsrfToken)) {
    const newToken = await generateCsrfToken();
    response.cookies.set({
      name: CSRF_COOKIE_NAME,
      value: newToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
    });
  }

  // --- 3. Authentication Enforcement ---
  if (isProtectedRoute(pathname)) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const signInUrl = new URL('/auth/sign-in', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }

    // --- 4. Role Enforcement ---
    const userRole = (token.role as string) ?? 'ATHLETE';

    if (isAdminRoute(pathname) && userRole !== 'ADMIN') {
      // Non-admin trying to access admin routes
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (isCoachRoute(pathname) && userRole !== 'COACH' && userRole !== 'ADMIN') {
      // Non-coach trying to access coach management routes
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public folder assets
     * - API routes (handled by their own auth checks)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|icons/|sw\\.js|api/).*)',
  ],
};
