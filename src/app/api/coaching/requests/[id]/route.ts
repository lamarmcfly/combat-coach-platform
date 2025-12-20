import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { CoachingService } from '@/services/coachingService';
import { prisma } from '@/db/client';
import { CoachingRequestStatus } from '@prisma/client';

// GET - Get request details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const requestDetails = await CoachingService.getRequestDetails(id);

    if (!requestDetails) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Verify user has access (is student or coach)
    const coachProfile = await prisma.coachProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    const isStudent = requestDetails.userId === session.user.id;
    const isCoach = coachProfile?.id === requestDetails.coachId;

    if (!isStudent && !isCoach) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ request: requestDetails });
  } catch (error) {
    console.error('Error fetching request details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch request' },
      { status: 500 }
    );
  }
}

// PATCH - Update request status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Verify request exists and user has access
    const existingRequest = await prisma.coachingRequest.findUnique({
      where: { id },
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

    // Update the request
    const updatedRequest = await CoachingService.updateRequestStatus(
      id,
      status as CoachingRequestStatus
    );

    return NextResponse.json({ request: updatedRequest });
  } catch (error) {
    console.error('Error updating request status:', error);
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    );
  }
}
