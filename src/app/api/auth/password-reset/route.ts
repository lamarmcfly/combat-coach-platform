import { NextRequest, NextResponse } from 'next/server';
import { authRatelimit, strictRatelimit, checkRateLimit } from '@/lib/ratelimit';
import {
  requestPasswordReset,
  completePasswordReset,
  validateResetToken,
} from '@/lib/auth/password-reset';
import { passwordResetRequestSchema, passwordResetSchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/password-reset
 * Request a password reset email
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await checkRateLimit(request, authRatelimit);
  if (!rateLimitResult.success && rateLimitResult.response) {
    return rateLimitResult.response;
  }

  try {
    const body = await request.json();
    const validation = passwordResetRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid email address',
        },
        { status: 400 }
      );
    }

    await requestPasswordReset(validation.data.email);

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.',
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/auth/password-reset
 * Complete password reset with new password
 */
export async function PUT(request: NextRequest) {
  // Apply strict rate limiting for password changes
  const rateLimitResult = await checkRateLimit(request, strictRatelimit);
  if (!rateLimitResult.success && rateLimitResult.response) {
    return rateLimitResult.response;
  }

  try {
    const body = await request.json();
    const validation = passwordResetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const result = await completePasswordReset(
      validation.data.token,
      validation.data.password
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('Password reset completion error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/password-reset?token=...
 * Validate a reset token
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'Token is required' },
      { status: 400 }
    );
  }

  const result = await validateResetToken(token);

  return NextResponse.json({
    valid: result.valid,
    error: result.error,
  });
}
