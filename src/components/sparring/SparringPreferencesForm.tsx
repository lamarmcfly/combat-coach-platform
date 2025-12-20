'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';

interface SparringPreferencesFormProps {
  preferences: any;
  onSave: (data: any) => Promise<void>;
}

const WEIGHT_CLASSES = [
  'Strawweight 115',
  'Flyweight 125',
  'Bantamweight 135',
  'Featherweight 145',
  'Lightweight 155',
  'Welterweight 170',
  'Middleweight 185',
  'Light Heavyweight 205',
  'Heavyweight 265',
  'Open Weight',
];

const DISCIPLINES = [
  'MMA',
  'Boxing',
  'Muay Thai',
  'Kickboxing',
  'BJJ',
  'Wrestling',
  'Judo',
  'Sambo',
  'Karate',
  'Taekwondo',
];

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Pro'];
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_PREFERENCES = ['Morning', 'Afternoon', 'Evening', 'Flexible'];

export function SparringPreferencesForm({ preferences, onSave }: SparringPreferencesFormProps) {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    isAvailable: preferences?.isAvailable ?? true,
    weightClass: preferences?.weightClass || '',
    disciplines: preferences?.disciplines || [],
    location: preferences?.location || '',
    radius: preferences?.radius || 25,
    skillLevel: preferences?.skillLevel || '',
    preferredDays: preferences?.preferredDays || [],
    preferredTime: preferences?.preferredTime || '',
    gymName: preferences?.gymName || '',
    notes: preferences?.notes || '',
  });

  const handleDisciplineToggle = (discipline: string) => {
    setFormData((prev) => ({
      ...prev,
      disciplines: prev.disciplines.includes(discipline)
        ? prev.disciplines.filter((d: string) => d !== discipline)
        : [...prev.disciplines, discipline],
    }));
  };

  const handleDayToggle = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredDays: prev.preferredDays.includes(day)
        ? prev.preferredDays.filter((d: string) => d !== day)
        : [...prev.preferredDays, day],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSave(formData);
      toast.success('Preferences saved successfully!');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Availability Toggle */}
      <div className="flex items-center justify-between p-4 rounded-lg border border-gray-700 bg-gray-800/50">
        <div>
          <h3 className="font-medium text-white">Available for Sparring</h3>
          <p className="text-sm text-gray-400">Toggle off if you're not currently looking for partners</p>
        </div>
        <button
          type="button"
          onClick={() => setFormData((prev) => ({ ...prev, isAvailable: !prev.isAvailable }))}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            formData.isAvailable ? 'bg-accent' : 'bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              formData.isAvailable ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Weight Class */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Weight Class</label>
        <select
          value={formData.weightClass}
          onChange={(e) => setFormData((prev) => ({ ...prev, weightClass: e.target.value }))}
          className="w-full px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">Select weight class...</option>
          {WEIGHT_CLASSES.map((wc) => (
            <option key={wc} value={wc}>
              {wc}
            </option>
          ))}
        </select>
      </div>

      {/* Disciplines */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Disciplines</label>
        <div className="flex flex-wrap gap-2">
          {DISCIPLINES.map((discipline) => (
            <button
              key={discipline}
              type="button"
              onClick={() => handleDisciplineToggle(discipline)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                formData.disciplines.includes(discipline)
                  ? 'bg-accent text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {discipline}
            </button>
          ))}
        </div>
      </div>

      {/* Location & Radius */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Location / Area</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
            placeholder="e.g., Los Angeles, CA"
            className="w-full px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Search Radius (miles)</label>
          <input
            type="number"
            value={formData.radius}
            onChange={(e) => setFormData((prev) => ({ ...prev, radius: parseInt(e.target.value) || 25 }))}
            min={5}
            max={100}
            className="w-full px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {/* Skill Level */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Skill Level</label>
        <div className="flex flex-wrap gap-2">
          {SKILL_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, skillLevel: level }))}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                formData.skillLevel === level
                  ? 'bg-accent text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Preferred Days */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Days</label>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => handleDayToggle(day)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                formData.preferredDays.includes(day)
                  ? 'bg-accent text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Preferred Time */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Time</label>
        <div className="flex flex-wrap gap-2">
          {TIME_PREFERENCES.map((time) => (
            <button
              key={time}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, preferredTime: time }))}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                formData.preferredTime === time
                  ? 'bg-accent text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      </div>

      {/* Gym Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Gym / Training Facility</label>
        <input
          type="text"
          value={formData.gymName}
          onChange={(e) => setFormData((prev) => ({ ...prev, gymName: e.target.value }))}
          placeholder="e.g., UFC Performance Institute"
          className="w-full px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Additional Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Any other details potential partners should know..."
          rows={3}
          className="w-full px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </form>
  );
}
