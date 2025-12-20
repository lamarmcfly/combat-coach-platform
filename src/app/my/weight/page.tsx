'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FormField } from '@/components/ui/FormField';
import { WeightChart } from '@/components/weight/WeightChart';
import { WeightCutCalculator } from '@/components/weight/WeightCutCalculator';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/contexts/ToastContext';

interface WeightEntry {
  id: string;
  weight: number;
  unit: string;
  loggedAt: string;
  notes: string | null;
  isFightWeight: boolean;
  eventName: string | null;
}

interface WeightGoal {
  id: string;
  targetWeight: number;
  unit: string;
  targetDate: string | null;
  weightClass: string | null;
  currentWeight: number | null;
  startWeight: number | null;
}

interface WeightStats {
  currentWeight: number | null;
  lowestWeight: number | null;
  highestWeight: number | null;
  averageWeight: number | null;
  totalEntries: number;
}

const WEIGHT_CLASSES = [
  'Strawweight (115)',
  'Flyweight (125)',
  'Bantamweight (135)',
  'Featherweight (145)',
  'Lightweight (155)',
  'Welterweight (170)',
  'Middleweight (185)',
  'Light Heavyweight (205)',
  'Heavyweight (265)',
  'Custom',
];

export default function WeightPage() {
  const { success, error: showError } = useToast();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [goal, setGoal] = useState<WeightGoal | null>(null);
  const [stats, setStats] = useState<WeightStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'log' | 'history' | 'plan'>('log');

  // Form states
  const [newWeight, setNewWeight] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isFightWeight, setIsFightWeight] = useState(false);
  const [eventName, setEventName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Goal form
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalWeight, setGoalWeight] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [goalWeightClass, setGoalWeightClass] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/weight?limit=90');
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries);
        setGoal(data.goal);
        setStats(data.stats);

        if (data.goal) {
          setGoalWeight(data.goal.targetWeight.toString());
          setGoalDate(data.goal.targetDate?.split('T')[0] || '');
          setGoalWeightClass(data.goal.weightClass || '');
        }
      }
    } catch (error) {
      console.error('Error fetching weight data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: parseFloat(newWeight),
          unit: 'LBS',
          notes: newNotes || null,
          isFightWeight,
          eventName: isFightWeight ? eventName : null,
        }),
      });

      if (response.ok) {
        success('Weight Logged', `Recorded ${newWeight} lbs`);
        setNewWeight('');
        setNewNotes('');
        setIsFightWeight(false);
        setEventName('');
        await fetchData();
      } else {
        throw new Error('Failed to log weight');
      }
    } catch (err) {
      showError('Error', 'Failed to log weight');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalWeight) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/weight/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetWeight: parseFloat(goalWeight),
          unit: 'LBS',
          targetDate: goalDate || null,
          weightClass: goalWeightClass || null,
        }),
      });

      if (response.ok) {
        success('Goal Saved', 'Your weight goal has been updated');
        setShowGoalForm(false);
        await fetchData();
      } else {
        throw new Error('Failed to save goal');
      }
    } catch (err) {
      showError('Error', 'Failed to save goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Weight Management</h1>
          <p className="mt-2 text-gray-400">Track your weight and plan your cuts</p>
        </div>
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Weight Management</h1>
        <p className="mt-2 text-gray-400">Track your weight and plan safe weight cuts</p>
      </div>

      {/* Stats cards */}
      {stats && stats.currentWeight && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <p className="text-xs text-gray-500 uppercase">Current</p>
            <p className="text-2xl font-bold text-white">{stats.currentWeight} lbs</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500 uppercase">Lowest</p>
            <p className="text-2xl font-bold text-green-400">{stats.lowestWeight} lbs</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500 uppercase">Highest</p>
            <p className="text-2xl font-bold text-red-400">{stats.highestWeight} lbs</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-500 uppercase">Average</p>
            <p className="text-2xl font-bold text-white">{stats.averageWeight} lbs</p>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-800 mb-6">
        {[
          { id: 'log', label: 'Log Weight' },
          { id: 'history', label: 'History' },
          { id: 'plan', label: 'Cut Planner' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium transition border-b-2 ${
              activeTab === tab.id
                ? 'border-accent text-accent'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Log Weight Tab */}
      {activeTab === 'log' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Log Weight</h3>
            <form onSubmit={handleLogWeight} className="space-y-4">
              <FormField label="Weight (lbs)" required>
                <input
                  type="number"
                  step="0.1"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500 text-2xl text-center"
                  placeholder="185.5"
                  required
                />
              </FormField>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="fightWeight"
                  checked={isFightWeight}
                  onChange={(e) => setIsFightWeight(e.target.checked)}
                  className="rounded border-gray-700 bg-gray-800 text-accent focus:ring-accent"
                />
                <label htmlFor="fightWeight" className="text-sm text-gray-400">
                  This is a fight weigh-in
                </label>
              </div>

              {isFightWeight && (
                <FormField label="Event Name">
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
                    placeholder="e.g., UFC 300"
                  />
                </FormField>
              )}

              <FormField label="Notes">
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
                  rows={2}
                  placeholder="How are you feeling? Any notes..."
                />
              </FormField>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Logging...' : 'Log Weight'}
              </Button>
            </form>
          </Card>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Weight Goal</h3>
              <Button variant="secondary" size="sm" onClick={() => setShowGoalForm(!showGoalForm)}>
                {goal ? 'Edit Goal' : 'Set Goal'}
              </Button>
            </div>

            {showGoalForm && (
              <Card className="mb-4">
                <form onSubmit={handleSaveGoal} className="space-y-4">
                  <FormField label="Target Weight (lbs)" required>
                    <input
                      type="number"
                      step="0.1"
                      value={goalWeight}
                      onChange={(e) => setGoalWeight(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                      required
                    />
                  </FormField>

                  <FormField label="Weight Class">
                    <select
                      value={goalWeightClass}
                      onChange={(e) => setGoalWeightClass(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="">Select weight class...</option>
                      {WEIGHT_CLASSES.map((wc) => (
                        <option key={wc} value={wc}>{wc}</option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Target Date">
                    <input
                      type="date"
                      value={goalDate}
                      onChange={(e) => setGoalDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </FormField>

                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Goal'}
                  </Button>
                </form>
              </Card>
            )}

            {goal && !showGoalForm && (
              <Card>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Target Weight</p>
                    <p className="text-3xl font-bold text-accent">{goal.targetWeight} lbs</p>
                    {goal.weightClass && (
                      <Badge variant="info" className="mt-2">{goal.weightClass}</Badge>
                    )}
                  </div>
                  {goal.targetDate && (
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Target Date</p>
                      <p className="text-white font-medium">
                        {new Date(goal.targetDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            <div className="mt-4">
              <WeightChart entries={entries} goal={goal} />
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <WeightChart entries={entries} goal={goal} />

          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">
              Weight History ({entries.length} entries)
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {entries.slice().reverse().map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xl font-bold text-white">{entry.weight} lbs</div>
                    {entry.isFightWeight && (
                      <Badge variant="error">Fight Weight</Badge>
                    )}
                    {entry.notes && (
                      <span className="text-sm text-gray-500">{entry.notes}</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(entry.loggedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              ))}
              {entries.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No weight entries yet. Start logging to see your history.
                </p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Cut Planner Tab */}
      {activeTab === 'plan' && (
        <WeightCutCalculator
          currentWeight={stats?.currentWeight || null}
          targetWeight={goal?.targetWeight || null}
          targetDate={goal?.targetDate || null}
        />
      )}
    </div>
  );
}
