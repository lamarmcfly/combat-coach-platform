'use client';

import { useState } from 'react';
import { SubscriptionTier } from '@prisma/client';
import { TIER_CONFIG } from '@/lib/stripe/config';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface TierUpgradeCardsProps {
  currentTier: SubscriptionTier;
  userId: string;
}

const TIER_ORDER = [
  SubscriptionTier.FREE,
  SubscriptionTier.BASIC,
  SubscriptionTier.PRO,
  SubscriptionTier.ELITE,
];

export function TierUpgradeCards({ currentTier, userId }: TierUpgradeCardsProps) {
  const [upgrading, setUpgrading] = useState<SubscriptionTier | null>(null);

  const currentTierIndex = TIER_ORDER.indexOf(currentTier);
  const availableTiers = TIER_ORDER.slice(currentTierIndex + 1);

  const handleUpgrade = async (tier: SubscriptionTier) => {
    setUpgrading(tier);
    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to upgrade subscription:', error);
    } finally {
      setUpgrading(null);
    }
  };

  if (availableTiers.length === 0) {
    return (
      <Card>
        <p className="text-center text-copy-muted">
          You're on the highest tier! 🎉
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {availableTiers.map((tier) => {
        const config = TIER_CONFIG[tier];
        return (
          <Card key={tier} className="flex flex-col">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">{config.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-accent">${config.price}</span>
                <span className="text-copy-muted">/month</span>
              </div>

              <ul className="mt-4 space-y-2">
                {config.features.coursesPerMonth === -1 ? (
                  <li className="flex items-start gap-2 text-sm text-copy">
                    <span className="text-accent">✓</span>
                    <span>Unlimited courses</span>
                  </li>
                ) : config.features.coursesPerMonth > 0 ? (
                  <li className="flex items-start gap-2 text-sm text-copy">
                    <span className="text-accent">✓</span>
                    <span>{config.features.coursesPerMonth} courses/month</span>
                  </li>
                ) : null}

                {config.features.liveSessionCreditsPerMonth > 0 && (
                  <li className="flex items-start gap-2 text-sm text-copy">
                    <span className="text-accent">✓</span>
                    <span>{config.features.liveSessionCreditsPerMonth} live session credits</span>
                  </li>
                )}

                {config.features.officeHoursAccess && (
                  <li className="flex items-start gap-2 text-sm text-copy">
                    <span className="text-accent">✓</span>
                    <span>1:1 office hours access</span>
                  </li>
                )}

                {config.features.exclusiveContent && (
                  <li className="flex items-start gap-2 text-sm text-copy">
                    <span className="text-accent">✓</span>
                    <span>Exclusive content</span>
                  </li>
                )}

                {config.features.earlyAccess && (
                  <li className="flex items-start gap-2 text-sm text-copy">
                    <span className="text-accent">✓</span>
                    <span>Early access to new content</span>
                  </li>
                )}
              </ul>
            </div>

            <Button
              className="mt-6 w-full"
              onClick={() => handleUpgrade(tier)}
              disabled={upgrading !== null}
            >
              {upgrading === tier ? 'Processing...' : `Upgrade to ${config.name}`}
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
