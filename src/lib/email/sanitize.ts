/**
 * Escape HTML special characters to prevent XSS in email templates.
 * Handles the 5 critical characters that can break HTML context.
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Validate that a URL starts with the expected app domain.
 * Prevents open redirect attacks via email links.
 */
export function validateEmailUrl(url: string, allowedBaseUrl?: string): string {
  const base = allowedBaseUrl || process.env.NEXT_PUBLIC_APP_URL || '';
  if (base && !url.startsWith(base)) {
    // If URL doesn't match expected domain, return the base URL as fallback
    return base;
  }
  return url;
}
