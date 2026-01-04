import { SubscriptionTier } from '@prisma/client';

/**
 * Billing interval type
 */
export type BillingInterval = 'monthly' | 'annual';

/**
 * Annual discount percentage (30% off)
 */
export const ANNUAL_DISCOUNT_PERCENT = 30;

/**
 * Free trial configuration
 */
export const TRIAL_CONFIG = {
  durationDays: 14, // 14-day free trial
  eligibleTiers: [SubscriptionTier.BASIC, SubscriptionTier.PRO, SubscriptionTier.ELITE],
  requirePaymentMethod: true, // Require card upfront
  reminderDays: [3, 1], // Send reminders 3 days and 1 day before trial ends
} as const;

/**
 * Subscription tier pricing and features configuration
 */
export const TIER_CONFIG = {
  [SubscriptionTier.FREE]: {
    name: 'Free',
    price: 0,
    annualPrice: 0,
    stripePriceId: null,
    stripeAnnualPriceId: null,
    features: {
      coursesPerMonth: 0,
      liveSessionCreditsPerMonth: 0,
      officeHoursAccess: false,
      exclusiveContent: false,
      earlyAccess: false,
    },
    benefits: [
      'Browse all courses and sessions',
      'View coach profiles',
      'Access free content',
    ],
  },
  [SubscriptionTier.BASIC]: {
    name: 'Basic',
    price: 29,
    annualPrice: 244, // $29 * 12 * 0.70 = $243.60 rounded to $244 (~30% savings)
    stripePriceId: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic_placeholder',
    stripeAnnualPriceId: process.env.STRIPE_BASIC_ANNUAL_PRICE_ID || 'price_basic_annual_placeholder',
    features: {
      coursesPerMonth: 2,
      liveSessionCreditsPerMonth: 0,
      officeHoursAccess: false,
      exclusiveContent: false,
      earlyAccess: false,
    },
    benefits: [
      '2 courses per month',
      'Full access to enrolled courses',
      'Course completion certificates',
      'Community forum access',
    ],
  },
  [SubscriptionTier.PRO]: {
    name: 'Pro',
    price: 79,
    annualPrice: 664, // $79 * 12 * 0.70 = $663.60 rounded to $664 (~30% savings)
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_placeholder',
    stripeAnnualPriceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || 'price_pro_annual_placeholder',
    features: {
      coursesPerMonth: -1, // unlimited
      liveSessionCreditsPerMonth: 2,
      officeHoursAccess: false,
      exclusiveContent: false,
      earlyAccess: false,
    },
    benefits: [
      'Unlimited course access',
      '2 live session credits per month',
      'Priority support',
      'Downloadable course materials',
      'Progress tracking and analytics',
    ],
    popular: true,
  },
  [SubscriptionTier.ELITE]: {
    name: 'Elite',
    price: 199,
    annualPrice: 1672, // $199 * 12 * 0.70 = $1671.60 rounded to $1672 (~30% savings)
    stripePriceId: process.env.STRIPE_ELITE_PRICE_ID || 'price_elite_placeholder',
    stripeAnnualPriceId: process.env.STRIPE_ELITE_ANNUAL_PRICE_ID || 'price_elite_annual_placeholder',
    features: {
      coursesPerMonth: -1, // unlimited
      liveSessionCreditsPerMonth: -1, // unlimited
      officeHoursAccess: true,
      exclusiveContent: true,
      earlyAccess: true,
    },
    benefits: [
      'All Pro features',
      'Unlimited live sessions',
      'Weekly 1:1 office hours with coaches',
      'Exclusive Elite-only content',
      'Early access to new courses',
      'VIP community access',
      'Personalized training recommendations',
    ],
  },
} as const;

/**
 * Get price ID based on billing interval
 */
export function getPriceId(tier: SubscriptionTier, interval: BillingInterval): string | null {
  const config = TIER_CONFIG[tier];
  return interval === 'annual' ? config.stripeAnnualPriceId : config.stripePriceId;
}

/**
 * Calculate annual savings
 */
export function getAnnualSavings(tier: SubscriptionTier): number {
  const config = TIER_CONFIG[tier];
  const monthlyTotal = config.price * 12;
  return monthlyTotal - config.annualPrice;
}

/**
 * Credit pack configurations
 */
export const CREDIT_PACKS = [
  {
    id: 'pack_5',
    name: '5 Session Pack',
    credits: 5,
    priceCents: 8900, // $89 (10% discount from $99)
    stripePriceId: process.env.STRIPE_PACK_5_PRICE_ID || 'price_pack_5_placeholder',
    savings: 10, // percentage
  },
  {
    id: 'pack_10',
    name: '10 Session Pack',
    credits: 10,
    priceCents: 15900, // $159 (20% discount from $198)
    stripePriceId: process.env.STRIPE_PACK_10_PRICE_ID || 'price_pack_10_placeholder',
    savings: 20,
    popular: true,
  },
  {
    id: 'pack_20',
    name: '20 Session Pack',
    credits: 20,
    priceCents: 27900, // $279 (30% discount from $396)
    stripePriceId: process.env.STRIPE_PACK_20_PRICE_ID || 'price_pack_20_placeholder',
    savings: 30,
  },
] as const;

/**
 * Check if a tier has a specific feature
 */
export function hasFeature(
  tier: SubscriptionTier,
  feature: keyof typeof TIER_CONFIG[SubscriptionTier]['features']
): boolean {
  return TIER_CONFIG[tier].features[feature] === true || TIER_CONFIG[tier].features[feature] === -1;
}

/**
 * Check if a tier allows unlimited access to a feature
 */
export function isUnlimited(
  tier: SubscriptionTier,
  feature: keyof typeof TIER_CONFIG[SubscriptionTier]['features']
): boolean {
  return TIER_CONFIG[tier].features[feature] === -1;
}

/**
 * Get the monthly limit for a feature, or -1 for unlimited
 */
export function getFeatureLimit(
  tier: SubscriptionTier,
  feature: keyof typeof TIER_CONFIG[SubscriptionTier]['features']
): number {
  const value = TIER_CONFIG[tier].features[feature];
  return typeof value === 'number' ? value : 0;
}

/**
 * Compare tier levels (returns positive if tierA > tierB)
 */
export function compareTiers(tierA: SubscriptionTier, tierB: SubscriptionTier): number {
  const order = [
    SubscriptionTier.FREE,
    SubscriptionTier.BASIC,
    SubscriptionTier.PRO,
    SubscriptionTier.ELITE,
  ];
  return order.indexOf(tierA) - order.indexOf(tierB);
}

/**
 * Check if tierA is higher than or equal to tierB
 */
export function hasMinimumTier(
  userTier: SubscriptionTier,
  requiredTier: SubscriptionTier
): boolean {
  return compareTiers(userTier, requiredTier) >= 0;
}
