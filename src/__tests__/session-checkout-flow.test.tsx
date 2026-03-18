import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SessionSidebar } from '@/components/session/SessionSidebar';

describe('Session checkout consent flow', () => {
  const baseProps = {
    sessionId: 'live_session_123',
    priceCents: 2500,
    capacity: 20,
    startTime: '2026-03-01T10:00:00.000Z',
    durationMinutes: 60,
    booked: false,
  };

  it('blocks checkout when required consent checkboxes are unchecked', () => {
    render(<SessionSidebar {...baseProps} />);

    const checkoutButton = screen.getByRole('button', { name: /book spot/i });
    expect(checkoutButton).toBeDisabled();

    fireEvent.click(checkoutButton);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('starts checkout after required consent checkboxes are checked', async () => {
    const fetchMock = vi.mocked(global.fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ checkoutUrl: '#checkout-started' }),
    } as Response);

    render(<SessionSidebar {...baseProps} />);

    fireEvent.click(
      screen.getByLabelText(/i acknowledge the no-show policy/i),
    );
    fireEvent.click(
      screen.getByLabelText(/i accept the training safety waiver/i),
    );
    fireEvent.click(
      screen.getByLabelText(/i consent to automatic billing/i),
    );

    const checkoutButton = screen.getByRole('button', { name: /book spot/i });
    expect(checkoutButton).toBeEnabled();

    fireEvent.click(checkoutButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [url, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/checkout/live');
    expect(requestInit.method).toBe('POST');
    expect(requestInit.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(String(requestInit.body))).toEqual({
      liveSessionId: 'live_session_123',
      acceptedNoShowPolicy: true,
      acceptedSafetyWaiver: true,
      acceptedWaitlistAutoBilling: true,
    });

    await waitFor(() => {
      expect(window.location.hash).toBe('#checkout-started');
    });
  });
});
