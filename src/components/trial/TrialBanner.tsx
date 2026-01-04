'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SubscriptionTier } from '@prisma/client';
import { TRIAL_CONFIG, TIER_CONFIG } from '@/lib/stripe/config';

interface TrialBannerProps {
  tier: SubscriptionTier;
  onStartTrial: (tier: SubscriptionTier) => void;
  isLoading?: boolean;
  isEligible?: boolean;
}

export function TrialBanner({
  tier,
  onStartTrial,
  isLoading = false,
  isEligible = true,
}: TrialBannerProps) {
  const config = TIER_CONFIG[tier];

  if (!isEligible || tier === SubscriptionTier.FREE) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-lg p-4 mb-4"
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="font-semibold">
            Try {config.name} Free for {TRIAL_CONFIG.durationDays} Days
          </h3>
          <p className="text-sm text-white/90 mt-1">
            No charge until your trial ends. Cancel anytime.
          </p>
        </div>
        <button
          onClick={() => onStartTrial(tier)}
          disabled={isLoading}
          className="bg-white text-brand-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Starting...' : 'Start Free Trial'}
        </button>
      </div>
    </motion.div>
  );
}

interface TrialStatusBadgeProps {
  daysRemaining: number;
  tier: SubscriptionTier;
  onManage?: () => void;
}

export function TrialStatusBadge({
  daysRemaining,
  tier,
  onManage,
}: TrialStatusBadgeProps) {
  const config = TIER_CONFIG[tier];
  const isUrgent = daysRemaining <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-lg p-4 ${
        isUrgent
          ? 'bg-amber-50 border border-amber-200'
          : 'bg-brand-50 border border-brand-200'
      }`}
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                isUrgent
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-brand-100 text-brand-800'
              }`}
            >
              Trial
            </span>
            <span className="font-semibold text-gray-900">{config.name} Plan</span>
          </div>
          <p className={`text-sm mt-1 ${isUrgent ? 'text-amber-700' : 'text-gray-600'}`}>
            {daysRemaining === 0
              ? 'Your trial ends today!'
              : daysRemaining === 1
              ? '1 day remaining in your trial'
              : `${daysRemaining} days remaining in your trial`}
          </p>
        </div>
        {onManage && (
          <button
            onClick={onManage}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isUrgent
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-brand-600 text-white hover:bg-brand-700'
            }`}
          >
            {isUrgent ? 'Keep My Plan' : 'Manage Subscription'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

interface TrialCardProps {
  tier: SubscriptionTier;
  onStartTrial: (tier: SubscriptionTier) => void;
  isLoading?: boolean;
  isEligible?: boolean;
}

export function TrialCard({
  tier,
  onStartTrial,
  isLoading = false,
  isEligible = true,
}: TrialCardProps) {
  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'annual'>('monthly');
  const config = TIER_CONFIG[tier];

  if (tier === SubscriptionTier.FREE) {
    return null;
  }

  const price = selectedInterval === 'annual' ? config.annualPrice : config.price;
  const monthlyEquivalent = selectedInterval === 'annual'
    ? Math.round(config.annualPrice / 12)
    : config.price;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Trial badge */}
      {isEligible && (
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 text-white text-center py-2 text-sm font-medium">
          {TRIAL_CONFIG.durationDays}-Day Free Trial Available
        </div>
      )}

      <div className="p-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">{config.name}</h3>
          <div className="mt-4">
            <span className="text-4xl font-bold text-gray-900">${monthlyEquivalent}</span>
            <span className="text-gray-500">/month</span>
            {selectedInterval === 'annual' && (
              <p className="text-sm text-green-600 mt-1">
                Billed ${price}/year (save 30%)
              </p>
            )}
          </div>
        </div>

        {/* Billing interval toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setSelectedInterval('monthly')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedInterval === 'monthly'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedInterval('annual')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedInterval === 'annual'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual
            </button>
          </div>
        </div>

        {/* Benefits list */}
        <ul className="space-y-3 mb-6">
          {config.benefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-500 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-gray-600 text-sm">{benefit}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        {isEligible ? (
          <button
            onClick={() => onStartTrial(tier)}
            disabled={isLoading}
            className="w-full bg-brand-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Starting...' : `Start ${TRIAL_CONFIG.durationDays}-Day Free Trial`}
          </button>
        ) : (
          <button
            disabled
            className="w-full bg-gray-300 text-gray-600 py-3 rounded-lg font-semibold cursor-not-allowed"
          >
            Trial Not Available
          </button>
        )}

        <p className="text-center text-xs text-gray-500 mt-4">
          No charge until trial ends. Cancel anytime.
        </p>
      </div>
    </div>
  );
}
