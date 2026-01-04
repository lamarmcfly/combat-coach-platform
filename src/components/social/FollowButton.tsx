'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, UserMinus, Check, Loader2 } from 'lucide-react';

interface FollowButtonProps {
  userId: string;
  initialIsFollowing?: boolean;
  initialFollowersCount?: number;
  onFollowChange?: (isFollowing: boolean, followersCount: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  variant?: 'default' | 'outline' | 'minimal';
}

export function FollowButton({
  userId,
  initialIsFollowing = false,
  initialFollowersCount = 0,
  onFollowChange,
  size = 'md',
  showCount = false,
  variant = 'default',
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const handleToggleFollow = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/social/follow', {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to update follow status');
      }

      const data = await response.json();
      setIsFollowing(data.isFollowing);
      setFollowersCount(data.followersCount);
      onFollowChange?.(data.isFollowing, data.followersCount);
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isFollowing, onFollowChange]);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20,
  };

  const getButtonStyles = () => {
    if (isFollowing) {
      if (isHovering) {
        return 'bg-red-500/10 border-red-500 text-red-400 hover:bg-red-500/20';
      }
      return 'bg-white/10 border-white/20 text-white hover:bg-white/20';
    }

    switch (variant) {
      case 'outline':
        return 'bg-transparent border-accent text-accent hover:bg-accent hover:text-black';
      case 'minimal':
        return 'bg-transparent border-transparent text-accent hover:text-accent-light';
      default:
        return 'bg-accent text-black hover:bg-accent-light border-transparent';
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <Loader2 size={iconSizes[size]} className="animate-spin" />;
    }

    if (isFollowing) {
      if (isHovering) {
        return (
          <>
            <UserMinus size={iconSizes[size]} />
            <span>Unfollow</span>
          </>
        );
      }
      return (
        <>
          <Check size={iconSizes[size]} />
          <span>Following</span>
        </>
      );
    }

    return (
      <>
        <UserPlus size={iconSizes[size]} />
        <span>Follow</span>
      </>
    );
  };

  return (
    <div className="flex items-center gap-2">
      <motion.button
        onClick={handleToggleFollow}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        disabled={isLoading}
        className={`
          inline-flex items-center gap-2 font-medium rounded-lg border transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${sizeClasses[size]}
          ${getButtonStyles()}
        `}
        whileTap={{ scale: 0.95 }}
        aria-label={isFollowing ? 'Unfollow user' : 'Follow user'}
        aria-pressed={isFollowing}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isFollowing ? (isHovering ? 'unfollow' : 'following') : 'follow'}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </motion.button>

      {showCount && (
        <span className="text-sm text-gray-400">
          {followersCount.toLocaleString()} {followersCount === 1 ? 'follower' : 'followers'}
        </span>
      )}
    </div>
  );
}

/**
 * Hook for managing follow state
 */
export function useFollowStatus(userId: string) {
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFollowStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/social/follow?userId=${userId}`);

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
        setFollowersCount(data.followersCount);
        setFollowingCount(data.followingCount);
      }
    } catch (error) {
      console.error('Error fetching follow status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  return {
    isFollowing,
    followersCount,
    followingCount,
    isLoading,
    refresh: fetchFollowStatus,
    setIsFollowing,
    setFollowersCount,
  };
}
