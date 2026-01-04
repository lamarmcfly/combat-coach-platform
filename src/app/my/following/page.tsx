'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { UserList } from '@/components/social';

type ListType = 'followers' | 'following';

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

export default function FollowingPage() {
  const { data: session } = useSession();
  const [listType, setListType] = useState<ListType>('following');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        userId: session.user.id,
        type: listType,
        limit: '50',
      });

      const response = await fetch(`/api/social/followers?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, listType]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFollowChange = (userId: string, isFollowing: boolean, followersCount: number) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? { ...user, isFollowing, followersCount }
          : user
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#0b0b0c]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display text-white mb-2">Your Network</h1>
          <p className="text-gray-400">
            People you follow and your followers.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
          <TabButton
            active={listType === 'following'}
            onClick={() => setListType('following')}
            icon={UserCheck}
            label="Following"
          />
          <TabButton
            active={listType === 'followers'}
            onClick={() => setListType('followers')}
            icon={Users}
            label="Followers"
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
          </div>
        ) : (
          <UserList
            users={users}
            currentUserId={session?.user?.id}
            emptyMessage={
              listType === 'following'
                ? "You're not following anyone yet. Explore the community to find coaches and athletes to follow!"
                : "You don't have any followers yet. Share your achievements and engage with the community!"
            }
            onFollowChange={handleFollowChange}
          />
        )}
      </div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: typeof Users;
  label: string;
}

function TabButton({ active, onClick, icon: Icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all
        ${
          active
            ? 'text-white bg-white/10'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }
      `}
      aria-pressed={active}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
}
