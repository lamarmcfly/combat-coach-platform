import { z } from 'zod';
import { SubscriptionTier } from '@prisma/client';

// ============================================
// Auth Schemas
// ============================================

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long').optional(),
  lastName: z.string().max(50, 'Last name too long').optional(),
});

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

// ============================================
// Subscription Schemas
// ============================================

export const checkoutSchema = z.object({
  tier: z.nativeEnum(SubscriptionTier).refine(
    (tier) => tier !== SubscriptionTier.FREE,
    'Cannot checkout for free tier'
  ),
  billingInterval: z.enum(['monthly', 'annual']).default('monthly'),
});

export const updateSubscriptionSchema = z.object({
  tier: z.nativeEnum(SubscriptionTier),
  prorate: z.boolean().default(true),
});

export const liveSessionCheckoutSchema = z
  .object({
    liveSessionId: z.string().min(1, 'Live session ID is required'),
    useCredit: z.boolean().optional().default(false),
    acceptedNoShowPolicy: z.boolean(),
    acceptedSafetyWaiver: z.boolean(),
    acceptedWaitlistAutoBilling: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.acceptedNoShowPolicy) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['acceptedNoShowPolicy'],
        message: 'You must acknowledge the no-show policy to continue',
      });
    }

    if (!data.acceptedSafetyWaiver) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['acceptedSafetyWaiver'],
        message: 'You must acknowledge the training safety waiver to continue',
      });
    }
  });

// ============================================
// Review Schemas
// ============================================

export const createReviewSchema = z.object({
  rating: z
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  title: z.string().max(200, 'Title too long').optional().nullable(),
  content: z.string().max(5000, 'Review too long').optional().nullable(),
});

export const updateReviewSchema = z.object({
  rating: z
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5')
    .optional(),
  title: z.string().max(200, 'Title too long').optional().nullable(),
  content: z.string().max(5000, 'Review too long').optional().nullable(),
});

// ============================================
// Office Hours Schemas
// ============================================

export const bookOfficeHoursSchema = z.object({
  slotId: z.string().cuid('Invalid slot ID'),
  notes: z.string().max(1000, 'Notes too long').optional(),
});

export const createOfficeHoursSlotSchema = z.object({
  startTime: z.string().datetime('Invalid start time'),
  endTime: z.string().datetime('Invalid end time'),
  maxAttendees: z.number().int().min(1).max(20).default(1),
  meetingUrl: z.string().url('Invalid meeting URL').optional().nullable(),
});

// ============================================
// Coaching Request Schemas
// ============================================

export const createCoachingRequestSchema = z.object({
  coachId: z.string().cuid('Invalid coach ID'),
  courseId: z.string().cuid('Invalid course ID').optional().nullable(),
  message: z.string().min(10, 'Message too short').max(2000, 'Message too long'),
  requestType: z.enum(['TECHNIQUE_REVIEW', 'GENERAL_ADVICE', 'FIGHT_ANALYSIS', 'TRAINING_PLAN']),
});

export const respondToCoachingRequestSchema = z.object({
  response: z.string().min(10, 'Response too short').max(5000, 'Response too long'),
});

// ============================================
// Weight Tracking Schemas
// ============================================

export const weightEntrySchema = z.object({
  weightKg: z.number().positive('Weight must be positive').max(500, 'Weight too large'),
  notes: z.string().max(500, 'Notes too long').optional().nullable(),
  recordedAt: z.string().datetime().optional(),
});

export const weightGoalSchema = z.object({
  targetWeightKg: z.number().positive('Weight must be positive').max(500, 'Weight too large'),
  targetDate: z.string().datetime('Invalid target date').optional().nullable(),
  weightClass: z.string().max(50, 'Weight class too long').optional().nullable(),
  notes: z.string().max(500, 'Notes too long').optional().nullable(),
});

// ============================================
// Profile Schemas
// ============================================

export const updateProfileSchema = z.object({
  firstName: z.string().max(50, 'First name too long').optional(),
  lastName: z.string().max(50, 'Last name too long').optional(),
});

export const updateCoachProfileSchema = z.object({
  displayName: z.string().min(1, 'Display name required').max(100, 'Display name too long'),
  tagline: z.string().max(200, 'Tagline too long').optional().nullable(),
  bio: z.string().max(5000, 'Bio too long').optional().nullable(),
  hourlyRateCents: z.number().int().min(0).max(100000).optional().nullable(),
});

// ============================================
// Helper Types
// ============================================

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type BookOfficeHoursInput = z.infer<typeof bookOfficeHoursSchema>;
export type WeightEntryInput = z.infer<typeof weightEntrySchema>;
export type WeightGoalInput = z.infer<typeof weightGoalSchema>;
