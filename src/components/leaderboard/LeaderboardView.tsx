'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Trophy, Medal, Loader2, RefreshCw, Calendar, ChevronDown } from 'lucide-react';
import { leaderboardConfig } from './LeaderboardCard';

type LeaderboardType =
  | 'streak'
  | 'courses_completed'
  | 'badges_earned'
  | 'sessions_attended'
  | 'goals_achieved'
  | 'fights_logged';

type LeaderboardPeriod = 'all_time' | 'monthly' | 'weekly';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  isCoach: boolean;
  value: number;
  change?: number;
}

interface LeaderboardViewProps {
  initialType?: LeaderboardType;
  currentUserId?: string;
}

const periodLabels: Record<LeaderboardPeriod, string> = {
  all_time: 'All Time',
  monthly: 'This Month',
  weekly: 'This Week',
};

export function LeaderboardView({
  initialType = 'streak',
  currentUserId,
}: LeaderboardViewProps) {
  const [type, setType] = useState<LeaderboardType>(initialType);
  const [period, setPeriod] = useState<LeaderboardPeriod>('all_time');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        type,
        period,
        limit: '50',
      });

      const response = await fetch(`/api/leaderboard?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      setEntries(data.entries);
      setUserRank(data.userRank || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [type, period]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const config = leaderboardConfig[type];
  const Icon = config.icon;

  return (
    <div className="space-y-6">
      {/* Type Tabs */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(leaderboardConfig) as LeaderboardType[]).map((t) => {
          const cfg = leaderboardConfig[t];
          const TypeIcon = cfg.icon;
          const isActive = t === type;

          return (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                ${isActive
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
              `}
              aria-pressed={isActive}
            >
              <TypeIcon size={16} className={isActive ? cfg.color : ''} />
              <span className="hidden sm:inline">{cfg.title.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Header with Period Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${config.color} bg-white/10`}>
            <Icon size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-display text-white">{config.title}</h2>
            <p className="text-gray-400 text-sm">
              Top performers by {config.unit}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <div className="relative">
            <button
              onClick={() => setShowPeriodMenu(!showPeriodMenu)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Calendar size={16} className="text-gray-400" />
              <span>{periodLabels[period]}</span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>

            <AnimatePresence>
              {showPeriodMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-40 bg-gray-800 rounded-lg border border-white/10 shadow-xl z-10"
                >
                  {(Object.keys(periodLabels) as LeaderboardPeriod[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setPeriod(p);
                        setShowPeriodMenu(false);
                      }}
                      className={`
                        w-full px-4 py-2 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg
                        ${p === period
                          ? 'bg-accent/10 text-accent'
                          : 'text-gray-300 hover:bg-white/5'
                        }
                      `}
                    >
                      {periodLabels[p]}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={fetchLeaderboard}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Refresh leaderboard"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* User's Rank Banner (if not in top 50) */}
      {userRank && !entries.find((e) => e.userId === currentUserId) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-accent/10 border border-accent/20 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-accent">#{userRank.rank}</div>
              <div>
                <p className="text-white font-medium">Your Rank</p>
                <p className="text-gray-400 text-sm">
                  {userRank.value.toLocaleString()} {config.unit}
                </p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Keep going to climb the leaderboard!
            </p>
          </div>
        </motion.div>
      )}

      {/* Leaderboard Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            No entries for this leaderboard yet. Be the first to claim the top spot!
          </p>
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          {/* Top 3 Podium */}
          {entries.length >= 3 && (
            <div className="p-6 border-b border-white/10">
              <div className="flex items-end justify-center gap-4">
                {/* 2nd Place */}
                <PodiumPlace
                  entry={entries[1]}
                  rank={2}
                  unit={config.unit}
                  isCurrentUser={entries[1]?.userId === currentUserId}
                />
                {/* 1st Place */}
                <PodiumPlace
                  entry={entries[0]}
                  rank={1}
                  unit={config.unit}
                  isCurrentUser={entries[0]?.userId === currentUserId}
                />
                {/* 3rd Place */}
                <PodiumPlace
                  entry={entries[2]}
                  rank={3}
                  unit={config.unit}
                  isCurrentUser={entries[2]?.userId === currentUserId}
                />
              </div>
            </div>
          )}

          {/* Rest of Leaderboard */}
          <div className="divide-y divide-white/5">
            {entries.slice(3).map((entry, index) => (
              <LeaderboardRow
                key={entry.userId}
                entry={entry}
                rank={index + 4}
                unit={config.unit}
                isCurrentUser={entry.userId === currentUserId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface PodiumPlaceProps {
  entry: LeaderboardEntry;
  rank: number;
  unit: string;
  isCurrentUser: boolean;
}

function PodiumPlace({ entry, rank, unit, isCurrentUser }: PodiumPlaceProps) {
  const heights = { 1: 'h-28', 2: 'h-20', 3: 'h-16' };
  const colors = {
    1: 'bg-yellow-500/20 border-yellow-500/40',
    2: 'bg-gray-400/20 border-gray-400/40',
    3: 'bg-amber-600/20 border-amber-600/40',
  };
  const iconColors = {
    1: 'text-yellow-400',
    2: 'text-gray-300',
    3: 'text-amber-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (3 - rank) * 0.1 }}
      className="flex flex-col items-center"
    >
      {/* Avatar */}
      <Link href={`/profile/${entry.userId}`} className="mb-2">
        <div
          className={`
            w-16 h-16 rounded-full overflow-hidden border-2
            ${isCurrentUser ? 'border-accent ring-2 ring-accent/50' : 'border-white/20'}
          `}
        >
          {entry.userAvatar ? (
            <Image
              src={entry.userAvatar}
              alt={entry.userName}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white text-xl font-bold">
              {entry.userName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </Link>

      {/* Name */}
      <Link
        href={`/profile/${entry.userId}`}
        className={`font-medium text-sm mb-1 hover:text-accent transition-colors ${
          isCurrentUser ? 'text-accent' : 'text-white'
        }`}
      >
        {entry.userName.split(' ')[0]}
      </Link>

      {/* Value */}
      <div className="text-xs text-gray-400 mb-2">
        {entry.value.toLocaleString()} {unit}
      </div>

      {/* Podium */}
      <div
        className={`
          w-20 ${heights[rank as 1 | 2 | 3]} rounded-t-lg border-t-2 border-x-2
          ${colors[rank as 1 | 2 | 3]}
          flex items-center justify-center
        `}
      >
        {rank === 1 ? (
          <Trophy className={`w-8 h-8 ${iconColors[rank]}`} />
        ) : (
          <Medal className={`w-6 h-6 ${iconColors[rank as 2 | 3]}`} />
        )}
      </div>
    </motion.div>
  );
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  rank: number;
  unit: string;
  isCurrentUser: boolean;
}

function LeaderboardRow({ entry, rank, unit, isCurrentUser }: LeaderboardRowProps) {
  return (
    <div
      className={`px-4 py-3 flex items-center gap-4 hover:bg-white/5 transition-colors ${
        isCurrentUser ? 'bg-accent/10' : ''
      }`}
    >
      {/* Rank */}
      <div className="w-8 text-center">
        <span className="text-gray-400 font-mono">{rank}</span>
      </div>

      {/* Avatar */}
      <Link href={`/profile/${entry.userId}`}>
        <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
          {entry.userAvatar ? (
            <Image
              src={entry.userAvatar}
              alt={entry.userName}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-semibold">
              {entry.userName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </Link>

      {/* Name */}
      <div className="flex-1">
        <Link
          href={`/profile/${entry.userId}`}
          className={`font-medium hover:text-accent transition-colors ${
            isCurrentUser ? 'text-accent' : 'text-white'
          }`}
        >
          {entry.userName}
          {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
        </Link>
      </div>

      {/* Value */}
      <div className="text-right">
        <span className="font-bold text-white">{entry.value.toLocaleString()}</span>
        <span className="text-gray-400 text-sm ml-1">{unit}</span>
      </div>
    </div>
  );
}
