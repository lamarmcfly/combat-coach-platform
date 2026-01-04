'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import {
  Heart,
  MessageCircle,
  Award,
  Target,
  BookOpen,
  Video,
  Flame,
  UserPlus,
  Star,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface ActivityItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: string;
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  likesCount: number;
  commentsCount: number;
  hasLiked: boolean;
  createdAt: string;
}

interface ActivityFeedProps {
  type?: 'personal' | 'public';
  userId?: string;
  showHeader?: boolean;
  limit?: number;
}

const activityIcons: Record<string, typeof Award> = {
  COURSE_COMPLETED: BookOpen,
  BADGE_EARNED: Award,
  GOAL_ACHIEVED: Target,
  FIGHT_LOGGED: Flame,
  REVIEW_POSTED: Star,
  STARTED_FOLLOWING: UserPlus,
  COURSE_ENROLLED: BookOpen,
  SESSION_ATTENDED: Video,
  STREAK_MILESTONE: Flame,
};

const activityColors: Record<string, string> = {
  COURSE_COMPLETED: 'text-green-400 bg-green-500/10',
  BADGE_EARNED: 'text-yellow-400 bg-yellow-500/10',
  GOAL_ACHIEVED: 'text-blue-400 bg-blue-500/10',
  FIGHT_LOGGED: 'text-red-400 bg-red-500/10',
  REVIEW_POSTED: 'text-purple-400 bg-purple-500/10',
  STARTED_FOLLOWING: 'text-cyan-400 bg-cyan-500/10',
  COURSE_ENROLLED: 'text-indigo-400 bg-indigo-500/10',
  SESSION_ATTENDED: 'text-orange-400 bg-orange-500/10',
  STREAK_MILESTONE: 'text-accent bg-accent/10',
};

export function ActivityFeed({
  type = 'public',
  showHeader = true,
  limit = 20,
}: ActivityFeedProps) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(async (cursor?: string) => {
    try {
      if (cursor) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const params = new URLSearchParams({
        type,
        limit: limit.toString(),
        ...(cursor && { cursor }),
      });

      const response = await fetch(`/api/social/feed?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch activity feed');
      }

      const data = await response.json();

      if (cursor) {
        setItems((prev) => [...prev, ...data.items]);
      } else {
        setItems(data.items);
      }
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [type, limit]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleLike = async (activityId: string, currentlyLiked: boolean) => {
    try {
      const response = await fetch('/api/social/like', {
        method: currentlyLiked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId }),
      });

      if (response.ok) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === activityId
              ? {
                  ...item,
                  hasLiked: !currentlyLiked,
                  likesCount: currentlyLiked ? item.likesCount - 1 : item.likesCount + 1,
                }
              : item
          )
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => fetchFeed()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">
          {type === 'personal'
            ? 'No activity from people you follow yet. Start following some coaches and athletes!'
            : 'No activity yet. Be the first to complete a course or earn a badge!'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display text-white">
            {type === 'personal' ? 'Your Feed' : 'Community Activity'}
          </h2>
          <button
            onClick={() => fetchFeed()}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Refresh feed"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      )}

      <div className="space-y-4">
        <AnimatePresence>
          {items.map((item, index) => (
            <ActivityCard
              key={item.id}
              item={item}
              index={index}
              onLike={handleLike}
            />
          ))}
        </AnimatePresence>
      </div>

      {nextCursor && (
        <div className="text-center pt-4">
          <button
            onClick={() => fetchFeed(nextCursor)}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            {isLoadingMore ? (
              <Loader2 size={16} className="animate-spin" />
            ) : null}
            {isLoadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}

interface ActivityCardProps {
  item: ActivityItem;
  index: number;
  onLike: (activityId: string, currentlyLiked: boolean) => void;
}

function ActivityCard({ item, index, onLike }: ActivityCardProps) {
  const Icon = activityIcons[item.type] || Award;
  const colorClass = activityColors[item.type] || 'text-gray-400 bg-gray-500/10';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white/5 rounded-xl border border-white/10 p-4 hover:border-white/20 transition-colors"
    >
      <div className="flex gap-4">
        {/* User Avatar */}
        <Link href={`/profile/${item.userId}`} className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden">
            {item.userAvatar ? (
              <Image
                src={item.userAvatar}
                alt={item.userName}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-semibold">
                {item.userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link
                href={`/profile/${item.userId}`}
                className="font-semibold text-white hover:text-accent transition-colors"
              >
                {item.userName}
              </Link>
              <span className="text-gray-400 text-sm ml-2">
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </span>
            </div>

            <div className={`p-2 rounded-lg ${colorClass}`}>
              <Icon size={16} />
            </div>
          </div>

          <p className="text-gray-300 mt-1">{item.title}</p>

          {item.description && (
            <p className="text-gray-400 text-sm mt-1">{item.description}</p>
          )}

          {item.imageUrl && (
            <div className="mt-3 rounded-lg overflow-hidden">
              <Image
                src={item.imageUrl}
                alt=""
                width={400}
                height={200}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {item.linkUrl && (
            <Link
              href={item.linkUrl}
              className="inline-block mt-2 text-accent text-sm hover:underline"
            >
              View Details →
            </Link>
          )}

          {/* Actions */}
          <div className="flex items-center gap-6 mt-3 pt-3 border-t border-white/5">
            <button
              onClick={() => onLike(item.id, item.hasLiked)}
              className={`flex items-center gap-2 text-sm transition-colors ${
                item.hasLiked
                  ? 'text-red-400'
                  : 'text-gray-400 hover:text-red-400'
              }`}
              aria-label={item.hasLiked ? 'Unlike' : 'Like'}
              aria-pressed={item.hasLiked}
            >
              <Heart
                size={18}
                className={item.hasLiked ? 'fill-current' : ''}
              />
              <span>{item.likesCount}</span>
            </button>

            <div className="flex items-center gap-2 text-sm text-gray-400">
              <MessageCircle size={18} />
              <span>{item.commentsCount}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export { ActivityCard };
