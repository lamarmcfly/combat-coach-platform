'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RequestFormData) => Promise<void>;
  coaches: Array<{ id: string; displayName: string; avatarUrl: string | null }>;
}

interface RequestFormData {
  coachId: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  tags: string[];
}

const REQUEST_TYPES = [
  { value: 'VIDEO_REVIEW', label: 'Video Review' },
  { value: 'TECHNIQUE_CHECK', label: 'Technique Check' },
  { value: 'FORM_ANALYSIS', label: 'Form Analysis' },
  { value: 'TRAINING_QUESTION', label: 'Training Question' },
  { value: 'STRATEGY_ADVICE', label: 'Strategy Advice' },
  { value: 'GENERAL', label: 'General' },
];

const PRIORITIES = [
  { value: 'LOW', label: 'Low' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

export function CreateRequestModal({
  isOpen,
  onClose,
  onSubmit,
  coaches,
}: CreateRequestModalProps) {
  const [formData, setFormData] = useState<RequestFormData>({
    coachId: '',
    title: '',
    description: '',
    type: 'GENERAL',
    priority: 'NORMAL',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        coachId: '',
        title: '',
        description: '',
        type: 'GENERAL',
        priority: 'NORMAL',
        tags: [],
      });
      setTagInput('');
      onClose();
    } catch (error) {
      console.error('Error submitting request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 transition-opacity bg-black/75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-gray-900 border border-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Request Coaching Feedback
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Submit a request for personalized coaching feedback
                </p>
              </div>

              <div className="space-y-4">
                <FormField label="Select Coach" required>
                  <select
                    value={formData.coachId}
                    onChange={(e) =>
                      setFormData({ ...formData, coachId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  >
                    <option value="">Choose a coach...</option>
                    {coaches.map((coach) => (
                      <option key={coach.id} value={coach.id}>
                        {coach.displayName}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Request Type" required>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  >
                    {REQUEST_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Priority">
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Title" required>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
                    placeholder="Brief title for your request"
                    required
                  />
                </FormField>

                <FormField label="Description" required>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
                    rows={4}
                    placeholder="Provide details about what you need feedback on..."
                    required
                  />
                </FormField>

                <FormField label="Tags (optional)">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
                        placeholder="Add tags (e.g., sparring, footwork)"
                      />
                      <Button
                        type="button"
                        onClick={handleAddTag}
                        variant="secondary"
                      >
                        Add
                      </Button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-accent/20 text-accent rounded-full text-sm"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="hover:text-white"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </FormField>
              </div>
            </div>

            <div className="bg-gray-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
