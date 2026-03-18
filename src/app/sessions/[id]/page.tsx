import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { Tag } from "@/components/Tag";
import { SessionSidebar } from "@/components/session/SessionSidebar";
import { getCurrentSession } from "@/lib/auth/session";
import { userBookedSession } from "@/lib/auth/access";
import { getLiveSessionByIdServer } from "@/data/server/content";

type SessionDetailPageProps = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function SessionDetailPage({ params }: SessionDetailPageProps) {
  const { id } = await Promise.resolve(params);
  const sessionRecord = await getLiveSessionByIdServer(id);
  if (!sessionRecord) {
    notFound();
  }
  const sessionAuth = await getCurrentSession();
  const booked = await userBookedSession(sessionAuth?.user?.id, sessionRecord.id);

  return (
    <PageContainer>
      <div className="space-y-6">
        {sessionRecord.promoVideoUrl ? (
          <VideoPlayer videoRef={sessionRecord.promoVideoUrl} controls className="w-full rounded-2xl border border-[#2b2c30]" />
        ) : null}
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="rounded-2xl border border-[#2a2b30] bg-[#121216] p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Tag>{sessionRecord.discipline.replace("-", " ")}</Tag>
              <Tag tone="muted">{sessionRecord.level.replace("_", " ")}</Tag>
              <p className="text-xs uppercase tracking-[0.2em] text-copy-muted">{sessionRecord.coach.name}</p>
            </div>
            <h1 className="font-display text-4xl uppercase">{sessionRecord.title}</h1>
            <p className="text-sm text-copy-muted">{sessionRecord.description}</p>
            <div className="grid gap-4 rounded-xl border border-[#1f1f24] p-4 text-sm text-copy-muted md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em]">Date</p>
                <p>{new Date(sessionRecord.startTime).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em]">Coach</p>
                <p>{sessionRecord.coach.name}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em]">Capacity</p>
                <p>{sessionRecord.capacity} athletes</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em]">Duration</p>
                <p>{sessionRecord.durationMinutes} minutes</p>
              </div>
            </div>
          </section>
          <SessionSidebar
            sessionId={sessionRecord.id}
            priceCents={sessionRecord.priceCents}
            capacity={sessionRecord.capacity}
            startTime={sessionRecord.startTime}
            durationMinutes={sessionRecord.durationMinutes}
            meetingUrl={sessionRecord.meetingUrl}
            booked={booked}
          />
        </div>
      </div>
    </PageContainer>
  );
}
