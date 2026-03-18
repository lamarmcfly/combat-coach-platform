import { describe, it, expect } from 'vitest';

// Mock Prisma client module before importing
vi.mock('@prisma/client', () => ({
  SubscriptionTier: {
    FREE: 'FREE',
    BASIC: 'BASIC',
    PRO: 'PRO',
    ELITE: 'ELITE',
  },
}));

import { vi } from 'vitest';
import {
  TIER_CONFIG,
  CREDIT_PACKS,
  ANNUAL_DISCOUNT_PERCENT,
  getPriceId,
  getAnnualSavings,
  hasFeature,
  isUnlimited,
} from '@/lib/stripe/config';

describe('TIER_CONFIG', () => {
  it('defines all four subscription tiers', () => {
    expect(TIER_CONFIG).toHaveProperty('FREE');
    expect(TIER_CONFIG).toHaveProperty('BASIC');
    expect(TIER_CONFIG).toHaveProperty('PRO');
    expect(TIER_CONFIG).toHaveProperty('ELITE');
  });

  it('FREE tier has zero price', () => {
    expect(TIER_CONFIG.FREE.price).toBe(0);
    expect(TIER_CONFIG.FREE.annualPrice).toBe(0);
    expect(TIER_CONFIG.FREE.stripePriceId).toBeNull();
  });

  it('paid tiers have non-zero prices', () => {
    expect(TIER_CONFIG.BASIC.price).toBeGreaterThan(0);
    expect(TIER_CONFIG.PRO.price).toBeGreaterThan(0);
    expect(TIER_CONFIG.ELITE.price).toBeGreaterThan(0);
  });

  it('tier prices increase from BASIC to ELITE', () => {
    expect(TIER_CONFIG.BASIC.price).toBeLessThan(TIER_CONFIG.PRO.price);
    expect(TIER_CONFIG.PRO.price).toBeLessThan(TIER_CONFIG.ELITE.price);
  });

  it('annual prices offer savings over monthly', () => {
    const tiers = ['BASIC', 'PRO', 'ELITE'] as const;
    for (const tier of tiers) {
      const monthlyTotal = TIER_CONFIG[tier].price * 12;
      expect(TIER_CONFIG[tier].annualPrice).toBeLessThan(monthlyTotal);
    }
  });
});

describe('CREDIT_PACKS', () => {
  it('defines credit packs', () => {
    expect(CREDIT_PACKS.length).toBeGreaterThan(0);
  });

  it('each pack has credits and price', () => {
    for (const pack of CREDIT_PACKS) {
      expect(pack.credits).toBeGreaterThan(0);
      expect(pack.priceCents).toBeGreaterThan(0);
      expect(pack.id).toBeTruthy();
      expect(pack.name).toBeTruthy();
    }
  });

  it('larger packs offer better per-credit pricing', () => {
    for (let i = 1; i < CREDIT_PACKS.length; i++) {
      const prevRate = CREDIT_PACKS[i - 1].priceCents / CREDIT_PACKS[i - 1].credits;
      const currRate = CREDIT_PACKS[i].priceCents / CREDIT_PACKS[i].credits;
      expect(currRate).toBeLessThan(prevRate);
    }
  });
});

describe('getPriceId', () => {
  it('returns monthly price ID', () => {
    const priceId = getPriceId('BASIC' as any, 'monthly');
    expect(priceId).toBeTruthy();
  });

  it('returns annual price ID', () => {
    const priceId = getPriceId('PRO' as any, 'annual');
    expect(priceId).toBeTruthy();
  });

  it('returns null for FREE tier', () => {
    expect(getPriceId('FREE' as any, 'monthly')).toBeNull();
    expect(getPriceId('FREE' as any, 'annual')).toBeNull();
  });
});

describe('getAnnualSavings', () => {
  it('returns zero savings for FREE tier', () => {
    expect(getAnnualSavings('FREE' as any)).toBe(0);
  });

  it('returns positive savings for paid tiers', () => {
    expect(getAnnualSavings('BASIC' as any)).toBeGreaterThan(0);
    expect(getAnnualSavings('PRO' as any)).toBeGreaterThan(0);
    expect(getAnnualSavings('ELITE' as any)).toBeGreaterThan(0);
  });
});

describe('hasFeature', () => {
  it('FREE tier has no premium features', () => {
    expect(hasFeature('FREE' as any, 'officeHoursAccess')).toBe(false);
    expect(hasFeature('FREE' as any, 'exclusiveContent')).toBe(false);
  });

  it('ELITE tier has all features', () => {
    expect(hasFeature('ELITE' as any, 'officeHoursAccess')).toBe(true);
    expect(hasFeature('ELITE' as any, 'exclusiveContent')).toBe(true);
    expect(hasFeature('ELITE' as any, 'earlyAccess')).toBe(true);
  });
});

describe('isUnlimited', () => {
  it('FREE tier has no unlimited features', () => {
    expect(isUnlimited('FREE' as any, 'coursesPerMonth')).toBe(false);
    expect(isUnlimited('FREE' as any, 'liveSessionCreditsPerMonth')).toBe(false);
  });

  it('PRO has unlimited courses', () => {
    expect(isUnlimited('PRO' as any, 'coursesPerMonth')).toBe(true);
  });

  it('ELITE has unlimited everything', () => {
    expect(isUnlimited('ELITE' as any, 'coursesPerMonth')).toBe(true);
    expect(isUnlimited('ELITE' as any, 'liveSessionCreditsPerMonth')).toBe(true);
  });
});

describe('ANNUAL_DISCOUNT_PERCENT', () => {
  it('is 30%', () => {
    expect(ANNUAL_DISCOUNT_PERCENT).toBe(30);
  });
});
