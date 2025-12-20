import Link from "next/link";
import { getCurrentSession } from "@/lib/auth/session";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { SessionCard } from "@/components/cards/SessionCard";
import { PrimaryButton } from "@/components/buttons/PrimaryButton";
import { getLiveSessions } from "@/data/server/content";
import { getBookedSessionIds } from "@/data/server/userContent";

export default async function MySessionsPage() {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return (
      <PageContainer>
        <div className="rounded-2xl border border-[#2a2b30] bg-[#121216] p-8 text-center">
          <h1 className="font-display text-4xl uppercase text-copy">My Sessions</h1>
          <p className="mt-2 text-sm text-copy-muted">Sign in to see your live bookings.</p>
          <div className="mt-4 flex justify-center">
            <PrimaryButton label="Sign in" href="/auth/sign-in" />
          </div>
        </div>
      </PageContainer>
    );
  }

  const [sessions, bookedIds] = await Promise.all([getLiveSessions(), getBookedSessionIds(session.user.id)]);
  const upcomingSessions = sessions.filter((sessionItem) => bookedIds.includes(sessionItem.id));

  return (
    <PageContainer>
      <SectionHeader eyebrow="Dashboard" title="My sessions" />
      {upcomingSessions.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {upcomingSessions.map((sessionItem) => (
            <SessionCard key={sessionItem.id} session={sessionItem} owned />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-[#2a2b30] p-6 text-sm text-copy-muted">
          No live bookings yet. Check the{" "}
          <Link className="text-accent underline" href="/live">
            live session schedule
          </Link>{" "}
          to reserve a spot.
        </p>
      )}
    </PageContainer>
  );
}
