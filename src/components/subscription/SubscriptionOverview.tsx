'use client';

import { useState } from 'react';
import { SubscriptionTier, Subscription, SubscriptionStatus } from '@prisma/client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';

interface SubscriptionOverviewProps {
  tier: SubscriptionTier;
  tierConfig: any;
  subscription: Subscription | null;
}

export function SubscriptionOverview({
  tier,
  tierConfig,
  subscription,
}: SubscriptionOverviewProps) {
  const { success, error: showError } = useToast();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  const handleManageSubscription = async () => {
    setIsLoadingPortal(true);
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        showError('Error', data.error);
      }
    } catch (error) {
      console.error('Failed to open billing portal:', error);
      showError('Error', 'Failed to open billing portal');
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!showCancelConfirm) {
      setShowCancelConfirm(true);
      return;
    }

    setIsCanceling(true);
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
      });
      if (response.ok) {
        success('Subscription Canceled', 'You will retain access until the end of your billing period.');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error('Failed to cancel');
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      showError('Error', 'Failed to cancel subscription. Please try again.');
    } finally {
      setIsCanceling(false);
      setShowCancelConfirm(false);
    }
  };

  const getStatusBadge = (status?: SubscriptionStatus) => {
    if (!status || status === 'ACTIVE') return <Badge variant="success">Active</Badge>;
    if (status === 'CANCELED') return <Badge variant="warning">Canceled</Badge>;
    if (status === 'PAST_DUE') return <Badge variant="error">Past Due</Badge>;
    return <Badge>{status}</Badge>;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">{tierConfig.name} Plan</h2>
            {subscription && getStatusBadge(subscription.status)}
          </div>
          {tier !== SubscriptionTier.FREE && (
            <p className="mt-1 text-3xl font-bold text-accent">
              ${tierConfig.price}
              <span className="text-base font-normal text-copy-muted">/month</span>
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-copy-muted">
            Plan Features
          </h3>
          <ul className="mt-3 space-y-2">
            {tierConfig.features.coursesPerMonth === -1 ? (
              <li className="flex items-center gap-2 text-copy">
                <span className="text-accent">✓</span> Unlimited courses per month
              </li>
            ) : tierConfig.features.coursesPerMonth > 0 ? (
              <li className="flex items-center gap-2 text-copy">
                <span className="text-accent">✓</span> {tierConfig.features.coursesPerMonth}{' '}
                courses per month
              </li>
            ) : null}

            {tierConfig.features.liveSessionCreditsPerMonth === -1 ? (
              <li className="flex items-center gap-2 text-copy">
                <span className="text-accent">✓</span> Unlimited live session credits
              </li>
            ) : tierConfig.features.liveSessionCreditsPerMonth > 0 ? (
              <li className="flex items-center gap-2 text-copy">
                <span className="text-accent">✓</span>{' '}
                {tierConfig.features.liveSessionCreditsPerMonth} live session credits/month
              </li>
            ) : null}

            {tierConfig.features.officeHoursAccess && (
              <li className="flex items-center gap-2 text-copy">
                <span className="text-accent">✓</span> 1:1 office hours access
              </li>
            )}

            {tierConfig.features.exclusiveContent && (
              <li className="flex items-center gap-2 text-copy">
                <span className="text-accent">✓</span> Exclusive content
              </li>
            )}

            {tierConfig.features.earlyAccess && (
              <li className="flex items-center gap-2 text-copy">
                <span className="text-accent">✓</span> Early access to new courses
              </li>
            )}
          </ul>
        </div>

        {subscription && subscription.status !== 'CANCELED' && (
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-copy-muted">Current period ends</span>
              <span className="font-medium text-copy">
                {formatDate(subscription.currentPeriodEnd)}
              </span>
            </div>
          </div>
        )}

        {tier !== SubscriptionTier.FREE && (
          <div className="space-y-4 pt-4">
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleManageSubscription}
                disabled={isLoadingPortal}
              >
                {isLoadingPortal ? 'Loading...' : 'Manage Billing'}
              </Button>
              {subscription?.status === 'ACTIVE' && !showCancelConfirm && (
                <Button variant="outline" onClick={handleCancelSubscription}>
                  Cancel Plan
                </Button>
              )}
            </div>

            {showCancelConfirm && (
              <div className="rounded-lg border border-red-800 bg-red-900/20 p-4">
                <p className="text-sm text-red-300 mb-3">
                  Are you sure you want to cancel? You will retain access until the end of your billing period.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCancelConfirm(false)}
                    disabled={isCanceling}
                  >
                    Keep Plan
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCancelSubscription}
                    disabled={isCanceling}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isCanceling ? 'Canceling...' : 'Yes, Cancel'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
