import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import bcrypt from "bcryptjs";
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
  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      role: Role.ATHLETE,
    },
  });

  // Send welcome email
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://combatcoach.app';
  try {
    await sendTemplatedEmail(email, 'welcome', {
      firstName: firstName || '',
      dashboardUrl: `${baseUrl}/my/dashboard`,
    });
  } catch (emailError) {
    console.error('Failed to send welcome email:', emailError);
  }

  return NextResponse.json({ success: true, userId: user.id });
}
