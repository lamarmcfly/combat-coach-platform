/**
 * Create or promote an admin user.
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts <email> [password]
 *
 * If the user already exists, they are promoted to ADMIN.
 * If the user doesn't exist, a new ADMIN account is created.
 * Password defaults to a random 16-char string if not provided.
 */
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/create-admin.ts <email> [password]");
    process.exit(1);
  }

  const password = process.argv[3] || crypto.randomBytes(12).toString("base64url");
  const isGeneratedPassword = !process.argv[3];

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role === Role.ADMIN) {
      console.log(`User ${email} is already an admin.`);
      return;
    }

    await prisma.user.update({
      where: { email },
      data: { role: Role.ADMIN },
    });
    console.log(`Promoted ${email} to ADMIN.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: "Admin",
      lastName: "",
      role: Role.ADMIN,
      emailVerified: new Date(),
    },
  });

  console.log(`Created admin user: ${email}`);
  if (isGeneratedPassword) {
    console.log(`Generated password: ${password}`);
    console.log("Change this password after first login.");
  }
}

main()
  .catch((err) => {
    console.error("Failed to create admin:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
