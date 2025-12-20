'use client';

import { useEffect, useState } from 'react';
import { SparringPreferencesForm } from '@/components/sparring/SparringPreferencesForm';
import { SparringMatchCard } from '@/components/sparring/SparringMatchCard';
import { SparringRequestCard } from '@/components/sparring/SparringRequestCard';
import { SendRequestModal } from '@/components/sparring/SendRequestModal';
import { SkeletonCard, SkeletonStats } from '@/components/ui/Skeleton';
import { useToast } from '@/contexts/ToastContext';

export default function SparringPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'find' | 'requests' | 'preferences'>('find');
  const [preferences, setPreferences] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  // Modal state
  const [selectedPartner, setSelectedPartner] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchPreferences();
    fetchRequests();
  }, []);

  useEffect(() => {
    if (preferences && activeTab === 'find') {
      fetchMatches();
    }
  }, [preferences, activeTab]);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/sparring/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMatches = async () => {
    setIsLoadingMatches(true);
    try {
      const response = await fetch('/api/sparring/matches');
      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches || []);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/sparring/requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleSavePreferences = async (data: any) => {
    const response = await fetch('/api/sparring/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to save preferences');
    }

    const result = await response.json();
    setPreferences(result.preferences);
    // Refresh matches with new preferences
    if (activeTab === 'find') {
      fetchMatches();
    }
  };

  const handleSendRequest = async (data: any) => {
    const response = await fetch('/api/sparring/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to send request');
    }

    fetchRequests();
    setSelectedPartner(null);
  };

  const handleUpdateRequest = async (requestId: string, updates: any) => {
    try {
      const response = await fetch(`/api/sparring/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        toast.success('Request updated');
        fetchRequests();
      } else {
        toast.error('Failed to update request');
      }
    } catch (error) {
      toast.error('Failed to update request');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="h-9 w-64 bg-gray-800 rounded animate-pulse mb-2" />
          <div className="h-5 w-96 bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="mb-6">
          <SkeletonStats />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Sparring Partners</h1>
        <p className="text-gray-400">
          Find training partners based on weight class, experience, and location
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
            <p className="text-sm text-gray-400">Pending Received</p>
            <p className="text-2xl font-bold text-white">{stats.pendingReceived}</p>
          </div>
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
            <p className="text-sm text-gray-400">Pending Sent</p>
            <p className="text-2xl font-bold text-white">{stats.pendingSent}</p>
          </div>
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
            <p className="text-sm text-gray-400">Accepted</p>
            <p className="text-2xl font-bold text-accent">{stats.accepted}</p>
          </div>
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
            <p className="text-sm text-gray-400">Completed</p>
            <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-800 mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('find')}
            className={`px-4 py-2 border-b-2 font-medium ${
              activeTab === 'find'
                ? 'border-accent text-accent'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Find Partners
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 border-b-2 font-medium ${
              activeTab === 'requests'
                ? 'border-accent text-accent'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            My Requests
            {stats?.pendingReceived > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-accent rounded-full">
                {stats.pendingReceived}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-2 border-b-2 font-medium ${
              activeTab === 'preferences'
                ? 'border-accent text-accent'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Preferences
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'find' && (
        <div>
          {!preferences ? (
            <div className="text-center py-12 rounded-lg border border-gray-700 bg-gray-800/50">
              <div className="text-6xl mb-4">🥊</div>
              <h3 className="text-xl font-semibold text-white mb-2">Set Up Your Profile First</h3>
              <p className="text-gray-400 mb-4">
                Tell us about your training preferences to find the best matches
              </p>
              <button
                onClick={() => setActiveTab('preferences')}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90"
              >
                Set Preferences
              </button>
            </div>
          ) : isLoadingMatches ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-12 rounded-lg border border-gray-700 bg-gray-800/50">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Matches Found</h3>
              <p className="text-gray-400">
                Try adjusting your preferences or check back later
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match) => (
                <SparringMatchCard
                  key={match.userId}
                  match={match}
                  onSendRequest={() =>
                    setSelectedPartner({ id: match.userId, name: match.displayName })
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div>
          {requests.length === 0 ? (
            <div className="text-center py-12 rounded-lg border border-gray-700 bg-gray-800/50">
              <div className="text-6xl mb-4">📬</div>
              <h3 className="text-xl font-semibold text-white mb-2">No Requests Yet</h3>
              <p className="text-gray-400">
                Send sparring requests to potential partners or wait for others to reach out
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pending Received */}
              {requests.filter((r) => r.status === 'PENDING' && r.type === 'received').length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Awaiting Your Response</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requests
                      .filter((r) => r.status === 'PENDING' && r.type === 'received')
                      .map((request) => (
                        <SparringRequestCard
                          key={request.id}
                          request={request}
                          onAccept={() => handleUpdateRequest(request.id, { status: 'ACCEPTED' })}
                          onDecline={() => handleUpdateRequest(request.id, { status: 'DECLINED' })}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Accepted */}
              {requests.filter((r) => r.status === 'ACCEPTED').length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Upcoming Sessions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requests
                      .filter((r) => r.status === 'ACCEPTED')
                      .map((request) => (
                        <SparringRequestCard
                          key={request.id}
                          request={request}
                          onComplete={() => handleUpdateRequest(request.id, { status: 'COMPLETED' })}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Pending Sent */}
              {requests.filter((r) => r.status === 'PENDING' && r.type === 'sent').length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Waiting for Response</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requests
                      .filter((r) => r.status === 'PENDING' && r.type === 'sent')
                      .map((request) => (
                        <SparringRequestCard
                          key={request.id}
                          request={request}
                          onCancel={() => handleUpdateRequest(request.id, { status: 'CANCELED' })}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* History */}
              {requests.filter((r) => ['COMPLETED', 'DECLINED', 'CANCELED'].includes(r.status)).length >
                0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">History</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requests
                      .filter((r) => ['COMPLETED', 'DECLINED', 'CANCELED'].includes(r.status))
                      .map((request) => (
                        <SparringRequestCard key={request.id} request={request} />
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="max-w-2xl">
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Sparring Preferences</h2>
            <SparringPreferencesForm
              preferences={preferences}
              onSave={handleSavePreferences}
            />
          </div>
        </div>
      )}

      {/* Send Request Modal */}
      {selectedPartner && (
        <SendRequestModal
          isOpen={true}
          onClose={() => setSelectedPartner(null)}
          partnerId={selectedPartner.id}
          partnerName={selectedPartner.name}
          onSubmit={handleSendRequest}
        />
      )}
    </div>
  );
}
