import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import {
  generateCertificate,
  getUserCertificates,
  canGenerateCertificate,
} from '@/lib/certificates/service';
import { z } from 'zod';

const generateCertificateSchema = z.object({
  courseId: z.string().cuid('Invalid course ID'),
  coursePurchaseId: z.string().cuid('Invalid purchase ID'),
});

/**
 * GET /api/certificates
 * Get all certificates for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const certificates = await getUserCertificates(session.user.id);

    return NextResponse.json({ certificates });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certificates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/certificates
 * Generate a new certificate for a completed course
 */
export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = generateCertificateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const { courseId, coursePurchaseId } = parsed.data;

    // Check if certificate can be generated
    const eligibility = await canGenerateCertificate(session.user.id, courseId);

    if (!eligibility.canGenerate) {
      return NextResponse.json(
        { error: eligibility.reason },
        { status: 400 }
      );
    }

    // Generate the certificate
    const certificate = await generateCertificate({
      userId: session.user.id,
      courseId,
      coursePurchaseId,
    });

    return NextResponse.json({
      certificate,
      message: 'Certificate generated successfully',
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    return NextResponse.json(
      { error: 'Failed to generate certificate' },
      { status: 500 }
    );
  }
}
