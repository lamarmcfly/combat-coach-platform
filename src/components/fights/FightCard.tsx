'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

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
  discipline: string | null;
  videoUrl: string | null;
  totalRounds: number;
}

interface FightCardProps {
  fight: Fight;
  onClick?: () => void;
}

const resultColors: Record<string, 'success' | 'error' | 'warning' | 'default' | 'info'> = {
  WIN: 'success',
  LOSS: 'error',
  DRAW: 'warning',
  NO_CONTEST: 'default',
  IN_PROGRESS: 'info',
};

const finishTypeLabels: Record<string, string> = {
  DECISION_UNANIMOUS: 'UD',
  DECISION_SPLIT: 'SD',
  DECISION_MAJORITY: 'MD',
  KO: 'KO',
  TKO: 'TKO',
  SUBMISSION: 'SUB',
  DQ: 'DQ',
  TECHNICAL_DECISION: 'TD',
  NONE: '',
};

const typeIcons: Record<string, string> = {
  COMPETITION: '🏆',
  SPARRING: '🥊',
  TRAINING: '🎯',
  EXHIBITION: '🎭',
};

export function FightCard({ fight, onClick }: FightCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getFinishDescription = () => {
    if (fight.finishType === 'NONE' || !fight.finishType) {
      return fight.result === 'IN_PROGRESS' ? 'Ongoing' : '';
    }
    const method = finishTypeLabels[fight.finishType] || fight.finishType;
    if (fight.finishRound && fight.finishTime) {
      return `${method} R${fight.finishRound} ${fight.finishTime}`;
    }
    if (fight.finishRound) {
      return `${method} R${fight.finishRound}`;
    }
    return method;
  };

  return (
    <Card
      className="cursor-pointer hover:border-accent/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Result indicator */}
        <div
          className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg text-2xl font-bold ${
            fight.result === 'WIN'
              ? 'bg-green-600/20 text-green-400'
              : fight.result === 'LOSS'
              ? 'bg-red-600/20 text-red-400'
              : fight.result === 'DRAW'
              ? 'bg-yellow-600/20 text-yellow-400'
              : 'bg-gray-700 text-gray-400'
          }`}
        >
          {fight.result === 'WIN' ? 'W' : fight.result === 'LOSS' ? 'L' : fight.result === 'DRAW' ? 'D' : '?'}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-white truncate">
                {fight.opponentName || 'Unknown Opponent'}
              </h3>
              <p className="text-sm text-gray-400">
                {fight.eventName || fight.type.toLowerCase().replace('_', ' ')}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-sm text-gray-500">{formatDate(fight.eventDate)}</span>
              <span className="text-lg">{typeIcons[fight.type] || '🥊'}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Badge variant={resultColors[fight.result] || 'default'}>
              {fight.result.replace('_', ' ')}
            </Badge>
            {getFinishDescription() && (
              <Badge variant="default">{getFinishDescription()}</Badge>
            )}
            {fight.discipline && (
              <Badge variant="info">{fight.discipline}</Badge>
            )}
            {fight.weightClass && (
              <span className="text-xs text-gray-500">{fight.weightClass}</span>
            )}
            {fight.videoUrl && (
              <span className="text-xs text-accent flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
                Video
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
