'use client';

import { Card } from '@/components/ui/Card';

interface FightStats {
  total: number;
  wins: number;
  losses: number;
  draws: number;
  competitions: number;
  sparringSessions: number;
  koTkoWins: number;
  submissionWins: number;
  decisionWins: number;
}

interface FightStatsCardProps {
  stats: FightStats;
}

export function FightStatsCard({ stats }: FightStatsCardProps) {
  const winRate = stats.total > 0 ? ((stats.wins / stats.total) * 100).toFixed(0) : 0;
  const finishRate =
    stats.wins > 0
      ? (((stats.koTkoWins + stats.submissionWins) / stats.wins) * 100).toFixed(0)
      : 0;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
      <Card className="p-4 text-center">
        <p className="text-3xl font-bold text-white">{stats.total}</p>
        <p className="text-xs text-gray-500 uppercase mt-1">Total Fights</p>
      </Card>

      <Card className="p-4 text-center">
        <p className="text-3xl font-bold text-accent">
          {stats.wins}-{stats.losses}-{stats.draws}
        </p>
        <p className="text-xs text-gray-500 uppercase mt-1">Record</p>
      </Card>

      <Card className="p-4 text-center">
        <p className="text-3xl font-bold text-green-400">{winRate}%</p>
        <p className="text-xs text-gray-500 uppercase mt-1">Win Rate</p>
      </Card>

      <Card className="p-4 text-center">
        <p className="text-3xl font-bold text-red-400">{stats.koTkoWins}</p>
        <p className="text-xs text-gray-500 uppercase mt-1">KO/TKO Wins</p>
      </Card>

      <Card className="p-4 text-center">
        <p className="text-3xl font-bold text-purple-400">{stats.submissionWins}</p>
        <p className="text-xs text-gray-500 uppercase mt-1">Submissions</p>
      </Card>

      <Card className="p-4 text-center">
        <p className="text-3xl font-bold text-blue-400">{finishRate}%</p>
        <p className="text-xs text-gray-500 uppercase mt-1">Finish Rate</p>
      </Card>
    </div>
  );
}
