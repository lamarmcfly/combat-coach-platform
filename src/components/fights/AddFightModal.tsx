'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { useToast } from '@/contexts/ToastContext';

interface AddFightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const FIGHT_TYPES = [
  { value: 'COMPETITION', label: 'Competition' },
  { value: 'SPARRING', label: 'Sparring' },
  { value: 'TRAINING', label: 'Training' },
  { value: 'EXHIBITION', label: 'Exhibition' },
];

const RESULTS = [
  { value: 'WIN', label: 'Win' },
  { value: 'LOSS', label: 'Loss' },
  { value: 'DRAW', label: 'Draw' },
  { value: 'NO_CONTEST', label: 'No Contest' },
  { value: 'IN_PROGRESS', label: 'Not Yet Decided' },
];

const FINISH_TYPES = [
  { value: 'NONE', label: 'N/A' },
  { value: 'DECISION_UNANIMOUS', label: 'Unanimous Decision' },
  { value: 'DECISION_SPLIT', label: 'Split Decision' },
  { value: 'DECISION_MAJORITY', label: 'Majority Decision' },
  { value: 'KO', label: 'Knockout (KO)' },
  { value: 'TKO', label: 'Technical Knockout (TKO)' },
  { value: 'SUBMISSION', label: 'Submission' },
  { value: 'DQ', label: 'Disqualification' },
  { value: 'TECHNICAL_DECISION', label: 'Technical Decision' },
];

const DISCIPLINES = [
  'MMA',
  'Boxing',
  'Kickboxing',
  'Muay Thai',
  'BJJ',
  'Wrestling',
  'Judo',
  'Karate',
  'Taekwondo',
  'Other',
];

const WEIGHT_CLASSES = [
  'Strawweight (115)',
  'Flyweight (125)',
  'Bantamweight (135)',
  'Featherweight (145)',
  'Lightweight (155)',
  'Welterweight (170)',
  'Middleweight (185)',
  'Light Heavyweight (205)',
  'Heavyweight (265)',
  'Open Weight',
];

export function AddFightModal({ isOpen, onClose, onSuccess }: AddFightModalProps) {
  const { success, error: showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  // Form state
  const [type, setType] = useState('SPARRING');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [weightClass, setWeightClass] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [opponentRecord, setOpponentRecord] = useState('');
  const [opponentNotes, setOpponentNotes] = useState('');
  const [result, setResult] = useState('IN_PROGRESS');
  const [finishType, setFinishType] = useState('NONE');
  const [finishRound, setFinishRound] = useState('');
  const [finishTime, setFinishTime] = useState('');
  const [totalRounds, setTotalRounds] = useState('3');
  const [roundMinutes, setRoundMinutes] = useState('5');
  const [videoUrl, setVideoUrl] = useState('');
  const [gameplanNotes, setGameplanNotes] = useState('');
  const [summaryNotes, setSummaryNotes] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/fights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          eventName: eventName || null,
          eventDate,
          location: location || null,
          discipline: discipline || null,
          weightClass: weightClass || null,
          opponentName: opponentName || null,
          opponentRecord: opponentRecord || null,
          opponentNotes: opponentNotes || null,
          result,
          finishType,
          finishRound: finishRound ? parseInt(finishRound) : null,
          finishTime: finishTime || null,
          totalRounds: parseInt(totalRounds),
          roundMinutes: parseInt(roundMinutes),
          videoUrl: videoUrl || null,
          gameplanNotes: gameplanNotes || null,
          summaryNotes: summaryNotes || null,
          lessonsLearned: lessonsLearned || null,
        }),
      });

      if (response.ok) {
        success('Fight Added', 'Your fight has been logged successfully');
        onSuccess();
        onClose();
        resetForm();
      } else {
        throw new Error('Failed to add fight');
      }
    } catch (err) {
      showError('Error', 'Failed to add fight');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setType('SPARRING');
    setEventName('');
    setEventDate(new Date().toISOString().split('T')[0]);
    setLocation('');
    setDiscipline('');
    setWeightClass('');
    setOpponentName('');
    setOpponentRecord('');
    setOpponentNotes('');
    setResult('IN_PROGRESS');
    setFinishType('NONE');
    setFinishRound('');
    setFinishTime('');
    setTotalRounds('3');
    setRoundMinutes('5');
    setVideoUrl('');
    setGameplanNotes('');
    setSummaryNotes('');
    setLessonsLearned('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Log Fight/Sparring</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`flex-1 h-2 rounded-full transition ${
                step >= s ? 'bg-accent' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Event Details</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Type" required>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {FIGHT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Date" required>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  />
                </FormField>
              </div>

              <FormField label="Event Name">
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g., UFC 300, Local Tournament, Gym Sparring"
                  className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Discipline">
                  <select
                    value={discipline}
                    onChange={(e) => setDiscipline(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Select...</option>
                    {DISCIPLINES.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Weight Class">
                  <select
                    value={weightClass}
                    onChange={(e) => setWeightClass(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Select...</option>
                    {WEIGHT_CLASSES.map((wc) => (
                      <option key={wc} value={wc}>{wc}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField label="Location">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Las Vegas, NV or Your Gym"
                  className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Rounds">
                  <input
                    type="number"
                    value={totalRounds}
                    onChange={(e) => setTotalRounds(e.target.value)}
                    min="1"
                    max="12"
                    className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </FormField>

                <FormField label="Minutes/Round">
                  <input
                    type="number"
                    value={roundMinutes}
                    onChange={(e) => setRoundMinutes(e.target.value)}
                    min="1"
                    max="10"
                    className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </FormField>
              </div>

              <div className="flex justify-end mt-6">
                <Button type="button" onClick={() => setStep(2)}>
                  Next: Opponent & Result
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Opponent & Result */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Opponent & Result</h3>

              <FormField label="Opponent Name">
                <input
                  type="text"
                  value={opponentName}
                  onChange={(e) => setOpponentName(e.target.value)}
                  placeholder="Enter opponent's name"
                  className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Opponent Record">
                  <input
                    type="text"
                    value={opponentRecord}
                    onChange={(e) => setOpponentRecord(e.target.value)}
                    placeholder="e.g., 5-2-0"
                    className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
                  />
                </FormField>

                <FormField label="Result" required>
                  <select
                    value={result}
                    onChange={(e) => setResult(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {RESULTS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              {result !== 'IN_PROGRESS' && (
                <div className="grid grid-cols-3 gap-4">
                  <FormField label="Finish Method">
                    <select
                      value={finishType}
                      onChange={(e) => setFinishType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      {FINISH_TYPES.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Finish Round">
                    <input
                      type="number"
                      value={finishRound}
                      onChange={(e) => setFinishRound(e.target.value)}
                      placeholder="Round #"
                      min="1"
                      max={totalRounds}
                      className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
                    />
                  </FormField>

                  <FormField label="Finish Time">
                    <input
                      type="text"
                      value={finishTime}
                      onChange={(e) => setFinishTime(e.target.value)}
                      placeholder="e.g., 2:34"
                      className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
                    />
                  </FormField>
                </div>
              )}

              <FormField label="Opponent Notes">
                <textarea
                  value={opponentNotes}
                  onChange={(e) => setOpponentNotes(e.target.value)}
                  placeholder="Style, tendencies, weaknesses observed..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
                />
              </FormField>

              <FormField label="Video URL">
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="YouTube or video link"
                  className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
                />
              </FormField>

              <div className="flex justify-between mt-6">
                <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="button" onClick={() => setStep(3)}>
                  Next: Notes
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Notes & Analysis */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Analysis & Notes</h3>

              <FormField label="Game Plan (Pre-fight)">
                <textarea
                  value={gameplanNotes}
                  onChange={(e) => setGameplanNotes(e.target.value)}
                  placeholder="What was your strategy going in?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
                />
              </FormField>

              <FormField label="Fight Summary">
                <textarea
                  value={summaryNotes}
                  onChange={(e) => setSummaryNotes(e.target.value)}
                  placeholder="How did the fight go? Key moments?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
                />
              </FormField>

              <FormField label="Lessons Learned">
                <textarea
                  value={lessonsLearned}
                  onChange={(e) => setLessonsLearned(e.target.value)}
                  placeholder="What did you learn? What needs improvement?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
                />
              </FormField>

              <div className="flex justify-between mt-6">
                <Button type="button" variant="secondary" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Fight'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
