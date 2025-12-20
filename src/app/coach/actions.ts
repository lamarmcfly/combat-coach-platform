"use server";

import { db } from "@/db/client";
import { getCurrentSession } from "@/lib/auth/session";
import { CoachStatus, Role } from "@prisma/client";

export async function submitCoachApplication(formData: FormData) {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const disciplines = formData.getAll("disciplines").map(String);
  const payload = {
    displayName: formData.get("displayName")?.toString() ?? "",
    shortBio: formData.get("shortBio")?.toString() ?? "",
    longBio: formData.get("longBio")?.toString() ?? "",
    gymName: formData.get("gymName")?.toString() ?? "",
    gymLocation: formData.get("gymLocation")?.toString() ?? "",
    location: formData.get("location")?.toString() ?? "",
    yearsCoaching: Number(formData.get("yearsCoaching") ?? 0),
    highlightVideoUrl: formData.get("highlightVideoUrl")?.toString() ?? "",
    socialLinks: {
      instagram: formData.get("instagram")?.toString() ?? undefined,
      youtube: formData.get("youtube")?.toString() ?? undefined,
    },
  };

  await db.coachProfile.upsert({
    where: { userId: session.user.id },
    update: {
      ...payload,
      status: CoachStatus.PENDING,
      disciplines: {
        deleteMany: {},
        create: disciplines.map((slug) => ({
          discipline: {
            connect: { slug },
          },
        })),
      },
    },
    create: {
      userId: session.user.id,
      ...payload,
      status: CoachStatus.PENDING,
      disciplines: {
        create: disciplines.map((slug) => ({
          discipline: {
            connect: { slug },
          },
        })),
      },
    },
  });

  await db.user.update({
    where: { id: session.user.id },
    data: { role: Role.COACH },
  });

  return { success: true };
}

export async function reviewCoachApplication(formData: FormData) {
  const session = await getCurrentSession();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  const profileId = formData.get("profileId")?.toString();
  const status = formData.get("status")?.toString() as CoachStatus | undefined;
  if (!profileId || !status) {
    throw new Error("Missing profileId or status");
  }
  await db.coachProfile.update({
    where: { id: profileId },
    data: { status },
  });
}
