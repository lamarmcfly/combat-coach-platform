import { prisma } from '@/db/client';
import { nanoid } from 'nanoid';

interface GenerateCertificateParams {
  userId: string;
  courseId: string;
  coursePurchaseId: string;
}

/**
 * Generate a unique certificate number
 */
function generateCertificateNumber(): string {
  const prefix = 'CERT';
  const year = new Date().getFullYear();
  const uniqueId = nanoid(8).toUpperCase();
  return `${prefix}-${year}-${uniqueId}`;
}

/**
 * Generate a verification URL for a certificate
 */
function generateVerificationUrl(certificateNumber: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/verify/${certificateNumber}`;
}

/**
 * Generate a certificate for a completed course
 */
export async function generateCertificate({
  userId,
  courseId,
  coursePurchaseId,
}: GenerateCertificateParams) {
  // Check if certificate already exists
  const existing = await prisma.certificate.findUnique({
    where: { coursePurchaseId },
  });

  if (existing) {
    return existing;
  }

  // Get user, course, and coach details
  const [user, coursePurchase] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    }),
    prisma.coursePurchase.findUnique({
      where: { id: coursePurchaseId },
      include: {
        course: {
          include: {
            coach: {
              select: { displayName: true },
            },
          },
        },
      },
    }),
  ]);

  if (!user || !coursePurchase) {
    throw new Error('User or course purchase not found');
  }

  // Verify course is completed
  if (coursePurchase.progressPercent < 100) {
    throw new Error('Course must be completed to generate certificate');
  }

  const certificateNumber = generateCertificateNumber();
  const recipientName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

  const certificate = await prisma.certificate.create({
    data: {
      userId,
      courseId,
      coursePurchaseId,
      certificateNumber,
      recipientName,
      courseName: coursePurchase.course.title,
      coachName: coursePurchase.course.coach.displayName,
      completionDate: new Date(),
      verificationUrl: generateVerificationUrl(certificateNumber),
    },
  });

  return certificate;
}

/**
 * Get a certificate by its number (for verification)
 */
export async function getCertificateByNumber(certificateNumber: string) {
  const certificate = await prisma.certificate.findUnique({
    where: { certificateNumber },
    include: {
      course: {
        select: {
          title: true,
          slug: true,
          coverImageUrl: true,
          discipline: { select: { name: true } },
        },
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!certificate) {
    return null;
  }

  return {
    ...certificate,
    isValid: !certificate.isRevoked,
  };
}

/**
 * Get all certificates for a user
 */
export async function getUserCertificates(userId: string) {
  return prisma.certificate.findMany({
    where: {
      userId,
      isRevoked: false,
    },
    include: {
      course: {
        select: {
          title: true,
          slug: true,
          coverImageUrl: true,
          discipline: { select: { name: true } },
          coach: { select: { displayName: true } },
        },
      },
    },
    orderBy: { completionDate: 'desc' },
  });
}

/**
 * Revoke a certificate (admin only)
 */
export async function revokeCertificate(
  certificateId: string,
  reason: string
) {
  return prisma.certificate.update({
    where: { id: certificateId },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: reason,
    },
  });
}

/**
 * Check if a user can generate a certificate for a course
 */
export async function canGenerateCertificate(
  userId: string,
  courseId: string
): Promise<{ canGenerate: boolean; reason?: string; purchase?: any }> {
  const purchase = await prisma.coursePurchase.findUnique({
    where: {
      userId_courseId: { userId, courseId },
    },
    include: {
      certificate: true,
    },
  });

  if (!purchase) {
    return { canGenerate: false, reason: 'Course not purchased' };
  }

  if (purchase.status !== 'ACTIVE') {
    return { canGenerate: false, reason: 'Purchase is not active' };
  }

  if (purchase.progressPercent < 100) {
    return {
      canGenerate: false,
      reason: `Course not completed (${purchase.progressPercent}% complete)`,
      purchase,
    };
  }

  if (purchase.certificate) {
    return {
      canGenerate: false,
      reason: 'Certificate already generated',
      purchase,
    };
  }

  return { canGenerate: true, purchase };
}
