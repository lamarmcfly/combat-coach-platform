import { SubscriptionTier } from '@prisma/client';

/**
 * Subscription tier pricing and features configuration
 */
export const TIER_CONFIG = {
  [SubscriptionTier.FREE]: {
    name: 'Free',
    price: 0,
    stripePriceId: null,
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
    stripePriceId: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic_placeholder',
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
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_placeholder',
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
    stripePriceId: process.env.STRIPE_ELITE_PRICE_ID || 'price_elite_placeholder',
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
