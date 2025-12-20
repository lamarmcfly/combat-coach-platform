'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/contexts/ToastContext';

interface SubscriptionStatus {
  hasSubscription: boolean;
  isActive?: boolean;
  subscriptionUrl?: string;
  webcalUrl?: string;
  lastAccessedAt?: string;
  createdAt?: string;
}

export function CalendarSubscription() {
  const toast = useToast();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/calendar/subscribe');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/calendar/subscribe', {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Subscription URL created');
        await fetchStatus();
        setShowUrl(true);
      } else {
        toast.error('Failed to create subscription');
      }
    } catch (error) {
      toast.error('Failed to create subscription');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async () => {
    try {
      const response = await fetch('/api/calendar/subscribe', {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Subscription revoked');
        setStatus({ hasSubscription: false });
        setShowUrl(false);
      } else {
        toast.error('Failed to revoke subscription');
      }
    } catch (error) {
      toast.error('Failed to revoke subscription');
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('This will invalidate your current subscription URL. Continue?')) {
      return;
    }
    await handleCreate();
  };

  const copyToClipboard = async (url: string, type: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(`${type} copied to clipboard`);
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  const openWebcal = () => {
    if (status?.webcalUrl) {
      window.location.href = status.webcalUrl;
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-4 w-40 bg-gray-700 rounded mb-2" />
          <div className="h-3 w-56 bg-gray-700 rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
        <h3 className="text-lg font-semibold text-white">Calendar Subscription</h3>
      </div>

      <p className="text-sm text-gray-400 mb-4">
        Subscribe to your training schedule from any calendar app (Apple Calendar, Outlook, etc.)
      </p>

      {status?.hasSubscription && status.isActive ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-green-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Subscription active
          </div>

          {status.lastAccessedAt && (
            <p className="text-xs text-gray-500">
              Last synced: {new Date(status.lastAccessedAt).toLocaleString()}
            </p>
          )}

          {showUrl && status.subscriptionUrl && (
            <div className="p-3 bg-gray-800 rounded-lg space-y-2">
              <p className="text-xs text-gray-400 mb-2">Subscription URL:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={status.subscriptionUrl}
                  className="flex-1 bg-gray-900 text-gray-300 text-xs p-2 rounded border border-gray-700 focus:outline-none"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => copyToClipboard(status.subscriptionUrl!, 'URL')}
                >
                  Copy
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={openWebcal}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Add to Calendar App
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowUrl(!showUrl)}
            >
              {showUrl ? 'Hide URL' : 'Show URL'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRegenerate}
            >
              Regenerate URL
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRevoke}
            >
              Revoke
            </Button>
          </div>

          <div className="mt-3 p-3 bg-gray-800/50 rounded-lg">
            <p className="text-xs text-gray-400 mb-2">How to subscribe:</p>
            <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
              <li><strong>Apple Calendar:</strong> Click "Add to Calendar App" or File &gt; New Calendar Subscription</li>
              <li><strong>Outlook:</strong> Click "Show URL", copy it, then Add Calendar &gt; From Internet</li>
              <li><strong>Google Calendar:</strong> Click "Show URL", copy it, then Settings &gt; Add Calendar &gt; From URL</li>
            </ul>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-500 mb-3">
            Create a subscription URL to keep your calendar app in sync with your training schedule.
            The calendar will automatically update when you make changes.
          </p>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? 'Creating...' : 'Create Subscription URL'}
          </Button>
        </div>
      )}
    </Card>
  );
}
