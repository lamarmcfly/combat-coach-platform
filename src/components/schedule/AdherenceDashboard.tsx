'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface AdherenceStats {
  weekStart: string;
  weekEnd: string;
  scheduledSessions: number;
  completedSessions: number;
  skippedSessions: number;
  adherenceRate: number;
  totalMinutesTrained: number;
  streak: number;
}

interface AdherenceDashboardProps {
  stats: AdherenceStats[];
  summary: {
    currentStreak: number;
    averageAdherence: number;
    totalMinutesTrained: number;
    totalSessions: number;
  };
}

export function AdherenceDashboard({ stats, summary }: AdherenceDashboardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getAdherenceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-400';
    if (rate >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getAdherenceBadge = (rate: number) => {
    if (rate >= 80) return <Badge variant="success">Excellent</Badge>;
    if (rate >= 60) return <Badge variant="warning">Good</Badge>;
    return <Badge variant="error">Needs Work</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="text-center">
          <div className="text-sm text-copy-muted">Current Streak</div>
          <div className="mt-2 text-4xl font-bold text-accent">
            {summary.currentStreak}
          </div>
          <div className="mt-1 text-xs text-copy-muted">
            {summary.currentStreak === 1 ? 'week' : 'weeks'}
          </div>
          {summary.currentStreak >= 4 && (
            <div className="mt-2">
              <Badge variant="success">🔥 On Fire!</Badge>
            </div>
          )}
        </Card>

        <Card className="text-center">
          <div className="text-sm text-copy-muted">Avg Adherence</div>
          <div className={`mt-2 text-4xl font-bold ${getAdherenceColor(summary.averageAdherence)}`}>
            {summary.averageAdherence}%
          </div>
          <div className="mt-2">{getAdherenceBadge(summary.averageAdherence)}</div>
        </Card>

        <Card className="text-center">
          <div className="text-sm text-copy-muted">Total Sessions</div>
          <div className="mt-2 text-4xl font-bold text-white">
            {summary.totalSessions}
          </div>
          <div className="mt-1 text-xs text-copy-muted">completed</div>
        </Card>

        <Card className="text-center">
          <div className="text-sm text-copy-muted">Total Training</div>
          <div className="mt-2 text-4xl font-bold text-white">
            {Math.round(summary.totalMinutesTrained / 60)}
          </div>
          <div className="mt-1 text-xs text-copy-muted">hours</div>
        </Card>
      </div>

      {/* Weekly Breakdown */}
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-white">Weekly Breakdown</h3>
        <div className="space-y-3">
          {stats.map((week, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 p-4"
            >
              <div className="flex-1">
                <div className="text-sm font-medium text-white">
                  {formatDate(week.weekStart)} - {formatDate(week.weekEnd)}
                </div>
                <div className="mt-1 text-xs text-copy-muted">
                  {week.completedSessions} of {week.scheduledSessions} sessions •{' '}
                  {week.totalMinutesTrained} minutes
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Progress Bar */}
                <div className="w-32">
                  <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                    <div
                      className={`h-full transition-all ${
                        week.adherenceRate >= 80
                          ? 'bg-green-500'
                          : week.adherenceRate >= 60
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${week.adherenceRate}%` }}
                    />
                  </div>
                </div>

                {/* Percentage */}
                <div
                  className={`min-w-[60px] text-right text-lg font-bold ${getAdherenceColor(
                    week.adherenceRate
                  )}`}
                >
                  {Math.round(week.adherenceRate)}%
                </div>

                {/* Streak Indicator */}
                {week.adherenceRate >= 80 && (
                  <div className="text-yellow-400">🔥</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
