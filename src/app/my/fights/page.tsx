'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { FightStatsCard } from '@/components/fights/FightStatsCard';
import { FightCard } from '@/components/fights/FightCard';
import { AddFightModal } from '@/components/fights/AddFightModal';
import { FightDetailView } from '@/components/fights/FightDetailView';

interface Fight {
  id: string;
  type: string;
  result: string;
  finishType: string;
  finishRound: number | null;
  finishTime: string | null;
  eventName: string | null;
  eventDate: string;
  location: string | null;
  weightClass: string | null;
  opponentName: string | null;
  discipline: string | null;
  videoUrl: string | null;
  totalRounds: number;
}

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

export default function FightsPage() {
  const [fights, setFights] = useState<Fight[]>([]);
  const [stats, setStats] = useState<FightStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFightId, setSelectedFightId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterResult, setFilterResult] = useState<string>('all');

  useEffect(() => {
    fetchFights();
  }, []);

  const fetchFights = async () => {
    try {
      const response = await fetch('/api/fights');
      if (response.ok) {
        const data = await response.json();
        setFights(data.fights);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching fights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFights = fights.filter((fight) => {
    if (filterType !== 'all' && fight.type !== filterType) return false;
    if (filterResult !== 'all' && fight.result !== filterResult) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Fight Analysis</h1>
          <p className="mt-2 text-gray-400">Track and analyze your fights and sparring sessions</p>
        </div>
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Fight Analysis</h1>
          <p className="mt-2 text-gray-400">Track and analyze your fights and sparring sessions</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Log Fight
        </Button>
      </div>

      {/* Stats */}
      {stats && stats.total > 0 && (
        <div className="mb-8">
          <FightStatsCard stats={stats} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Type:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">All Types</option>
            <option value="COMPETITION">Competition</option>
            <option value="SPARRING">Sparring</option>
            <option value="TRAINING">Training</option>
            <option value="EXHIBITION">Exhibition</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Result:</span>
          <select
            value={filterResult}
            onChange={(e) => setFilterResult(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">All Results</option>
            <option value="WIN">Wins</option>
            <option value="LOSS">Losses</option>
            <option value="DRAW">Draws</option>
            <option value="IN_PROGRESS">In Progress</option>
          </select>
        </div>
      </div>

      {/* Fight List */}
      {filteredFights.length > 0 ? (
        <div className="space-y-4">
          {filteredFights.map((fight) => (
            <FightCard
              key={fight.id}
              fight={fight}
              onClick={() => setSelectedFightId(fight.id)}
            />
          ))}
        </div>
      ) : fights.length > 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-400">No fights match your filters.</p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => {
              setFilterType('all');
              setFilterResult('all');
            }}
          >
            Clear Filters
          </Button>
        </Card>
      ) : (
        <Card className="text-center py-12">
          <div className="text-gray-400">
            <svg
              className="mx-auto h-12 w-12 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <p className="text-lg font-medium text-white mb-2">No Fights Logged</p>
            <p className="text-sm mb-4">Start tracking your fights and sparring sessions to analyze your performance.</p>
            <Button onClick={() => setShowAddModal(true)}>Log Your First Fight</Button>
          </div>
        </Card>
      )}

      {/* Quick Stats by Type */}
      {stats && stats.total > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="text-2xl font-bold text-white">{stats.competitions}</p>
                <p className="text-xs text-gray-500">Competitions</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🥊</span>
              <div>
                <p className="text-2xl font-bold text-white">{stats.sparringSessions}</p>
                <p className="text-xs text-gray-500">Sparring Sessions</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Win Method Breakdown */}
      {stats && stats.wins > 0 && (
        <Card className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Win Method Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: 'KO/TKO', value: stats.koTkoWins, color: 'bg-red-500' },
              { label: 'Submission', value: stats.submissionWins, color: 'bg-purple-500' },
              { label: 'Decision', value: stats.decisionWins, color: 'bg-blue-500' },
            ].map((method) => (
              <div key={method.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">{method.label}</span>
                  <span className="text-white">{method.value} ({((method.value / stats.wins) * 100).toFixed(0)}%)</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${method.color} rounded-full transition-all`}
                    style={{ width: `${(method.value / stats.wins) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add Fight Modal */}
      <AddFightModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchFights}
      />

      {/* Fight Detail View */}
      {selectedFightId && (
        <FightDetailView
          fightId={selectedFightId}
          onClose={() => setSelectedFightId(null)}
          onUpdate={fetchFights}
        />
      )}
    </div>
  );
}
