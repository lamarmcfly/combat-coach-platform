'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface DisciplineSelectorProps {
  selectedDisciplines: string[];
  onComplete: (disciplines: string[]) => void;
  onBack: () => void;
}

const disciplines = [
  { id: 'boxing', name: 'Boxing', icon: '🥊', description: 'The sweet science' },
  { id: 'muay-thai', name: 'Muay Thai', icon: '🇹🇭', description: 'Art of eight limbs' },
  { id: 'mma', name: 'MMA', icon: '🔥', description: 'Mixed martial arts' },
  { id: 'brazilian-jiu-jitsu', name: 'Brazilian Jiu-Jitsu', icon: '🥋', description: 'Ground fighting & submissions' },
  { id: 'wrestling', name: 'Wrestling', icon: '🤼', description: 'Takedowns & control' },
  { id: 'kickboxing', name: 'Kickboxing', icon: '🦵', description: 'Stand-up striking' },
  { id: 'judo', name: 'Judo', icon: '⚫', description: 'Throws & grappling' },
  { id: 'karate', name: 'Karate', icon: '🥷', description: 'Traditional striking art' },
  { id: 'taekwondo', name: 'Taekwondo', icon: '🦶', description: 'Korean kicking art' },
  { id: 'sambo', name: 'Sambo', icon: '🇷🇺', description: 'Russian combat sport' },
];

export function DisciplineSelector({ selectedDisciplines, onComplete, onBack }: DisciplineSelectorProps) {
  const [selected, setSelected] = useState<string[]>(selectedDisciplines);

  const toggleDiscipline = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const canContinue = selected.length > 0;

  const handleSubmit = () => {
    if (canContinue) {
      onComplete(selected);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Choose Your Disciplines</h2>
        <p className="text-gray-400">Select all the martial arts you train or want to train</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {disciplines.map((discipline) => (
          <button
            key={discipline.id}
            type="button"
            onClick={() => toggleDiscipline(discipline.id)}
            className={`p-4 rounded-lg border text-left transition-all ${
              selected.includes(discipline.id)
                ? 'border-accent bg-accent/10 text-white scale-[1.02]'
                : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{discipline.icon}</span>
              <div>
                <div className="font-medium">{discipline.name}</div>
                <div className="text-xs text-gray-400">{discipline.description}</div>
              </div>
              {selected.includes(discipline.id) && (
                <span className="ml-auto text-accent">✓</span>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="text-center text-sm text-gray-500">
        {selected.length} discipline{selected.length !== 1 ? 's' : ''} selected
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
