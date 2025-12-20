export type Role = "ATHLETE" | "COACH" | "ADMIN";

export type DisciplineSlug =
  | "boxing"
  | "muay-thai"
  | "kickboxing"
  | "mma"
  | "wrestling"
  | "bare-knuckle"
  | "slap";

export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";

export type Discipline = {
  id: number;
  name: string;
  slug: DisciplineSlug;
};

export type CoachSummary = {
  id: string;
  name: string;
  gym: string;
  location: string;
  bio: string;
  introVideoUrl: string;
  avatarUrl: string;
  yearsCoaching: number;
  fightersCoached: number;
  titles: number;
  disciplines: DisciplineSlug[];
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  discipline: DisciplineSlug;
  level: CourseLevel;
  priceCents: number;
  status: "draft" | "published";
  trailerVideoUrl: string;
  coverImageUrl: string;
  modules: {
    label: string;
    lessons: Lesson[];
  }[];
  stats: {
    durationHours: number;
    lessons: number;
    modules: number;
  };
  coach: CoachSummary;
};

export type Lesson = {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  durationMinutes: number;
  videoUrl: string;
  isPreview?: boolean;
};

export type LiveSession = {
  id: string;
  title: string;
  description: string;
  discipline: DisciplineSlug;
  level: CourseLevel;
  coach: CoachSummary;
  startTime: string;
  durationMinutes: number;
  capacity: number;
  priceCents: number;
  meetingUrl?: string;
  promoVideoUrl?: string;
};

export type CoursePurchase = {
  courseId: string;
  userId: string;
  status: "ACTIVE" | "PENDING";
  progressPercent?: number;
};

export type LiveSessionBooking = {
  liveSessionId: string;
  userId: string;
  status: "CONFIRMED" | "PENDING";
};
