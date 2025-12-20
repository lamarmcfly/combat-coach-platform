'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';

interface GoalCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const goalTypes = [
  { value: 'TECHNIQUE_MASTERY', label: 'Technique Mastery', description: 'Perfect a specific technique or combo' },
  { value: 'COMPETITION_PREP', label: 'Competition Prep', description: 'Prepare for an upcoming fight or tournament' },
  { value: 'FITNESS_IMPROVEMENT', label: 'Fitness Improvement', description: 'Improve conditioning, strength, or endurance' },
  { value: 'WEIGHT_CLASS', label: 'Weight Class', description: 'Reach or maintain a target weight' },
  { value: 'BELT_PROMOTION', label: 'Belt Promotion', description: 'Advance to the next rank or belt' },
  { value: 'SKILL_DEVELOPMENT', label: 'Skill Development', description: 'Develop overall skills in a discipline' },
  { value: 'SPARRING_PERFORMANCE', label: 'Sparring Performance', description: 'Improve sparring outcomes and confidence' },
  { value: 'CUSTOM', label: 'Custom Goal', description: 'Define your own goal type' },
];

const disciplines = [
  { id: 1, name: 'Boxing' },
  { id: 2, name: 'Muay Thai' },
  { id: 3, name: 'Kickboxing' },
  { id: 4, name: 'MMA' },
  { id: 5, name: 'Wrestling' },
  { id: 6, name: 'Brazilian Jiu-Jitsu' },
  { id: 7, name: 'Judo' },
];

export function GoalCreateModal({ isOpen, onClose, onSuccess }: GoalCreateModalProps) {
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: 'TECHNIQUE_MASTERY',
    title: '',
    description: '',
    targetDate: '',
    targetValue: '',
    unit: '',
    disciplineId: '',
    tags: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      error('Validation Error', 'Please enter a goal title');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        type: formData.type,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        targetDate: formData.targetDate || undefined,
        targetValue: formData.targetValue ? parseFloat(formData.targetValue) : undefined,
        unit: formData.unit.trim() || undefined,
        disciplineId: formData.disciplineId ? parseInt(formData.disciplineId) : undefined,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };

      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create goal');
      }

      success('Goal Created', 'Your new goal has been added successfully');
      setFormData({
        type: 'TECHNIQUE_MASTERY',
        title: '',
        description: '',
        targetDate: '',
        targetValue: '',
        unit: '',
        disciplineId: '',
        tags: '',
      });
      onSuccess();
      onClose();
    } catch (err) {
      error('Error', err instanceof Error ? err.message : 'Failed to create goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = goalTypes.find((t) => t.value === formData.type);
  const showTargetValue = ['FITNESS_IMPROVEMENT', 'WEIGHT_CLASS'].includes(formData.type);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Goal" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Goal Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Goal Type <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {goalTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, type: type.value }))}
                className={`
                  p-3 rounded-lg border text-left transition-all
                  ${formData.type === type.value
                    ? 'border-accent bg-accent/10 text-white'
                    : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                  }
                `}
              >
                <div className="font-medium text-sm">{type.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{type.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
            Goal Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder={`e.g., ${selectedType?.label === 'Technique Mastery' ? 'Master the spinning back kick' : 'Enter your goal'}`}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Describe your goal in more detail..."
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
          />
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-2 gap-4">
          {/* Discipline */}
          <div>
            <label htmlFor="disciplineId" className="block text-sm font-medium text-gray-300 mb-2">
              Discipline
            </label>
            <select
              id="disciplineId"
              name="disciplineId"
              value={formData.disciplineId}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              <option value="">Select discipline</option>
              {disciplines.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Target Date */}
          <div>
            <label htmlFor="targetDate" className="block text-sm font-medium text-gray-300 mb-2">
              Target Date
            </label>
            <input
              type="date"
              id="targetDate"
              name="targetDate"
              value={formData.targetDate}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>
        </div>

        {/* Target Value (conditional) */}
        {showTargetValue && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="targetValue" className="block text-sm font-medium text-gray-300 mb-2">
                Target Value
              </label>
              <input
                type="number"
                id="targetValue"
                name="targetValue"
                value={formData.targetValue}
                onChange={handleChange}
                placeholder="e.g., 155"
                step="0.1"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-300 mb-2">
                Unit
              </label>
              <input
                type="text"
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                placeholder="e.g., lbs, reps, minutes"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-2">
            Tags
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="Enter comma-separated tags (e.g., striking, defense, cardio)"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">Separate multiple tags with commas</p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
