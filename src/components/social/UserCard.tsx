'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Award, Users } from 'lucide-react';
import { FollowButton } from './FollowButton';

interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  isCoach: boolean;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isFollowedBy: boolean;
}

interface UserCardProps {
  user: UserProfile;
  showFollowButton?: boolean;
  currentUserId?: string;
  onFollowChange?: (userId: string, isFollowing: boolean, followersCount: number) => void;
}

export function UserCard({
  user,
  showFollowButton = true,
  currentUserId,
  onFollowChange,
}: UserCardProps) {
  const isCurrentUser = currentUserId === user.id;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/5 rounded-xl border border-white/10 p-4 hover:border-white/20 transition-colors"
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <Link href={`/profile/${user.id}`} className="flex-shrink-0">
          <div className="w-14 h-14 rounded-full bg-gray-700 overflow-hidden ring-2 ring-white/10">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-lg font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${user.id}`}
              className="font-semibold text-white hover:text-accent transition-colors truncate"
            >
              {user.name}
            </Link>
            {user.isCoach && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full">
                <Award size={12} />
                Coach
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Users size={14} />
              {user.followersCount.toLocaleString()} followers
            </span>
            {user.isFollowedBy && (
              <span className="text-accent text-xs">Follows you</span>
            )}
          </div>
        </div>

        {/* Follow Button */}
        {showFollowButton && !isCurrentUser && (
          <FollowButton
            userId={user.id}
            initialIsFollowing={user.isFollowing}
            initialFollowersCount={user.followersCount}
            onFollowChange={(isFollowing, followersCount) =>
              onFollowChange?.(user.id, isFollowing, followersCount)
            }
            size="sm"
          />
        )}
      </div>
    </motion.div>
  );
}

interface UserListProps {
  users: UserProfile[];
  currentUserId?: string;
  emptyMessage?: string;
  onFollowChange?: (userId: string, isFollowing: boolean, followersCount: number) => void;
}

export function UserList({
  users,
  currentUserId,
  emptyMessage = 'No users to display',
  onFollowChange,
}: UserListProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          currentUserId={currentUserId}
          onFollowChange={onFollowChange}
        />
      ))}
    </div>
  );
}
