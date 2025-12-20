'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/contexts/ToastContext';

interface CalendarStatus {
  configured: boolean;
  connected: boolean;
  email?: string;
  calendarName?: string;
  lastSyncAt?: string;
  syncErrors?: number;
  lastSyncError?: string;
}

interface Calendar {
  id: string;
  summary: string;
  primary: boolean;
  backgroundColor?: string;
}

export function GoogleCalendarSync() {
  const toast = useToast();
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('');
  const [showCalendarSelect, setShowCalendarSelect] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/calendar/google');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch calendar status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    window.location.href = '/api/calendar/google/connect';
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/calendar/google', {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Google Calendar disconnected');
        setStatus({ configured: true, connected: false });
      } else {
        toast.error('Failed to disconnect calendar');
      }
    } catch (error) {
      toast.error('Failed to disconnect calendar');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/calendar/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weeksAhead: 4 }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Synced ${data.synced} events to Google Calendar`);
        fetchStatus();
      } else {
        toast.error(data.error || 'Failed to sync calendar');
      }
    } catch (error) {
      toast.error('Failed to sync calendar');
    } finally {
      setSyncing(false);
    }
  };

  const fetchCalendars = async () => {
    try {
      const response = await fetch('/api/calendar/google/calendars');
      if (response.ok) {
        const data = await response.json();
        setCalendars(data.calendars);
        setSelectedCalendarId(data.selectedId || '');
        setShowCalendarSelect(true);
      }
    } catch (error) {
      toast.error('Failed to load calendars');
    }
  };

  const handleSelectCalendar = async (calendarId: string, calendarName: string) => {
    try {
      const response = await fetch('/api/calendar/google/calendars', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarId, calendarName }),
      });

      if (response.ok) {
        toast.success('Calendar selected');
        setShowCalendarSelect(false);
        fetchStatus();
      } else {
        toast.error('Failed to select calendar');
      }
    } catch (error) {
      toast.error('Failed to select calendar');
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-4 w-32 bg-gray-700 rounded mb-2" />
          <div className="h-3 w-48 bg-gray-700 rounded" />
        </div>
      </Card>
    );
  }

  if (!status?.configured) {
    return null; // Don't show if not configured on server
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zm-15 1.5h15v3h-15v-3zm0 4.5h15v10.5h-15V9z" />
          <path d="M7.5 12h3v3h-3zm6 0h3v3h-3z" />
        </svg>
        <h3 className="text-lg font-semibold text-white">Google Calendar</h3>
      </div>

      {status.connected ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Connected
              </p>
              {status.email && (
                <p className="text-xs text-gray-400">{status.email}</p>
              )}
              {status.calendarName && (
                <p className="text-xs text-gray-500">Calendar: {status.calendarName}</p>
              )}
            </div>
          </div>

          {status.lastSyncAt && (
            <p className="text-xs text-gray-500">
              Last synced: {new Date(status.lastSyncAt).toLocaleString()}
            </p>
          )}

          {status.lastSyncError && (
            <p className="text-xs text-red-400">
              Error: {status.lastSyncError}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={fetchCalendars}
            >
              Change Calendar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          </div>

          {showCalendarSelect && calendars.length > 0 && (
            <div className="mt-3 p-3 bg-gray-800 rounded-lg space-y-2">
              <p className="text-sm text-gray-300 mb-2">Select a calendar:</p>
              {calendars.map((cal) => (
                <button
                  key={cal.id}
                  onClick={() => handleSelectCalendar(cal.id, cal.summary)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition ${
                    selectedCalendarId === cal.id
                      ? 'bg-accent text-black'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {cal.backgroundColor && (
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cal.backgroundColor }}
                      />
                    )}
                    {cal.summary}
                    {cal.primary && (
                      <span className="text-xs text-gray-400">(Primary)</span>
                    )}
                  </span>
                </button>
              ))}
              <button
                onClick={() => setShowCalendarSelect(false)}
                className="text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-400 mb-3">
            Connect your Google Calendar to automatically sync your training schedule.
          </p>
          <Button size="sm" onClick={handleConnect}>
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Connect Google Calendar
          </Button>
        </div>
      )}
    </Card>
  );
}
