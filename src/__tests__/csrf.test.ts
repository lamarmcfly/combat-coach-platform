import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCsrfToken, validateCsrfToken } from '@/lib/csrf';

beforeEach(() => {
  vi.stubEnv('NEXTAUTH_SECRET', 'test-secret-for-csrf-testing-only-not-real');
});

describe('CSRF Token', () => {
  describe('generateCsrfToken', () => {
    it('should generate a token in the correct format', async () => {
      const token = await generateCsrfToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const parts = token.split(':');
      expect(parts).toHaveLength(3);

      // Random value should be 64 chars (32 bytes hex encoded)
      expect(parts[0]).toHaveLength(64);

      // Timestamp should be a valid number
      expect(parseInt(parts[1], 10)).toBeGreaterThan(0);

      // Signature should be 64 chars (sha256 hex)
      expect(parts[2]).toHaveLength(64);
    });

    it('should generate unique tokens', async () => {
      const tokens = new Set<string>();

      for (let i = 0; i < 100; i++) {
        tokens.add(await generateCsrfToken());
      }

      expect(tokens.size).toBe(100);
    });
  });

  describe('validateCsrfToken', () => {
    it('should validate a valid token', async () => {
      const token = await generateCsrfToken();
      const isValid = await validateCsrfToken(token);

      expect(isValid).toBe(true);
    });

    it('should reject an empty token', async () => {
      expect(await validateCsrfToken('')).toBe(false);
    });

    it('should reject a malformed token', async () => {
      expect(await validateCsrfToken('invalid')).toBe(false);
      expect(await validateCsrfToken('part1:part2')).toBe(false);
      expect(await validateCsrfToken('a:b:c:d')).toBe(false);
    });

    it('should reject a token with invalid signature', async () => {
      const token = await generateCsrfToken();
      const parts = token.split(':');

      // Tamper with the signature
      const tamperedToken = `${parts[0]}:${parts[1]}:invalid_signature`;

      expect(await validateCsrfToken(tamperedToken)).toBe(false);
    });

    it('should reject a token with modified content', async () => {
      const token = await generateCsrfToken();
      const parts = token.split(':');

      // Tamper with the random value
      const tamperedToken = `modified_random:${parts[1]}:${parts[2]}`;

      expect(await validateCsrfToken(tamperedToken)).toBe(false);
    });
  });
});
