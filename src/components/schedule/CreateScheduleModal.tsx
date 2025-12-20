'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface CreateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ScheduleFormData) => Promise<void>;
}

export interface ScheduleFormData {
  title: string;
  description?: string;
  frequency: 'ONCE' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  startDate: string;
  endDate?: string;
  daysOfWeek: number[];
  timeOfDay: string;
  durationMinutes: number;
  reminderMinutes: number;
  courseId?: string;
  disciplineId?: number;
  notes?: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export function CreateScheduleModal({ isOpen, onClose, onSubmit }: CreateScheduleModalProps) {
  const [formData, setFormData] = useState<ScheduleFormData>({
    title: '',
    frequency: 'WEEKLY',
    startDate: new Date().toISOString().split('T')[0],
    daysOfWeek: [],
    timeOfDay: '09:00',
    durationMinutes: 60,
    reminderMinutes: 30,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
      // Reset form
      setFormData({
        title: '',
        frequency: 'WEEKLY',
        startDate: new Date().toISOString().split('T')[0],
        daysOfWeek: [],
        timeOfDay: '09:00',
        durationMinutes: 60,
        reminderMinutes: 30,
      });
    } catch (error) {
      console.error('Failed to create schedule:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDay = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Create Training Schedule</h2>
          <button
            onClick={onClose}
            className="text-2xl text-copy-muted hover:text-white"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-medium text-copy">
              Schedule Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
              placeholder="e.g., Morning Boxing Training"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-copy">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
              rows={3}
              placeholder="Add any notes about this training..."
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="mb-2 block text-sm font-medium text-copy">
              Frequency *
            </label>
            <select
              value={formData.frequency}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  frequency: e.target.value as ScheduleFormData['frequency'],
                })
              }
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
            >
              <option value="ONCE">One Time</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="BIWEEKLY">Bi-Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>

          {/* Days of Week */}
          {formData.frequency !== 'ONCE' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-copy">
                Days of Week *
              </label>
              <div className="flex gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition ${
                      formData.daysOfWeek.includes(day.value)
                        ? 'border-accent bg-accent text-black'
                        : 'border-gray-700 bg-gray-800 text-copy hover:border-gray-600'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date Range */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-copy">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-copy">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Time and Duration */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-copy">
                Time of Day *
              </label>
              <input
                type="time"
                value={formData.timeOfDay}
                onChange={(e) => setFormData({ ...formData, timeOfDay: e.target.value })}
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-copy">
                Duration (minutes) *
              </label>
              <input
                type="number"
                value={formData.durationMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })
                }
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
                min="15"
                step="15"
                required
              />
            </div>
          </div>

          {/* Reminder */}
          <div>
            <label className="mb-2 block text-sm font-medium text-copy">
              Reminder (minutes before)
            </label>
            <select
              value={formData.reminderMinutes}
              onChange={(e) =>
                setFormData({ ...formData, reminderMinutes: parseInt(e.target.value) })
              }
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
            >
              <option value="0">No reminder</option>
              <option value="15">15 minutes before</option>
              <option value="30">30 minutes before</option>
              <option value="60">1 hour before</option>
              <option value="120">2 hours before</option>
              <option value="1440">1 day before</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? 'Creating...' : 'Create Schedule'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
