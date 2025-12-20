import { getCurrentSession } from "@/lib/auth/session";
import { getLiveSessions } from "@/data/server/content";
import { getBookedSessionIds } from "@/data/server/userContent";
import { PageContainer } from "@/components/layout/PageContainer";
import { LiveSchedule } from "@/components/live/LiveSchedule";

export default async function LiveSessionsPage() {
  const sessions = await getLiveSessions();
  const session = await getCurrentSession();
  const userId = session?.user?.id;
  const bookedSessionIds = await getBookedSessionIds(userId);

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-copy-muted">Corner Marketplace</p>
          <h1 className="font-display text-5xl uppercase text-copy">Live Sessions</h1>
          <p className="text-sm text-copy-muted">Group rounds, sparring labs, and live breakdowns.</p>
        </div>
        <LiveSchedule sessions={sessions} bookedSessionIds={bookedSessionIds} />
      </div>
    </PageContainer>
  );
}
