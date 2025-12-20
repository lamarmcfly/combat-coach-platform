"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { getCurrentSession } from "@/lib/auth/session";
import { CoachStatus, CourseLevel, CourseStatus, LiveSessionStatus } from "@prisma/client";

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function requireApprovedCoach() {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  const coachProfile = await db.coachProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!coachProfile || coachProfile.status !== CoachStatus.APPROVED) {
    throw new Error("Coach profile not approved");
  }
  return coachProfile;
}

export async function createCourseDraft(formData: FormData) {
  const coachProfile = await requireApprovedCoach();
  const title = formData.get("title")?.toString() ?? "";
  if (!title) throw new Error("Title required");
  const disciplineSlug = formData.get("discipline")?.toString();
  if (!disciplineSlug) throw new Error("Discipline required");
  const shortDescription = formData.get("shortDescription")?.toString() ?? "";
  const longDescription = formData.get("longDescription")?.toString() ?? shortDescription;
  const level = (formData.get("level")?.toString() as CourseLevel) ?? "ALL_LEVELS";
  const priceCents = Number(formData.get("priceCents") ?? 0);
  const coverImageUrl = formData.get("coverImageUrl")?.toString() ?? "";
  const trailerVideoUrl = formData.get("trailerVideoUrl")?.toString() ?? "";

  let slugBase = slugify(title);
  if (!slugBase) {
    slugBase = `course-${Date.now()}`;
  }
  let slug = slugBase;
  let suffix = 1;
  while (await db.course.findUnique({ where: { slug } })) {
    slug = `${slugBase}-${suffix++}`;
  }

  const discipline = await db.discipline.findUnique({
    where: { slug: disciplineSlug },
  });

  if (!discipline) {
    throw new Error(`Discipline not found: ${disciplineSlug}`);
  }

  await db.course.create({
    data: {
      slug,
      title,
      shortDescription,
      longDescription,
      level,
      priceCents,
      coverImageUrl,
      trailerVideoUrl,
      coachId: coachProfile.id,
      status: CourseStatus.DRAFT,
      disciplineId: discipline.id,
    },
  });

  revalidatePath("/coach/dashboard");
}

export async function createLiveSessionSlot(formData: FormData) {
  const coachProfile = await requireApprovedCoach();
  const title = formData.get("title")?.toString() ?? "";
  const disciplineSlug = formData.get("discipline")?.toString();
  if (!title || !disciplineSlug) throw new Error("Missing required fields");

  const description = formData.get("description")?.toString() ?? "";
  const startTime = new Date(formData.get("startTime")?.toString() ?? "");
  const durationMinutes = Number(formData.get("durationMinutes") ?? 60);
  const capacity = Number(formData.get("capacity") ?? 20);
  const priceCents = Number(formData.get("priceCents") ?? 0);
  const promoVideoUrl = formData.get("promoVideoUrl")?.toString() ?? "";

  const discipline = await db.discipline.findUnique({
    where: { slug: disciplineSlug },
  });

  if (!discipline) {
    throw new Error(`Discipline not found: ${disciplineSlug}`);
  }

  await db.liveSession.create({
    data: {
      title,
      description,
      startTime,
      durationMinutes,
      capacity,
      priceCents,
      promoVideoUrl,
      status: LiveSessionStatus.SCHEDULED,
      coachId: coachProfile.id,
      disciplineId: discipline.id,
    },
  });

  revalidatePath("/coach/dashboard");
}
