'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Card } from '@/components/ui/Card';

interface VideoSubmissionFormProps {
  onSubmit: (data: VideoSubmissionData) => Promise<void>;
  coaches: Array<{ id: string; displayName: string; avatarUrl: string | null }>;
}

interface VideoSubmissionData {
  coachId: string;
  title: string;
  description: string;
  videoUrl: string;
  specificQuestions: string;
  tags: string[];
}

export function VideoSubmissionForm({ onSubmit, coaches }: VideoSubmissionFormProps) {
  const [formData, setFormData] = useState<VideoSubmissionData>({
    coachId: '',
    title: '',
    description: '',
    videoUrl: '',
    specificQuestions: '',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
        videoUrl: '',
        specificQuestions: '',
        tags: [],
      });
    } catch (error) {
      console.error('Error submitting video:', error);
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
    <Card>
      <h2 className="text-xl font-bold text-white mb-4">Submit Video for Review</h2>
      <p className="text-gray-400 mb-6">
        Upload a video of your training or technique and get personalized feedback from your coach.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Select Coach" required>
          <select
            value={formData.coachId}
            onChange={(e) => setFormData({ ...formData, coachId: e.target.value })}
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

        <FormField label="Video Title" required>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
            placeholder="e.g., Sparring session - Working on footwork"
            required
          />
        </FormField>

        <FormField label="Video URL" required>
          <input
            type="url"
            value={formData.videoUrl}
            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
            className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
            placeholder="https://youtube.com/... or upload link"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Paste a link to your video (YouTube, Vimeo, Google Drive, etc.)
          </p>
        </FormField>

        <FormField label="Context & Background" required>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
            rows={4}
            placeholder="Provide context about the video - What were you working on? What are your goals? Any specific challenges you're facing?"
            required
          />
        </FormField>

        <FormField label="Specific Questions for Coach">
          <textarea
            value={formData.specificQuestions}
            onChange={(e) =>
              setFormData({ ...formData, specificQuestions: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
            rows={3}
            placeholder="e.g., How is my stance? Should I be moving my feet differently? Is my guard too low?"
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
                placeholder="e.g., sparring, footwork, combinations"
              />
              <Button type="button" onClick={handleAddTag} variant="secondary">
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

        <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
          <h4 className="font-semibold text-accent mb-2">Tips for Better Feedback</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Use good lighting and film from multiple angles if possible</li>
            <li>• Include warmup and actual training/sparring footage</li>
            <li>• Be specific about what you want feedback on</li>
            <li>• Typical response time is 24-48 hours</li>
          </ul>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
