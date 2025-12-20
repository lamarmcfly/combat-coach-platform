'use client';

import { Card } from '@/components/ui/Card';

interface LineageEntry {
  id: string;
  coachName: string;
  gymName: string | null;
  location: string | null;
  discipline: string;
  startYear: number | null;
  endYear: number | null;
  beltOrRank: string | null;
  isVerified: boolean;
  coachProfile?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
}

interface LineageTreeProps {
  lineage: LineageEntry[];
  userName: string;
}

const disciplineColors: Record<string, string> = {
  'BJJ': 'bg-purple-500',
  'Boxing': 'bg-red-500',
  'Muay Thai': 'bg-orange-500',
  'Wrestling': 'bg-blue-500',
  'Judo': 'bg-yellow-500',
  'Karate': 'bg-green-500',
  'MMA': 'bg-gray-500',
  'Kickboxing': 'bg-pink-500',
};

export function LineageTree({ lineage, userName }: LineageTreeProps) {
  const getDisciplineColor = (discipline: string) => {
    return disciplineColors[discipline] || 'bg-accent';
  };

  const formatYears = (start: number | null, end: number | null) => {
    if (!start && !end) return '';
    if (start && !end) return `${start} - Present`;
    if (!start && end) return `Until ${end}`;
    return `${start} - ${end}`;
  };

  if (lineage.length === 0) {
    return (
      <Card className="text-center py-12">
        <div className="text-gray-400">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-lg font-medium text-white mb-2">No Training Lineage Yet</p>
          <p className="text-sm">Add your coaches and training history to build your martial arts family tree.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="relative">
      {/* Current User - Root of the tree */}
      <div className="flex justify-center mb-8">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-black font-bold text-xl">
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <p className="mt-2 font-bold text-white">{userName}</p>
          <p className="text-xs text-gray-500">You</p>
        </div>
      </div>

      {/* Connecting line */}
      <div className="absolute left-1/2 top-24 w-0.5 h-8 bg-gray-700 -translate-x-1/2" />

      {/* "Trained By" label */}
      <div className="text-center mb-4">
        <span className="text-xs uppercase tracking-wider text-gray-500 bg-gray-900 px-3 py-1 rounded-full border border-gray-800">
          Trained By
        </span>
      </div>

      {/* Lineage entries */}
      <div className="space-y-4">
        {lineage.map((entry, index) => (
          <Card key={entry.id} className="relative overflow-visible">
            {/* Discipline indicator */}
            <div className={`absolute -left-2 top-4 w-1 h-12 rounded-full ${getDisciplineColor(entry.discipline)}`} />

            <div className="flex items-start gap-4 pl-4">
              {/* Coach avatar */}
              <div className="flex-shrink-0">
                {entry.coachProfile?.avatarUrl ? (
                  <img
                    src={entry.coachProfile.avatarUrl}
                    alt={entry.coachName}
                    className="w-14 h-14 rounded-full object-cover border-2 border-gray-700"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 font-bold border-2 border-gray-700">
                    {entry.coachName.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Coach info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white truncate">{entry.coachName}</h3>
                  {entry.isVerified && (
                    <svg className="w-4 h-4 text-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {entry.coachProfile && (
                    <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">On Platform</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-400">
                  <span className={`px-2 py-0.5 rounded text-xs text-white ${getDisciplineColor(entry.discipline)}`}>
                    {entry.discipline}
                  </span>
                  {entry.gymName && <span>{entry.gymName}</span>}
                  {entry.location && <span>• {entry.location}</span>}
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                  {formatYears(entry.startYear, entry.endYear) && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatYears(entry.startYear, entry.endYear)}
                    </span>
                  )}
                  {entry.beltOrRank && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      {entry.beltOrRank}
                    </span>
                  )}
                </div>
              </div>

              {/* Order indicator */}
              <div className="flex-shrink-0 text-xs text-gray-600">
                #{index + 1}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
