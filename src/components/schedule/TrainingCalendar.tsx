'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface ScheduleOccurrence {
  id: string;
  scheduledFor: string;
  status: 'ACTIVE' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED';
  completedAt?: string;
  durationActual?: number;
  schedule: {
    title: string;
    durationMinutes: number;
    course?: { title: string };
    discipline?: { name: string };
  };
}

interface TrainingCalendarProps {
  occurrences: ScheduleOccurrence[];
  onCompleteSession: (id: string, duration?: number) => void;
  onSkipSession: (id: string) => void;
}

export function TrainingCalendar({
  occurrences,
  onCompleteSession,
  onSkipSession,
}: TrainingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  // Get current week's dates
  const getWeekDates = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      dates.push(day);
    }
    return dates;
  };

  const weekDates = getWeekDates(selectedDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const getOccurrencesForDate = (date: Date) => {
    return occurrences.filter((occ) => {
      const occDate = new Date(occ.scheduledFor);
      return isSameDay(occDate, date);
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">✓ Done</Badge>;
      case 'SKIPPED':
        return <Badge variant="warning">Skipped</Badge>;
      case 'ACTIVE':
        return <Badge variant="default">Scheduled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  return (
    <Card>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white">Training Calendar</h2>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              ← Prev
            </Button>
            <span className="min-w-[120px] text-center text-copy">
              {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
            </span>
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              Next →
            </Button>
          </div>
        </div>
      </div>

      {/* Week View */}
      <div className="grid grid-cols-7 gap-4">
        {weekDates.map((date, index) => {
          const dateOccurrences = getOccurrencesForDate(date);
          const isToday = isSameDay(date, today);
          const isPast = date < today;

          return (
            <div
              key={index}
              className={`min-h-[200px] rounded-lg border p-3 ${
                isToday
                  ? 'border-accent bg-accent/5'
                  : 'border-gray-800 bg-gray-900/50'
              }`}
            >
              <div className="mb-2">
                <div className="text-xs text-copy-muted">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div
                  className={`text-lg font-semibold ${
                    isToday ? 'text-accent' : 'text-white'
                  }`}
                >
                  {date.getDate()}
                </div>
              </div>

              <div className="space-y-2">
                {dateOccurrences.map((occ) => (
                  <div
                    key={occ.id}
                    className="rounded-md border border-gray-700 bg-gray-800 p-2"
                  >
                    <div className="mb-1 text-xs text-copy-muted">
                      {formatTime(occ.scheduledFor)}
                    </div>
                    <div className="mb-2 text-sm font-medium text-white">
                      {occ.schedule.title}
                    </div>
                    {getStatusBadge(occ.status)}

                    {occ.status === 'ACTIVE' && !isPast && (
                      <div className="mt-2 flex gap-1">
                        <Button
                          size="sm"
                          variant="primary"
                          className="flex-1 text-xs"
                          onClick={() => onCompleteSession(occ.id)}
                        >
                          ✓
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={() => onSkipSession(occ.id)}
                        >
                          Skip
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                {dateOccurrences.length === 0 && (
                  <div className="pt-4 text-center text-xs text-copy-muted">
                    No sessions
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
