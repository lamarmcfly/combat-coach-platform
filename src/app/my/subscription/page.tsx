import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/db/client';
import { SubscriptionTier } from '@prisma/client';
import { TIER_CONFIG } from '@/lib/stripe/config';
import { SubscriptionOverview } from '@/components/subscription/SubscriptionOverview';
import { CreditBalance } from '@/components/subscription/CreditBalance';
import { TierUpgradeCards } from '@/components/subscription/TierUpgradeCards';
import { BillingHistory } from '@/components/subscription/BillingHistory';

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/sign-in?callbackUrl=/my/subscription');
  }

  // Fetch user's subscription data
  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });

  // Fetch credit balance - get the most recent transaction's balance
  const latestTransaction = await prisma.creditTransaction.findFirst({
    where: {
      userId: session.user.id,
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalCredits = latestTransaction?.balance ?? 0;

  // Fetch recent transactions for history
  const creditTransactions = await prisma.creditTransaction.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const currentTier = subscription?.tier ?? SubscriptionTier.FREE;
  const tierConfig = TIER_CONFIG[currentTier];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Subscription & Credits</h1>
        <p className="mt-2 text-copy-muted">
          Manage your membership tier and training credits
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content - 2 columns */}
        <div className="space-y-8 lg:col-span-2">
          {/* Current subscription overview */}
          <SubscriptionOverview
            tier={currentTier}
            tierConfig={tierConfig}
            subscription={subscription}
          />

          {/* Upgrade/Downgrade options */}
          {currentTier !== SubscriptionTier.ELITE && (
            <div>
              <h2 className="mb-4 text-xl font-semibold text-white">Upgrade Your Plan</h2>
              <TierUpgradeCards currentTier={currentTier} userId={session.user.id} />
            </div>
          )}

          {/* Billing history */}
          <BillingHistory userId={session.user.id} />
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-8">
          {/* Credit balance card */}
          <CreditBalance
            totalCredits={totalCredits}
            monthlyCredits={subscription?.monthlyCreditsRemaining ?? 0}
            userId={session.user.id}
          />
        </div>
      </div>
    </div>
  );
}
