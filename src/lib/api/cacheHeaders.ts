import { NextResponse } from "next/server";

/**
 * Apply public cache headers to a response.
 * Useful for public content like course listings, coach profiles.
 */
export function withPublicCache(
  response: NextResponse,
  maxAge = 60,
  staleWhileRevalidate = 300,
): NextResponse {
  response.headers.set(
    "Cache-Control",
    `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
  );
  return response;
}

/**
 * Apply private cache headers to a response.
 * Useful for user-specific data like dashboard, settings.
 */
export function withPrivateCache(
  response: NextResponse,
  maxAge = 0,
): NextResponse {
  response.headers.set(
    "Cache-Control",
    `private, max-age=${maxAge}, no-cache`,
  );
  return response;
}

/**
 * Apply no-cache headers to a response.
 * Useful for mutation responses, auth endpoints.
 */
export function withNoCache(response: NextResponse): NextResponse {
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate",
  );
  return response;
}
