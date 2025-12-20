'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';

interface Goal {
  id: string;
  title: string;
  targetValue?: number | null;
  currentValue?: number | null;
  unit?: string | null;
}

interface ProgressLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goal: Goal | null;
}

const moodEmojis = [
  { value: 1, emoji: '😫', label: 'Exhausted' },
  { value: 2, emoji: '😕', label: 'Struggling' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '😊', label: 'Good' },
  { value: 5, emoji: '🔥', label: 'Great' },
];

const difficultyLabels = [
  { value: 1, label: 'Very Easy', color: 'bg-green-600' },
  { value: 2, label: 'Easy', color: 'bg-green-500' },
  { value: 3, label: 'Moderate', color: 'bg-yellow-500' },
  { value: 4, label: 'Hard', color: 'bg-orange-500' },
  { value: 5, label: 'Very Hard', color: 'bg-red-500' },
];

export function ProgressLogModal({ isOpen, onClose, onSuccess, goal }: ProgressLogModalProps) {
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    value: '',
    notes: '',
    mood: 3,
    difficulty: 3,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!goal) return;

    setIsSubmitting(true);
    try {
      const payload = {
        value: formData.value ? parseFloat(formData.value) : undefined,
        notes: formData.notes.trim() || undefined,
        mood: formData.mood,
        difficulty: formData.difficulty,
      };

      const response = await fetch(`/api/goals/${goal.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to log progress');
      }

      success('Progress Logged', 'Your training progress has been recorded');
      setFormData({ value: '', notes: '', mood: 3, difficulty: 3 });
      onSuccess();
      onClose();
    } catch (err) {
      error('Error', err instanceof Error ? err.message : 'Failed to log progress');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!goal) return null;

  const hasTargetValue = goal.targetValue !== null && goal.targetValue !== undefined;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Progress" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Goal Info */}
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="font-semibold text-white">{goal.title}</h3>
          {hasTargetValue && (
            <p className="text-sm text-gray-400 mt-1">
              Current: {goal.currentValue || 0} / {goal.targetValue} {goal.unit}
            </p>
          )}
        </div>

        {/* Value Input (if goal has target) */}
        {hasTargetValue && (
          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-300 mb-2">
              New Value {goal.unit && <span className="text-gray-500">({goal.unit})</span>}
            </label>
            <input
              type="number"
              id="value"
              name="value"
              value={formData.value}
              onChange={handleChange}
              placeholder={`e.g., ${goal.currentValue ? goal.currentValue + 5 : goal.targetValue}`}
              step="0.1"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>
        )}

        {/* Mood Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            How are you feeling?
          </label>
          <div className="flex justify-between gap-2">
            {moodEmojis.map((mood) => (
              <button
                key={mood.value}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, mood: mood.value }))}
                className={`
                  flex-1 flex flex-col items-center p-3 rounded-lg border transition-all
                  ${formData.mood === mood.value
                    ? 'border-accent bg-accent/10 scale-105'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }
                `}
              >
                <span className="text-2xl mb-1">{mood.emoji}</span>
                <span className="text-xs text-gray-400">{mood.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Session Difficulty
          </label>
          <div className="flex gap-2">
            {difficultyLabels.map((diff) => (
              <button
                key={diff.value}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, difficulty: diff.value }))}
                className={`
                  flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all
                  ${formData.difficulty === diff.value
                    ? `border-transparent ${diff.color} text-white`
                    : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                  }
                `}
              >
                {diff.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2">
            Training Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            placeholder="What did you work on? Any insights or observations..."
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Logging...' : 'Log Progress'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
