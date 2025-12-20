'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface ProfileData {
  firstName: string;
  lastName: string;
  experienceLevel: string;
}

interface ProfileSetupProps {
  initialData: ProfileData;
  onComplete: (data: ProfileData) => void;
  onBack: () => void;
}

const experienceLevels = [
  { value: 'BEGINNER', label: 'Beginner', description: 'Just starting out, less than 1 year' },
  { value: 'INTERMEDIATE', label: 'Intermediate', description: '1-3 years of training' },
  { value: 'ADVANCED', label: 'Advanced', description: '3-5 years of training' },
  { value: 'EXPERT', label: 'Expert', description: '5+ years, competition experience' },
];

export function ProfileSetup({ initialData, onComplete, onBack }: ProfileSetupProps) {
  const [firstName, setFirstName] = useState(initialData.firstName);
  const [lastName, setLastName] = useState(initialData.lastName);
  const [experienceLevel, setExperienceLevel] = useState(initialData.experienceLevel);

  const canContinue = firstName.trim() && lastName.trim() && experienceLevel;

  const handleSubmit = () => {
    if (canContinue) {
      onComplete({ firstName: firstName.trim(), lastName: lastName.trim(), experienceLevel });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Tell us about yourself</h2>
        <p className="text-gray-400">We'll personalize your experience based on your info</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="John"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="Doe"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-3">Experience Level</label>
          <div className="space-y-2">
            {experienceLevels.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setExperienceLevel(level.value)}
                className={`w-full p-4 rounded-lg border text-left transition-colors ${
                  experienceLevel === level.value
                    ? 'border-accent bg-accent/10 text-white'
                    : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600'
                }`}
              >
                <div className="font-medium">{level.label}</div>
                <div className="text-sm text-gray-400">{level.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={!canContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
