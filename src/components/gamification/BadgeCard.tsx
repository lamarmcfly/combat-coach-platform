'use client';

import { Badge, BadgeRarity, BadgeCategory } from '@prisma/client';
import { motion } from 'framer-motion';

interface BadgeCardProps {
  badge: Badge;
  earned?: boolean;
  earnedAt?: Date;
  showProgress?: boolean;
  progress?: number;
  maxProgress?: number;
}

const rarityColors: Record<BadgeRarity, { bg: string; border: string; glow: string }> = {
  COMMON: { bg: 'bg-gray-100', border: 'border-gray-300', glow: '' },
  UNCOMMON: { bg: 'bg-green-50', border: 'border-green-400', glow: 'shadow-green-200' },
  RARE: { bg: 'bg-blue-50', border: 'border-blue-400', glow: 'shadow-blue-200' },
  EPIC: { bg: 'bg-purple-50', border: 'border-purple-400', glow: 'shadow-purple-300' },
  LEGENDARY: { bg: 'bg-amber-50', border: 'border-amber-400', glow: 'shadow-amber-300' },
};

const categoryIcons: Record<BadgeCategory, string> = {
  STREAK: '🔥',
  COURSES: '📚',
  SESSIONS: '🥊',
  COMMUNITY: '👥',
  GOALS: '🎯',
  SPECIAL: '⭐',
};

const rarityLabels: Record<BadgeRarity, string> = {
  COMMON: 'Common',
  UNCOMMON: 'Uncommon',
  RARE: 'Rare',
  EPIC: 'Epic',
  LEGENDARY: 'Legendary',
};

export function BadgeCard({
  badge,
  earned = false,
  earnedAt,
  showProgress = false,
  progress = 0,
  maxProgress = 100,
}: BadgeCardProps) {
  const colors = rarityColors[badge.rarity];
  const progressPercent = Math.min((progress / maxProgress) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={earned ? { scale: 1.05 } : undefined}
      className={`relative rounded-xl border-2 p-4 transition-all ${
        earned
          ? `${colors.bg} ${colors.border} ${colors.glow} shadow-lg`
          : 'bg-gray-50 border-gray-200 opacity-60 grayscale'
      }`}
    >
      {/* Rarity indicator */}
      <div className="absolute -top-2 -right-2">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            earned ? 'bg-white shadow' : 'bg-gray-200'
          }`}
        >
          {rarityLabels[badge.rarity]}
        </span>
      </div>

      {/* Badge icon */}
      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 text-4xl">
        {badge.iconUrl ? (
          <img src={badge.iconUrl} alt={badge.name} className="w-full h-full object-contain" />
        ) : (
          <span className={earned ? '' : 'opacity-50'}>{categoryIcons[badge.category]}</span>
        )}
      </div>

      {/* Badge name */}
      <h3 className="text-center font-semibold text-gray-900 mb-1">{badge.name}</h3>

      {/* Badge description */}
      <p className="text-center text-sm text-gray-600 mb-2">{badge.description}</p>

      {/* Points */}
      <div className="text-center">
        <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-600">
          <span>✨</span>
          {badge.points} pts
        </span>
      </div>

      {/* Progress bar for unearned badges */}
      {showProgress && !earned && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>
              {progress} / {maxProgress}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-brand-600 h-2 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Earned date */}
      {earned && earnedAt && (
        <p className="text-center text-xs text-gray-500 mt-2">
          Earned {new Date(earnedAt).toLocaleDateString()}
        </p>
      )}

      {/* Lock icon for unearned */}
      {!earned && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-xl">
          <span className="text-3xl opacity-30">🔒</span>
        </div>
      )}
    </motion.div>
  );
}
