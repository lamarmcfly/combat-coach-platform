import { NextResponse } from "next/server";
import { db } from "@/db/client";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { sendTemplatedEmail } from "@/lib/email/emailService";

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { email, password, firstName, lastName } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

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
