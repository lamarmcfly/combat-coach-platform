import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { CoachStatus, CourseLevel } from "@prisma/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/db/client";
import { featuredCourses, liveSessions as sampleLiveSessions } from "@/data/sampleContent";
import { getDisciplineOptions } from "@/data/server/content";
import { createCourseDraft, createLiveSessionSlot } from "@/app/coach/dashboard/actions";

const levelOptions: CourseLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"];

export default async function CoachDashboardPage() {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    redirect("/auth/sign-in?callbackUrl=/coach/dashboard");
  }

  if (session.user.role !== "COACH" && session.user.role !== "ADMIN") {
    redirect("/coach/apply");
  }

  const disciplines = await getDisciplineOptions();

  type DashboardCourse = {
    id: string;
    title: string;
    shortDescription: string;
    level: string;
    status: string;
    priceCents: number;
    updatedAt: Date;
    disciplineName: string;
  };

  type DashboardSession = {
    id: string;
    title: string;
    description: string;
    startTime: Date;
    durationMinutes: number;
    capacity: number;
    priceCents: number;
    disciplineName: string;
  };

  let coachProfile = null;
  let courseSummaries: DashboardCourse[] = [];
  let sessionSummaries: DashboardSession[] = [];

  try {
    coachProfile = await db.coachProfile.findUnique({
      where: { userId: session.user.id },
      include: { user: true },
    });
    if (coachProfile) {
      const courses = await db.course.findMany({
        where: { coachId: coachProfile.id },
        include: { discipline: true },
        orderBy: { updatedAt: "desc" },
      });
      courseSummaries = courses.map((course) => ({
        id: course.id,
        title: course.title,
        shortDescription: course.shortDescription ?? "",
        level: course.level ?? "ALL_LEVELS",
        status: course.status ?? "DRAFT",
        priceCents: course.priceCents ?? 0,
        updatedAt: course.updatedAt,
        disciplineName: course.discipline?.name ?? "Discipline",
      }));

      const liveSessions = await db.liveSession.findMany({
        where: { coachId: coachProfile.id },
        include: { discipline: true },
        orderBy: { startTime: "desc" },
      });
      sessionSummaries = liveSessions.map((session) => ({
        id: session.id,
        title: session.title,
        description: session.description ?? "",
        startTime: session.startTime,
        durationMinutes: session.durationMinutes ?? 0,
        capacity: session.capacity ?? 0,
        priceCents: session.priceCents ?? 0,
        disciplineName: session.discipline?.name ?? "Discipline",
      }));
    }
  } catch (error) {
    console.warn("Coach dashboard fallback", error);
  }

  if (!coachProfile) {
    return (
      <PageContainer>
        <div className="rounded-2xl border border-[#2a2b30] bg-[#121216] p-8 text-center">
          <h1 className="font-display text-4xl uppercase text-copy">Coach dashboard</h1>
          <p className="mt-2 text-sm text-copy-muted">
            We couldn&apos;t find a coach profile for your account yet. Apply to become a verified coach and the dashboard will
            unlock once approved.
          </p>
          <div className="mt-4 flex justify-center">
            <Link href="/coach/apply" className="text-accent underline">
              Apply to coach
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  const awaitingApproval = coachProfile.status !== CoachStatus.APPROVED;

  if (!courseSummaries.length) {
    courseSummaries = featuredCourses.map((course) => ({
      id: course.id,
      title: course.title,
      shortDescription: course.shortDescription,
      level: course.level,
      status: course.status,
      priceCents: course.priceCents,
      updatedAt: new Date(),
      disciplineName: course.discipline,
    }));
  }

  if (!sessionSummaries.length) {
    sessionSummaries = sampleLiveSessions.map((session) => ({
      id: session.id,
      title: session.title,
      description: session.description,
      startTime: new Date(session.startTime),
      durationMinutes: session.durationMinutes,
      capacity: session.capacity,
      priceCents: session.priceCents,
      disciplineName: session.discipline,
    }));
  }

  return (
    <PageContainer>
      <div className="space-y-10">
        <section className="rounded-2xl border border-[#2a2b30] bg-[#121216] p-6">
          <p className="text-xs uppercase tracking-[0.4em] text-copy-muted">Coach</p>
          <h1 className="font-display text-4xl uppercase text-copy">{coachProfile.displayName ?? coachProfile.user.email}</h1>
          <p className="text-sm text-copy-muted">{coachProfile.shortBio ?? "Keep building your fighters."}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.2em] text-copy-muted">
            <span>
              Status:{" "}
              <strong className={awaitingApproval ? "text-[#f5a524]" : "text-accent"}>
                {coachProfile.status.toLowerCase()}
              </strong>
            </span>
            <span>{coachProfile.gymName ?? "Independent"}</span>
          </div>
          {awaitingApproval ? (
            <p className="mt-4 rounded-md border border-dashed border-[#2a2b30] p-3 text-sm text-copy-muted">
              Your application is under review. You can prepare draft courses and sessions, but they won&apos;t be visible to athletes
              until approved.
            </p>
          ) : null}
        </section>

        {/* Quick Navigation & Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/coach/clients" className="rounded-xl border border-[#2a2b30] bg-[#151518] p-4 hover:border-accent/50 transition-colors group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-copy-muted">Clients</p>
            </div>
            <p className="font-display text-2xl text-copy group-hover:text-accent transition-colors">View Roster</p>
            <p className="text-xs text-copy-muted mt-1">Manage your students →</p>
          </Link>
          <Link href="/coach/earnings" className="rounded-xl border border-[#2a2b30] bg-[#151518] p-4 hover:border-accent/50 transition-colors group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-green-900/50 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-copy-muted">Earnings</p>
            </div>
            <p className="font-display text-2xl text-copy group-hover:text-accent transition-colors">Track Revenue</p>
            <p className="text-xs text-copy-muted mt-1">View payouts & stats →</p>
          </Link>
          <Link href="/coach/coaching" className="rounded-xl border border-[#2a2b30] bg-[#151518] p-4 hover:border-accent/50 transition-colors group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-purple-900/50 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-copy-muted">Coaching</p>
            </div>
            <p className="font-display text-2xl text-copy group-hover:text-accent transition-colors">Requests</p>
            <p className="text-xs text-copy-muted mt-1">Review submissions →</p>
          </Link>
          <div className="rounded-xl border border-[#2a2b30] bg-[#151518] p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-orange-900/50 flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-copy-muted">Content</p>
            </div>
            <p className="font-display text-2xl text-copy">{courseSummaries.length + sessionSummaries.length}</p>
            <p className="text-xs text-copy-muted mt-1">
              {courseSummaries.filter(c => c.status === 'published').length} courses, {sessionSummaries.filter(s => new Date(s.startTime) > new Date()).length} upcoming
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#2a2b30] bg-[#121216] p-6">
            <SectionHeader eyebrow="Programs" title="Create a course" />
            <form action={createCourseDraft} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  Title
                  <input
                    name="title"
                    required
                    className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  Discipline
                  <select
                    name="discipline"
                    required
                    className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
                  >
                    <option value="">Select</option>
                    {disciplines.map((discipline) => (
                      <option key={discipline.id} value={discipline.slug}>
                        {discipline.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  Level
                  <select
                    name="level"
                    className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
                  >
                    {levelOptions.map((level) => (
                      <option key={level} value={level}>
                        {level.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  Price (USD)
                  <input
                    name="priceCents"
                    type="number"
                    min={0}
                    step={100}
                    placeholder="14900"
                    className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm">
                Short description
                <textarea
                  name="shortDescription"
                  rows={2}
                  className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                Long description
                <textarea
                  name="longDescription"
                  rows={3}
                  className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  Cover image URL
                  <input
                    name="coverImageUrl"
                    type="url"
                    placeholder="https://..."
                    className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  Trailer video URL
                  <input
                    name="trailerVideoUrl"
                    type="url"
                    placeholder="https://..."
                    className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
                  />
                </label>
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-accent px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black hover:bg-accent-bright"
              >
                Save draft
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-[#2a2b30] bg-[#121216] p-6">
            <SectionHeader eyebrow="Live sessions" title="Schedule a session" />
            <form action={createLiveSessionSlot} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  Title
                  <input
                    name="title"
                    required
                    className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  Discipline
                  <select
                    name="discipline"
                    required
                    className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
                  >
                    <option value="">Select</option>
                    {disciplines.map((discipline) => (
                      <option key={discipline.id} value={discipline.slug}>
                        {discipline.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm">
                Description
                <textarea
                  name="description"
                  rows={2}
                  className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  Start time
                  <input
                    type="datetime-local"
                    name="startTime"
                    required
                    className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  Duration (minutes)
                  <input
                    type="number"
                    name="durationMinutes"
                    min={15}
                    step={15}
                    defaultValue={60}
                    className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  Capacity
                  <input
                    type="number"
                    name="capacity"
                    min={1}
                    defaultValue={20}
                    className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  Price (USD)
                  <input
                    type="number"
                    name="priceCents"
                    min={0}
                    step={100}
                    defaultValue={4500}
                    className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm">
                Promo video URL
                <input
                  name="promoVideoUrl"
                  type="url"
                  placeholder="https://videos.corner/session"
                  className="rounded-md border border-[#2a2b30] bg-[#0f0f12] px-3 py-2 text-copy focus:border-accent focus:outline-none"
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-md bg-accent px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black hover:bg-accent-bright"
              >
                Publish session
              </button>
            </form>
          </div>
        </section>

        <section>
          <SectionHeader eyebrow="Programs" title="Your courses" />
          <div className="space-y-3">
            {courseSummaries.length ? (
              courseSummaries.map((course) => (
                <article key={course.id} className="rounded-xl border border-[#2a2b30] bg-[#151518] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-display text-2xl uppercase text-copy">{course.title}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-copy-muted">
                        {course.level.replace("_", " ")} · {course.disciplineName}
                      </p>
                    </div>
                    <span className="rounded-full border border-[#2a2b30] px-3 py-1 text-xs uppercase tracking-[0.2em] text-copy-muted">
                      {course.status.toLowerCase()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-copy-muted">{course.shortDescription}</p>
                  <div className="mt-3 text-xs text-copy-muted">
                    ${(course.priceCents / 100).toFixed(0)} · Updated {format(course.updatedAt, "MMM d, yyyy")}
                  </div>
                </article>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-[#2a2b30] p-6 text-sm text-copy-muted">
                No courses yet. Use the form above to create your first draft.
              </p>
            )}
          </div>
        </section>

        <section>
          <SectionHeader eyebrow="Live" title="Scheduled sessions" />
          <div className="space-y-3">
            {sessionSummaries.length ? (
              sessionSummaries.map((session) => (
                <article key={session.id} className="rounded-xl border border-[#2a2b30] bg-[#151518] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-display text-2xl uppercase text-copy">{session.title}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-copy-muted">
                        {session.disciplineName} · {session.durationMinutes} min
                      </p>
                    </div>
                    <span className="text-sm text-copy-muted">
                      {format(new Date(session.startTime), "MMM d • h:mm a")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-copy-muted">{session.description}</p>
                  <div className="mt-3 text-xs text-copy-muted">
                    ${(session.priceCents / 100).toFixed(0)} · {session.capacity} spots
                  </div>
                </article>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-[#2a2b30] p-6 text-sm text-copy-muted">
                No sessions scheduled. Use the form above to open a new group slot.
              </p>
            )}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
