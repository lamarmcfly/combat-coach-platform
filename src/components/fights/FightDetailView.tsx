'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { YouTubeEmbed, isYouTubeUrl } from '@/components/ui/YouTubeEmbed';
import { useToast } from '@/contexts/ToastContext';

interface Round {
  id: string;
  roundNumber: number;
  strikesLanded: number;
  strikesAttempted: number;
  sigStrikesLanded: number;
  sigStrikesAttempted: number;
  knockdowns: number;
  takedownsLanded: number;
  takedownsAttempted: number;
  submissionAttempts: number;
  sweeps: number;
  reversals: number;
  controlTimeTop: number;
  controlTimeBack: number;
  controlTimeClinch: number;
  timeInGuard: number;
  strikesAbsorbed: number;
  takedownsDefended: number;
  submissionsDefended: number;
  roundWinner: string | null;
  notes: string | null;
}

interface Technique {
  id: string;
  roundNumber: number | null;
  techniqueName: string;
  category: string;
  attempted: number;
  successful: number;
  wasEffective: boolean;
  needsWork: boolean;
  notes: string | null;
}

interface Fight {
  id: string;
  type: string;
  result: string;
  finishType: string;
  finishRound: number | null;
  finishTime: string | null;
  eventName: string | null;
  eventDate: string;
  location: string | null;
  weightClass: string | null;
  opponentName: string | null;
  opponentRecord: string | null;
  opponentNotes: string | null;
  discipline: string | null;
  videoUrl: string | null;
  totalRounds: number;
  roundMinutes: number;
  gameplanNotes: string | null;
  summaryNotes: string | null;
  lessonsLearned: string | null;
  rounds: Round[];
  techniques: Technique[];
}

interface AggregateStats {
  totalStrikesLanded: number;
  totalStrikesAttempted: number;
  totalSigStrikesLanded: number;
  totalSigStrikesAttempted: number;
  totalTakedownsLanded: number;
  totalTakedownsAttempted: number;
  totalSubmissionAttempts: number;
  totalKnockdowns: number;
  totalControlTime: number;
  strikeAccuracy: string | number;
  takedownAccuracy: string | number;
  roundsWon: number;
  roundsLost: number;
}

interface FightDetailViewProps {
  fightId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function FightDetailView({ fightId, onClose, onUpdate }: FightDetailViewProps) {
  const { success, error: showError } = useToast();
  const [fight, setFight] = useState<Fight | null>(null);
  const [aggregateStats, setAggregateStats] = useState<AggregateStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'rounds' | 'techniques'>('overview');
  const [editingRound, setEditingRound] = useState<number | null>(null);
  const [roundData, setRoundData] = useState<Partial<Round>>({});

  useEffect(() => {
    fetchFight();
  }, [fightId]);

  const fetchFight = async () => {
    try {
      const response = await fetch(`/api/fights/${fightId}`);
      if (response.ok) {
        const data = await response.json();
        setFight(data.fight);
        setAggregateStats(data.aggregateStats);
      }
    } catch (error) {
      console.error('Error fetching fight:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRound = async (roundNumber: number) => {
    try {
      const response = await fetch(`/api/fights/${fightId}/rounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundNumber, ...roundData }),
      });

      if (response.ok) {
        success('Round Saved', `Round ${roundNumber} stats updated`);
        setEditingRound(null);
        setRoundData({});
        fetchFight();
        onUpdate();
      } else {
        throw new Error('Failed to save round');
      }
    } catch (err) {
      showError('Error', 'Failed to save round stats');
    }
  };

  const startEditingRound = (round: Round | null, roundNumber: number) => {
    setEditingRound(roundNumber);
    if (round) {
      setRoundData(round);
    } else {
      setRoundData({ roundNumber });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading || !fight) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        <Card className="w-full max-w-4xl p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-700 rounded w-1/3" />
            <div className="h-4 bg-gray-700 rounded w-1/2" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto my-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`text-3xl font-bold ${
                  fight.result === 'WIN'
                    ? 'text-green-400'
                    : fight.result === 'LOSS'
                    ? 'text-red-400'
                    : 'text-yellow-400'
                }`}
              >
                {fight.result}
              </span>
              {fight.finishType !== 'NONE' && (
                <Badge variant="default">
                  {fight.finishType.replace('_', ' ')}
                  {fight.finishRound && ` R${fight.finishRound}`}
                  {fight.finishTime && ` ${fight.finishTime}`}
                </Badge>
              )}
            </div>
            <h2 className="text-xl font-bold text-white">
              vs {fight.opponentName || 'Unknown Opponent'}
            </h2>
            <p className="text-gray-400">
              {fight.eventName || fight.type} • {new Date(fight.eventDate).toLocaleDateString()}
              {fight.location && ` • ${fight.location}`}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-800 mb-6">
          {['overview', 'rounds', 'techniques'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 text-sm font-medium transition border-b-2 ${
                activeTab === tab
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && aggregateStats && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-white">
                  {aggregateStats.totalStrikesLanded}/{aggregateStats.totalStrikesAttempted}
                </p>
                <p className="text-xs text-gray-500">Strikes (Landed/Att)</p>
                <p className="text-accent text-sm">{aggregateStats.strikeAccuracy}% Accuracy</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-white">
                  {aggregateStats.totalSigStrikesLanded}/{aggregateStats.totalSigStrikesAttempted}
                </p>
                <p className="text-xs text-gray-500">Sig. Strikes</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-white">
                  {aggregateStats.totalTakedownsLanded}/{aggregateStats.totalTakedownsAttempted}
                </p>
                <p className="text-xs text-gray-500">Takedowns</p>
                <p className="text-accent text-sm">{aggregateStats.takedownAccuracy}% Accuracy</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-white">{formatTime(aggregateStats.totalControlTime)}</p>
                <p className="text-xs text-gray-500">Control Time</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-400">{aggregateStats.totalKnockdowns}</p>
                <p className="text-xs text-gray-500">Knockdowns</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-purple-400">{aggregateStats.totalSubmissionAttempts}</p>
                <p className="text-xs text-gray-500">Sub Attempts</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-accent">
                  {aggregateStats.roundsWon}-{aggregateStats.roundsLost}
                </p>
                <p className="text-xs text-gray-500">Rounds Won/Lost</p>
              </div>
            </div>

            {/* Notes */}
            {fight.gameplanNotes && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">Game Plan</h4>
                <p className="text-gray-400 text-sm">{fight.gameplanNotes}</p>
              </div>
            )}
            {fight.summaryNotes && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">Fight Summary</h4>
                <p className="text-gray-400 text-sm">{fight.summaryNotes}</p>
              </div>
            )}
            {fight.lessonsLearned && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">Lessons Learned</h4>
                <p className="text-gray-400 text-sm">{fight.lessonsLearned}</p>
              </div>
            )}
          </div>
        )}

        {/* Rounds Tab */}
        {activeTab === 'rounds' && (
          <div className="space-y-4">
            {Array.from({ length: fight.totalRounds }, (_, i) => i + 1).map((roundNum) => {
              const round = fight.rounds.find((r) => r.roundNumber === roundNum);
              const isEditing = editingRound === roundNum;

              return (
                <div key={roundNum} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-white">Round {roundNum}</span>
                      {round?.roundWinner && (
                        <Badge
                          variant={
                            round.roundWinner === 'self'
                              ? 'success'
                              : round.roundWinner === 'opponent'
                              ? 'error'
                              : 'warning'
                          }
                        >
                          {round.roundWinner === 'self' ? 'Won' : round.roundWinner === 'opponent' ? 'Lost' : 'Even'}
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => (isEditing ? handleSaveRound(roundNum) : startEditingRound(round || null, roundNum))}
                    >
                      {isEditing ? 'Save' : round ? 'Edit' : 'Add Stats'}
                    </Button>
                  </div>

                  {isEditing ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <FormField label="Strikes Landed">
                        <input
                          type="number"
                          value={roundData.strikesLanded || 0}
                          onChange={(e) => setRoundData({ ...roundData, strikesLanded: parseInt(e.target.value) })}
                          className="w-full px-2 py-1 border border-gray-700 bg-gray-900 text-white rounded text-sm"
                        />
                      </FormField>
                      <FormField label="Strikes Attempted">
                        <input
                          type="number"
                          value={roundData.strikesAttempted || 0}
                          onChange={(e) => setRoundData({ ...roundData, strikesAttempted: parseInt(e.target.value) })}
                          className="w-full px-2 py-1 border border-gray-700 bg-gray-900 text-white rounded text-sm"
                        />
                      </FormField>
                      <FormField label="Takedowns Landed">
                        <input
                          type="number"
                          value={roundData.takedownsLanded || 0}
                          onChange={(e) => setRoundData({ ...roundData, takedownsLanded: parseInt(e.target.value) })}
                          className="w-full px-2 py-1 border border-gray-700 bg-gray-900 text-white rounded text-sm"
                        />
                      </FormField>
                      <FormField label="Takedowns Attempted">
                        <input
                          type="number"
                          value={roundData.takedownsAttempted || 0}
                          onChange={(e) => setRoundData({ ...roundData, takedownsAttempted: parseInt(e.target.value) })}
                          className="w-full px-2 py-1 border border-gray-700 bg-gray-900 text-white rounded text-sm"
                        />
                      </FormField>
                      <FormField label="Knockdowns">
                        <input
                          type="number"
                          value={roundData.knockdowns || 0}
                          onChange={(e) => setRoundData({ ...roundData, knockdowns: parseInt(e.target.value) })}
                          className="w-full px-2 py-1 border border-gray-700 bg-gray-900 text-white rounded text-sm"
                        />
                      </FormField>
                      <FormField label="Sub Attempts">
                        <input
                          type="number"
                          value={roundData.submissionAttempts || 0}
                          onChange={(e) => setRoundData({ ...roundData, submissionAttempts: parseInt(e.target.value) })}
                          className="w-full px-2 py-1 border border-gray-700 bg-gray-900 text-white rounded text-sm"
                        />
                      </FormField>
                      <FormField label="Control Time (sec)">
                        <input
                          type="number"
                          value={(roundData.controlTimeTop || 0) + (roundData.controlTimeBack || 0)}
                          onChange={(e) => setRoundData({ ...roundData, controlTimeTop: parseInt(e.target.value) })}
                          className="w-full px-2 py-1 border border-gray-700 bg-gray-900 text-white rounded text-sm"
                        />
                      </FormField>
                      <FormField label="Round Winner">
                        <select
                          value={roundData.roundWinner || ''}
                          onChange={(e) => setRoundData({ ...roundData, roundWinner: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-700 bg-gray-900 text-white rounded text-sm"
                        >
                          <option value="">Not scored</option>
                          <option value="self">Won</option>
                          <option value="opponent">Lost</option>
                          <option value="even">Even</option>
                        </select>
                      </FormField>
                    </div>
                  ) : round ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Strikes:</span>{' '}
                        <span className="text-white">{round.strikesLanded}/{round.strikesAttempted}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Takedowns:</span>{' '}
                        <span className="text-white">{round.takedownsLanded}/{round.takedownsAttempted}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Knockdowns:</span>{' '}
                        <span className="text-white">{round.knockdowns}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Control:</span>{' '}
                        <span className="text-white">
                          {formatTime(round.controlTimeTop + round.controlTimeBack + round.controlTimeClinch)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No stats recorded for this round</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Techniques Tab */}
        {activeTab === 'techniques' && (
          <div className="space-y-4">
            {fight.techniques.length > 0 ? (
              <div className="space-y-2">
                {fight.techniques.map((tech) => (
                  <div
                    key={tech.id}
                    className="flex items-center justify-between bg-gray-800 rounded-lg p-3"
                  >
                    <div>
                      <span className="font-medium text-white">{tech.techniqueName}</span>
                      <span className="text-gray-500 ml-2">({tech.category})</span>
                      {tech.roundNumber && (
                        <span className="text-xs text-gray-500 ml-2">R{tech.roundNumber}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-accent">
                        {tech.successful}/{tech.attempted}
                      </span>
                      {tech.wasEffective && <Badge variant="success">Effective</Badge>}
                      {tech.needsWork && <Badge variant="warning">Needs Work</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                No techniques logged. Add techniques from round-by-round analysis.
              </p>
            )}
          </div>
        )}

        {/* Video Section */}
        {fight.videoUrl && (
          <div className="mt-6 pt-4 border-t border-gray-800">
            <h4 className="font-medium text-white mb-3">Fight Video</h4>
            {isYouTubeUrl(fight.videoUrl) ? (
              <YouTubeEmbed
                url={fight.videoUrl}
                title={`${fight.opponentName || 'Fight'} - ${fight.eventName || fight.type}`}
                className="rounded-lg overflow-hidden"
              />
            ) : (
              <a
                href={fight.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-accent hover:underline"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
                Watch Fight Video
              </a>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
