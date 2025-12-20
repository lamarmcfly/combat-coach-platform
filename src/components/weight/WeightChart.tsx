'use client';

import { Card } from '@/components/ui/Card';

interface WeightEntry {
  id: string;
  weight: number;
  unit: string;
  loggedAt: string;
  isFightWeight: boolean;
}

interface WeightGoal {
  targetWeight: number;
  targetDate: string | null;
  weightClass: string | null;
}

interface WeightChartProps {
  entries: WeightEntry[];
  goal: WeightGoal | null;
}

export function WeightChart({ entries, goal }: WeightChartProps) {
  if (entries.length === 0) {
    return (
      <Card className="text-center py-12">
        <div className="text-gray-400">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-lg font-medium text-white mb-2">No Weight Data Yet</p>
          <p className="text-sm">Start logging your weight to see your progress chart.</p>
        </div>
      </Card>
    );
  }

  const weights = entries.map((e) => e.weight);
  const minWeight = Math.min(...weights) - 5;
  const maxWeight = Math.max(...weights) + 5;
  const range = maxWeight - minWeight;

  const chartHeight = 200;
  const chartWidth = 100; // percentage

  const getY = (weight: number) => {
    return chartHeight - ((weight - minWeight) / range) * chartHeight;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Create SVG path
  const points = entries.map((entry, i) => {
    const x = (i / (entries.length - 1 || 1)) * 100;
    const y = getY(entry.weight);
    return { x, y, entry };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaD = `${pathD} L 100 ${chartHeight} L 0 ${chartHeight} Z`;

  // Calculate progress toward goal
  const currentWeight = entries[entries.length - 1]?.weight;
  const progressToGoal = goal && currentWeight
    ? ((entries[0]?.weight - currentWeight) / (entries[0]?.weight - goal.targetWeight)) * 100
    : null;

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-lg font-semibold text-white mb-4">Weight Trend</h3>

        {/* Chart */}
        <div className="relative h-52">
          <svg
            className="w-full h-full"
            viewBox={`0 0 100 ${chartHeight}`}
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={y}
                x1="0"
                y1={(y / 100) * chartHeight}
                x2="100"
                y2={(y / 100) * chartHeight}
                stroke="rgba(75, 85, 99, 0.3)"
                strokeWidth="0.5"
              />
            ))}

            {/* Goal line */}
            {goal && (
              <line
                x1="0"
                y1={getY(goal.targetWeight)}
                x2="100"
                y2={getY(goal.targetWeight)}
                stroke="rgba(16, 185, 129, 0.5)"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            )}

            {/* Area fill */}
            <path
              d={areaD}
              fill="url(#weightGradient)"
              opacity="0.3"
            />

            {/* Line */}
            <path
              d={pathD}
              fill="none"
              stroke="var(--color-accent, #00ff85)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />

            {/* Data points */}
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="3"
                fill={p.entry.isFightWeight ? '#ef4444' : 'var(--color-accent, #00ff85)'}
                stroke="#0b0b0c"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {/* Gradient definition */}
            <defs>
              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent, #00ff85)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--color-accent, #00ff85)" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-10 w-8 text-right">
            <span>{maxWeight.toFixed(0)}</span>
            <span>{((maxWeight + minWeight) / 2).toFixed(0)}</span>
            <span>{minWeight.toFixed(0)}</span>
          </div>

          {/* Goal label */}
          {goal && (
            <div
              className="absolute right-0 text-xs text-green-500 bg-gray-900 px-1 rounded"
              style={{ top: `${(getY(goal.targetWeight) / chartHeight) * 100}%` }}
            >
              Goal: {goal.targetWeight}
            </div>
          )}
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between text-xs text-gray-500 mt-2 px-2">
          <span>{formatDate(entries[0]?.loggedAt)}</span>
          <span>{formatDate(entries[entries.length - 1]?.loggedAt)}</span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span>Regular weigh-in</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Fight weight</span>
          </div>
          {goal && (
            <div className="flex items-center gap-1">
              <div className="w-6 h-0.5 bg-green-500 opacity-50" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, currentColor 2px, currentColor 4px)' }} />
              <span>Target weight</span>
            </div>
          )}
        </div>
      </Card>

      {/* Progress toward goal */}
      {goal && progressToGoal !== null && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-white">Progress to Goal</h4>
            <span className="text-sm text-gray-400">
              {goal.weightClass && `${goal.weightClass} • `}
              Target: {goal.targetWeight} lbs
            </span>
          </div>
          <div className="h-3 rounded-full bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-green-500 transition-all"
              style={{ width: `${Math.min(Math.max(progressToGoal, 0), 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-gray-400">
              Current: <span className="text-white font-medium">{currentWeight} lbs</span>
            </span>
            <span className="text-gray-400">
              To go: <span className="text-accent font-medium">
                {Math.abs(currentWeight - goal.targetWeight).toFixed(1)} lbs
              </span>
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}
