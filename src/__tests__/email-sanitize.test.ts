import { describe, it, expect, vi, beforeEach } from 'vitest';
import { escapeHtml, validateEmailUrl } from '@/lib/email/sanitize';

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });

  it('escapes all special characters combined', () => {
    expect(escapeHtml('<b>"A & B"</b>')).toBe(
      '&lt;b&gt;&quot;A &amp; B&quot;&lt;/b&gt;'
    );
  });

  it('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('returns empty string for null/undefined input', () => {
    // @ts-expect-error testing runtime behavior
    expect(escapeHtml(null)).toBe('');
    // @ts-expect-error testing runtime behavior
    expect(escapeHtml(undefined)).toBe('');
  });

  it('returns unmodified string when no special chars', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });
});

describe('validateEmailUrl', () => {
  const BASE_URL = 'https://combatcoach.app';

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', BASE_URL);
  });

  it('returns the URL if it starts with the base URL', () => {
    const url = `${BASE_URL}/auth/verify-email?token=abc`;
    expect(validateEmailUrl(url, BASE_URL)).toBe(url);
  });

  it('returns base URL for URLs that do not match', () => {
    const maliciousUrl = 'https://evil.com/phishing';
    expect(validateEmailUrl(maliciousUrl, BASE_URL)).toBe(BASE_URL);
  });

  it('returns base URL for javascript: protocol', () => {
    expect(validateEmailUrl('javascript:alert(1)', BASE_URL)).toBe(BASE_URL);
  });

  it('accepts any URL when empty base is passed explicitly', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    const url = 'https://anything.com/path';
    // When explicit empty string is passed, and env is also empty, no validation
    expect(validateEmailUrl(url, '')).toBe(url);
  });
});
