import { expect, test } from '@playwright/test';

test.describe('Live session consent checkout', () => {
  test('blocks checkout while required consents are unchecked', async ({ page }) => {
    let checkoutApiCalled = false;

    await page.route('**/api/checkout/live', async (route) => {
      checkoutApiCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ checkoutUrl: '#checkout-started' }),
      });
    });

    await page.goto('/sessions/session-1');

    const bookSpotButton = page.getByRole('button', { name: /book spot/i });
    await expect(bookSpotButton).toBeDisabled();
    await page.waitForTimeout(300);

    expect(checkoutApiCalled).toBe(false);
    await expect(page).not.toHaveURL(/#checkout-started$/);
  });

  test('starts checkout after required consents are checked', async ({ page }) => {
    let checkoutPayload: Record<string, unknown> | null = null;

    await page.route('**/api/checkout/live', async (route) => {
      checkoutPayload = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ checkoutUrl: '#checkout-started' }),
      });
    });

    await page.goto('/sessions/session-1');

    const bookSpotButton = page.getByRole('button', { name: /book spot/i });
    await expect(bookSpotButton).toBeDisabled();

    await page.getByLabel(/i acknowledge the no-show policy/i).check();
    await page.getByLabel(/i accept the training safety waiver/i).check();
    await expect(bookSpotButton).toBeEnabled();

    await bookSpotButton.click();

    await expect(page).toHaveURL(/#checkout-started$/);
    expect(checkoutPayload).toEqual({
      liveSessionId: 'session-1',
      acceptedNoShowPolicy: true,
      acceptedSafetyWaiver: true,
      acceptedWaitlistAutoBilling: false,
    });
  });
});
