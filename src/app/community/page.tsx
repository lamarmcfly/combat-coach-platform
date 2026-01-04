'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Globe, UserCheck } from 'lucide-react';
import { ActivityFeed } from '@/components/social';

type FeedType = 'public' | 'personal';

export default function CommunityPage() {
  const [feedType, setFeedType] = useState<FeedType>('public');

  return (
    <div className="min-h-screen bg-[#0b0b0c]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-display text-white mb-2">Community</h1>
          <p className="text-gray-400">
            See what athletes and coaches are achieving in the Corner community.
          </p>
        </div>

        {/* Feed Type Tabs */}
        <div className="flex gap-2 mb-6">
          <TabButton
            active={feedType === 'public'}
            onClick={() => setFeedType('public')}
            icon={Globe}
            label="Explore"
          />
          <TabButton
            active={feedType === 'personal'}
            onClick={() => setFeedType('personal')}
            icon={UserCheck}
            label="Following"
          />
        </div>

        {/* Feed */}
        <ActivityFeed
          key={feedType}
          type={feedType}
          showHeader={false}
          limit={20}
        />
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
            ? 'text-white'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }
      `}
      aria-pressed={active}
    >
      <Icon size={18} />
      <span>{label}</span>
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-white/10 rounded-lg -z-10"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        />
      )}
    </button>
  );
}
