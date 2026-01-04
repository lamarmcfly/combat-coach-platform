import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/db/client';

/**
 * DELETE /api/office-hours/book/[bookingId]
 * Cancel an office hours booking
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { bookingId } = await params;

    // Find the booking
    const booking = await prisma.officeHoursBooking.findUnique({
      where: { id: bookingId },
      include: {
        slot: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (booking.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only cancel your own bookings' },
        { status: 403 }
      );
    }

    // Check if the session hasn't started yet (allow cancellation up to 1 hour before)
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    if (booking.slot.startTime < oneHourFromNow) {
      return NextResponse.json(
        { error: 'Cannot cancel bookings less than 1 hour before the session' },
        { status: 400 }
      );
    }

    // Cancel the booking
    await prisma.officeHoursBooking.update({
      where: { id: bookingId },
      data: {
        status: 'cancelled',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/office-hours/book/[bookingId]
 * Get a specific booking
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { bookingId } = await params;

    const booking = await prisma.officeHoursBooking.findUnique({
      where: { id: bookingId },
      include: {
        slot: {
          include: {
            coach: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (booking.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only view your own bookings' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: booking.id,
      status: booking.status,
      notes: booking.notes,
      slot: {
        startTime: booking.slot.startTime,
        endTime: booking.slot.endTime,
        meetingUrl: booking.slot.meetingUrl,
      },
      coach: {
        displayName: booking.slot.coach.displayName,
        avatarUrl: booking.slot.coach.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}
