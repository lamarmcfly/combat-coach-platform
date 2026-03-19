/**
 * Fix image URLs in existing database records.
 * Replaces old Unsplash/placeholder URLs with local /images/ paths.
 *
 * Usage: npx tsx scripts/fix-image-urls.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const REPLACEMENTS = {
  avatar: "/images/coach-portrait.jpg",
  courseCover: "/images/coaching-mitts.jpg",
  courseCoverAlt: "/images/hero-fight.jpg",
};

async function main() {
  // Fix coach profile avatars
  const coachesFixed = await prisma.coachProfile.updateMany({
    where: {
      OR: [
        { avatarUrl: { contains: "unsplash.com" } },
        { avatarUrl: { contains: "lena-stone" } },
        { avatarUrl: { contains: "placeholder" } },
      ],
    },
    data: { avatarUrl: REPLACEMENTS.avatar },
  });
  console.log(`Fixed ${coachesFixed.count} coach profile avatar(s)`);

  // Fix course cover images
  const coursesFixed = await prisma.course.updateMany({
    where: {
      OR: [
        { coverImageUrl: { contains: "unsplash.com" } },
        { coverImageUrl: { contains: "placeholder" } },
      ],
    },
    data: { coverImageUrl: REPLACEMENTS.courseCover },
  });
  console.log(`Fixed ${coursesFixed.count} course cover image(s)`);

  // Fix null cover images
  const coursesNull = await prisma.course.updateMany({
    where: { coverImageUrl: null },
    data: { coverImageUrl: REPLACEMENTS.courseCoverAlt },
  });
  console.log(`Fixed ${coursesNull.count} null course cover image(s)`);

  console.log("Done. Image URLs updated.");
}

main()
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
