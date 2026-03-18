import { describe, it, expect } from 'vitest';
import {
  signUpSchema,
  signInSchema,
  checkoutSchema,
  createReviewSchema,
  weightEntrySchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  liveSessionCheckoutSchema,
} from '@/lib/validation/schemas';

describe('Validation Schemas', () => {
  describe('signUpSchema', () => {
    it('should accept valid signup data', () => {
      const result = signUpSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = signUpSchema.safeParse({
        email: 'invalid-email',
        password: 'Password123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email');
      }
    });

    it('should reject weak passwords', () => {
      const weakPasswords = ['short', 'nouppercaseornumber', 'NOUPPERCASEORNUMBER', '12345678'];

      weakPasswords.forEach((password) => {
        const result = signUpSchema.safeParse({
          email: 'test@example.com',
          password,
        });
        expect(result.success).toBe(false);
      });
    });

    it('should accept password with all requirements', () => {
      const result = signUpSchema.safeParse({
        email: 'test@example.com',
        password: 'StrongPass123',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('signInSchema', () => {
    it('should accept valid signin data', () => {
      const result = signInSchema.safeParse({
        email: 'test@example.com',
        password: 'anypassword',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty password', () => {
      const result = signInSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('checkoutSchema', () => {
    it('should accept valid checkout for paid tiers', () => {
      const validTiers = ['BASIC', 'PRO', 'ELITE'];

      validTiers.forEach((tier) => {
        const result = checkoutSchema.safeParse({
          tier,
          billingInterval: 'monthly',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject FREE tier checkout', () => {
      const result = checkoutSchema.safeParse({
        tier: 'FREE',
        billingInterval: 'monthly',
      });
      expect(result.success).toBe(false);
    });

    it('should accept annual billing interval', () => {
      const result = checkoutSchema.safeParse({
        tier: 'PRO',
        billingInterval: 'annual',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('createReviewSchema', () => {
    it('should accept valid review', () => {
      const result = createReviewSchema.safeParse({
        rating: 5,
        title: 'Great course!',
        content: 'I learned so much from this course.',
      });
      expect(result.success).toBe(true);
    });

    it('should reject rating below 1', () => {
      const result = createReviewSchema.safeParse({
        rating: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject rating above 5', () => {
      const result = createReviewSchema.safeParse({
        rating: 6,
      });
      expect(result.success).toBe(false);
    });

    it('should accept rating without title and content', () => {
      const result = createReviewSchema.safeParse({
        rating: 4,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('weightEntrySchema', () => {
    it('should accept valid weight entry', () => {
      const result = weightEntrySchema.safeParse({
        weightKg: 75.5,
        notes: 'After morning workout',
      });
      expect(result.success).toBe(true);
    });

    it('should reject negative weight', () => {
      const result = weightEntrySchema.safeParse({
        weightKg: -10,
      });
      expect(result.success).toBe(false);
    });

    it('should reject unrealistic weight', () => {
      const result = weightEntrySchema.safeParse({
        weightKg: 600,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('passwordResetRequestSchema', () => {
    it('should accept valid email', () => {
      const result = passwordResetRequestSchema.safeParse({
        email: 'test@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = passwordResetRequestSchema.safeParse({
        email: 'not-an-email',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('passwordResetSchema', () => {
    it('should accept valid reset data', () => {
      const result = passwordResetSchema.safeParse({
        token: 'abc123',
        password: 'NewPassword123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty token', () => {
      const result = passwordResetSchema.safeParse({
        token: '',
        password: 'NewPassword123',
      });
      expect(result.success).toBe(false);
    });

    it('should validate password strength', () => {
      const result = passwordResetSchema.safeParse({
        token: 'abc123',
        password: 'weak',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('liveSessionCheckoutSchema', () => {
    it('should accept valid consent payload', () => {
      const result = liveSessionCheckoutSchema.safeParse({
        liveSessionId: 'session_123',
        useCredit: true,
        acceptedNoShowPolicy: true,
        acceptedSafetyWaiver: true,
        acceptedWaitlistAutoBilling: false,
      });
      expect(result.success).toBe(true);
    });

    it('should default useCredit to false when omitted', () => {
      const result = liveSessionCheckoutSchema.safeParse({
        liveSessionId: 'session_123',
        acceptedNoShowPolicy: true,
        acceptedSafetyWaiver: true,
        acceptedWaitlistAutoBilling: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.useCredit).toBe(false);
      }
    });

    it('should reject checkout when no-show policy is not acknowledged', () => {
      const result = liveSessionCheckoutSchema.safeParse({
        liveSessionId: 'session_123',
        acceptedNoShowPolicy: false,
        acceptedSafetyWaiver: true,
        acceptedWaitlistAutoBilling: true,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes('acceptedNoShowPolicy'))).toBe(true);
      }
    });

    it('should reject checkout when safety waiver is not acknowledged', () => {
      const result = liveSessionCheckoutSchema.safeParse({
        liveSessionId: 'session_123',
        acceptedNoShowPolicy: true,
        acceptedSafetyWaiver: false,
        acceptedWaitlistAutoBilling: true,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes('acceptedSafetyWaiver'))).toBe(true);
      }
    });
  });
});
