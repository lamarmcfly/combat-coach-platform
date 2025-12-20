'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';

interface SendRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerId: string;
  partnerName: string;
  onSubmit: (data: any) => Promise<void>;
}

const INTENSITIES = ['Light', 'Medium', 'Hard'];

export function SendRequestModal({
  isOpen,
  onClose,
  partnerId,
  partnerName,
  onSubmit,
}: SendRequestModalProps) {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    proposedDate: '',
    proposedTime: '',
    location: '',
    discipline: '',
    intensity: 'Medium',
    duration: 60,
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        partnerId,
        ...formData,
        proposedDate: formData.proposedDate || undefined,
      });
      toast.success('Request sent successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to send request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Request Sparring Session</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-gray-400 mb-6">
            Send a sparring request to <span className="text-white font-medium">{partnerName}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Proposed Date</label>
                <input
                  type="date"
                  value={formData.proposedDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, proposedDate: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Proposed Time</label>
                <input
                  type="time"
                  value={formData.proposedTime}
                  onChange={(e) => setFormData((prev) => ({ ...prev, proposedTime: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Location / Gym</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="Where do you want to meet?"
                className="w-full px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {/* Discipline */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Discipline</label>
              <select
                value={formData.discipline}
                onChange={(e) => setFormData((prev) => ({ ...prev, discipline: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select discipline...</option>
                <option value="MMA">MMA</option>
                <option value="Boxing">Boxing</option>
                <option value="Muay Thai">Muay Thai</option>
                <option value="Kickboxing">Kickboxing</option>
                <option value="BJJ">BJJ</option>
                <option value="Wrestling">Wrestling</option>
              </select>
            </div>

            {/* Intensity */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Intensity Level</label>
              <div className="flex gap-2">
                {INTENSITIES.map((intensity) => (
                  <button
                    key={intensity}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, intensity }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.intensity === intensity
                        ? 'bg-accent text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {intensity}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData((prev) => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                min={15}
                max={180}
                step={15}
                className="w-full px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Message (optional)</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="Introduce yourself, mention any preferences or goals..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Sending...' : 'Send Request'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
