import { db } from "@/db/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

export async function userOwnsCourse(userId: string | undefined, courseId: string) {
  if (!userId) return false;
  try {
    const purchase = await db.coursePurchase.findFirst({
      where: { userId, courseId, status: { in: ["ACTIVE", "PENDING"] } },
    });
    return !!purchase;
  } catch (error) {
    console.error("Failed to validate course ownership via DB", error);
    return false;
  }
}

export async function userBookedSession(userId: string | undefined, liveSessionId: string) {
  if (!userId) return false;
  try {
    const booking = await db.liveSessionBooking.findFirst({
      where: { userId, liveSessionId, status: { in: ["CONFIRMED", "PENDING"] } },
    });
    return !!booking;
  } catch (error) {
    console.error("Failed to validate session booking via DB", error);
    return false;
  }
}

export type UserRole = "ATHLETE" | "COACH" | "ADMIN";

export async function enforceRole<T>(
  requiredRole: UserRole | UserRole[],
  action: () => T | Promise<T>
): Promise<T> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Unauthorized: No session found");
  }

  const userRole = (session.user as { role?: string }).role ?? "ATHLETE";
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  // ADMIN has access to everything
  if (userRole === "ADMIN" || allowedRoles.includes(userRole as UserRole)) {
    return action();
  }

  throw new Error(`Forbidden: Requires ${allowedRoles.join(" or ")} role`);
}

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return ((session.user as { role?: string }).role ?? "ATHLETE") as UserRole;
}

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized: Authentication required");
  }
  return session.user;
}
