'use client';

import { useState, useEffect, useCallback } from 'react';
import { SubscriptionTier } from '@prisma/client';

interface TrialInfo {
  isOnTrial: boolean;
  trialStart?: string;
  trialEnd?: string;
  daysRemaining?: number;
  tier?: SubscriptionTier;
}

interface TrialEligibility {
  eligible: boolean;
  reason?: string;
  hasHadTrial?: boolean;
}

interface TrialData {
  trialInfo: TrialInfo;
  eligibility: Record<string, TrialEligibility>;
  config: {
    durationDays: number;
    requirePaymentMethod: boolean;
  };
}

interface UseTrialResult {
  trialInfo: TrialInfo | null;
  eligibility: Record<string, TrialEligibility> | null;
  config: { durationDays: number; requirePaymentMethod: boolean } | null;
  isLoading: boolean;
  error: string | null;
  startTrial: (tier: SubscriptionTier, billingInterval?: 'monthly' | 'annual') => Promise<void>;
  refresh: () => Promise<void>;
}

export function useTrial(): UseTrialResult {
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [eligibility, setEligibility] = useState<Record<string, TrialEligibility> | null>(null);
  const [config, setConfig] = useState<{ durationDays: number; requirePaymentMethod: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/trial');

      if (!response.ok) {
        throw new Error('Failed to fetch trial data');
      }

      const data: TrialData = await response.json();

      setTrialInfo(data.trialInfo);
      setEligibility(data.eligibility);
      setConfig(data.config);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrialData();
  }, [fetchTrialData]);

  const startTrial = useCallback(async (
    tier: SubscriptionTier,
    billingInterval: 'monthly' | 'annual' = 'monthly'
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/trial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier, billingInterval }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start trial');
      }

      const data = await response.json();

      // Redirect to Stripe checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    trialInfo,
    eligibility,
    config,
    isLoading,
    error,
    startTrial,
    refresh: fetchTrialData,
  };
}
