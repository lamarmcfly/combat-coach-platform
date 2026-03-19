import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { Role } from "@prisma/client";
import { sendTemplatedEmail } from "@/lib/email/emailService";
import { authRatelimit, checkRateLimit } from "@/lib/ratelimit";
import { signUpSchema } from "@/lib/validation/schemas";

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Apply rate limiting for registration attempts
  const rateLimitResult = await checkRateLimit(request, authRatelimit);
  if (!rateLimitResult.success && rateLimitResult.response) {
    return rateLimitResult.response;
  }

  // Parse and validate request body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validation = signUpSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: validation.error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      },
      { status: 400 }
    );
  }

  const { email, password, firstName, lastName } = validation.data;

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "Email already registered" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Auto-verify email when email service is not configured (dev/demo mode)
  const emailServiceConfigured = !!process.env.SENDGRID_API_KEY;
  const autoVerify = !emailServiceConfigured;

  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      role: Role.ATHLETE,
      emailVerified: autoVerify ? new Date() : null,
    },
  });

  if (!autoVerify) {
    // Generate email verification token (32 random hex bytes)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://combatcoach.app';
    const verificationToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt,
      },
    });

    // Send verification email
    const verifyUrl = `${baseUrl}/auth/verify-email?token=${verificationToken}`;
    try {
      await sendTemplatedEmail(email, 'email_verification', {
        firstName: firstName || '',
        verifyUrl,
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      message: "Account created. Please check your email to verify your address.",
    });
  }

  return NextResponse.json({
    success: true,
    userId: user.id,
    message: "Account created. You can now sign in.",
  });
}
