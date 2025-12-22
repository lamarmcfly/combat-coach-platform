import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/db/client';
import { SubscriptionTier } from '@prisma/client';

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slotId, notes } = await request.json();

    if (!slotId) {
      return NextResponse.json({ error: 'Missing slotId' }, { status: 400 });
    }

    // Check user's subscription tier (Elite only)
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription || subscription.tier !== SubscriptionTier.ELITE) {
      return NextResponse.json(
        {
          error: 'Elite tier required',
          message: 'Office hours are only available to Elite members. Upgrade your plan to access this feature.',
          upgradeRequired: true
        },
        { status: 403 }
      );
    }

    // Check if slot exists and has availability
    const slot = await prisma.officeHoursSlot.findUnique({
      where: { id: slotId },
      include: {
        bookings: { where: { status: 'CONFIRMED' } },
      },
    });

    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    // Check if slot is full
    if (slot.bookings.length >= slot.maxAttendees) {
      return NextResponse.json({ error: 'Slot is no longer available' }, { status: 409 });
    }

    // Check monthly limit
    const currentPeriodStart = subscription.currentPeriodStart;
    const currentPeriodEnd = subscription.currentPeriodEnd;

    const bookingsThisPeriod = await prisma.officeHoursBooking.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: currentPeriodStart,
          lte: currentPeriodEnd,
        },
        status: 'CONFIRMED',
      },
    });

    // Elite tier gets 2 office hours per month
    const monthlyLimit = 2;
    if (bookingsThisPeriod >= monthlyLimit) {
      return NextResponse.json(
        {
          error: 'Monthly limit reached',
          message: `You've used all ${monthlyLimit} office hours sessions for this month. Your limit will reset on ${currentPeriodEnd.toLocaleDateString()}.`
        },
        { status: 429 }
      );
    }

    // Create booking
    const booking = await prisma.officeHoursBooking.create({
      data: {
        userId: session.user.id,
        slotId,
        notes,
        status: 'CONFIRMED',
      },
    });

    return NextResponse.json({
      success: true,
      booking,
      message: 'Office hours session booked successfully!',
    });
  } catch (error) {
    console.error('Error booking office hours:', error);
    return NextResponse.json(
      { error: 'Failed to book office hours' },
      { status: 500 }
    );
  }
}

// Cancel office hours booking
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    // Verify booking belongs to user
    const booking = await prisma.officeHoursBooking.findUnique({
      where: { id: bookingId },
      include: { slot: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Cancel booking
    await prisma.officeHoursBooking.update({
      where: { id: bookingId },
      data: { status: 'CANCELED' },
    });

    return NextResponse.json({
      success: true,
      message: 'Office hours booking canceled successfully',
    });
  } catch (error) {
    console.error('Error canceling office hours booking:', error);
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}
