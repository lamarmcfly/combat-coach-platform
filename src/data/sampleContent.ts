import { Course, CoursePurchase, Discipline, LiveSession, LiveSessionBooking, DisciplineSlug } from "@/types/content";

export const disciplines: Discipline[] = [
  { id: 1, name: "Boxing", slug: "boxing" },
  { id: 2, name: "Muay Thai", slug: "muay-thai" },
  { id: 3, name: "Kickboxing", slug: "kickboxing" },
  { id: 4, name: "MMA", slug: "mma" },
  { id: 5, name: "Wrestling", slug: "wrestling" },
  { id: 6, name: "Bare-knuckle", slug: "bare-knuckle" },
  { id: 7, name: "Slap", slug: "slap" },
];

export const sampleCoach = {
  id: "coach-lena-stone",
  name: "Lena \"Stone\" Alvarez",
  gym: "Southside Combat Collective",
  location: "Brooklyn, NY",
  bio: "Former WBC Muay Thai champ known for ruthless clinch systems and modern fight IQ.",
  introVideoUrl: "https://storage.googleapis.com/coach-demo/lena-stone-intro.mp4",
  avatarUrl: "/images/coach-portrait.jpg",
  yearsCoaching: 12,
  fightersCoached: 38,
  titles: 6,
  disciplines: ["muay-thai", "mma"] as DisciplineSlug[],
};

export const featuredCourses: Course[] = [
  {
    id: "course-muay-fundamentals",
    slug: "muay-fundamentals",
    title: "Elbow & Clinch Blueprint",
    shortDescription: "12-week Muay Thai system for dominating the inside range with purpose.",
    longDescription:
      "Coach Lena breaks down her signature elbow chains, pressure entries, and clinch control frameworks used with top fighters worldwide.",
    discipline: "muay-thai",
    level: "INTERMEDIATE",
    priceCents: 14900,
    status: "published",
    trailerVideoUrl: "https://storage.googleapis.com/coach-demo/lena-blueprint-trailer.mp4",
    coverImageUrl: "/images/athlete-boxing.jpg",
    modules: [
      {
        label: "Week 1 · Foundations",
        lessons: [
          {
            id: "lesson-1",
            title: "Stance & Guard Under Fire",
            description: "Driving steps, shin blocks, and shelling up without freezing.",
            orderIndex: 1,
            durationMinutes: 12,
            videoUrl: "https://storage.googleapis.com/coach-demo/lesson-1.mp4",
            isPreview: true,
          },
        ],
      },
      {
        label: "Week 2 · Inside Entries",
        lessons: [
          {
            id: "lesson-5",
            title: "Trigger Steps to Elbow Range",
            description: "Build repeatable patterns to cover distance against tall fighters.",
            orderIndex: 5,
            durationMinutes: 16,
            videoUrl: "https://storage.googleapis.com/coach-demo/lesson-5.mp4",
          },
        ],
      },
    ],
    stats: {
      durationHours: 7.5,
      lessons: 26,
      modules: 8,
    },
    coach: sampleCoach,
  },
];

export const liveSessions: LiveSession[] = [
  {
    id: "session-1",
    title: "Southpaw Pressure Lab",
    description: "Live sparring labs to plug southpaw counters into your fight style.",
    discipline: "boxing",
    level: "ADVANCED",
    coach: sampleCoach,
    startTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 75,
    capacity: 25,
    priceCents: 4500,
    meetingUrl: "https://zoom.us/s/southpaw-pressure",
    promoVideoUrl: "https://storage.googleapis.com/coach-demo/session-1.mp4",
  },
  {
    id: "session-2",
    title: "Clinchett Crash Course",
    description: "Learn how to off-balance and knee inside short rounds.",
    discipline: "muay-thai",
    level: "ALL_LEVELS",
    coach: sampleCoach,
    startTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 60,
    capacity: 40,
    priceCents: 3500,
  },
];

export const coaches = [sampleCoach];

export const samplePurchases: CoursePurchase[] = [
  { courseId: "course-muay-fundamentals", userId: "athlete-123", status: "ACTIVE", progressPercent: 42 },
];

export const sampleBookings: LiveSessionBooking[] = [
  { liveSessionId: "session-1", userId: "athlete-123", status: "CONFIRMED" },
];

export function getCourseBySlug(slug: string): Course | undefined {
  return featuredCourses.find((course) => course.slug === slug);
}

export function getCoachById(id: string) {
  return coaches.find((coach) => coach.id === id);
}
