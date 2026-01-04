'use client';

import { useState, useEffect, useCallback } from 'react';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  permission: NotificationPermission | null;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
    error: null,
    permission: null,
  });

  // Check if push is supported and get current state
  useEffect(() => {
    const checkSupport = async () => {
      // Check browser support
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setState((prev) => ({
          ...prev,
          isSupported: false,
          isLoading: false,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        isSupported: true,
        permission: Notification.permission,
      }));

      try {
        // Register service worker if not already registered
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        // Check if already subscribed
        const subscription = await registration.pushManager.getSubscription();
        setState((prev) => ({
          ...prev,
          isSubscribed: !!subscription,
          isLoading: false,
        }));
      } catch (error) {
        console.error('Error checking push state:', error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Failed to initialize push notifications',
        }));
      }
    };

    checkSupport();
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        error: 'Push notifications are not supported in this browser',
      }));
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));

      if (permission !== 'granted') {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Notification permission denied',
        }));
        return false;
      }

      // Get VAPID public key from server
      const keyResponse = await fetch('/api/push/vapid-key');
      if (!keyResponse.ok) {
        throw new Error('Failed to get VAPID key');
      }
      const { publicKey } = await keyResponse.json();

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error('Push subscription error:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to subscribe',
      }));
      return false;
    }
  }, [state.isSupported]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from browser
        await subscription.unsubscribe();

        // Remove from server
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error('Push unsubscribe error:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to unsubscribe',
      }));
      return false;
    }
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
