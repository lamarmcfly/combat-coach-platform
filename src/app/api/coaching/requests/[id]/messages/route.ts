import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { CoachingService } from '@/services/coachingService';
import { prisma } from '@/db/client';
import { sendTemplatedEmail } from '@/lib/email/emailService';

// POST - Add message to coaching request
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: requestId } = await params;
    const body = await request.json();
    const { content, attachments } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Verify request exists and user has access
    const existingRequest = await prisma.coachingRequest.findUnique({
      where: { id: requestId },
      select: { userId: true, coachId: true },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Get coach profile if user is a coach
    const coachProfile = await prisma.coachProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    const isStudent = existingRequest.userId === session.user.id;
    const isCoach = coachProfile?.id === existingRequest.coachId;

    if (!isStudent && !isCoach) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create the message
    const message = await CoachingService.addMessage({
      requestId,
      senderId: session.user.id,
      content,
      isCoachResponse: isCoach,
      attachments: attachments || [],
    });

    // Send email notification to student when coach responds
    if (isCoach) {
      try {
        // Get the request with student and coach info
        const requestWithDetails = await prisma.coachingRequest.findUnique({
          where: { id: requestId },
          include: {
            user: {
              select: { email: true, firstName: true },
            },
            coach: {
              select: { displayName: true },
            },
          },
        });

        if (requestWithDetails?.user.email) {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://combatcoach.app';

          await sendTemplatedEmail(requestWithDetails.user.email, 'coaching_response_received', {
            firstName: requestWithDetails.user.firstName || '',
            coachName: requestWithDetails.coach.displayName,
            title: requestWithDetails.title,
            viewUrl: `${baseUrl}/my/coaching/${requestId}`,
          });
        }
      } catch (emailError) {
        console.error('Failed to send coaching response email:', emailError);
      }
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Error adding message:', error);
    return NextResponse.json(
      { error: 'Failed to add message' },
      { status: 500 }
    );
  }
}
