import Stripe from "stripe";
import { db } from "@/db/client";
import { featuredCourses, liveSessions as sampleLiveSessions } from "@/data/sampleContent";

type CheckoutResult = {
  checkoutUrl: string;
  provider: "stripe";
  checkoutId?: string;
};

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PUBLISHABLE = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "pk_test_placeholder";
const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2025-10-29.clover",
    })
  : null;

async function resolveCourse(courseId: string) {
  try {
    const course = await db.course.findUnique({
      where: { id: courseId },
    });
    if (course) {
      return { title: course.title, description: course.shortDescription ?? "", slug: course.slug, priceCents: course.priceCents ?? 0 };
    }
  } catch (error) {
    console.warn("Failed to resolve course from DB", error);
  }
  const fallback = featuredCourses.find((course) => course.id === courseId);
  if (!fallback) throw new Error("Course not found");
  return { title: fallback.title, description: fallback.shortDescription, slug: fallback.slug, priceCents: fallback.priceCents };
}

async function resolveLiveSession(liveSessionId: string) {
  try {
    const session = await db.liveSession.findUnique({
      where: { id: liveSessionId },
    });
    if (session) {
      return {
        title: session.title,
        description: session.description ?? "",
        priceCents: session.priceCents ?? 0,
      };
    }
  } catch (error) {
    console.warn("Failed to resolve live session from DB", error);
  }
  const fallback = sampleLiveSessions.find((session) => session.id === liveSessionId);
  if (!fallback) throw new Error("Session not found");
  return { title: fallback.title, description: fallback.description, priceCents: fallback.priceCents };
}

export async function createCourseCheckoutSession(userId: string, courseId: string): Promise<CheckoutResult> {
  const course = await resolveCourse(courseId);
  if (stripe) {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${APP_URL}/courses/${course.slug}?purchase=success`,
      cancel_url: `${APP_URL}/courses/${course.slug}?purchase=cancelled`,
      metadata: { userId, courseId, type: "course" },
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: course.priceCents || 0,
            product_data: {
              name: course.title,
              description: course.description,
            },
          },
          quantity: 1,
        },
      ],
    });

    return {
      checkoutUrl: session.url ?? `${APP_URL}/courses/${course.slug}`,
      checkoutId: session.id,
      provider: "stripe",
    };
  }

  return {
    checkoutUrl: `/checkout/test?type=course&courseId=${courseId}&userId=${userId}&pk=${STRIPE_PUBLISHABLE}`,
    provider: "stripe",
  };
}

export async function createLiveSessionCheckoutSession(userId: string, liveSessionId: string): Promise<CheckoutResult> {
  const sessionDetails = await resolveLiveSession(liveSessionId);
  if (stripe) {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${APP_URL}/sessions/${liveSessionId}?booking=success`,
      cancel_url: `${APP_URL}/sessions/${liveSessionId}?booking=cancelled`,
      metadata: { userId, liveSessionId, type: "live" },
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: sessionDetails.priceCents || 0,
            product_data: {
              name: sessionDetails.title,
              description: sessionDetails.description,
            },
          },
          quantity: 1,
        },
      ],
    });

    return {
      checkoutUrl: session.url ?? `${APP_URL}/sessions/${liveSessionId}`,
      checkoutId: session.id,
      provider: "stripe",
    };
  }

  return {
    checkoutUrl: `/checkout/test?type=live&sessionId=${liveSessionId}&userId=${userId}&pk=${STRIPE_PUBLISHABLE}`,
    provider: "stripe",
  };
}
