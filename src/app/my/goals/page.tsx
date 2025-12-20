'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { GoalCreateModal } from '@/components/goals/GoalCreateModal';
import { ProgressLogModal } from '@/components/goals/ProgressLogModal';
import { GoalDetailModal } from '@/components/goals/GoalDetailModal';
import { useToast } from '@/contexts/ToastContext';
import { SkeletonCard, SkeletonStats } from '@/components/ui/Skeleton';
import { EmptyState, EmptyStateIcons } from '@/components/ui/EmptyState';

interface Goal {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  progressPercent: number;
  targetValue?: number | null;
  currentValue?: number | null;
  unit?: string | null;
  targetDate?: string | null;
  createdAt: string;
  discipline?: { name: string };
  tags?: string[];
  _count?: { milestones: number; progressLogs: number };
}

export default function GoalsPage() {
  const { error } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const handleLogProgress = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsProgressModalOpen(true);
  };

  const handleViewGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsDetailModalOpen(true);
  };

  const handleLogProgressFromDetail = () => {
    setIsDetailModalOpen(false);
    setIsProgressModalOpen(true);
  };

  useEffect(() => {
    fetchData();
  }, [activeFilter]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [goalsRes, statsRes, recsRes] = await Promise.all([
        fetch(`/api/goals?status=${activeFilter === 'all' ? '' : activeFilter}`),
        fetch('/api/goals/stats'),
        fetch('/api/goals/recommendations?limit=5'),
      ]);

      if (goalsRes.ok) {
        const data = await goalsRes.json();
        setGoals(data.goals);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
      if (recsRes.ok) {
        const data = await recsRes.json();
        setRecommendations(data.recommendations);
      }
    } catch (err) {
      error('Error', 'Failed to load goals data');
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGoal = () => {
    setIsCreateModalOpen(true);
  };

  const handleDismissRecommendation = async (id: string) => {
    try {
      await fetch(`/api/goals/recommendations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss' }),
      });
      fetchData();
    } catch (error) {
      console.error('Error dismissing recommendation:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">My Goals</h1>
          <p className="text-gray-400">
            Track your training goals and get personalized recommendations
          </p>
        </div>
        <div className="mb-6">
          <SkeletonStats />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">My Goals</h1>
        <p className="text-gray-400">
          Track your training goals and get personalized recommendations
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <div className="text-sm text-gray-400 mb-1">Total Goals</div>
            <div className="text-3xl font-bold text-white">{stats.totalGoals}</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-400 mb-1">Active</div>
            <div className="text-3xl font-bold text-blue-400">{stats.activeGoals}</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-400 mb-1">Completed</div>
            <div className="text-3xl font-bold text-green-400">{stats.completedGoals}</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-400 mb-1">Avg Progress</div>
            <div className="text-3xl font-bold text-purple-400">{stats.averageProgress}%</div>
          </Card>
          <Card>
            <div className="text-sm text-gray-400 mb-1">Completion Rate</div>
            <div className="text-3xl font-bold text-orange-400">{stats.completionRate}%</div>
          </Card>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Recommended for You</h2>
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="flex items-start justify-between p-4 bg-blue-900/30 rounded-lg border border-blue-800"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{rec.title}</h3>
                    <Badge variant="info">{rec.type.replace(/_/g, ' ')}</Badge>
                  </div>
                  <p className="text-sm text-gray-400 mb-1">{rec.description}</p>
                  {rec.reason && (
                    <p className="text-xs text-blue-400">Why: {rec.reason}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDismissRecommendation(rec.id)}
                  className="text-gray-500 hover:text-white ml-4 text-xl"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {['all', 'IN_PROGRESS', 'NOT_STARTED', 'COMPLETED'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeFilter === filter
                  ? 'bg-accent text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {filter === 'all' ? 'All' : filter.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <Button onClick={handleCreateGoal}>New Goal</Button>
      </div>

      {/* Goals List */}
      {goals.length === 0 ? (
        <Card>
          <EmptyState
            icon={EmptyStateIcons.goals}
            title="No goals yet"
            description="Set your first training goal to track your progress and stay motivated."
            action={{ label: 'Create Goal', onClick: handleCreateGoal }}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <Card key={goal.id} className="cursor-pointer hover:border-gray-700 transition-colors" onClick={() => handleViewGoal(goal)}>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant={
                        goal.status === 'COMPLETED'
                          ? 'success'
                          : goal.status === 'IN_PROGRESS'
                          ? 'info'
                          : 'default'
                      }
                    >
                      {goal.status.replace(/_/g, ' ')}
                    </Badge>
                    <Badge variant="default">{goal.type.replace(/_/g, ' ')}</Badge>
                  </div>
                  <h3 className="font-bold text-white text-lg">{goal.title}</h3>
                  {goal.description && (
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                      {goal.description}
                    </p>
                  )}
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-400">Progress</span>
                    <span className="text-sm font-semibold text-white">
                      {goal.progressPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-accent h-2 rounded-full transition-all"
                      style={{ width: `${goal.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Metadata */}
                <div className="text-xs text-gray-500 space-y-1">
                  {goal.discipline && (
                    <div>Discipline: {goal.discipline.name}</div>
                  )}
                  {goal.targetDate && (
                    <div>
                      Target: {new Date(goal.targetDate).toLocaleDateString()}
                    </div>
                  )}
                  {goal.targetValue && (
                    <div>
                      Target: {goal.currentValue || 0} / {goal.targetValue} {goal.unit}
                    </div>
                  )}
                  {goal._count && (
                    <div>
                      {goal._count.milestones} milestones, {goal._count.progressLogs} logs
                    </div>
                  )}
                </div>

                {/* Tags */}
                {goal.tags && goal.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {goal.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-800 text-gray-400 rounded text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {goal.status !== 'COMPLETED' && goal.status !== 'ABANDONED' && (
                  <div className="pt-3 border-t border-gray-800">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLogProgress(goal);
                      }}
                      className="w-full"
                    >
                      Log Progress
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Goal Modal */}
      <GoalCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchData}
      />

      {/* Progress Log Modal */}
      <ProgressLogModal
        isOpen={isProgressModalOpen}
        onClose={() => {
          setIsProgressModalOpen(false);
          setSelectedGoal(null);
        }}
        onSuccess={fetchData}
        goal={selectedGoal}
      />

      {/* Goal Detail Modal with Progress Chart */}
      <GoalDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedGoal(null);
        }}
        goal={selectedGoal}
        onLogProgress={handleLogProgressFromDetail}
      />
    </div>
  );
}
