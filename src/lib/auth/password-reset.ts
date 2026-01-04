import { prisma } from '@/db/client';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { sendTemplatedEmail } from '@/lib/email/emailService';

// Token expires in 1 hour
const TOKEN_EXPIRY_HOURS = 1;

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Request a password reset for a user
 * Returns true if email was sent (always returns true to prevent email enumeration)
 */
export async function requestPasswordReset(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, firstName: true, email: true },
  });

  // Always return true to prevent email enumeration attacks
  if (!user) {
    // Simulate delay to prevent timing attacks
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 500 + 500));
    return true;
  }

  // Invalidate any existing tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: {
      userId: user.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: {
      expiresAt: new Date(), // Expire immediately
    },
  });

  // Create new token
  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  // Send reset email
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

  try {
    await sendTemplatedEmail(user.email, 'passwordReset', {
      firstName: user.firstName || 'there',
      resetUrl,
      expiryHours: TOKEN_EXPIRY_HOURS.toString(),
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    // Don't throw - we still want to return true to prevent enumeration
  }

  return true;
}

/**
 * Validate a password reset token
 */
export async function validateResetToken(
  token: string
): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      usedAt: true,
    },
  });

  if (!resetToken) {
    return { valid: false, error: 'Invalid or expired token' };
  }

  if (resetToken.usedAt) {
    return { valid: false, error: 'This token has already been used' };
  }

  if (new Date() > resetToken.expiresAt) {
    return { valid: false, error: 'This token has expired' };
  }

  return { valid: true, userId: resetToken.userId };
}

/**
 * Complete password reset by setting new password
 */
export async function completePasswordReset(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const validation = await validateResetToken(token);

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const userId = validation.userId!;

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update user password and mark token as used
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
  ]);

  // Get user email to send confirmation
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, firstName: true },
  });

  if (user) {
    try {
      await sendTemplatedEmail(user.email, 'passwordChanged', {
        firstName: user.firstName || 'there',
      });
    } catch (error) {
      console.error('Failed to send password changed confirmation:', error);
    }
  }

  return { success: true };
}
