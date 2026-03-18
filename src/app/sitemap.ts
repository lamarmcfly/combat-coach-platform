import type { MetadataRoute } from "next";
import { prisma } from "@/db/client";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://combatcoach.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/courses`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/coaches`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/live`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/community`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/leaderboard`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
  ];

  // Dynamic course pages
  let coursePages: MetadataRoute.Sitemap = [];
  try {
    const courses = await prisma.course.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    });
    coursePages = courses.map((course) => ({
      url: `${BASE_URL}/courses/${course.slug}`,
      lastModified: course.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // Database might not be available during build
  }

  // Dynamic coach pages
  let coachPages: MetadataRoute.Sitemap = [];
  try {
    const coaches = await prisma.coachProfile.findMany({
      where: { status: "APPROVED" },
      select: { userId: true, updatedAt: true },
    });
    coachPages = coaches.map((coach) => ({
      url: `${BASE_URL}/coaches/${coach.userId}`,
      lastModified: coach.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    // Database might not be available during build
  }

  return [...staticPages, ...coursePages, ...coachPages];
}
