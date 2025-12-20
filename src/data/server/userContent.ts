import { db } from "@/db/client";
import { sampleBookings, samplePurchases } from "@/data/sampleContent";

type PurchaseRecord = {
  courseId: string;
  progressPercent: number;
};

async function fetchPurchases(userId: string): Promise<PurchaseRecord[]> {
  try {
    const purchases = await db.coursePurchase.findMany({
      where: { userId, status: { in: ["ACTIVE", "PENDING"] } },
      select: { courseId: true, progressPercent: true },
    });
    if (purchases.length) {
      return purchases.map((purchase) => ({ courseId: purchase.courseId, progressPercent: purchase.progressPercent ?? 0 }));
    }
  } catch (error) {
    console.warn("Failed to fetch user purchases", error);
  }
  return samplePurchases
    .filter((purchase) => purchase.userId === userId)
    .map((purchase) => ({ courseId: purchase.courseId, progressPercent: purchase.progressPercent ?? 0 }));
}

export async function getOwnedCourseIds(userId?: string): Promise<string[]> {
  if (!userId) return [];
  const purchases = await fetchPurchases(userId);
  return purchases.map((purchase) => purchase.courseId);
}

export async function getCourseProgressMap(userId?: string): Promise<Record<string, number>> {
  if (!userId) return {};
  const purchases = await fetchPurchases(userId);
  return purchases.reduce<Record<string, number>>((acc, purchase) => {
    acc[purchase.courseId] = purchase.progressPercent ?? 0;
    return acc;
  }, {});
}

export async function getBookedSessionIds(userId?: string): Promise<string[]> {
  if (!userId) return [];
  try {
    const bookings = await db.liveSessionBooking.findMany({
      where: { userId, status: { in: ["CONFIRMED", "PENDING"] } },
      select: { liveSessionId: true },
    });
    if (!bookings.length) {
      return sampleBookings.filter((booking) => booking.userId === userId).map((booking) => booking.liveSessionId);
    }
    return bookings.map((booking) => booking.liveSessionId);
  } catch (error) {
    console.warn("Failed to fetch session bookings", error);
    return sampleBookings.filter((booking) => booking.userId === userId).map((booking) => booking.liveSessionId);
  }
}
