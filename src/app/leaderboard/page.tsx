'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { LeaderboardView } from '@/components/leaderboard';

type LeaderboardType =
  | 'streak'
  | 'courses_completed'
  | 'badges_earned'
  | 'sessions_attended'
  | 'goals_achieved'
  | 'fights_logged';

function LeaderboardContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const type = (searchParams.get('type') as LeaderboardType) || 'streak';

  return (
    <div className="min-h-screen bg-[#0b0b0c]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display text-white mb-2">Leaderboards</h1>
          <p className="text-gray-400">
            See how you stack up against other athletes and coaches in the Corner community.
          </p>
        </div>

        {/* Leaderboard View */}
        <LeaderboardView
          initialType={type}
          currentUserId={session?.user?.id}
        />
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      }
    >
      <LeaderboardContent />
    </Suspense>
  );
}
