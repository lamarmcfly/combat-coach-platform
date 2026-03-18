import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('encryption', () => {
  const TEST_KEY = 'a'.repeat(64); // 32 bytes in hex

  beforeEach(() => {
    vi.stubEnv('ENCRYPTION_KEY', TEST_KEY);
    vi.resetModules();
  });

  it('encrypts and decrypts a string correctly', async () => {
    const { encrypt, decrypt } = await import('@/lib/crypto/encryption');
    const plaintext = 'secret-oauth-token-12345';
    const encrypted = encrypt(plaintext);

    expect(encrypted).not.toBe(plaintext);
    expect(encrypted).toContain(':'); // iv:authTag:ciphertext format

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('produces different ciphertexts for the same plaintext (random IV)', async () => {
    const { encrypt } = await import('@/lib/crypto/encryption');
    const plaintext = 'same-input';
    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);

    expect(encrypted1).not.toBe(encrypted2);
  });

  it('output has three colon-separated parts', async () => {
    const { encrypt } = await import('@/lib/crypto/encryption');
    const encrypted = encrypt('test');
    const parts = encrypted.split(':');
    expect(parts).toHaveLength(3);

    // IV is 12 bytes = 24 hex chars
    expect(parts[0]).toHaveLength(24);
    // Auth tag is 16 bytes = 32 hex chars
    expect(parts[1]).toHaveLength(32);
    // Ciphertext length varies
    expect(parts[2].length).toBeGreaterThan(0);
  });

  it('throws on invalid ciphertext format', async () => {
    const { decrypt } = await import('@/lib/crypto/encryption');
    expect(() => decrypt('not-valid')).toThrow();
    expect(() => decrypt('a:b')).toThrow();
    expect(() => decrypt('')).toThrow();
  });

  it('throws when ENCRYPTION_KEY is missing', async () => {
    vi.stubEnv('ENCRYPTION_KEY', '');
    vi.resetModules();
    const { encrypt } = await import('@/lib/crypto/encryption');
    expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY');
  });

  it('throws when ENCRYPTION_KEY is wrong length', async () => {
    vi.stubEnv('ENCRYPTION_KEY', 'tooshort');
    vi.resetModules();
    const { encrypt } = await import('@/lib/crypto/encryption');
    expect(() => encrypt('test')).toThrow('64 hex characters');
  });

  it('fails to decrypt with wrong key', async () => {
    const { encrypt } = await import('@/lib/crypto/encryption');
    const encrypted = encrypt('secret');

    // Change key
    vi.stubEnv('ENCRYPTION_KEY', 'b'.repeat(64));
    vi.resetModules();
    const { decrypt } = await import('@/lib/crypto/encryption');

    expect(() => decrypt(encrypted)).toThrow();
  });

  it('handles empty string', async () => {
    const { encrypt, decrypt } = await import('@/lib/crypto/encryption');
    const encrypted = encrypt('');
    expect(decrypt(encrypted)).toBe('');
  });

  it('handles unicode strings', async () => {
    const { encrypt, decrypt } = await import('@/lib/crypto/encryption');
    const plaintext = 'Hello 世界 🥊';
    const encrypted = encrypt(plaintext);
    expect(decrypt(encrypted)).toBe(plaintext);
  });
});
