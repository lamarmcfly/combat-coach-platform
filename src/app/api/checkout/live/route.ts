import { NextRequest, NextResponse } from "next/server";
import { createLiveSessionCheckoutSession } from "@/lib/payments/paymentService";
import { getCurrentSession } from "@/lib/auth/session";
import { SubscriptionService } from "@/services/subscriptionService";
import { validateRequest } from "@/lib/validation";
import { liveSessionCheckoutSchema } from "@/lib/validation/schemas";
import { db } from "@/db/client";

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';

function getClientIp(request: NextRequest): string | undefined {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.headers.get("x-real-ip") ?? undefined;
}

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const validation = await validateRequest(request, liveSessionCheckoutSchema);
  if (!validation.success) {
    return validation.error;
  }

  const {
    liveSessionId,
    useCredit,
    acceptedNoShowPolicy,
    acceptedSafetyWaiver,
    acceptedWaitlistAutoBilling,
  } = validation.data;

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "LIVE_SESSION_CONSENT_ACKNOWLEDGED",
      resource: "LiveSession",
      resourceId: liveSessionId,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
      metadata: {
        acceptedNoShowPolicy,
        acceptedSafetyWaiver,
        acceptedWaitlistAutoBilling,
        useCredit,
        acknowledgedAt: new Date().toISOString(),
      },
    },
  });

  // If user wants to use credit, attempt to deduct it
  if (useCredit) {
    try {
      await SubscriptionService.deductCredit(session.user.id, liveSessionId);
      return NextResponse.json({
        success: true,
        message: "Session booked using credit",
        creditUsed: true
      });
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("Insufficient credits") || error.message.includes("No credits remaining"))
      ) {
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
  const checkout = await createLiveSessionCheckoutSession(session.user.id, liveSessionId, {
    acceptedNoShowPolicy,
    acceptedSafetyWaiver,
    acceptedWaitlistAutoBilling,
  });
  return NextResponse.json(checkout);
}
