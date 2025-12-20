'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface Goal {
  title: string;
  type: string;
  targetValue?: number;
  unit?: string;
  targetDate?: string;
}

interface GoalWizardProps {
  disciplines: string[];
  onComplete: (goal: Goal) => void;
  onSkip: () => void;
  onBack: () => void;
}

const goalTemplates = [
  {
    id: 'first-fight',
    title: 'Complete my first amateur fight',
    type: 'COMPETITION',
    icon: '🏆',
    description: 'Train towards competing',
  },
  {
    id: 'skill-mastery',
    title: 'Master a specific technique',
    type: 'SKILL_MASTERY',
    icon: '🎯',
    description: 'Focus on one technique',
  },
  {
    id: 'training-streak',
    title: 'Train consistently for 30 days',
    type: 'TRAINING_VOLUME',
    icon: '📅',
    description: 'Build a habit',
    targetValue: 30,
    unit: 'days',
  },
  {
    id: 'sessions-goal',
    title: 'Complete 50 training sessions',
    type: 'TRAINING_VOLUME',
    icon: '💪',
    description: 'Log your sessions',
    targetValue: 50,
    unit: 'sessions',
  },
  {
    id: 'weight-goal',
    title: 'Reach competition weight',
    type: 'PHYSICAL',
    icon: '⚖️',
    description: 'Weight management',
  },
  {
    id: 'cardio',
    title: 'Improve cardio endurance',
    type: 'PHYSICAL',
    icon: '❤️',
    description: 'Better conditioning',
  },
];

export function GoalWizard({ disciplines, onComplete, onSkip, onBack }: GoalWizardProps) {
  const [step, setStep] = useState<'select' | 'customize'>('select');
  const [selectedTemplate, setSelectedTemplate] = useState<typeof goalTemplates[0] | null>(null);
  const [customGoal, setCustomGoal] = useState<Goal>({
    title: '',
    type: 'SKILL_MASTERY',
    targetValue: undefined,
    unit: '',
    targetDate: '',
  });

  const handleTemplateSelect = (template: typeof goalTemplates[0]) => {
    setSelectedTemplate(template);
    setCustomGoal({
      title: template.title,
      type: template.type,
      targetValue: template.targetValue,
      unit: template.unit || '',
      targetDate: '',
    });
    setStep('customize');
  };

  const handleCustomize = () => {
    setSelectedTemplate(null);
    setCustomGoal({
      title: '',
      type: 'SKILL_MASTERY',
      targetValue: undefined,
      unit: '',
      targetDate: '',
    });
    setStep('customize');
  };

  const handleSubmit = () => {
    if (customGoal.title.trim()) {
      onComplete({
        title: customGoal.title.trim(),
        type: customGoal.type,
        targetValue: customGoal.targetValue,
        unit: customGoal.unit || undefined,
        targetDate: customGoal.targetDate || undefined,
      });
    }
  };

  // Calculate default target date (3 months from now)
  const defaultTargetDate = new Date();
  defaultTargetDate.setMonth(defaultTargetDate.getMonth() + 3);
  const minDate = new Date().toISOString().split('T')[0];

  if (step === 'select') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Set Your First Goal</h2>
          <p className="text-gray-400">What do you want to achieve? Choose a template or create your own.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {goalTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => handleTemplateSelect(template)}
              className="p-4 rounded-lg border border-gray-700 bg-gray-800/50 text-left transition-all hover:border-accent hover:bg-accent/5"
            >
              <div className="text-2xl mb-2">{template.icon}</div>
              <div className="font-medium text-white text-sm">{template.title}</div>
              <div className="text-xs text-gray-400 mt-1">{template.description}</div>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleCustomize}
          className="w-full p-4 rounded-lg border border-dashed border-gray-600 text-gray-400 hover:border-accent hover:text-accent transition-colors"
        >
          + Create Custom Goal
        </button>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button variant="outline" onClick={onSkip}>
            Skip for now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          {selectedTemplate ? 'Customize Your Goal' : 'Create Your Goal'}
        </h2>
        <p className="text-gray-400">Add details to make it specific and trackable</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Goal Title</label>
          <input
            type="text"
            value={customGoal.title}
            onChange={(e) => setCustomGoal((prev) => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            placeholder="e.g., Master the jab-cross combination"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Goal Type</label>
          <select
            value={customGoal.type}
            onChange={(e) => setCustomGoal((prev) => ({ ...prev, type: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            <option value="SKILL_MASTERY">Skill Mastery</option>
            <option value="TRAINING_VOLUME">Training Volume</option>
            <option value="COMPETITION">Competition</option>
            <option value="PHYSICAL">Physical/Fitness</option>
            <option value="MENTAL">Mental/Mindset</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Target Value (optional)</label>
            <input
              type="number"
              value={customGoal.targetValue || ''}
              onChange={(e) =>
                setCustomGoal((prev) => ({
                  ...prev,
                  targetValue: e.target.value ? parseInt(e.target.value) : undefined,
                }))
              }
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="e.g., 30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Unit (optional)</label>
            <input
              type="text"
              value={customGoal.unit}
              onChange={(e) => setCustomGoal((prev) => ({ ...prev, unit: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="e.g., sessions, rounds, hours"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Target Date (optional)</label>
          <input
            type="date"
            value={customGoal.targetDate}
            min={minDate}
            onChange={(e) => setCustomGoal((prev) => ({ ...prev, targetDate: e.target.value }))}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setStep('select')}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSkip}>
            Skip
          </Button>
          <Button onClick={handleSubmit} disabled={!customGoal.title.trim()}>
            Create Goal
          </Button>
        </div>
      </div>
    </div>
  );
}
