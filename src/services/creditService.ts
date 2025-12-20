import { CreditType } from '@prisma/client';
import { prisma } from '@/db/client';
import { addMonths } from 'date-fns';

export class CreditService {
  /**
   * Purchase a credit pack for a user
   */
  static async purchaseCreditPack(params: {
    userId: string;
    packId: string;
    credits: number;
    priceCents: number;
    validityMonths?: number;
  }) {
    const { userId, packId, credits, priceCents, validityMonths = 6 } = params;

    // Get or create the credit pack definition
    let creditPack = await prisma.creditPack.findFirst({
      where: { name: packId },
    });

    if (!creditPack) {
      creditPack = await prisma.creditPack.create({
        data: {
          name: packId,
          credits,
          priceCents,
          validityMonths,
        },
      });
    }

    // Calculate expiration date
    const expiresAt = addMonths(new Date(), validityMonths);

    // Get current balance
    const currentBalance = await this.getPackCreditBalance(userId);

    // Create credit transaction
    const transaction = await prisma.creditTransaction.create({
      data: {
        userId,
        type: CreditType.PACK,
        amount: credits,
        balance: currentBalance + credits,
        description: `Purchased ${credits} credits (${packId})`,
        creditPackId: creditPack.id,
        expiresAt,
      },
    });

    return transaction;
  }

  /**
   * Use a credit (prioritize monthly credits, then pack credits)
   */
  static async useCredit(params: {
    userId: string;
    sessionId: string;
    description?: string;
  }): Promise<{ success: boolean; type: 'monthly' | 'pack' | 'none'; balance: number }> {
    const { userId, sessionId, description = 'Session booking' } = params;

    // First, try to use monthly credit via subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
    });

    if (subscription && subscription.monthlyCreditsRemaining > 0) {
      // Use monthly credit
      const updated = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          monthlyCreditsRemaining: { decrement: 1 },
        },
      });

      await prisma.creditTransaction.create({
        data: {
          userId,
          type: CreditType.MONTHLY,
          amount: -1,
          balance: updated.monthlyCreditsRemaining,
          description: `${description} (monthly credit)`,
          sessionId,
        },
      });

      return { success: true, type: 'monthly', balance: updated.monthlyCreditsRemaining };
    }

    // No monthly credits, try pack credits
    const packBalance = await this.getPackCreditBalance(userId);

    if (packBalance > 0) {
      // Use pack credit
      await prisma.creditTransaction.create({
        data: {
          userId,
          type: CreditType.PACK,
          amount: -1,
          balance: packBalance - 1,
          description: `${description} (pack credit)`,
          sessionId,
        },
      });

      return { success: true, type: 'pack', balance: packBalance - 1 };
    }

    // No credits available
    return { success: false, type: 'none', balance: 0 };
  }

  /**
   * Get current pack credit balance (non-expired credits)
   */
  static async getPackCreditBalance(userId: string): Promise<number> {
    const result = await prisma.creditTransaction.aggregate({
      where: {
        userId,
        type: CreditType.PACK,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount || 0;
  }

  /**
   * Get all credit transactions for a user
   */
  static async getTransactionHistory(params: {
    userId: string;
    limit?: number;
    offset?: number;
  }) {
    const { userId, limit = 50, offset = 0 } = params;

    const transactions = await prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        creditPack: true,
      },
    });

    const total = await prisma.creditTransaction.count({
      where: { userId },
    });

    return { transactions, total, limit, offset };
  }

  /**
   * Expire old pack credits (run as a scheduled job)
   */
  static async expireCredits() {
    const now = new Date();

    // Find users with expiring credits
    const expiringTransactions = await prisma.creditTransaction.findMany({
      where: {
        type: CreditType.PACK,
        expiresAt: { lte: now },
        amount: { gt: 0 }, // Only positive amounts (purchases, not usage)
      },
      include: {
        user: true,
      },
    });

    const results = [];

    for (const transaction of expiringTransactions) {
      // Create a negative transaction to expire the credits
      const expired = await prisma.creditTransaction.create({
        data: {
          userId: transaction.userId,
          type: CreditType.PACK,
          amount: -transaction.amount,
          balance: (await this.getPackCreditBalance(transaction.userId)) - transaction.amount,
          description: `Credits expired from purchase on ${transaction.createdAt.toLocaleDateString()}`,
          creditPackId: transaction.creditPackId,
        },
      });

      results.push({
        userId: transaction.userId,
        email: transaction.user.email,
        creditsExpired: transaction.amount,
        originalPurchase: transaction.createdAt,
      });
    }

    return results;
  }

  /**
   * Get comprehensive credit summary for a user
   */
  static async getCreditSummary(userId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
    });

    const monthlyCredits = subscription?.monthlyCreditsRemaining || 0;
    const packCredits = await this.getPackCreditBalance(userId);

    // Check if unlimited (Elite tier)
    const unlimited = subscription?.tier === 'ELITE';

    // Get credits expiring soon (within 30 days)
    const expiringCredits = await prisma.creditTransaction.aggregate({
      where: {
        userId,
        type: CreditType.PACK,
        amount: { gt: 0 },
        expiresAt: {
          gt: new Date(),
          lte: addMonths(new Date(), 1),
        },
      },
      _sum: {
        amount: true,
      },
    });

    return {
      unlimited,
      monthlyCredits,
      packCredits,
      totalCredits: unlimited ? -1 : monthlyCredits + packCredits,
      expiringCredits: expiringCredits._sum.amount || 0,
    };
  }

  /**
   * Get available credit packs for purchase
   */
  static async getAvailablePacks() {
    return prisma.creditPack.findMany({
      where: { active: true },
      orderBy: { credits: 'asc' },
    });
  }
}
