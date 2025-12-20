import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { CourseCard } from "@/components/cards/CourseCard";
import { SessionCard } from "@/components/cards/SessionCard";
import { PrimaryButton } from "@/components/buttons/PrimaryButton";
import { getCoachByIdServer, getLiveSessions, getPublishedCourses } from "@/data/server/content";

export default async function CoachProfilePage({ params }: { params: { id: string } }) {
  const coach = await getCoachByIdServer(params.id);
  if (!coach) {
    notFound();
  }

  const [courses, sessions] = await Promise.all([getPublishedCourses(), getLiveSessions()]);
  const programs = courses.filter((course) => course.coach.id === coach.id);
  const coachSessions = sessions.filter((session) => session.coach.id === coach.id);

  return (
    <PageContainer>
      <div className="space-y-10">
        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <VideoPlayer videoRef={coach.introVideoUrl} controls className="w-full rounded-2xl border border-[#2b2c30]" />
          <div className="rounded-2xl border border-[#2a2b30] bg-[#121216] p-6 space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-copy-muted">Coach</p>
            <h1 className="font-display text-4xl uppercase">{coach.name}</h1>
            <p className="text-sm text-copy-muted">{coach.bio}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-copy-muted">
              {coach.gym} · {coach.location}
            </p>
            <div className="flex gap-6 text-center text-xs uppercase tracking-[0.2em] text-copy-muted">
              <div>
                <p className="text-2xl text-copy">{coach.yearsCoaching}</p>
                Years
              </div>
              <div>
                <p className="text-2xl text-copy">{coach.fightersCoached}</p>
                Fighters
              </div>
              <div>
                <p className="text-2xl text-copy">{coach.titles}</p>
                Titles
              </div>
            </div>
            <PrimaryButton label={`Start training with ${coach.name.split(" ")[0]}`} href="/courses" className="w-full" />
          </div>
        </section>

        <section>
          <SectionHeader eyebrow="Programs" title="Courses by this coach" />
          <div className="section-grid">
            {programs.length ? (
              programs.map((course) => <CourseCard key={course.id} course={course} />)
            ) : (
              <EmptyState message="Courses coming soon." />
            )}
          </div>
        </section>

        <section>
          <SectionHeader eyebrow="Live Sessions" title="Train in real time" />
          <div className="grid gap-4 md:grid-cols-2">
            {coachSessions.length ? (
              coachSessions.map((session) => <SessionCard key={session.id} session={session} />)
            ) : (
              <EmptyState message="No scheduled sessions yet." />
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[#2a2b30] bg-[#121216] p-6">
          <SectionHeader eyebrow="About" title="Training Philosophy" />
          <p className="text-sm leading-relaxed text-copy-muted">
            Coach {coach.name.split(" ")[0]} blends old-school grit with modern sport science. Expect long rounds, heavy clinch emphasis,
            and accountability around conditioning. Athletes get film study, pad homework, and sparring diagnostics weekly.
          </p>
        </section>
      </div>
    </PageContainer>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="rounded-xl border border-dashed border-[#2a2b30] p-6 text-sm text-copy-muted">{message}</p>;
}
