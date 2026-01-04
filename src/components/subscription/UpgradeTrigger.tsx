'use client';

import { useState } from 'react';
import { SubscriptionTier } from '@prisma/client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface UpgradeTriggerProps {
  currentTier: SubscriptionTier;
  feature: string;
  requiredTier: SubscriptionTier;
  limit?: number;
  used?: number;
  children?: React.ReactNode;
  variant?: 'inline' | 'modal' | 'banner';
  onUpgradeClick?: () => void;
}

const tierOrder: Record<SubscriptionTier, number> = {
  FREE: 0,
  BASIC: 1,
  PRO: 2,
  ELITE: 3,
};

const tierNames: Record<SubscriptionTier, string> = {
  FREE: 'Free',
  BASIC: 'Basic',
  PRO: 'Pro',
  ELITE: 'Elite',
};

const tierColors: Record<SubscriptionTier, string> = {
  FREE: 'bg-gray-100 text-gray-700',
  BASIC: 'bg-blue-100 text-blue-700',
  PRO: 'bg-purple-100 text-purple-700',
  ELITE: 'bg-amber-100 text-amber-700',
};

export function UpgradeTrigger({
  currentTier,
  feature,
  requiredTier,
  limit,
  used,
  children,
  variant = 'inline',
  onUpgradeClick,
}: UpgradeTriggerProps) {
  const [showModal, setShowModal] = useState(false);
  const needsUpgrade = tierOrder[currentTier] < tierOrder[requiredTier];
  const isAtLimit = limit !== undefined && used !== undefined && used >= limit;

  if (!needsUpgrade && !isAtLimit) {
    return <>{children}</>;
  }

  if (variant === 'inline') {
    return (
      <div className="relative">
        {children && <div className="opacity-50 pointer-events-none">{children}</div>}
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg">
          <div className="text-center p-4">
            <div className="text-2xl mb-2">🔒</div>
            <p className="text-sm text-gray-600 mb-3">
              {isAtLimit
                ? `You've reached your ${feature} limit (${used}/${limit})`
                : `${feature} requires ${tierNames[requiredTier]} or higher`}
            </p>
            <Link
              href="/my/subscription"
              onClick={onUpgradeClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
            >
              Upgrade Now
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-brand-600 to-brand-800 rounded-xl p-4 text-white shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <p className="font-medium">
                {isAtLimit
                  ? `You've used ${used} of ${limit} ${feature}`
                  : `Unlock ${feature}`}
              </p>
              <p className="text-brand-200 text-sm">
                Upgrade to {tierNames[requiredTier]} for more
              </p>
            </div>
          </div>
          <Link
            href="/my/subscription"
            onClick={onUpgradeClick}
            className="px-4 py-2 bg-white text-brand-700 rounded-lg hover:bg-brand-50 transition-colors text-sm font-medium"
          >
            Upgrade
          </Link>
        </div>
        {isAtLimit && limit && used !== undefined && (
          <div className="mt-3">
            <div className="w-full bg-brand-900/50 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full"
                style={{ width: `${Math.min((used / limit) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // Modal variant
  return (
    <>
      <div onClick={() => setShowModal(true)} className="cursor-pointer">
        {children}
      </div>
      <AnimatePresence>
        {showModal && (
          <UpgradeModal
            feature={feature}
            requiredTier={requiredTier}
            currentTier={currentTier}
            limit={limit}
            used={used}
            onClose={() => setShowModal(false)}
            onUpgradeClick={onUpgradeClick}
          />
        )}
      </AnimatePresence>
    </>
  );
}

interface UpgradeModalProps {
  feature: string;
  requiredTier: SubscriptionTier;
  currentTier: SubscriptionTier;
  limit?: number;
  used?: number;
  onClose: () => void;
  onUpgradeClick?: () => void;
}

function UpgradeModal({
  feature,
  requiredTier,
  currentTier,
  limit,
  used,
  onClose,
  onUpgradeClick,
}: UpgradeModalProps) {
  const isAtLimit = limit !== undefined && used !== undefined && used >= limit;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚀</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isAtLimit ? 'Limit Reached' : 'Upgrade Required'}
          </h2>
          <p className="text-gray-600">
            {isAtLimit
              ? `You've used all ${limit} ${feature} available on your ${tierNames[currentTier]} plan.`
              : `${feature} is available on the ${tierNames[requiredTier]} plan and above.`}
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Current Plan</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${tierColors[currentTier]}`}>
              {tierNames[currentTier]}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Recommended</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${tierColors[requiredTier]}`}>
              {tierNames[requiredTier]}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/my/subscription"
            onClick={() => {
              onUpgradeClick?.();
              onClose();
            }}
            className="block w-full py-3 px-4 bg-brand-600 text-white text-center rounded-xl font-medium hover:bg-brand-700 transition-colors"
          >
            View Upgrade Options
          </Link>
          <button
            onClick={onClose}
            className="block w-full py-3 px-4 bg-gray-100 text-gray-700 text-center rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Utility hook for checking tier access
export function useTierAccess(currentTier: SubscriptionTier, requiredTier: SubscriptionTier) {
  return tierOrder[currentTier] >= tierOrder[requiredTier];
}

// Feature limits by tier
export const TIER_LIMITS = {
  FREE: {
    coursesPerMonth: 0,
    liveSessionsPerMonth: 0,
    coachingRequestsPerMonth: 0,
    videoUploadsPerMonth: 0,
    officeHoursPerMonth: 0,
  },
  BASIC: {
    coursesPerMonth: 2,
    liveSessionsPerMonth: 2,
    coachingRequestsPerMonth: 3,
    videoUploadsPerMonth: 5,
    officeHoursPerMonth: 0,
  },
  PRO: {
    coursesPerMonth: 999, // Unlimited
    liveSessionsPerMonth: 8,
    coachingRequestsPerMonth: 10,
    videoUploadsPerMonth: 20,
    officeHoursPerMonth: 0,
  },
  ELITE: {
    coursesPerMonth: 999,
    liveSessionsPerMonth: 999,
    coachingRequestsPerMonth: 999,
    videoUploadsPerMonth: 999,
    officeHoursPerMonth: 4,
  },
} as const;
