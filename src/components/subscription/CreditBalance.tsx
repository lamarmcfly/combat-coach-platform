'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const CREDIT_PACKS = [
  { credits: 5, price: 45, savings: 0 },
  { credits: 10, price: 85, savings: 5 },
  { credits: 20, price: 160, savings: 20 },
];

interface CreditBalanceProps {
  totalCredits: number;
  monthlyCredits: number;
  userId: string;
}

export function CreditBalance({ totalCredits, monthlyCredits, userId }: CreditBalanceProps) {
  const [purchasing, setPurchasing] = useState<number | null>(null);

  const handlePurchaseCredits = async (packCredits: number, packPrice: number) => {
    setPurchasing(packCredits);
    try {
      const response = await fetch('/api/credits/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits: packCredits, price: packPrice }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to purchase credits:', error);
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold text-white">Live Session Credits</h3>

      <div className="mt-4 rounded-lg bg-background-card p-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-accent">{totalCredits}</span>
          <span className="text-copy-muted">total credits</span>
        </div>
        <div className="mt-2 text-sm text-copy-muted">
          {monthlyCredits > 0 && (
            <p>Monthly credits remaining: {monthlyCredits}</p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-copy-muted">
          Purchase Credit Packs
        </h4>
        <div className="space-y-3">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.credits}
              className="flex items-center justify-between rounded-lg border border-border bg-background-card p-3"
            >
              <div>
                <p className="font-semibold text-white">{pack.credits} Credits</p>
                <p className="text-sm text-copy-muted">
                  ${pack.price}
                  {pack.savings > 0 && (
                    <span className="ml-2 text-accent">Save ${pack.savings}</span>
                  )}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handlePurchaseCredits(pack.credits, pack.price)}
                disabled={purchasing !== null}
              >
                {purchasing === pack.credits ? 'Processing...' : 'Buy'}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-background-card p-4">
        <p className="text-xs text-copy-muted">
          <strong>Note:</strong> Purchased credits expire 12 months from purchase date. Monthly
          subscription credits renew each billing cycle.
        </p>
      </div>
    </Card>
  );
}
