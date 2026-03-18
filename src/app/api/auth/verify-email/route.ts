import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Missing verification token" },
      { status: 400 }
    );
  }

  // Find the token record
  const verificationToken = await db.emailVerificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!verificationToken) {
    return NextResponse.json(
      { error: "Invalid verification token" },
      { status: 400 }
    );
  }

  // Check if the token has expired
  if (verificationToken.expiresAt < new Date()) {
    // Clean up the expired token
    await db.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });
    return NextResponse.json(
      { error: "Verification token has expired. Please register again." },
      { status: 410 }
    );
  }

  // Mark the user's email as verified and delete the token in a transaction
  await db.$transaction([
    db.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: new Date() },
    }),
    db.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    }),
  ]);

  return NextResponse.json({
    success: true,
    message: "Email verified successfully. You can now sign in.",
  });
}
