'use client';

import { Card } from '@/components/ui/Card';

interface CoachStats {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  averageResponseTimeMinutes: number | null;
}

interface CoachStatsCardProps {
  stats: CoachStats;
  days: number;
}

export function CoachStatsCard({ stats, days }: CoachStatsCardProps) {
  const formatResponseTime = (minutes: number | null) => {
    if (minutes === null) return 'N/A';

    if (minutes < 60) {
      return `${minutes}m`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `${hours}h`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days}d`;
    }
  };

  const completionRate = stats.totalRequests > 0
    ? Math.round((stats.completedRequests / stats.totalRequests) * 100)
    : 0;

  const statCards = [
    {
      label: 'Total Requests',
      value: stats.totalRequests,
      subtext: `Last ${days} days`,
      color: 'blue',
    },
    {
      label: 'Pending',
      value: stats.pendingRequests,
      subtext: 'Awaiting response',
      color: stats.pendingRequests > 5 ? 'yellow' : 'gray',
    },
    {
      label: 'Completed',
      value: stats.completedRequests,
      subtext: `${completionRate}% completion rate`,
      color: 'green',
    },
    {
      label: 'Avg Response Time',
      value: formatResponseTime(stats.averageResponseTimeMinutes),
      subtext: 'First response',
      color: 'purple',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.label}>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-400">{stat.label}</p>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.subtext}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
