import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

// Memory-based fallback for development
class MemoryRatelimit {
  private cache: Map<string, { count: number; timestamp: number }> = new Map();
  private maxRequests: number;
  private window: number;

  constructor(limit: number, windowMs: number) {
    this.maxRequests = limit;
    this.window = windowMs;
  }

  async limit(identifier: string): Promise<{ success: boolean; remaining: number; reset: number }> {
    const now = Date.now();
    const key = identifier;
    const entry = this.cache.get(key);

    if (!entry || now - entry.timestamp > this.window) {
      this.cache.set(key, { count: 1, timestamp: now });
      return {
        success: true,
        remaining: this.maxRequests - 1,
        reset: now + this.window,
      };
    }

    if (entry.count >= this.maxRequests) {
      return {
        success: false,
        remaining: 0,
        reset: entry.timestamp + this.window,
      };
    }

    entry.count++;
    return {
      success: true,
      remaining: this.maxRequests - entry.count,
      reset: entry.timestamp + this.window,
    };
  }
}

// Create rate limiters based on environment
const hasUpstash =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

let redis: Redis | null = null;
if (hasUpstash) {
  redis = Redis.fromEnv();
}

// Auth rate limiter: 5 requests per minute per IP
export const authRatelimit = hasUpstash
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: 'ratelimit:auth',
    })
  : new MemoryRatelimit(5, 60000);

// API rate limiter: 100 requests per minute per user/IP
export const apiRatelimit = hasUpstash
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: 'ratelimit:api',
    })
  : new MemoryRatelimit(100, 60000);

// Stripe webhook: 50 requests per minute (generous for webhooks)
export const webhookRatelimit = hasUpstash
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(50, '1 m'),
      analytics: true,
      prefix: 'ratelimit:webhook',
    })
  : new MemoryRatelimit(50, 60000);

// Strict rate limiter for sensitive operations: 3 requests per minute
export const strictRatelimit = hasUpstash
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(3, '1 m'),
      analytics: true,
      prefix: 'ratelimit:strict',
    })
  : new MemoryRatelimit(3, 60000);

/**
 * Get identifier for rate limiting (IP or user ID)
 */
export function getRateLimitIdentifier(req: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get real IP from various headers
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfIp = req.headers.get('cf-connecting-ip');

  const ip =
    cfIp ||
    realIp ||
    (forwarded ? forwarded.split(',')[0].trim() : null) ||
    'unknown';

  return `ip:${ip}`;
}

/**
 * Rate limit check wrapper for API routes
 */
export async function checkRateLimit(
  req: NextRequest,
  limiter: typeof authRatelimit | typeof apiRatelimit | typeof strictRatelimit,
  identifier?: string
): Promise<{ success: boolean; response?: NextResponse }> {
  const id = identifier || getRateLimitIdentifier(req);

  try {
    const result = await limiter.limit(id);

    if (!result.success) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Too many requests',
            message: 'Please try again later',
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.reset.toString(),
              'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
            },
          }
        ),
      };
    }

    return { success: true };
  } catch (error) {
    // If rate limiting fails, allow the request but log the error
    console.error('Rate limit check failed:', error);
    return { success: true };
  }
}

/**
 * Middleware helper for rate limiting
 */
export async function withRateLimit(
  req: NextRequest,
  limiter: typeof authRatelimit | typeof apiRatelimit | typeof strictRatelimit,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const rateLimitResult = await checkRateLimit(req, limiter);

  if (!rateLimitResult.success && rateLimitResult.response) {
    return rateLimitResult.response;
  }

  return handler();
}
