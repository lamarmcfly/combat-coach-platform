'use client';

import { useState, useEffect } from 'react';
import { SubscriptionTier } from '@prisma/client';
import { TIER_LIMITS } from '@/components/subscription/UpgradeTrigger';

interface FeatureUsage {
  coursesEnrolled: number;
  sessionsBooked: number;
  coachingRequests: number;
  videoUploads: number;
  officeHoursBooked: number;
}

interface UsageWithLimits {
  usage: FeatureUsage;
  limits: typeof TIER_LIMITS[SubscriptionTier];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFeatureUsage(tier: SubscriptionTier): UsageWithLimits {
  const [usage, setUsage] = useState<FeatureUsage>({
    coursesEnrolled: 0,
    sessionsBooked: 0,
    coachingRequests: 0,
    videoUploads: 0,
    officeHoursBooked: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/user/usage');
      if (!response.ok) {
        throw new Error('Failed to fetch usage');
      }

      const data = await response.json();
      setUsage(data.usage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  return {
    usage,
    limits: TIER_LIMITS[tier],
    isLoading,
    error,
    refetch: fetchUsage,
  };
}

// Check if a specific feature is at limit
export function isFeatureAtLimit(
  feature: keyof FeatureUsage,
  usage: FeatureUsage,
  tier: SubscriptionTier
): boolean {
  const limits = TIER_LIMITS[tier];
  const limitKey = feature.replace(/([A-Z])/g, (match) => match.toLowerCase()) + 'PerMonth';
  const limit = limits[limitKey as keyof typeof limits];

  if (limit === undefined || limit === 999) return false; // No limit or unlimited
  return usage[feature] >= limit;
}

// Get remaining uses for a feature
export function getRemainingUses(
  feature: keyof FeatureUsage,
  usage: FeatureUsage,
  tier: SubscriptionTier
): number {
  const limits = TIER_LIMITS[tier];
  const featureToLimit: Record<keyof FeatureUsage, keyof typeof limits> = {
    coursesEnrolled: 'coursesPerMonth',
    sessionsBooked: 'liveSessionsPerMonth',
    coachingRequests: 'coachingRequestsPerMonth',
    videoUploads: 'videoUploadsPerMonth',
    officeHoursBooked: 'officeHoursPerMonth',
  };

  const limit = limits[featureToLimit[feature]];
  if (limit === 999) return Infinity; // Unlimited
  return Math.max(0, limit - usage[feature]);
}
