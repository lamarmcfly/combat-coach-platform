'use client';

import { useState } from 'react';
import { Badge, BadgeCategory, BadgeRarity, UserBadge } from '@prisma/client';
import { motion, AnimatePresence } from 'framer-motion';
import { BadgeCard } from './BadgeCard';

type BadgeWithDetails = Badge & {
  userBadge?: UserBadge;
};

interface GamificationDashboardProps {
  earnedBadges: (UserBadge & { badge: Badge })[];
  allBadges: Badge[];
  totalPoints: number;
  stats: {
    currentStreak: number;
    longestStreak: number;
    coursesCompleted: number;
    sessionsAttended: number;
    reviewsWritten: number;
    goalsAchieved: number;
  };
}

const categoryLabels: Record<BadgeCategory, { label: string; icon: string }> = {
  STREAK: { label: 'Streak', icon: '🔥' },
  COURSES: { label: 'Courses', icon: '📚' },
  SESSIONS: { label: 'Sessions', icon: '🥊' },
  COMMUNITY: { label: 'Community', icon: '👥' },
  GOALS: { label: 'Goals', icon: '🎯' },
  SPECIAL: { label: 'Special', icon: '⭐' },
};

const categories = Object.keys(categoryLabels) as BadgeCategory[];

export function GamificationDashboard({
  earnedBadges,
  allBadges,
  totalPoints,
  stats,
}: GamificationDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'ALL'>('ALL');
  const [showEarnedOnly, setShowEarnedOnly] = useState(false);

  // Create a map of earned badges for quick lookup
  const earnedBadgeMap = new Map(earnedBadges.map((ub) => [ub.badgeId, ub]));

  // Filter badges
  const filteredBadges = allBadges.filter((badge) => {
    if (selectedCategory !== 'ALL' && badge.category !== selectedCategory) {
      return false;
    }
    if (showEarnedOnly && !earnedBadgeMap.has(badge.id)) {
      return false;
    }
    return true;
  });

  // Sort badges: earned first, then by rarity, then by points
  const rarityOrder: Record<BadgeRarity, number> = {
    LEGENDARY: 0,
    EPIC: 1,
    RARE: 2,
    UNCOMMON: 3,
    COMMON: 4,
  };

  const sortedBadges = [...filteredBadges].sort((a, b) => {
    const aEarned = earnedBadgeMap.has(a.id);
    const bEarned = earnedBadgeMap.has(b.id);
    if (aEarned !== bEarned) return aEarned ? -1 : 1;
    if (a.rarity !== b.rarity) return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    return b.points - a.points;
  });

  // Calculate level from points
  const level = Math.floor(totalPoints / 100) + 1;
  const pointsToNextLevel = 100 - (totalPoints % 100);
  const levelProgress = (totalPoints % 100) / 100;

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Level Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-brand-200 text-sm font-medium">Your Level</span>
            <span className="text-2xl">🏆</span>
          </div>
          <div className="text-5xl font-bold mb-2">{level}</div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-brand-200">{totalPoints} total points</span>
              <span className="text-brand-200">{pointsToNextLevel} to next level</span>
            </div>
            <div className="w-full bg-brand-900/50 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all"
                style={{ width: `${levelProgress * 100}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Badges Earned Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 text-sm font-medium">Badges Earned</span>
            <span className="text-2xl">🎖️</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-gray-900">{earnedBadges.length}</span>
            <span className="text-gray-500">/ {allBadges.length}</span>
          </div>
          <div className="mt-4 flex gap-1">
            {categories.map((cat) => {
              const earned = earnedBadges.filter((ub) => ub.badge.category === cat).length;
              const total = allBadges.filter((b) => b.category === cat).length;
              const percent = total > 0 ? (earned / total) * 100 : 0;
              return (
                <div
                  key={cat}
                  className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"
                  title={`${categoryLabels[cat].label}: ${earned}/${total}`}
                >
                  <div
                    className="h-full bg-brand-500 transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Current Streak Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-orange-200 text-sm font-medium">Current Streak</span>
            <span className="text-2xl">🔥</span>
          </div>
          <div className="text-5xl font-bold mb-2">{stats.currentStreak} days</div>
          <p className="text-orange-200 text-sm">
            Longest streak: {stats.longestStreak} days
          </p>
        </motion.div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="📚" label="Courses Completed" value={stats.coursesCompleted} />
        <StatCard icon="🥊" label="Sessions Attended" value={stats.sessionsAttended} />
        <StatCard icon="✍️" label="Reviews Written" value={stats.reviewsWritten} />
        <StatCard icon="🎯" label="Goals Achieved" value={stats.goalsAchieved} />
      </div>

      {/* Badge Collection */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Badge Collection</h2>

          <div className="flex items-center gap-4">
            {/* Show earned only toggle */}
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showEarnedOnly}
                onChange={(e) => setShowEarnedOnly(e.target.checked)}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              Earned only
            </label>

            {/* Category filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as BadgeCategory | 'ALL')}
              className="rounded-lg border-gray-300 text-sm focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {categoryLabels[cat].icon} {categoryLabels[cat].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {categoryLabels[cat].icon} {categoryLabels[cat].label}
            </button>
          ))}
        </div>

        {/* Badge Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory + showEarnedOnly}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          >
            {sortedBadges.map((badge) => {
              const userBadge = earnedBadgeMap.get(badge.id);
              return (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  earned={!!userBadge}
                  earnedAt={userBadge?.earnedAt}
                />
              );
            })}
          </motion.div>
        </AnimatePresence>

        {sortedBadges.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <span className="text-4xl mb-4 block">🏅</span>
            <p>No badges found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl p-4 shadow border border-gray-100"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{label}</div>
        </div>
      </div>
    </motion.div>
  );
}
