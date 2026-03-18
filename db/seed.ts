import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const disciplines = [
  { slug: "boxing", name: "Boxing" },
  { slug: "muay-thai", name: "Muay Thai" },
  { slug: "kickboxing", name: "Kickboxing" },
  { slug: "mma", name: "MMA" },
  { slug: "wrestling", name: "Wrestling" },
  { slug: "bare-knuckle", name: "Bare-knuckle" },
  { slug: "slap", name: "Slap" },
];

async function seed() {
  await prisma.discipline.deleteMany();
  await prisma.course.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.user.deleteMany();

  for (const discipline of disciplines) {
    await prisma.discipline.upsert({
      where: { slug: discipline.slug },
      update: {},
      create: discipline,
    });
  }

  const passwordHash = await bcrypt.hash("password123", 10);

  // Create admin user (email verified so they can sign in immediately)
  const admin = await prisma.user.create({
    data: {
      email: "admin@combatcoach.app",
      passwordHash,
      firstName: "Platform",
      lastName: "Admin",
      role: Role.ADMIN,
      emailVerified: new Date(),
    },
  });
  console.log("  Admin user: admin@combatcoach.app / password123");

  const athlete = await prisma.user.create({
    data: {
      email: "athlete@example.com",
      passwordHash,
      firstName: "Sample",
      lastName: "Athlete",
      role: Role.ATHLETE,
      emailVerified: new Date(),
    },
  });

  const coachUser = await prisma.user.create({
    data: {
      email: "coach@example.com",
      passwordHash,
      firstName: "Lena",
      lastName: "Alvarez",
      role: Role.COACH,
      emailVerified: new Date(),
    },
  });

  const coachProfile = await prisma.coachProfile.create({
    data: {
      userId: coachUser.id,
      displayName: 'Lena "Stone" Alvarez',
      tagline: "Clinching up the world",
      gymName: "Southside Combat Collective",
      gymLocation: "Brooklyn, NY",
      location: "Brooklyn, NY",
      shortBio: "Former WBC champ coaching Muay Thai killers.",
      longBio: "Longer story of Lena, her fighters, and philosophy.",
      avatarUrl: "/images/coaches/lena-stone.png",
      highlightVideoUrl: "https://storage.googleapis.com/coach-demo/lena-stone-intro.mp4",
      status: "APPROVED",
      yearsCoaching: 12,
      socialLinks: {
        instagram: "https://instagram.com/coachstone",
      },
      disciplines: {
        create: [
          {
            discipline: { connect: { slug: "muay-thai" } },
          },
        ],
      },
    },
  });

  // Get the muay-thai discipline
  const muayThaiDiscipline = await prisma.discipline.findUnique({
    where: { slug: "muay-thai" },
  });

  if (!muayThaiDiscipline) {
    throw new Error("Muay Thai discipline not found");
  }

  const course = await prisma.course.create({
    data: {
      slug: "muay-fundamentals",
      title: "Elbow & Clinch Blueprint",
      shortDescription: "12-week Muay Thai system for dominating the inside range.",
      longDescription: "Deep dive into elbow chains, pressure entries, and clinch control frameworks.",
      priceCents: 14900,
      status: "PUBLISHED",
      featured: true,
      coverImageUrl: "https://images.unsplash.com/photo-1509223197845-458d87318791?auto=format&fit=crop&w=1200&q=80",
      trailerVideoUrl: "https://storage.googleapis.com/coach-demo/lena-blueprint-trailer.mp4",
      coachId: coachProfile.id,
      disciplineId: muayThaiDiscipline.id,
      lessons: {
        createMany: {
          data: [
            {
              title: "Stance & Guard Under Fire",
              description: "Driving steps, shin blocks, and shelling up.",
              orderIndex: 1,
              videoUrl: "https://storage.googleapis.com/coach-demo/lesson-1.mp4",
              durationSeconds: 12 * 60,
              isPreview: true,
              moduleName: "Week 1",
            },
            {
              title: "Trigger Steps to Elbow Range",
              description: "Cover distance vs. tall fighters.",
              orderIndex: 2,
              videoUrl: "https://storage.googleapis.com/coach-demo/lesson-2.mp4",
              durationSeconds: 16 * 60,
              moduleName: "Week 2",
            },
          ],
        },
      },
    },
  });

  await prisma.coursePurchase.create({
    data: {
      userId: athlete.id,
      courseId: course.id,
      status: "ACTIVE",
      amountCents: 14900,
      paymentStatus: "paid",
      paymentProvider: "stripe",
      accessGrantedAt: new Date(),
      progressPercent: 35,
    },
  });

  // Get the boxing discipline
  const boxingDiscipline = await prisma.discipline.findUnique({
    where: { slug: "boxing" },
  });

  if (!boxingDiscipline) {
    throw new Error("Boxing discipline not found");
  }

  const liveSession = await prisma.liveSession.create({
    data: {
      coachId: coachProfile.id,
      disciplineId: boxingDiscipline.id,
      title: "Southpaw Pressure Lab",
      description: "Live sparring labs to plug southpaw counters into your fight style.",
      startTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      durationMinutes: 75,
      capacity: 25,
      priceCents: 4500,
      meetingUrl: "https://zoom.us/s/southpaw-pressure",
      promoVideoUrl: "https://storage.googleapis.com/coach-demo/session-1.mp4",
      status: "SCHEDULED",
    },
  });

  await prisma.liveSessionBooking.create({
    data: {
      userId: athlete.id,
      liveSessionId: liveSession.id,
      status: "CONFIRMED",
      amountCents: 4500,
      paymentStatus: "paid",
    },
  });

  console.log("Seed complete");
}

seed()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
