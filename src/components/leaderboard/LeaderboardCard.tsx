'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Trophy, Medal, Award, Flame, BookOpen, Target, Video, Swords } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  isCoach: boolean;
  value: number;
}

type LeaderboardType =
  | 'streak'
  | 'courses_completed'
  | 'badges_earned'
  | 'sessions_attended'
  | 'goals_achieved'
  | 'fights_logged';

interface LeaderboardCardProps {
  type: LeaderboardType;
  entries: LeaderboardEntry[];
  currentUserId?: string;
  showViewAll?: boolean;
}

const leaderboardConfig: Record<
  LeaderboardType,
  { title: string; icon: typeof Trophy; color: string; unit: string }
> = {
  streak: {
    title: 'Longest Streaks',
    icon: Flame,
    color: 'text-orange-400',
    unit: 'days',
  },
  courses_completed: {
    title: 'Course Champions',
    icon: BookOpen,
    color: 'text-green-400',
    unit: 'courses',
  },
  badges_earned: {
    title: 'Badge Collectors',
    icon: Award,
    color: 'text-yellow-400',
    unit: 'badges',
  },
  sessions_attended: {
    title: 'Session Warriors',
    icon: Video,
    color: 'text-blue-400',
    unit: 'sessions',
  },
  goals_achieved: {
    title: 'Goal Crushers',
    icon: Target,
    color: 'text-purple-400',
    unit: 'goals',
  },
  fights_logged: {
    title: 'Fight Veterans',
    icon: Swords,
    color: 'text-red-400',
    unit: 'fights',
  },
};

export function LeaderboardCard({
  type,
  entries,
  currentUserId,
  showViewAll = true,
}: LeaderboardCardProps) {
  const config = leaderboardConfig[type];
  const Icon = config.icon;

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${config.color}`} />
          <h3 className="font-semibold text-white">{config.title}</h3>
        </div>
        {showViewAll && (
          <Link
            href={`/leaderboard?type=${type}`}
            className="text-sm text-accent hover:underline"
          >
            View All
          </Link>
        )}
      </div>

      {/* Entries */}
      <div className="divide-y divide-white/5">
        {entries.slice(0, 5).map((entry, index) => (
          <LeaderboardRow
            key={entry.userId}
            entry={entry}
            index={index}
            unit={config.unit}
            isCurrentUser={entry.userId === currentUserId}
          />
        ))}

        {entries.length === 0 && (
          <div className="px-4 py-6 text-center text-gray-400 text-sm">
            No entries yet. Be the first!
          </div>
        )}
      </div>
    </div>
  );
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  index: number;
  unit: string;
  isCurrentUser: boolean;
}

function LeaderboardRow({ entry, index, unit, isCurrentUser }: LeaderboardRowProps) {
  const rank = entry.rank || index + 1;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors ${
        isCurrentUser ? 'bg-accent/10' : ''
      }`}
    >
      {/* Rank */}
      <div className="w-8 flex-shrink-0">
        {rank <= 3 ? (
          <RankMedal rank={rank} />
        ) : (
          <span className="text-gray-400 font-mono text-sm">{rank}</span>
        )}
      </div>

      {/* Avatar */}
      <Link href={`/profile/${entry.userId}`} className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden ring-2 ring-white/10">
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
      <div className="flex-1 min-w-0">
        <Link
          href={`/profile/${entry.userId}`}
          className={`font-medium truncate hover:text-accent transition-colors ${
            isCurrentUser ? 'text-accent' : 'text-white'
          }`}
        >
          {entry.userName}
          {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
        </Link>
        {entry.isCoach && (
          <span className="ml-2 text-xs text-gray-400">Coach</span>
        )}
      </div>

      {/* Value */}
      <div className="flex-shrink-0 text-right">
        <span className="font-bold text-white">{entry.value.toLocaleString()}</span>
        <span className="text-gray-400 text-xs ml-1">{unit}</span>
      </div>
    </motion.div>
  );
}

function RankMedal({ rank }: { rank: number }) {
  const colors = {
    1: 'text-yellow-400 bg-yellow-500/20',
    2: 'text-gray-300 bg-gray-500/20',
    3: 'text-amber-600 bg-amber-600/20',
  };

  const color = colors[rank as 1 | 2 | 3];

  return (
    <div className={`w-7 h-7 rounded-full ${color} flex items-center justify-center`}>
      {rank === 1 ? (
        <Trophy size={14} />
      ) : (
        <Medal size={14} />
      )}
    </div>
  );
}

export { leaderboardConfig };
