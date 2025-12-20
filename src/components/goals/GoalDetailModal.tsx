'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressChart } from './ProgressChart';
import { Skeleton } from '@/components/ui/Skeleton';

interface ProgressEntry {
  id: string;
  value: number;
  note?: string | null;
  mood?: number | null;
  difficulty?: number | null;
  loggedAt: string;
}

interface Milestone {
  id: string;
  title: string;
  description?: string | null;
  targetValue?: number | null;
  isCompleted: boolean;
  completedAt?: string | null;
  order: number;
}

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
}

interface GoalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  onLogProgress: () => void;
}

export function GoalDetailModal({ isOpen, onClose, goal, onLogProgress }: GoalDetailModalProps) {
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'progress' | 'milestones'>('progress');

  useEffect(() => {
    if (isOpen && goal) {
      fetchGoalDetails();
    }
  }, [isOpen, goal?.id]);

  const fetchGoalDetails = async () => {
    if (!goal) return;

    setIsLoading(true);
    try {
      const [progressRes, milestonesRes] = await Promise.all([
        fetch(`/api/goals/${goal.id}/progress`),
        fetch(`/api/goals/${goal.id}/milestones`),
      ]);

      if (progressRes.ok) {
        const data = await progressRes.json();
        setProgressEntries(data.progressLogs || []);
      }

      if (milestonesRes.ok) {
        const data = await milestonesRes.json();
        setMilestones(data.milestones || []);
      }
    } catch (error) {
      console.error('Error fetching goal details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!goal) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="info">In Progress</Badge>;
      case 'NOT_STARTED':
        return <Badge variant="default">Not Started</Badge>;
      case 'PAUSED':
        return <Badge variant="warning">Paused</Badge>;
      case 'ABANDONED':
        return <Badge variant="error">Abandoned</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title={goal.title}>
      <div className="space-y-6">
        {/* Header Info */}
        <div className="flex items-center gap-3 flex-wrap">
          {getStatusBadge(goal.status)}
          <Badge variant="default">{goal.type.replace(/_/g, ' ')}</Badge>
          {goal.discipline && (
            <Badge variant="default">{goal.discipline.name}</Badge>
          )}
        </div>

        {goal.description && (
          <p className="text-gray-400">{goal.description}</p>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg bg-gray-800 p-3">
            <div className="text-gray-500">Created</div>
            <div className="text-white">{formatDate(goal.createdAt)}</div>
          </div>
          {goal.targetDate && (
            <div className="rounded-lg bg-gray-800 p-3">
              <div className="text-gray-500">Target Date</div>
              <div className="text-white">{formatDate(goal.targetDate)}</div>
            </div>
          )}
        </div>

        {/* Tags */}
        {goal.tags && goal.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {goal.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-800 text-gray-400 rounded text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === 'progress'
                ? 'border-b-2 border-accent text-accent'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Progress
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === 'milestones'
                ? 'border-b-2 border-accent text-accent'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Milestones ({milestones.length})
          </button>
        </div>

        {/* Tab Content */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton height={120} />
            <Skeleton height={80} />
            <Skeleton height={80} />
          </div>
        ) : (
          <>
            {activeTab === 'progress' && (
              <ProgressChart
                entries={progressEntries}
                targetValue={goal.targetValue || 100}
                unit={goal.unit || ''}
                startDate={goal.createdAt}
                targetDate={goal.targetDate}
              />
            )}

            {activeTab === 'milestones' && (
              <div className="space-y-3">
                {milestones.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No milestones set for this goal
                  </div>
                ) : (
                  milestones
                    .sort((a, b) => a.order - b.order)
                    .map((milestone) => (
                      <div
                        key={milestone.id}
                        className={`rounded-lg border p-4 ${
                          milestone.isCompleted
                            ? 'border-green-800 bg-green-900/20'
                            : 'border-gray-800 bg-gray-900/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-lg ${
                                  milestone.isCompleted ? 'text-green-400' : 'text-gray-500'
                                }`}
                              >
                                {milestone.isCompleted ? '✓' : '○'}
                              </span>
                              <h4
                                className={`font-medium ${
                                  milestone.isCompleted ? 'text-green-400' : 'text-white'
                                }`}
                              >
                                {milestone.title}
                              </h4>
                            </div>
                            {milestone.description && (
                              <p className="text-sm text-gray-400 mt-1 ml-6">
                                {milestone.description}
                              </p>
                            )}
                          </div>
                          {milestone.targetValue && (
                            <div className="text-sm text-gray-500">
                              {milestone.targetValue} {goal.unit}
                            </div>
                          )}
                        </div>
                        {milestone.completedAt && (
                          <div className="text-xs text-gray-500 mt-2 ml-6">
                            Completed {formatDate(milestone.completedAt)}
                          </div>
                        )}
                      </div>
                    ))
                )}
              </div>
            )}
          </>
        )}

        {/* Actions */}
        {goal.status !== 'COMPLETED' && goal.status !== 'ABANDONED' && (
          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <Button onClick={onLogProgress} className="flex-1">
              Log Progress
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
