import { Course, CoachSummary, LiveSession, DisciplineSlug } from "@/types/content";
import { featuredCourses, liveSessions as sampleLiveSessions, coaches as sampleCoaches, disciplines as sampleDisciplines } from "@/data/sampleContent";
import { db } from "@/db/client";
import { Prisma } from "@prisma/client";

type CourseWithRelations = Prisma.CourseGetPayload<{
  include: {
    coach: {
      include: {
        user: true;
        disciplines: { include: { discipline: true } };
      };
    };
    discipline: true;
    lessons: true;
  };
}>;

type CoachWithUser = Prisma.CoachProfileGetPayload<{
  include: { user: true; disciplines: { include: { discipline: true } } };
}>;

type LiveSessionWithRelations = Prisma.LiveSessionGetPayload<{
  include: {
    coach: {
      include: {
        user: true;
        disciplines: { include: { discipline: true } };
      };
    };
    discipline: true;
  };
}>;

const COACH_PLACEHOLDER_AVATAR =
  "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=400&q=60";

const COURSE_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1509223197845-458d87318791?auto=format&fit=crop&w=1200&q=80";

export async function getPublishedCourses(): Promise<Course[]> {
  try {
    const records = await db.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      include: {
        coach: { include: { user: true, disciplines: { include: { discipline: true } } } },
        discipline: true,
        lessons: { orderBy: { orderIndex: "asc" } },
      },
    });

    if (!records.length) {
      return featuredCourses;
    }

    return records.map(mapCourseRecord);
  } catch (error) {
    console.warn("Failed to load courses from DB, falling back to sample data", error);
    return featuredCourses;
  }
}

export async function getFeaturedCoaches(limit = 4): Promise<CoachSummary[]> {
  try {
    const coachProfiles = await db.coachProfile.findMany({
      where: { status: "APPROVED" },
      orderBy: { updatedAt: "desc" },
      include: { user: true, disciplines: { include: { discipline: true } } },
      take: limit,
    });
    if (!coachProfiles.length) return sampleCoaches;
    return coachProfiles.map(mapCoachProfile);
  } catch (error) {
    console.warn("Failed to load coaches, using sample fallback", error);
    return sampleCoaches.slice(0, limit);
  }
}

export async function getCoachByIdServer(id: string): Promise<CoachSummary | undefined> {
  try {
    const coachProfile = await db.coachProfile.findUnique({
      where: { id },
      include: { user: true, disciplines: { include: { discipline: true } } },
    });
    if (!coachProfile) return sampleCoaches.find((coach) => coach.id === id);
    return mapCoachProfile(coachProfile);
  } catch {
    return sampleCoaches.find((coach) => coach.id === id);
  }
}

export async function getLiveSessions(): Promise<LiveSession[]> {
  try {
    const sessions = await db.liveSession.findMany({
      where: { status: "SCHEDULED" },
      orderBy: { startTime: "asc" },
      include: {
        coach: { include: { user: true, disciplines: { include: { discipline: true } } } },
        discipline: true,
      },
    });
    if (!sessions.length) return sampleLiveSessions;
    return sessions.map(mapLiveSessionRecord);
  } catch (error) {
    console.warn("Failed to load live sessions, using sample fallback", error);
    return sampleLiveSessions;
  }
}

export async function getCourseBySlugServer(slug: string): Promise<Course | undefined> {
  try {
    const course = await db.course.findUnique({
      where: { slug },
      include: {
        coach: { include: { user: true, disciplines: { include: { discipline: true } } } },
        discipline: true,
        lessons: { orderBy: { orderIndex: "asc" } },
      },
    });
    if (!course) return featuredCourses.find((item) => item.slug === slug);
    return mapCourseRecord(course);
  } catch (error) {
    console.warn("Failed to load course by slug", error);
    return featuredCourses.find((item) => item.slug === slug);
  }
}

export async function getLiveSessionByIdServer(id: string): Promise<LiveSession | undefined> {
  try {
    const session = await db.liveSession.findUnique({
      where: { id },
      include: {
        coach: { include: { user: true, disciplines: { include: { discipline: true } } } },
        discipline: true,
      },
    });
    if (!session) return sampleLiveSessions.find((item) => item.id === id);
    return mapLiveSessionRecord(session);
  } catch (error) {
    console.warn("Failed to load live session", error);
    return sampleLiveSessions.find((item) => item.id === id);
  }
}

export async function getDisciplineOptions() {
  try {
    const data = await db.discipline.findMany({ orderBy: { name: "asc" } });
    if (!data.length) return sampleDisciplines;
    return data;
  } catch (error) {
    console.warn("Failed to load disciplines, using sample fallback", error);
    return sampleDisciplines;
  }
}

function mapCourseRecord(record: CourseWithRelations): Course {
  const lessonsByModule = new Map<string, Course["modules"][number]["lessons"]>();

  record.lessons.forEach((lesson, index) => {
    const label = lesson.moduleName ?? `Module ${lesson.orderIndex ?? index + 1}`;
    if (!lessonsByModule.has(label)) {
      lessonsByModule.set(label, []);
    }
    const bucket = lessonsByModule.get(label)!;
    bucket.push({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description ?? "",
      orderIndex: lesson.orderIndex ?? index + 1,
      durationMinutes: lesson.durationSeconds ? Math.round(lesson.durationSeconds / 60) : 0,
      videoUrl: lesson.videoUrl,
      isPreview: lesson.isPreview ?? false,
    });
  });

  const statsLessons = record.lessons.length;
  const statsDurationMinutes =
    record.lessons.reduce(
      (total, lesson) => total + (lesson.durationSeconds ? lesson.durationSeconds / 60 : 0),
      0,
    ) || 0;

  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    shortDescription: record.shortDescription ?? "",
    longDescription: record.longDescription ?? record.shortDescription ?? "",
    discipline: (record.discipline?.slug as DisciplineSlug) ?? "mma",
    level: record.level ?? "ALL_LEVELS",
    priceCents: record.priceCents ?? 0,
    status: record.status === "PUBLISHED" ? "published" : "draft",
    trailerVideoUrl: record.trailerVideoUrl ?? record.coverImageUrl ?? "",
    coverImageUrl: record.coverImageUrl ?? COURSE_PLACEHOLDER_IMAGE,
    modules: Array.from(lessonsByModule.entries()).map(([label, lessons]) => ({ label, lessons })),
    stats: {
      durationHours: Math.round((statsDurationMinutes / 60) * 10) / 10,
      lessons: statsLessons,
      modules: lessonsByModule.size,
    },
    coach: mapCoachProfile(record.coach),
  };
}

function mapCoachProfile(coach: CoachWithUser): CoachSummary {
  const social = (coach.socialLinks ?? {}) as Record<string, unknown>;
  const fightersCoached =
    typeof social.fightersCoached === "number" ? (social.fightersCoached as number) : 0;
  const titles = typeof social.titles === "number" ? (social.titles as number) : 0;

  return {
    id: coach.id,
    name: coach.displayName ?? (`${coach.user.firstName ?? ""} ${coach.user.lastName ?? ""}`.trim() || coach.user.email),
    gym: coach.gymName ?? "Independent",
    location: coach.location ?? coach.gymLocation ?? "Remote",
    bio: coach.shortBio ?? "Combat coach",
    introVideoUrl: coach.highlightVideoUrl ?? coach.avatarUrl ?? "",
    avatarUrl: coach.avatarUrl ?? COACH_PLACEHOLDER_AVATAR,
    yearsCoaching: coach.yearsCoaching ?? 0,
    fightersCoached,
    titles,
    disciplines: coach.disciplines.map((item) => item.discipline.slug as DisciplineSlug),
  };
}

function mapLiveSessionRecord(session: LiveSessionWithRelations): LiveSession {
  return {
    id: session.id,
    title: session.title,
    description: session.description ?? "",
    discipline: session.discipline?.slug as DisciplineSlug,
    level: session.level ?? "ALL_LEVELS",
    coach: mapCoachProfile(session.coach),
    startTime: session.startTime.toISOString(),
    durationMinutes: session.durationMinutes ?? 60,
    capacity: session.capacity ?? 20,
    priceCents: session.priceCents ?? 0,
    meetingUrl: session.meetingUrl ?? undefined,
    promoVideoUrl: session.promoVideoUrl ?? undefined,
  };
}
