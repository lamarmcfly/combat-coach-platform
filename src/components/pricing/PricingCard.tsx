'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SubscriptionTier } from '@prisma/client';
import { useToast } from '@/contexts/ToastContext';

interface PricingCardProps {
  tier: SubscriptionTier;
  name: string;
  price: number;
  features: any;
  benefits: readonly string[];
  popular?: boolean;
  isCurrent: boolean;
  isUpgrade: boolean;
  isDowngrade: boolean;
  cancelAtPeriodEnd: boolean;
  isAuthenticated: boolean;
}

export function PricingCard({
  tier,
  name,
  price,
  benefits,
  popular,
  isCurrent,
  isUpgrade,
  isDowngrade,
  cancelAtPeriodEnd,
  isAuthenticated,
}: PricingCardProps) {
  const router = useRouter();
  const { error: showError } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      router.push('/auth/sign-in?redirect=/pricing');
      return;
    }

    if (tier === SubscriptionTier.FREE) {
      // Free tier - no action needed
      return;
    }

    setLoading(true);

    try {
      // Create checkout session
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      showError('Checkout Error', 'Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (isCurrent) {
      if (cancelAtPeriodEnd) {
        return 'Reactivate';
      }
      return 'Current Plan';
    }

    if (tier === SubscriptionTier.FREE) {
      return 'Free Forever';
    }

    if (isUpgrade) {
      return 'Upgrade';
    }

    if (isDowngrade) {
      return 'Downgrade';
    }

    return 'Get Started';
  };

  const getButtonStyle = () => {
    if (isCurrent && !cancelAtPeriodEnd) {
      return 'bg-gray-300 cursor-not-allowed';
    }

    if (popular || isUpgrade) {
      return 'bg-blue-600 hover:bg-blue-700 text-white';
    }

    return 'bg-gray-800 hover:bg-gray-900 text-white';
  };

  return (
    <div
      className={`relative bg-white rounded-lg shadow-lg p-8 flex flex-col ${
        popular ? 'ring-2 ring-blue-600' : ''
      } ${isCurrent ? 'ring-2 ring-green-500' : ''}`}
    >
      {/* Popular Badge */}
      {popular && !isCurrent && (
        <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 rounded-bl-lg rounded-tr-lg text-sm font-bold">
          Most Popular
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrent && (
        <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 rounded-bl-lg rounded-tr-lg text-sm font-bold">
          {cancelAtPeriodEnd ? 'Canceling Soon' : 'Current Plan'}
        </div>
      )}

      {/* Tier Name */}
      <h3 className="text-2xl font-bold mb-4">{name}</h3>

      {/* Price */}
      <div className="mb-6">
        <span className="text-4xl font-bold">${price}</span>
        {price > 0 && <span className="text-gray-600">/month</span>}
      </div>

      {/* Benefits List */}
      <ul className="space-y-3 mb-8 flex-grow">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex items-start">
            <svg
              className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-gray-700">{benefit}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        onClick={handleSubscribe}
        disabled={loading || (isCurrent && !cancelAtPeriodEnd) || tier === SubscriptionTier.FREE}
        className={`w-full py-3 px-6 rounded-lg font-bold transition-colors ${getButtonStyle()} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading ? 'Loading...' : getButtonText()}
      </button>

      {/* Downgrade Warning */}
      {isDowngrade && (
        <p className="text-sm text-gray-500 mt-2 text-center">
          Takes effect at end of billing period
        </p>
      )}
    </div>
  );
}
