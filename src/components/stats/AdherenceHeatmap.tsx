'use client';

import { useMemo } from 'react';

interface DayData {
  date: string;
  completed: number;
  scheduled: number;
}

interface AdherenceHeatmapProps {
  data: DayData[];
  weeks?: number;
}

export function AdherenceHeatmap({ data, weeks = 12 }: AdherenceHeatmapProps) {
  const { grid, legend, stats } = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (weeks * 7 - 1));
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday

    // Create a map for quick lookup
    const dataMap = new Map<string, DayData>();
    data.forEach((d) => {
      const dateKey = new Date(d.date).toISOString().split('T')[0];
      dataMap.set(dateKey, d);
    });

    // Generate grid
    const gridData: (DayData & { dateObj: Date; key: string })[][] = [];
    const currentDate = new Date(startDate);
    let totalCompleted = 0;
    let totalScheduled = 0;
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    for (let week = 0; week < weeks; week++) {
      const weekData: (DayData & { dateObj: Date; key: string })[] = [];
      for (let day = 0; day < 7; day++) {
        const dateKey = currentDate.toISOString().split('T')[0];
        const dayData = dataMap.get(dateKey) || { date: dateKey, completed: 0, scheduled: 0 };

        totalCompleted += dayData.completed;
        totalScheduled += dayData.scheduled;

        // Calculate streak
        if (dayData.scheduled > 0 && dayData.completed >= dayData.scheduled) {
          tempStreak++;
          if (tempStreak > maxStreak) maxStreak = tempStreak;
        } else if (dayData.scheduled > 0) {
          tempStreak = 0;
        }

        weekData.push({
          ...dayData,
          dateObj: new Date(currentDate),
          key: dateKey,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
      gridData.push(weekData);
    }

    // Calculate current streak (from today going back)
    for (let i = gridData.length - 1; i >= 0; i--) {
      for (let j = gridData[i].length - 1; j >= 0; j--) {
        const cell = gridData[i][j];
        if (cell.dateObj > today) continue;
        if (cell.scheduled > 0 && cell.completed >= cell.scheduled) {
          currentStreak++;
        } else if (cell.scheduled > 0) {
          break;
        }
      }
    }

    return {
      grid: gridData,
      legend: ['None', '1-2', '3-4', '5+'],
      stats: {
        totalCompleted,
        totalScheduled,
        adherenceRate: totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0,
        currentStreak,
        maxStreak,
      },
    };
  }, [data, weeks]);

  const getIntensityClass = (completed: number, scheduled: number, dateObj: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateObj > today) return 'bg-gray-800/30';
    if (scheduled === 0) return 'bg-gray-800';

    const rate = completed / scheduled;
    if (rate >= 1) return 'bg-green-500';
    if (rate >= 0.75) return 'bg-green-600';
    if (rate >= 0.5) return 'bg-yellow-500';
    if (rate > 0) return 'bg-orange-500';
    return 'bg-red-500/50';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get month labels
  const monthLabels = useMemo(() => {
    const labels: { month: string; colStart: number }[] = [];
    let lastMonth = -1;

    grid.forEach((week, weekIndex) => {
      const firstDay = week[0].dateObj;
      if (firstDay.getMonth() !== lastMonth) {
        labels.push({ month: formatMonth(firstDay), colStart: weekIndex });
        lastMonth = firstDay.getMonth();
      }
    });

    return labels;
  }, [grid]);

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg bg-gray-800 p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.adherenceRate}%</div>
          <div className="text-xs text-gray-500">Adherence</div>
        </div>
        <div className="rounded-lg bg-gray-800 p-3 text-center">
          <div className="text-2xl font-bold text-accent">{stats.currentStreak}</div>
          <div className="text-xs text-gray-500">Current Streak</div>
        </div>
        <div className="rounded-lg bg-gray-800 p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.maxStreak}</div>
          <div className="text-xs text-gray-500">Best Streak</div>
        </div>
        <div className="rounded-lg bg-gray-800 p-3 text-center">
          <div className="text-2xl font-bold text-white">{stats.totalCompleted}</div>
          <div className="text-xs text-gray-500">Sessions</div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 overflow-x-auto">
        {/* Month labels */}
        <div className="flex ml-10 mb-1">
          {monthLabels.map((label, i) => (
            <div
              key={i}
              className="text-xs text-gray-500"
              style={{
                marginLeft: i === 0 ? 0 : `${(label.colStart - (monthLabels[i - 1]?.colStart || 0)) * 14 - 24}px`,
              }}
            >
              {label.month}
            </div>
          ))}
        </div>

        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 pr-2">
            {dayLabels.map((day, i) => (
              <div key={day} className="h-3 text-[10px] text-gray-500 flex items-center">
                {i % 2 === 1 ? day : ''}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-1">
            {grid.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day) => (
                  <div
                    key={day.key}
                    className={`w-3 h-3 rounded-sm ${getIntensityClass(
                      day.completed,
                      day.scheduled,
                      day.dateObj
                    )} cursor-pointer transition-transform hover:scale-125 group relative`}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs whitespace-nowrap shadow-lg">
                        <div className="font-medium text-white">{formatDate(day.dateObj)}</div>
                        {day.scheduled > 0 ? (
                          <div className="text-gray-400">
                            {day.completed}/{day.scheduled} sessions
                          </div>
                        ) : (
                          <div className="text-gray-500">No sessions scheduled</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-500">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-red-500/50" />
          <div className="w-3 h-3 rounded-sm bg-orange-500" />
          <div className="w-3 h-3 rounded-sm bg-yellow-500" />
          <div className="w-3 h-3 rounded-sm bg-green-600" />
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
