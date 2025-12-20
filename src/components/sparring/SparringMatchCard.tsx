'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface MatchData {
  userId: string;
  displayName: string;
  weightClass: string | null;
  disciplines: string[];
  location: string | null;
  skillLevel: string | null;
  gymName: string | null;
  preferredDays: string[];
  preferredTime: string | null;
  notes: string | null;
  matchScore: number;
  matchReasons: string[];
}

interface SparringMatchCardProps {
  match: MatchData;
  onSendRequest: (userId: string) => void;
}

export function SparringMatchCard({ match, onSendRequest }: SparringMatchCardProps) {
  const getMatchQuality = (score: number): { label: string; variant: 'success' | 'warning' | 'default' } => {
    if (score >= 60) return { label: 'Great Match', variant: 'success' };
    if (score >= 30) return { label: 'Good Match', variant: 'warning' };
    return { label: 'Possible Match', variant: 'default' };
  };

  const matchQuality = getMatchQuality(match.matchScore);

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white text-lg">{match.displayName}</h3>
          {match.location && <p className="text-sm text-gray-400">{match.location}</p>}
        </div>
        <Badge variant={matchQuality.variant}>{matchQuality.label}</Badge>
      </div>

      {/* Key Info */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {match.weightClass && (
          <div className="text-sm">
            <span className="text-gray-500">Weight:</span>{' '}
            <span className="text-gray-300">{match.weightClass}</span>
          </div>
        )}
        {match.skillLevel && (
          <div className="text-sm">
            <span className="text-gray-500">Level:</span>{' '}
            <span className="text-gray-300">{match.skillLevel}</span>
          </div>
        )}
        {match.gymName && (
          <div className="text-sm col-span-2">
            <span className="text-gray-500">Gym:</span>{' '}
            <span className="text-gray-300">{match.gymName}</span>
          </div>
        )}
      </div>

      {/* Disciplines */}
      {match.disciplines.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {match.disciplines.map((discipline) => (
            <span
              key={discipline}
              className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded-full"
            >
              {discipline}
            </span>
          ))}
        </div>
      )}

      {/* Match Reasons */}
      {match.matchReasons.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {match.matchReasons.slice(0, 4).map((reason, idx) => (
              <span
                key={idx}
                className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded"
              >
                {reason}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Availability */}
      {(match.preferredDays.length > 0 || match.preferredTime) && (
        <div className="text-sm text-gray-400 mb-3">
          {match.preferredDays.length > 0 && (
            <span>Available: {match.preferredDays.map((d) => d.slice(0, 3)).join(', ')}</span>
          )}
          {match.preferredTime && <span> ({match.preferredTime})</span>}
        </div>
      )}

      {/* Notes */}
      {match.notes && (
        <p className="text-sm text-gray-400 mb-4 line-clamp-2">{match.notes}</p>
      )}

      {/* Action */}
      <Button
        onClick={() => onSendRequest(match.userId)}
        size="sm"
        className="w-full"
      >
        Send Request
      </Button>
    </div>
  );
}
