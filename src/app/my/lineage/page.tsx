'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { LineageTree } from '@/components/lineage/LineageTree';
import { AddLineageModal } from '@/components/lineage/AddLineageModal';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface LineageEntry {
  id: string;
  coachName: string;
  gymName: string | null;
  location: string | null;
  discipline: string;
  startYear: number | null;
  endYear: number | null;
  beltOrRank: string | null;
  isVerified: boolean;
  coachProfile?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
}

export default function LineagePage() {
  const { data: session } = useSession();
  const [lineage, setLineage] = useState<LineageEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchLineage();
  }, []);

  const fetchLineage = async () => {
    try {
      const response = await fetch('/api/lineage');
      if (response.ok) {
        const data = await response.json();
        setLineage(data.lineage);
      }
    } catch (error) {
      console.error('Error fetching lineage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const userName = session?.user
    ? `${(session.user as any).firstName || ''} ${(session.user as any).lastName || ''}`.trim() || 'You'
    : 'You';

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Training Lineage</h1>
          <p className="mt-2 text-gray-400">Your martial arts family tree</p>
        </div>
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Training Lineage</h1>
          <p className="mt-2 text-gray-400">
            Your martial arts family tree - trace your training heritage
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          Add Coach
        </Button>
      </div>

      {/* Info banner */}
      <div className="mb-8 rounded-lg border border-accent/30 bg-accent/10 p-4">
        <div className="flex gap-3">
          <svg className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-medium text-accent">Build Your Training Heritage</h4>
            <p className="mt-1 text-sm text-gray-300">
              In martial arts, lineage matters. Document who trained you, where you trained, and
              what ranks you achieved. This creates a verifiable record of your martial arts journey
              and connects you to the broader community.
            </p>
          </div>
        </div>
      </div>

      <LineageTree lineage={lineage} userName={userName} />

      <AddLineageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchLineage}
      />
    </div>
  );
}
