import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { CoachingService } from '@/services/coachingService';
import { prisma } from '@/db/client';
import {
  CoachingRequestType,
  CoachingPriority,
  CoachingRequestStatus,
  AttachmentType,
} from '@prisma/client';
import { sendTemplatedEmail } from '@/lib/email/emailService';

// GET - Fetch coaching requests (for student or coach)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'student'; // 'student' or 'coach'
    const status = searchParams.get('status') as CoachingRequestStatus | null;
    const type = searchParams.get('type') as CoachingRequestType | null;
    const priority = searchParams.get('priority') as CoachingPriority | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let result;

    if (view === 'coach') {
      // Get coach profile ID
      const coachProfile = await prisma.coachProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });

      if (!coachProfile) {
        return NextResponse.json(
          { error: 'Coach profile not found' },
          { status: 404 }
        );
      }

      result = await CoachingService.getCoachRequests(coachProfile.id, {
        status: status || undefined,
        priority: priority || undefined,
        type: type || undefined,
        limit,
        offset,
      });
    } else {
      // Student view
      result = await CoachingService.getStudentRequests(session.user.id, {
        status: status || undefined,
        type: type || undefined,
        limit,
        offset,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching coaching requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}

// POST - Create new coaching request
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      coachId,
      title,
      description,
      type,
      priority,
      courseId,
      lessonId,
      tags,
      attachments,
    } = body;

    // Validate required fields
    if (!coachId || !title || !description || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify coach exists and get email
    const coach = await prisma.coachProfile.findUnique({
      where: { id: coachId },
      include: {
        user: {
          select: { email: true, firstName: true },
        },
      },
    });

    if (!coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 });
    }

    // Get student name
    const student = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, lastName: true },
    });

    // Create the request
    const coachingRequest = await CoachingService.createRequest({
      userId: session.user.id,
      coachId,
      title,
      description,
      type,
      priority: priority || 'NORMAL',
      courseId,
      lessonId,
      tags: tags || [],
      attachments: attachments || [],
    });

    // Send email notification to coach
    if (coach.user.email) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://combatcoach.app';
      const studentName = [student?.firstName, student?.lastName]
        .filter(Boolean)
        .join(' ') || 'A student';

      try {
        await sendTemplatedEmail(coach.user.email, 'coaching_request_received', {
          studentName,
          requestType: type,
          title,
          viewUrl: `${baseUrl}/coach/coaching`,
        });
      } catch (emailError) {
        console.error('Failed to send coaching request email:', emailError);
      }
    }

    return NextResponse.json({ request: coachingRequest }, { status: 201 });
  } catch (error) {
    console.error('Error creating coaching request:', error);
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    );
  }
}
