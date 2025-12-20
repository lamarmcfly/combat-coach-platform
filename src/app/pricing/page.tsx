import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/db/client';
import { TIER_CONFIG } from '@/lib/stripe/config';
import { SubscriptionTier } from '@prisma/client';
import { PricingCard } from '@/components/pricing/PricingCard';
import { PageContainer } from '@/components/layout/PageContainer';

export const metadata = {
  title: 'Pricing - Combat Coach Platform',
  description: 'Choose the perfect plan for your combat sports training journey',
};

export default async function PricingPage() {
  const session = (await getServerSession(authOptions)) as Session | null;

  let currentTier: SubscriptionTier = SubscriptionTier.FREE;
  let cancelAtPeriodEnd = false;

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true },
    });

    if (user) {
      currentTier = user.subscriptionTier;
      cancelAtPeriodEnd = user.subscription?.cancelAtPeriodEnd || false;
    }
  }

  const tiers = [
    SubscriptionTier.FREE,
    SubscriptionTier.BASIC,
    SubscriptionTier.PRO,
    SubscriptionTier.ELITE,
  ];

  return (
    <PageContainer>
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Training Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            From beginner to elite athlete, we have the perfect plan to accelerate your combat sports journey
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {tiers.map((tier) => {
            const config = TIER_CONFIG[tier];
            const isCurrent = tier === currentTier;
            const isUpgrade = !isCurrent && compareTierOrder(tier, currentTier) > 0;
            const isDowngrade = !isCurrent && compareTierOrder(tier, currentTier) < 0;

            return (
              <PricingCard
                key={tier}
                tier={tier}
                name={config.name}
                price={config.price}
                features={config.features}
                benefits={config.benefits}
                popular={'popular' in config ? config.popular : false}
                isCurrent={isCurrent}
                isUpgrade={isUpgrade}
                isDowngrade={isDowngrade}
                cancelAtPeriodEnd={cancelAtPeriodEnd}
                isAuthenticated={!!session}
              />
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-8 text-center">Feature Comparison</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4">Feature</th>
                  {tiers.map((tier) => (
                    <th key={tier} className="text-center py-4 px-4">
                      {TIER_CONFIG[tier].name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-4 px-4">Courses per Month</td>
                  <td className="text-center py-4 px-4">-</td>
                  <td className="text-center py-4 px-4">2</td>
                  <td className="text-center py-4 px-4">Unlimited</td>
                  <td className="text-center py-4 px-4">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4">Live Session Credits/Month</td>
                  <td className="text-center py-4 px-4">-</td>
                  <td className="text-center py-4 px-4">-</td>
                  <td className="text-center py-4 px-4">2</td>
                  <td className="text-center py-4 px-4">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4">Office Hours (1:1 Coach Sessions)</td>
                  <td className="text-center py-4 px-4">✗</td>
                  <td className="text-center py-4 px-4">✗</td>
                  <td className="text-center py-4 px-4">✗</td>
                  <td className="text-center py-4 px-4">✓ Weekly</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4">Exclusive Content</td>
                  <td className="text-center py-4 px-4">✗</td>
                  <td className="text-center py-4 px-4">✗</td>
                  <td className="text-center py-4 px-4">✗</td>
                  <td className="text-center py-4 px-4">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4">Early Access to New Courses</td>
                  <td className="text-center py-4 px-4">✗</td>
                  <td className="text-center py-4 px-4">✗</td>
                  <td className="text-center py-4 px-4">✗</td>
                  <td className="text-center py-4 px-4">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4">Priority Support</td>
                  <td className="text-center py-4 px-4">✗</td>
                  <td className="text-center py-4 px-4">✗</td>
                  <td className="text-center py-4 px-4">✓</td>
                  <td className="text-center py-4 px-4">✓</td>
                </tr>
                <tr>
                  <td className="py-4 px-4">Progress Tracking & Analytics</td>
                  <td className="text-center py-4 px-4">✗</td>
                  <td className="text-center py-4 px-4">Basic</td>
                  <td className="text-center py-4 px-4">✓</td>
                  <td className="text-center py-4 px-4">✓ Advanced</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold mb-2">Can I upgrade or downgrade anytime?</h3>
              <p className="text-gray-600">
                Yes! Upgrades take effect immediately with prorated billing. Downgrades take effect at the end of your current billing period.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-2">What happens to my credits when I upgrade?</h3>
              <p className="text-gray-600">
                Monthly credits reset to your new tier's allocation. Purchased credit packs are preserved and remain valid for 6 months.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-2">Can I cancel my subscription?</h3>
              <p className="text-gray-600">
                Yes, you can cancel anytime. You'll retain access until the end of your current billing period, then automatically downgrade to Free.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-2">Do live session credits roll over?</h3>
              <p className="text-gray-600">
                Monthly credits do not roll over and reset each billing period. However, purchased credit packs remain valid for 6 months from purchase.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function compareTierOrder(tierA: SubscriptionTier, tierB: SubscriptionTier): number {
  const order = [
    SubscriptionTier.FREE,
    SubscriptionTier.BASIC,
    SubscriptionTier.PRO,
    SubscriptionTier.ELITE,
  ];
  return order.indexOf(tierA) - order.indexOf(tierB);
}
