'use client';

import { useState, useEffect } from 'react';
import { TrainingCalendar } from '@/components/schedule/TrainingCalendar';
import { AdherenceDashboard } from '@/components/schedule/AdherenceDashboard';
import { CreateScheduleModal, ScheduleFormData } from '@/components/schedule/CreateScheduleModal';
import { GoogleCalendarSync } from '@/components/schedule/GoogleCalendarSync';
import { CalendarSubscription } from '@/components/schedule/CalendarSubscription';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SkeletonStats, Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, EmptyStateIcons } from '@/components/ui/EmptyState';
import { useToast } from '@/contexts/ToastContext';

export default function SchedulePage() {
  const { success, error } = useToast();
  const [occurrences, setOccurrences] = useState<any[]>([]);
  const [adherenceData, setAdherenceData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'calendar' | 'stats'>('calendar');

  // Fetch schedules and adherence data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [schedulesRes, adherenceRes] = await Promise.all([
        fetch('/api/schedule'),
        fetch('/api/schedule/adherence'),
      ]);

      if (schedulesRes.ok) {
        const schedulesData = await schedulesRes.json();
        setOccurrences(schedulesData.occurrences || []);
      }

      if (adherenceRes.ok) {
        const adherenceData = await adherenceRes.json();
        setAdherenceData(adherenceData);
      }
    } catch (err) {
      error('Error', 'Failed to load schedule data');
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async (data: ScheduleFormData) => {
    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        success('Schedule Created', 'Your training schedule has been set up');
        await fetchData();
      } else {
        const errorData = await response.json();
        error('Error', errorData.error || 'Failed to create schedule');
      }
    } catch (err) {
      error('Error', 'Failed to create schedule. Please try again.');
      console.error('Failed to create schedule:', err);
    }
  };

  const handleCompleteSession = async (id: string, duration?: number) => {
    try {
      const response = await fetch(`/api/schedule/occurrence/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', durationActual: duration }),
      });

      if (response.ok) {
        success('Session Complete', 'Great work! Keep up the training!');
        await fetchData();
      } else {
        error('Error', 'Failed to mark session as complete');
      }
    } catch (err) {
      error('Error', 'Failed to complete session');
      console.error('Failed to complete session:', err);
    }
  };

  const handleSkipSession = async (id: string) => {
    try {
      const response = await fetch(`/api/schedule/occurrence/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'skip' }),
      });

      if (response.ok) {
        success('Session Skipped', 'Session marked as skipped');
        await fetchData();
      } else {
        error('Error', 'Failed to skip session');
      }
    } catch (err) {
      error('Error', 'Failed to skip session');
      console.error('Failed to skip session:', err);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Training Schedule</h1>
            <p className="mt-2 text-gray-400">Plan your training and track your adherence</p>
          </div>
        </div>
        <div className="mb-6">
          <SkeletonStats />
        </div>
        <Card>
          <div className="grid grid-cols-7 gap-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="min-h-[200px] rounded-lg border border-gray-800 bg-gray-900/50 p-3">
                <Skeleton height={14} width={40} className="mb-2" />
                <Skeleton height={24} width={30} className="mb-4" />
                <Skeleton height={60} className="rounded-md" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Training Schedule</h1>
          <p className="mt-2 text-copy-muted">
            Plan your training and track your adherence
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              window.location.href = '/api/schedule/export?weeks=4';
            }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Export Calendar
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>+ New Schedule</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-gray-800">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === 'calendar'
              ? 'border-b-2 border-accent text-accent'
              : 'text-copy-muted hover:text-white'
          }`}
        >
          Calendar
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === 'stats'
              ? 'border-b-2 border-accent text-accent'
              : 'text-copy-muted hover:text-white'
          }`}
        >
          Stats & Progress
        </button>
      </div>

      {/* Content */}
      {activeTab === 'calendar' && (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <GoogleCalendarSync />
            <CalendarSubscription />
          </div>
          <TrainingCalendar
            occurrences={occurrences}
            onCompleteSession={handleCompleteSession}
            onSkipSession={handleSkipSession}
          />
        </>
      )}

      {activeTab === 'stats' && adherenceData && (
        <AdherenceDashboard
          stats={adherenceData.stats || []}
          summary={adherenceData.summary || {}}
        />
      )}

      {/* Create Schedule Modal */}
      <CreateScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateSchedule}
      />
    </div>
  );
}
