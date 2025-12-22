import { NextResponse } from "next/server";
import { createLiveSessionCheckoutSession } from "@/lib/payments/paymentService";
import { getCurrentSession } from "@/lib/auth/session";
import { SubscriptionService } from "@/services/subscriptionService";

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { liveSessionId, useCredit } = await request.json();
  if (!liveSessionId) {
    return NextResponse.json({ error: "Missing liveSessionId" }, { status: 400 });
  }

  // If user wants to use credit, attempt to deduct it
  if (useCredit) {
    try {
      await SubscriptionService.deductCredit(session.user.id, liveSessionId);
      return NextResponse.json({
        success: true,
        message: "Session booked using credit",
        creditUsed: true
      });
    } catch (error: any) {
      if (error.message.includes("Insufficient credits")) {
        return NextResponse.json(
          {
            error: "Insufficient credits",
            message: "You don't have enough credits. Purchase more credits or upgrade your plan.",
            upgradeRequired: true
          },
          { status: 402 }
        );
      }
      throw error;
    }
  }

  // Otherwise, proceed with payment checkout
  const checkout = await createLiveSessionCheckoutSession(session.user.id, liveSessionId);
  return NextResponse.json(checkout);
}
