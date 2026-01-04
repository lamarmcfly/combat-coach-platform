'use client';

import { useState, useEffect, useCallback } from 'react';

interface CsrfState {
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for managing CSRF tokens
 * Automatically fetches and refreshes tokens
 */
export function useCsrf() {
  const [state, setState] = useState<CsrfState>({
    token: null,
    isLoading: true,
    error: null,
  });

  const fetchToken = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/auth/csrf');
      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }

      const data = await response.json();
      setState({
        token: data.csrfToken,
        isLoading: false,
        error: null,
      });

      return data.csrfToken;
    } catch (error) {
      setState({
        token: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }, []);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  /**
   * Get fetch options with CSRF token header
   */
  const getFetchOptions = useCallback(
    (options: RequestInit = {}): RequestInit => {
      if (!state.token) return options;

      return {
        ...options,
        headers: {
          ...options.headers,
          'x-csrf-token': state.token,
        },
      };
    },
    [state.token]
  );

  /**
   * Fetch wrapper that automatically includes CSRF token
   */
  const csrfFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      let token = state.token;

      // If no token, fetch one first
      if (!token) {
        token = await fetchToken();
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'x-csrf-token': token || '',
        },
      });

      // If CSRF token expired, refresh and retry
      if (response.status === 403) {
        const data = await response.json();
        if (data.error?.includes('CSRF')) {
          token = await fetchToken();
          return fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              'x-csrf-token': token || '',
            },
          });
        }
      }

      return response;
    },
    [state.token, fetchToken]
  );

  return {
    token: state.token,
    isLoading: state.isLoading,
    error: state.error,
    refresh: fetchToken,
    getFetchOptions,
    csrfFetch,
  };
}
