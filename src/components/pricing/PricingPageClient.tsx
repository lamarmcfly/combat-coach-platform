'use client';

import { useState } from 'react';
import { SubscriptionTier } from '@prisma/client';
import { PricingCard } from './PricingCard';
import { BillingInterval } from '@/lib/stripe/config';

interface TierData {
  tier: SubscriptionTier;
  name: string;
  price: number;
  annualPrice: number;
  features: any;
  benefits: readonly string[];
  popular: boolean;
  isCurrent: boolean;
  isUpgrade: boolean;
  isDowngrade: boolean;
}

interface PricingPageClientProps {
  tierData: TierData[];
  cancelAtPeriodEnd: boolean;
  isAuthenticated: boolean;
  annualDiscountPercent: number;
}

export function PricingPageClient({
  tierData,
  cancelAtPeriodEnd,
  isAuthenticated,
  annualDiscountPercent,
}: PricingPageClientProps) {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  return (
    <>
      {/* Billing Toggle */}
      <div className="flex justify-center mb-12">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-1 flex items-center">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              billingInterval === 'monthly'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            aria-pressed={billingInterval === 'monthly'}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('annual')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              billingInterval === 'annual'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            aria-pressed={billingInterval === 'annual'}
          >
            Annual
            <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs px-2 py-0.5 rounded-full font-semibold">
              Save {annualDiscountPercent}%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        {tierData.map((data) => (
          <PricingCard
            key={data.tier}
            tier={data.tier}
            name={data.name}
            price={data.price}
            annualPrice={data.annualPrice}
            features={data.features}
            benefits={data.benefits}
            popular={data.popular}
            isCurrent={data.isCurrent}
            isUpgrade={data.isUpgrade}
            isDowngrade={data.isDowngrade}
            cancelAtPeriodEnd={cancelAtPeriodEnd}
            isAuthenticated={isAuthenticated}
            billingInterval={billingInterval}
          />
        ))}
      </div>
    </>
  );
}
