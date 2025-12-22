import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/db/client';
import { sendTemplatedEmail } from '@/lib/email/emailService';

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'sent', 'received', or null for all
    const status = searchParams.get('status');

    // Get sent requests
    const sentRequests = await db.sparringRequest.findMany({
      where: {
        requesterId: userId,
        ...(status && { status: status as any }),
      },
      include: {
        partner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            sparringPreference: {
              select: {
                weightClass: true,
                disciplines: true,
                location: true,
                skillLevel: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get received requests
    const receivedRequests = await db.sparringRequest.findMany({
      where: {
        partnerId: userId,
        ...(status && { status: status as any }),
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            sparringPreference: {
              select: {
                weightClass: true,
                disciplines: true,
                location: true,
                skillLevel: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format and return based on type filter
    if (type === 'sent') {
      return NextResponse.json({
        requests: sentRequests.map((r) => ({
          ...r,
          type: 'sent',
          otherUser: r.partner,
        })),
      });
    }

    if (type === 'received') {
      return NextResponse.json({
        requests: receivedRequests.map((r) => ({
          ...r,
          type: 'received',
          otherUser: r.requester,
        })),
      });
    }

    // Return all with type indicators
    const allRequests = [
      ...sentRequests.map((r) => ({
        ...r,
        type: 'sent' as const,
        otherUser: r.partner,
      })),
      ...receivedRequests.map((r) => ({
        ...r,
        type: 'received' as const,
        otherUser: r.requester,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate stats
    const stats = {
      pendingSent: sentRequests.filter((r) => r.status === 'PENDING').length,
      pendingReceived: receivedRequests.filter((r) => r.status === 'PENDING').length,
      accepted: allRequests.filter((r) => r.status === 'ACCEPTED').length,
      completed: allRequests.filter((r) => r.status === 'COMPLETED').length,
    };

    return NextResponse.json({ requests: allRequests, stats });
  } catch (error) {
    console.error('Error fetching sparring requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    const {
      partnerId,
      proposedDate,
      proposedTime,
      location,
      discipline,
      intensity,
      duration,
      message,
    } = body;

    if (!partnerId) {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      );
    }

    // Check if partner exists and is available
    const partnerPrefs = await db.sparringPreference.findUnique({
      where: { userId: partnerId },
    });

    if (!partnerPrefs) {
      return NextResponse.json(
        { error: 'Partner not found or not set up for sparring' },
        { status: 404 }
      );
    }

    if (!partnerPrefs.isAvailable) {
      return NextResponse.json(
        { error: 'Partner is not currently available for sparring' },
        { status: 400 }
      );
    }

    // Check for existing pending request
    const existingRequest = await db.sparringRequest.findFirst({
      where: {
        requesterId: userId,
        partnerId,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending request with this partner' },
        { status: 400 }
      );
    }

    // Create the request
    const sparringRequest = await db.sparringRequest.create({
      data: {
        requesterId: userId,
        partnerId,
        proposedDate: proposedDate ? new Date(proposedDate) : null,
        proposedTime,
        location,
        discipline,
        intensity,
        duration,
        message,
      },
      include: {
        requester: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        partner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Send email notification to partner
    if (sparringRequest.partner.email) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://combatcoach.app';
      const requesterName = [sparringRequest.requester.firstName, sparringRequest.requester.lastName]
        .filter(Boolean)
        .join(' ') || 'A fighter';

      try {
        await sendTemplatedEmail(sparringRequest.partner.email, 'sparring_request_received', {
          firstName: sparringRequest.partner.firstName || '',
          requesterName,
          discipline: discipline || '',
          proposedDate: proposedDate
            ? new Date(proposedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : '',
          message: message || '',
          viewUrl: `${baseUrl}/my/sparring`,
        });
      } catch (emailError) {
        console.error('Failed to send sparring request email:', emailError);
      }
    }

    return NextResponse.json({ request: sparringRequest }, { status: 201 });
  } catch (error) {
    console.error('Error creating sparring request:', error);
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    );
  }
}
