import { NextResponse } from "next/server";
import { createCourseCheckoutSession } from "@/lib/payments/paymentService";
import { getCurrentSession } from "@/lib/auth/session";
import { SubscriptionService } from "@/services/subscriptionService";

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { courseId } = await request.json();
  if (!courseId) {
    return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
  }

  // Check if user can access courses with their current tier
  const canAccess = await SubscriptionService.canAccessCourse(session.user.id);
  if (!canAccess) {
    return NextResponse.json(
      {
        error: "Course limit reached",
        message: "You've reached your monthly course limit. Upgrade your plan or wait for next month.",
        upgradeRequired: true
      },
      { status: 403 }
    );
  }

  const checkout = await createCourseCheckoutSession(session.user.id, courseId);
  return NextResponse.json(checkout);
}
