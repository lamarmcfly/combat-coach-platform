import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/db/client';
import { SubscriptionTier } from '@prisma/client';
import { hasMinimumTier, hasFeature } from '@/lib/stripe/config';

/**
 * Middleware to check if user has minimum required tier
 */
export async function requireTier(
  req: NextRequest,
  requiredTier: SubscriptionTier
): Promise<{ allowed: boolean; user?: any; reason?: string }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { allowed: false, reason: 'Not authenticated' };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { subscription: true },
  });

  if (!user) {
    return { allowed: false, reason: 'User not found' };
  }

  const userTier = user.subscriptionTier;

  if (!hasMinimumTier(userTier, requiredTier)) {
    return {
      allowed: false,
      user,
      reason: `Requires ${requiredTier} tier or higher (you have ${userTier})`,
    };
  }

  return { allowed: true, user };
}

/**
 * Check if user can access a specific course
 */
export async function checkCourseAccess(userId: string, courseId: string): Promise<{
  allowed: boolean;
  reason?: string;
  requiresPayment?: boolean;
  requiresUpgrade?: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: true,
      coursePurchases: {
        where: {
          courseId,
          status: 'ACTIVE',
        },
      },
    },
  });

  if (!user) {
    return { allowed: false, reason: 'User not found' };
  }

  // Check if already purchased individually
  if (user.coursePurchases.length > 0) {
    return { allowed: true };
  }

  const tier = user.subscriptionTier;

  // FREE tier must purchase or upgrade
  if (tier === SubscriptionTier.FREE) {
    return {
      allowed: false,
      reason: 'Upgrade to a subscription or purchase this course',
      requiresUpgrade: true,
      requiresPayment: true,
    };
  }

  // PRO and ELITE have unlimited access
  if (tier === SubscriptionTier.PRO || tier === SubscriptionTier.ELITE) {
    return { allowed: true };
  }

  // BASIC tier - check monthly limit
  if (tier === SubscriptionTier.BASIC) {
    const subscription = user.subscription;

    if (!subscription) {
      return { allowed: false, reason: 'No active subscription', requiresUpgrade: true };
    }

    // Check if this course has already been started (part of the 2 allowed)
    const courseAlreadyStarted = await prisma.coursePurchase.findFirst({
      where: {
        userId,
        courseId,
      },
    });

    if (courseAlreadyStarted) {
      return { allowed: true };
    }

    // Check monthly limit (2 courses for BASIC)
    if (subscription.monthlyCoursesUsed >= 2) {
      return {
        allowed: false,
        reason: 'Monthly course limit reached (2/2 courses). Upgrade to Pro for unlimited access.',
        requiresUpgrade: true,
      };
    }

    return { allowed: true };
  }

  return { allowed: false, reason: 'Unknown tier' };
}

/**
 * Check if user can book a live session (has credits or can pay)
 */
export async function checkSessionBooking(userId: string): Promise<{
  allowed: boolean;
  hasCredits: boolean;
  creditType?: 'monthly' | 'pack' | 'unlimited';
  requiresPayment: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (!user) {
    return { allowed: false, hasCredits: false, requiresPayment: true };
  }

  const tier = user.subscriptionTier;
  const subscription = user.subscription;

  // ELITE tier has unlimited credits
  if (tier === SubscriptionTier.ELITE) {
    return {
      allowed: true,
      hasCredits: true,
      creditType: 'unlimited',
      requiresPayment: false,
    };
  }

  // PRO tier gets 2 monthly credits
  if (tier === SubscriptionTier.PRO && subscription && subscription.monthlyCreditsRemaining > 0) {
    return {
      allowed: true,
      hasCredits: true,
      creditType: 'monthly',
      requiresPayment: false,
    };
  }

  // Check for pack credits
  const packCreditsAgg = await prisma.creditTransaction.aggregate({
    where: {
      userId,
      type: 'PACK',
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    _sum: {
      amount: true,
    },
  });

  const packCredits = packCreditsAgg._sum.amount || 0;

  if (packCredits > 0) {
    return {
      allowed: true,
      hasCredits: true,
      creditType: 'pack',
      requiresPayment: false,
    };
  }

  // No credits - must purchase
  return {
    allowed: true, // Can still book, but requires payment
    hasCredits: false,
    requiresPayment: true,
  };
}

/**
 * Check if user can access office hours (Elite tier only)
 */
export async function checkOfficeHoursAccess(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { allowed: false, reason: 'User not found' };
  }

  if (user.subscriptionTier !== SubscriptionTier.ELITE) {
    return {
      allowed: false,
      reason: 'Office hours are exclusive to Elite tier members. Upgrade to Elite for weekly 1:1 sessions with coaches.',
    };
  }

  return { allowed: true };
}

/**
 * Utility to get tier benefits for display
 */
export async function getTierBenefits(tier: SubscriptionTier) {
  const { TIER_CONFIG } = await import('@/lib/stripe/config');
  return TIER_CONFIG[tier];
}

/**
 * Check if user has a specific feature enabled
 */
export async function hasActiveFeature(
  userId: string,
  feature: 'officeHoursAccess' | 'exclusiveContent' | 'earlyAccess'
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return false;

  return hasFeature(user.subscriptionTier, feature);
}

/**
 * API route wrapper for tier-protected endpoints
 */
export function withTierProtection(
  requiredTier: SubscriptionTier,
  handler: (req: NextRequest, context: { user: any }) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const access = await requireTier(req, requiredTier);

    if (!access.allowed) {
      return NextResponse.json(
        {
          error: access.reason || 'Access denied',
          requiredTier,
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    return handler(req, { user: access.user });
  };
}
