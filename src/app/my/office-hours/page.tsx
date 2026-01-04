import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/db/client';
import { redirect } from 'next/navigation';
import { SubscriptionTier } from '@prisma/client';
import { PageContainer } from '@/components/layout/PageContainer';
import { OfficeHoursClient } from '@/components/office-hours/OfficeHoursClient';

export const metadata = {
  title: 'Office Hours - Combat Coach Platform',
  description: 'Book 1:1 sessions with elite coaches',
};

export default async function OfficeHoursPage() {
  const session = (await getServerSession(authOptions)) as Session | null;

  if (!session?.user?.id) {
    redirect('/auth/sign-in?redirect=/my/office-hours');
  }

  // Get user with subscription
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscription: true,
      officeHoursBookings: {
        where: {
          status: 'confirmed',
        },
        include: {
          slot: {
            include: {
              coach: {
                include: {
                  user: true,
                  disciplines: {
                    include: {
                      discipline: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          slot: {
            startTime: 'asc',
          },
        },
      },
    },
  });

  if (!user) {
    redirect('/auth/sign-in');
  }

  const isElite = user.subscriptionTier === SubscriptionTier.ELITE;

  // Get available coaches with office hours
  const coachesWithSlots = await prisma.coachProfile.findMany({
    where: {
      status: 'APPROVED',
      officeHoursSlots: {
        some: {
          startTime: {
            gte: new Date(),
          },
        },
      },
    },
    include: {
      user: true,
      disciplines: {
        include: {
          discipline: true,
        },
      },
      officeHoursSlots: {
        where: {
          startTime: {
            gte: new Date(),
          },
        },
        include: {
          bookings: {
            where: { status: 'confirmed' },
          },
        },
        orderBy: {
          startTime: 'asc',
        },
        take: 10,
      },
    },
  });

  // Calculate remaining bookings this period
  let remainingBookings = 0;
  let periodEnd: Date | null = null;

  if (user.subscription && isElite) {
    const bookingsThisPeriod = await prisma.officeHoursBooking.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: user.subscription.currentPeriodStart,
          lte: user.subscription.currentPeriodEnd,
        },
        status: 'confirmed',
      },
    });
    const monthlyLimit = 2; // Elite gets 2 per month
    remainingBookings = Math.max(0, monthlyLimit - bookingsThisPeriod);
    periodEnd = user.subscription.currentPeriodEnd;
  }

  // Format coach data for client
  const coaches = coachesWithSlots.map((coach) => ({
    id: coach.id,
    displayName: coach.displayName,
    avatarUrl: coach.avatarUrl,
    tagline: coach.tagline,
    disciplines: coach.disciplines.map((d) => d.discipline.name),
    availableSlots: coach.officeHoursSlots
      .filter((slot) => slot.bookings.length < slot.maxAttendees)
      .map((slot) => ({
        id: slot.id,
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        spotsLeft: slot.maxAttendees - slot.bookings.length,
      })),
  }));

  // Format upcoming bookings
  const upcomingBookings = user.officeHoursBookings
    .filter((booking) => booking.slot.startTime > new Date())
    .map((booking) => ({
      id: booking.id,
      coachName: booking.slot.coach.displayName,
      coachAvatar: booking.slot.coach.avatarUrl,
      startTime: booking.slot.startTime.toISOString(),
      endTime: booking.slot.endTime.toISOString(),
      meetingUrl: booking.slot.meetingUrl,
      notes: booking.notes,
    }));

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Office Hours</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Book 1:1 sessions with our elite coaches for personalized guidance
          </p>
        </div>

        <OfficeHoursClient
          isElite={isElite}
          coaches={coaches}
          upcomingBookings={upcomingBookings}
          remainingBookings={remainingBookings}
          periodEnd={periodEnd?.toISOString() || null}
        />
      </div>
    </PageContainer>
  );
}
