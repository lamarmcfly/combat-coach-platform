import { SubscriptionTier, SubscriptionStatus, Prisma } from '@prisma/client';
import { prisma } from '@/db/client';
import { stripe, getOrCreateCustomer, updateSubscription, cancelSubscriptionAtPeriodEnd, reactivateSubscription } from '@/lib/stripe/client';
import { TIER_CONFIG, getFeatureLimit } from '@/lib/stripe/config';

export class SubscriptionService {
  /**
   * Create a new subscription for a user
   */
  static async createSubscription(params: {
    userId: string;
    tier: SubscriptionTier;
    stripeSubscriptionId?: string;
    stripePriceId?: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }) {
    const { userId, tier, stripeSubscriptionId, stripePriceId, currentPeriodStart, currentPeriodEnd } = params;

    const monthlyCredits = getFeatureLimit(tier, 'liveSessionCreditsPerMonth');

    // Create subscription record
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        tier,
        status: SubscriptionStatus.ACTIVE,
        stripeSubscriptionId,
        stripePriceId,
        currentPeriodStart,
        currentPeriodEnd,
        monthlyCreditsRemaining: monthlyCredits === -1 ? 999999 : monthlyCredits, // Use large number for "unlimited"
        monthlyCoursesUsed: 0,
      },
    });

    // Update user's tier
    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: tier },
    });

    return subscription;
  }

  /**
   * Get active subscription for a user
   */
  static async getActiveSubscription(userId: string) {
    return prisma.subscription.findFirst({
      where: {
        userId,
        status: {
          in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING, SubscriptionStatus.PAST_DUE],
        },
      },
    });
  }

  /**
   * Upgrade a user's subscription
   */
  static async upgradeSubscription(params: {
    userId: string;
    newTier: SubscriptionTier;
    prorate?: boolean;
  }) {
    const { userId, newTier, prorate = true } = params;

    const currentSubscription = await this.getActiveSubscription(userId);

    if (!currentSubscription) {
      throw new Error('No active subscription found');
    }

    if (!currentSubscription.stripeSubscriptionId) {
      throw new Error('No Stripe subscription ID found');
    }

    const newPriceId = TIER_CONFIG[newTier].stripePriceId;

    if (!newPriceId) {
      throw new Error(`No price ID configured for tier: ${newTier}`);
    }

    // Update subscription in Stripe
    const stripeSubscription = (await updateSubscription(
      currentSubscription.stripeSubscriptionId,
      newPriceId,
      prorate
    )) as any;

    const monthlyCredits = getFeatureLimit(newTier, 'liveSessionCreditsPerMonth');

    // Update local subscription record
    const updatedSubscription = await prisma.subscription.update({
      where: { id: currentSubscription.id },
      data: {
        tier: newTier,
        stripePriceId: newPriceId,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        monthlyCreditsRemaining: monthlyCredits === -1 ? 999999 : monthlyCredits,
        monthlyCoursesUsed: 0, // Reset course usage on upgrade
      },
    });

    // Update user's tier
    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: newTier },
    });

    return updatedSubscription;
  }

  /**
   * Downgrade a user's subscription (scheduled for next billing period)
   */
  static async downgradeSubscription(params: {
    userId: string;
    newTier: SubscriptionTier;
  }) {
    const { userId, newTier } = params;

    const currentSubscription = await this.getActiveSubscription(userId);

    if (!currentSubscription) {
      throw new Error('No active subscription found');
    }

    if (!currentSubscription.stripeSubscriptionId) {
      throw new Error('No Stripe subscription ID found');
    }

    const newPriceId = TIER_CONFIG[newTier].stripePriceId;

    if (!newPriceId) {
      throw new Error(`No price ID configured for tier: ${newTier}`);
    }

    // Schedule downgrade in Stripe (at period end, no proration)
    const stripeSubscription = await stripe.subscriptions.update(
      currentSubscription.stripeSubscriptionId,
      {
        items: [
          {
            id: (await stripe.subscriptions.retrieve(currentSubscription.stripeSubscriptionId)).items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'none',
        billing_cycle_anchor: 'unchanged',
      }
    );

    // Note: We don't update the local tier yet - it will be updated when the webhook fires at period end
    await prisma.subscription.update({
      where: { id: currentSubscription.id },
      data: {
        stripePriceId: newPriceId,
      },
    });

    return currentSubscription;
  }

  /**
   * Cancel a user's subscription at the end of the billing period
   */
  static async cancelSubscription(userId: string) {
    const subscription = await this.getActiveSubscription(userId);

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    if (!subscription.stripeSubscriptionId) {
      throw new Error('No Stripe subscription ID found');
    }

    // Cancel in Stripe
    await cancelSubscriptionAtPeriodEnd(subscription.stripeSubscriptionId);

    // Update local record
    return prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
      },
    });
  }

  /**
   * Reactivate a canceled subscription
   */
  static async reactivateSubscription(userId: string) {
    const subscription = await this.getActiveSubscription(userId);

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    if (!subscription.cancelAtPeriodEnd) {
      throw new Error('Subscription is not scheduled for cancellation');
    }

    if (!subscription.stripeSubscriptionId) {
      throw new Error('No Stripe subscription ID found');
    }

    // Reactivate in Stripe
    await reactivateSubscription(subscription.stripeSubscriptionId);

    // Update local record
    return prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: false,
        canceledAt: null,
      },
    });
  }

  /**
   * Reset monthly credits for a subscription (called on billing renewal)
   */
  static async resetMonthlyCredits(subscriptionId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const monthlyCredits = getFeatureLimit(subscription.tier, 'liveSessionCreditsPerMonth');

    return prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        monthlyCreditsRemaining: monthlyCredits === -1 ? 999999 : monthlyCredits,
        monthlyCoursesUsed: 0,
      },
    });
  }

  /**
   * Deduct a live session credit
   */
  static async deductCredit(userId: string, sessionId: string) {
    const subscription = await this.getActiveSubscription(userId);

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    // Check if unlimited
    if (getFeatureLimit(subscription.tier, 'liveSessionCreditsPerMonth') === -1) {
      // Elite tier - unlimited credits, just log the usage
      await prisma.creditTransaction.create({
        data: {
          userId,
          type: 'MONTHLY',
          amount: -1,
          balance: 999999, // "unlimited"
          description: `Used credit for session ${sessionId}`,
          sessionId,
        },
      });
      return subscription;
    }

    // Check if credits available
    if (subscription.monthlyCreditsRemaining <= 0) {
      throw new Error('No credits remaining');
    }

    // Deduct credit
    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        monthlyCreditsRemaining: {
          decrement: 1,
        },
      },
    });

    // Log transaction
    await prisma.creditTransaction.create({
      data: {
        userId,
        type: 'MONTHLY',
        amount: -1,
        balance: updated.monthlyCreditsRemaining,
        description: `Used credit for session ${sessionId}`,
        sessionId,
      },
    });

    return updated;
  }

  /**
   * Check if user can access a course based on tier limits
   */
  static async canAccessCourse(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return { allowed: false, reason: 'User not found' };
    }

    const tier = user.subscriptionTier;

    // FREE tier cannot access courses
    if (tier === SubscriptionTier.FREE) {
      return { allowed: false, reason: 'Upgrade to access courses' };
    }

    // PRO and ELITE have unlimited access
    if (tier === SubscriptionTier.PRO || tier === SubscriptionTier.ELITE) {
      return { allowed: true };
    }

    // BASIC tier - check monthly limit
    if (tier === SubscriptionTier.BASIC) {
      const subscription = user.subscription;
      if (!subscription) {
        return { allowed: false, reason: 'No active subscription' };
      }

      const limit = getFeatureLimit(tier, 'coursesPerMonth');

      if (subscription.monthlyCoursesUsed >= limit) {
        return { allowed: false, reason: `Monthly course limit reached (${limit} courses)` };
      }

      return { allowed: true };
    }

    return { allowed: false, reason: 'Unknown tier' };
  }

  /**
   * Increment course usage count for BASIC tier
   */
  static async incrementCourseUsage(userId: string) {
    const subscription = await this.getActiveSubscription(userId);

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    // Only track for BASIC tier
    if (subscription.tier !== SubscriptionTier.BASIC) {
      return subscription;
    }

    return prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        monthlyCoursesUsed: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Get credit balance for a user (monthly + pack credits)
   */
  static async getCreditBalance(userId: string): Promise<{
    monthlyCredits: number;
    packCredits: number;
    total: number;
    unlimited: boolean;
  }> {
    const subscription = await this.getActiveSubscription(userId);

    if (!subscription) {
      return { monthlyCredits: 0, packCredits: 0, total: 0, unlimited: false };
    }

    // Check for unlimited
    const unlimited = getFeatureLimit(subscription.tier, 'liveSessionCreditsPerMonth') === -1;

    if (unlimited) {
      return { monthlyCredits: -1, packCredits: 0, total: -1, unlimited: true };
    }

    // Get pack credits (sum of non-expired pack transactions)
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
    const monthlyCredits = subscription.monthlyCreditsRemaining;
    const total = monthlyCredits + packCredits;

    return { monthlyCredits, packCredits, total, unlimited: false };
  }
}
