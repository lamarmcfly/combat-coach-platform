'use client';

import { useMemo } from 'react';

interface ProgressEntry {
  id: string;
  value: number;
  note?: string | null;
  mood?: number | null;
  difficulty?: number | null;
  loggedAt: string;
}

interface ProgressChartProps {
  entries: ProgressEntry[];
  targetValue: number;
  unit?: string;
  startDate: string;
  targetDate?: string | null;
}

export function ProgressChart({
  entries,
  targetValue,
  unit = '',
  startDate,
  targetDate,
}: ProgressChartProps) {
  const { chartData, maxValue, progressPercentage, trend } = useMemo(() => {
    if (entries.length === 0) {
      return { chartData: [], maxValue: targetValue, progressPercentage: 0, trend: 0 };
    }

    // Sort entries by date
    const sorted = [...entries].sort(
      (a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime()
    );

    // Calculate cumulative progress
    let cumulative = 0;
    const data = sorted.map((entry) => {
      cumulative += entry.value;
      return {
        ...entry,
        cumulative,
        date: new Date(entry.loggedAt),
      };
    });

    const maxVal = Math.max(targetValue, cumulative);
    const progress = Math.min(100, (cumulative / targetValue) * 100);

    // Calculate trend (comparing last 3 entries to previous 3)
    let trendValue = 0;
    if (data.length >= 4) {
      const recentAvg = data.slice(-3).reduce((sum, e) => sum + e.value, 0) / 3;
      const previousAvg = data.slice(-6, -3).reduce((sum, e) => sum + e.value, 0) / Math.min(3, data.slice(-6, -3).length);
      trendValue = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;
    }

    return { chartData: data, maxValue: maxVal, progressPercentage: progress, trend: trendValue };
  }, [entries, targetValue]);

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6 text-center">
        <p className="text-gray-400">No progress logged yet</p>
        <p className="text-sm text-gray-500 mt-1">Log your first entry to see your progress chart</p>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getMoodEmoji = (mood: number | null | undefined) => {
    if (!mood) return null;
    const moods = ['😫', '😕', '😐', '🙂', '💪'];
    return moods[mood - 1] || null;
  };

  return (
    <div className="space-y-4">
      {/* Progress Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-gray-800 p-3 text-center">
          <div className="text-2xl font-bold text-white">
            {chartData.length > 0 ? chartData[chartData.length - 1].cumulative : 0}
            <span className="text-sm text-gray-400 ml-1">{unit}</span>
          </div>
          <div className="text-xs text-gray-500">Current</div>
        </div>
        <div className="rounded-lg bg-gray-800 p-3 text-center">
          <div className="text-2xl font-bold text-accent">
            {targetValue}
            <span className="text-sm text-gray-400 ml-1">{unit}</span>
          </div>
          <div className="text-xs text-gray-500">Target</div>
        </div>
        <div className="rounded-lg bg-gray-800 p-3 text-center">
          <div className={`text-2xl font-bold ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(Math.round(trend))}%
          </div>
          <div className="text-xs text-gray-500">Trend</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">Progress</span>
          <span className="text-white font-medium">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressPercentage >= 100
                ? 'bg-green-500'
                : progressPercentage >= 75
                ? 'bg-accent'
                : progressPercentage >= 50
                ? 'bg-yellow-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(100, progressPercentage)}%` }}
          />
        </div>
        {progressPercentage >= 100 && (
          <div className="text-center mt-2">
            <span className="text-green-400 font-medium">🎉 Goal Achieved!</span>
          </div>
        )}
      </div>

      {/* Bar Chart */}
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
        <h4 className="text-sm font-medium text-white mb-4">Progress Over Time</h4>
        <div className="flex items-end gap-1 h-32">
          {chartData.slice(-14).map((entry, index) => {
            const height = maxValue > 0 ? (entry.cumulative / maxValue) * 100 : 0;
            return (
              <div key={entry.id} className="flex-1 flex flex-col items-center group">
                <div className="relative w-full">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-xs whitespace-nowrap shadow-lg">
                      <div className="font-medium text-white">
                        +{entry.value} {unit}
                      </div>
                      <div className="text-gray-400">{formatDate(entry.date)}</div>
                      {entry.mood && (
                        <div className="mt-1">{getMoodEmoji(entry.mood)}</div>
                      )}
                    </div>
                  </div>

                  {/* Bar */}
                  <div
                    className="w-full bg-accent/80 hover:bg-accent rounded-t transition-all cursor-pointer"
                    style={{ height: `${Math.max(height, 4)}px` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{chartData.length > 0 ? formatDate(chartData[Math.max(0, chartData.length - 14)].date) : ''}</span>
          <span>{chartData.length > 0 ? formatDate(chartData[chartData.length - 1].date) : ''}</span>
        </div>
      </div>

      {/* Recent Entries */}
      <div>
        <h4 className="text-sm font-medium text-white mb-2">Recent Progress</h4>
        <div className="space-y-2">
          {chartData.slice(-5).reverse().map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-lg bg-gray-800/50 px-3 py-2"
            >
              <div className="flex items-center gap-3">
                {entry.mood && (
                  <span className="text-lg">{getMoodEmoji(entry.mood)}</span>
                )}
                <div>
                  <div className="text-sm text-white">
                    +{entry.value} {unit}
                  </div>
                  <div className="text-xs text-gray-500">{formatDate(entry.date)}</div>
                </div>
              </div>
              {entry.difficulty && (
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((d) => (
                    <div
                      key={d}
                      className={`w-2 h-2 rounded-full ${
                        d <= entry.difficulty! ? 'bg-orange-400' : 'bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
