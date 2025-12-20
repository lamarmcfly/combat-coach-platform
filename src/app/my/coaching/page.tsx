'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { CoachingRequestList } from '@/components/coaching/CoachingRequestList';
import { CreateRequestModal } from '@/components/coaching/CreateRequestModal';
import { VideoSubmissionForm } from '@/components/coaching/VideoSubmissionForm';
import { RequestDetailView } from '@/components/coaching/RequestDetailView';

export default function StudentCoachingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'requests' | 'submit'>('requests');
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    fetchData();
    fetchCoaches();
  }, []);

  useEffect(() => {
    if (selectedRequestId) {
      fetchRequestDetails(selectedRequestId);
    } else {
      setSelectedRequest(null);
    }
  }, [selectedRequestId]);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/coaching/requests?view=student');
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

  const fetchCoaches = async () => {
    try {
      const response = await fetch('/api/coaches');
      if (response.ok) {
        const data = await response.json();
        setCoaches(
          data.coaches?.map((c: any) => ({
            id: c.id,
            displayName: c.displayName,
            avatarUrl: c.avatarUrl,
          })) || []
        );
      }
    } catch (error) {
      console.error('Error fetching coaches:', error);
    }
  };

  const fetchRequestDetails = async (requestId: string) => {
    try {
      const response = await fetch(`/api/coaching/requests/${requestId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedRequest(data.request);
        setCurrentUserId(data.request.userId);
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
    }
  };

  const handleCreateRequest = async (formData: any) => {
    try {
      const response = await fetch('/api/coaching/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchData();
        setIsCreateModalOpen(false);
      }
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  };

  const handleSubmitVideo = async (formData: any) => {
    // Transform video submission into a coaching request
    const requestData = {
      coachId: formData.coachId,
      title: formData.title,
      description: `${formData.description}\n\n**Video URL:** ${formData.videoUrl}\n\n**Specific Questions:**\n${formData.specificQuestions || 'None specified'}`,
      type: 'VIDEO_REVIEW',
      priority: 'NORMAL',
      tags: formData.tags,
      attachments: formData.videoUrl
        ? [
            {
              url: formData.videoUrl,
              filename: 'Training Video',
              type: 'VIDEO',
              fileSize: 0,
            },
          ]
        : [],
    };

    await handleCreateRequest(requestData);
    setActiveTab('requests');
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
          <div className="h-9 w-64 bg-gray-800 rounded animate-pulse mb-2" />
          <div className="h-5 w-96 bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="border-b border-gray-800 mb-6 pb-2">
          <div className="flex gap-4">
            <div className="h-8 w-32 bg-gray-800 rounded animate-pulse" />
            <div className="h-8 w-24 bg-gray-800 rounded animate-pulse" />
          </div>
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
        <h1 className="text-3xl font-bold text-white mb-2">Coaching Feedback</h1>
        <p className="text-gray-400">
          Get personalized feedback from your coaches on techniques, videos, and training questions
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800 mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 border-b-2 font-medium ${
              activeTab === 'requests'
                ? 'border-accent text-accent'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            My Requests ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('submit')}
            className={`px-4 py-2 border-b-2 font-medium ${
              activeTab === 'submit'
                ? 'border-accent text-accent'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Submit New
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'requests' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">All Requests</h2>
              <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
                New Request
              </Button>
            </div>
            <CoachingRequestList
              requests={requests}
              view="student"
              onSelectRequest={setSelectedRequestId}
            />
          </div>

          {selectedRequest && (
            <div>
              <RequestDetailView
                request={selectedRequest}
                currentUserId={currentUserId}
                isCoach={false}
                onSendMessage={handleSendMessage}
                onUpdateStatus={handleUpdateStatus}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'submit' && (
        <div className="max-w-3xl">
          <VideoSubmissionForm
            onSubmit={handleSubmitVideo}
            coaches={coaches}
          />
        </div>
      )}

      {/* Create Request Modal */}
      <CreateRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateRequest}
        coaches={coaches}
      />
    </div>
  );
}
