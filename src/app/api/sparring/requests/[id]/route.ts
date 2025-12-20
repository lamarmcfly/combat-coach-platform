import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db/client';
import { SparringRequestStatus } from '@prisma/client';
import { sendTemplatedEmail } from '@/lib/email/emailService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id } = await params;

    const sparringRequest = await db.sparringRequest.findFirst({
      where: {
        id,
        OR: [{ requesterId: userId }, { partnerId: userId }],
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            sparringPreference: true,
          },
        },
        partner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            sparringPreference: true,
          },
        },
      },
    });

    if (!sparringRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json({ request: sparringRequest });
  } catch (error) {
    console.error('Error fetching sparring request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch request' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id } = await params;
    const body = await request.json();

    const { status, responseNote, proposedDate, proposedTime, location } = body;

    // Find the request
    const existingRequest = await db.sparringRequest.findFirst({
      where: {
        id,
        OR: [{ requesterId: userId }, { partnerId: userId }],
      },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Validate status transitions
    const isRequester = existingRequest.requesterId === userId;
    const isPartner = existingRequest.partnerId === userId;

    if (status) {
      // Only partner can accept or decline
      if ((status === 'ACCEPTED' || status === 'DECLINED') && !isPartner) {
        return NextResponse.json(
          { error: 'Only the recipient can accept or decline' },
          { status: 403 }
        );
      }

      // Only requester can cancel a pending request
      if (status === 'CANCELED' && existingRequest.status === 'PENDING' && !isRequester) {
        return NextResponse.json(
          { error: 'Only the sender can cancel a pending request' },
          { status: 403 }
        );
      }

      // Either party can mark as completed if accepted
      if (status === 'COMPLETED' && existingRequest.status !== 'ACCEPTED') {
        return NextResponse.json(
          { error: 'Can only complete accepted requests' },
          { status: 400 }
        );
      }
    }

    // Update the request
    const updateData: any = {};

    if (status) {
      updateData.status = status as SparringRequestStatus;
      if (status === 'ACCEPTED' || status === 'DECLINED') {
        updateData.respondedAt = new Date();
      }
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
    }

    if (responseNote !== undefined) {
      updateData.responseNote = responseNote;
    }

    if (proposedDate !== undefined) {
      updateData.proposedDate = proposedDate ? new Date(proposedDate) : null;
    }

    if (proposedTime !== undefined) {
      updateData.proposedTime = proposedTime;
    }

    if (location !== undefined) {
      updateData.location = location;
    }

    const updatedRequest = await db.sparringRequest.update({
      where: { id },
      data: updateData,
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        partner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Send email notification when request is accepted
    if (status === 'ACCEPTED' && updatedRequest.requester.email) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://combatcoach.app';
      const partnerName = [updatedRequest.partner.firstName, updatedRequest.partner.lastName]
        .filter(Boolean)
        .join(' ') || 'Your sparring partner';

      try {
        await sendTemplatedEmail(updatedRequest.requester.email, 'sparring_request_accepted', {
          firstName: updatedRequest.requester.firstName || '',
          partnerName,
          discipline: updatedRequest.discipline || '',
          proposedDate: updatedRequest.proposedDate
            ? updatedRequest.proposedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : '',
          location: updatedRequest.location || '',
          viewUrl: `${baseUrl}/my/sparring`,
        });
      } catch (emailError) {
        console.error('Failed to send sparring acceptance email:', emailError);
      }
    }

    return NextResponse.json({ request: updatedRequest });
  } catch (error) {
    console.error('Error updating sparring request:', error);
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id } = await params;

    // Find the request (only requester can delete)
    const existingRequest = await db.sparringRequest.findFirst({
      where: {
        id,
        requesterId: userId,
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Request not found or you cannot delete it' },
        { status: 404 }
      );
    }

    // Only allow deletion of pending or declined requests
    if (existingRequest.status !== 'PENDING' && existingRequest.status !== 'DECLINED') {
      return NextResponse.json(
        { error: 'Can only delete pending or declined requests' },
        { status: 400 }
      );
    }

    await db.sparringRequest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting sparring request:', error);
    return NextResponse.json(
      { error: 'Failed to delete request' },
      { status: 500 }
    );
  }
}
