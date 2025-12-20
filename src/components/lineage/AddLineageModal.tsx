'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { useToast } from '@/contexts/ToastContext';

interface AddLineageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DISCIPLINES = [
  'BJJ',
  'Boxing',
  'Muay Thai',
  'Wrestling',
  'Judo',
  'Karate',
  'MMA',
  'Kickboxing',
  'Taekwondo',
  'Sambo',
  'Catch Wrestling',
  'Other',
];

export function AddLineageModal({ isOpen, onClose, onSuccess }: AddLineageModalProps) {
  const { success, error: showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    coachName: '',
    gymName: '',
    location: '',
    discipline: '',
    startYear: '',
    endYear: '',
    beltOrRank: '',
    notes: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/lineage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        success('Coach Added', 'Your training lineage has been updated.');
        setFormData({
          coachName: '',
          gymName: '',
          location: '',
          discipline: '',
          startYear: '',
          endYear: '',
          beltOrRank: '',
          notes: '',
        });
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add coach');
      }
    } catch (err) {
      showError('Error', err instanceof Error ? err.message : 'Failed to add coach');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black/75" onClick={onClose} />

        <div className="inline-block align-bottom bg-gray-900 border border-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="px-6 pt-6 pb-4">
              <h3 className="text-lg font-semibold text-white mb-1">Add Training Coach</h3>
              <p className="text-sm text-gray-400 mb-4">
                Add a coach or instructor who trained you to your lineage.
              </p>

              <div className="space-y-4">
                <FormField label="Coach Name" required>
                  <input
                    type="text"
                    value={formData.coachName}
                    onChange={(e) => setFormData({ ...formData, coachName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
                    placeholder="e.g., John Danaher, Saenchai"
                    required
                  />
                </FormField>

                <FormField label="Discipline" required>
                  <select
                    value={formData.discipline}
                    onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  >
                    <option value="">Select discipline...</option>
                    {DISCIPLINES.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Gym/Academy">
                    <input
                      type="text"
                      value={formData.gymName}
                      onChange={(e) => setFormData({ ...formData, gymName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
                      placeholder="e.g., 10th Planet, Renzo Gracie"
                    />
                  </FormField>

                  <FormField label="Location">
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
                      placeholder="e.g., New York, Thailand"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Start Year">
                    <select
                      value={formData.startYear}
                      onChange={(e) => setFormData({ ...formData, startYear: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="">Select year...</option>
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="End Year">
                    <select
                      value={formData.endYear}
                      onChange={(e) => setFormData({ ...formData, endYear: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="">Still training</option>
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <FormField label="Belt/Rank Achieved">
                  <input
                    type="text"
                    value={formData.beltOrRank}
                    onChange={(e) => setFormData({ ...formData, beltOrRank: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
                    placeholder="e.g., Purple Belt, Professional"
                  />
                </FormField>

                <FormField label="Notes">
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
                    rows={2}
                    placeholder="Any additional notes about your training..."
                  />
                </FormField>
              </div>
            </div>

            <div className="bg-gray-800 px-6 py-4 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Coach'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
