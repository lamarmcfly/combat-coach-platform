import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';
import { prisma } from '@/db/client';
import { TRIAL_CONFIG } from '@/lib/stripe/config';

export interface TrialEligibility {
  eligible: boolean;
  reason?: string;
  hasHadTrial?: boolean;
  currentSubscription?: {
    tier: SubscriptionTier;
    status: SubscriptionStatus;
  };
}

export interface TrialInfo {
  isOnTrial: boolean;
  trialStart?: Date;
  trialEnd?: Date;
  daysRemaining?: number;
  tier?: SubscriptionTier;
}

/**
 * Check if a user is eligible for a free trial
 */
export async function checkTrialEligibility(
  userId: string,
  requestedTier: SubscriptionTier
): Promise<TrialEligibility> {
  // Check if the tier is eligible for trial
  if (!(TRIAL_CONFIG.eligibleTiers as readonly SubscriptionTier[]).includes(requestedTier)) {
    return {
      eligible: false,
      reason: 'This subscription tier is not eligible for a free trial',
    };
  }

  // Check existing subscription status
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: {
      tier: true,
      status: true,
      trialStart: true,
      trialEnd: true,
    },
  });

  // If user has ever had a trial, they're not eligible
  if (subscription?.trialStart) {
    return {
      eligible: false,
      reason: 'You have already used your free trial',
      hasHadTrial: true,
      currentSubscription: subscription ? {
        tier: subscription.tier,
        status: subscription.status,
      } : undefined,
    };
  }

  // If user has an active paid subscription, they're not eligible
  if (subscription?.status === SubscriptionStatus.ACTIVE && subscription.tier !== SubscriptionTier.FREE) {
    return {
      eligible: false,
      reason: 'You already have an active subscription',
      currentSubscription: {
        tier: subscription.tier,
        status: subscription.status,
      },
    };
  }

  return {
    eligible: true,
    hasHadTrial: false,
  };
}

/**
 * Get the current trial information for a user
 */
export async function getTrialInfo(userId: string): Promise<TrialInfo> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: {
      tier: true,
      status: true,
      trialStart: true,
      trialEnd: true,
    },
  });

  if (!subscription || !subscription.trialEnd) {
    return { isOnTrial: false };
  }

  const now = new Date();
  const trialEnd = new Date(subscription.trialEnd);
  const isOnTrial = subscription.status === SubscriptionStatus.TRIALING && trialEnd > now;

  if (!isOnTrial) {
    return { isOnTrial: false };
  }

  const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    isOnTrial: true,
    trialStart: subscription.trialStart || undefined,
    trialEnd: subscription.trialEnd,
    daysRemaining: Math.max(0, daysRemaining),
    tier: subscription.tier,
  };
}

/**
 * Start a trial for a user (called after Stripe checkout completes)
 */
export async function startTrial(
  userId: string,
  tier: SubscriptionTier,
  stripeSubscriptionId: string,
  stripePriceId: string
): Promise<void> {
  const now = new Date();
  const trialEnd = new Date(now.getTime() + TRIAL_CONFIG.durationDays * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    // Create or update subscription
    prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        tier,
        status: SubscriptionStatus.TRIALING,
        stripeSubscriptionId,
        stripePriceId,
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        trialStart: now,
        trialEnd,
      },
      update: {
        tier,
        status: SubscriptionStatus.TRIALING,
        stripeSubscriptionId,
        stripePriceId,
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        trialStart: now,
        trialEnd,
      },
    }),

    // Update user's subscription tier
    prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: tier },
    }),
  ]);
}

/**
 * End a trial (convert to paid or cancel)
 */
export async function endTrial(
  userId: string,
  convertToPaid: boolean = true
): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { tier: true },
  });

  if (!subscription) return;

  if (convertToPaid) {
    // Trial ends, subscription continues as active
    await prisma.subscription.update({
      where: { userId },
      data: {
        status: SubscriptionStatus.ACTIVE,
      },
    });
  } else {
    // Trial ends, revert to free tier
    await prisma.$transaction([
      prisma.subscription.update({
        where: { userId },
        data: {
          status: SubscriptionStatus.CANCELED,
          tier: SubscriptionTier.FREE,
          canceledAt: new Date(),
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { subscriptionTier: SubscriptionTier.FREE },
      }),
    ]);
  }
}

/**
 * Get users whose trials are ending soon (for reminder emails)
 */
export async function getExpiringTrials(daysRemaining: number): Promise<Array<{
  userId: string;
  email: string;
  firstName: string | null;
  tier: SubscriptionTier;
  trialEnd: Date;
}>> {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysRemaining);

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: SubscriptionStatus.TRIALING,
      trialEnd: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
        },
      },
    },
  });

  return subscriptions.map((sub) => ({
    userId: sub.user.id,
    email: sub.user.email,
    firstName: sub.user.firstName,
    tier: sub.tier,
    trialEnd: sub.trialEnd!,
  }));
}

/**
 * Get trial statistics
 */
export async function getTrialStats(): Promise<{
  activeTrials: number;
  trialsStartedThisMonth: number;
  trialConversionRate: number;
}> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [activeTrials, trialsStartedThisMonth, convertedTrials, totalEndedTrials] =
    await Promise.all([
      // Active trials count
      prisma.subscription.count({
        where: {
          status: SubscriptionStatus.TRIALING,
          trialEnd: { gte: now },
        },
      }),

      // Trials started this month
      prisma.subscription.count({
        where: {
          trialStart: { gte: startOfMonth },
        },
      }),

      // Converted trials (trials that became active subscriptions)
      prisma.subscription.count({
        where: {
          status: SubscriptionStatus.ACTIVE,
          trialStart: { not: null },
          tier: { not: SubscriptionTier.FREE },
        },
      }),

      // Total ended trials
      prisma.subscription.count({
        where: {
          trialStart: { not: null },
          trialEnd: { lt: now },
        },
      }),
    ]);

  const trialConversionRate = totalEndedTrials > 0
    ? (convertedTrials / totalEndedTrials) * 100
    : 0;

  return {
    activeTrials,
    trialsStartedThisMonth,
    trialConversionRate: Math.round(trialConversionRate * 10) / 10,
  };
}
