'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SkeletonCard, SkeletonStats } from '@/components/ui/Skeleton';
import { CoachingRequestList } from '@/components/coaching/CoachingRequestList';
import { RequestDetailView } from '@/components/coaching/RequestDetailView';
import { CoachStatsCard } from '@/components/coaching/CoachStatsCard';

export default function CoachCoachingPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    if (selectedRequestId) {
      fetchRequestDetails(selectedRequestId);
    } else {
      setSelectedRequest(null);
    }
  }, [selectedRequestId]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams({ view: 'coach' });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);

      const response = await fetch(`/api/coaching/requests?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/coaching/stats?days=30');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRequestDetails = async (requestId: string) => {
    try {
      const response = await fetch(`/api/coaching/requests/${requestId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedRequest(data.request);
        // For coaches, we need to get their own userId from session
        // This would typically come from the session on the server side
        setCurrentUserId(data.request.coachId);
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedRequestId) return;

    try {
      const response = await fetch(
        `/api/coaching/requests/${selectedRequestId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        }
      );

      if (response.ok) {
        await fetchRequestDetails(selectedRequestId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedRequestId) return;

    try {
      const response = await fetch(`/api/coaching/requests/${selectedRequestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        await fetchRequestDetails(selectedRequestId);
        await fetchData();
        await fetchStats();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="h-9 w-56 bg-gray-800 rounded animate-pulse mb-2" />
          <div className="h-5 w-80 bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="mb-6">
          <SkeletonStats />
        </div>
        <div className="mb-6 flex gap-4">
          <div className="h-16 w-40 bg-gray-800 rounded animate-pulse" />
          <div className="h-16 w-40 bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Coaching Inbox</h1>
        <p className="text-gray-400">
          Review student submissions and provide personalized feedback
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mb-6">
          <CoachStatsCard stats={stats} days={30} />
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="RESPONDED">Responded</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Priority
          </label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white">
              Requests ({requests.length})
            </h2>
          </div>
          <CoachingRequestList
            requests={requests}
            view="coach"
            onSelectRequest={setSelectedRequestId}
          />
        </div>

        {selectedRequest && (
          <div>
            <RequestDetailView
              request={selectedRequest}
              currentUserId={currentUserId}
              isCoach={true}
              onSendMessage={handleSendMessage}
              onUpdateStatus={handleUpdateStatus}
            />
          </div>
        )}
      </div>
    </div>
  );
}
