'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';

interface CoachingRequest {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  submittedAt: string;
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  coach?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  messages: any[];
  _count?: {
    messages: number;
    attachments: number;
  };
}

interface CoachingRequestListProps {
  requests: CoachingRequest[];
  view: 'student' | 'coach';
  onSelectRequest?: (requestId: string) => void;
}

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  PENDING: 'warning',
  IN_REVIEW: 'info',
  RESPONDED: 'info',
  COMPLETED: 'success',
  ARCHIVED: 'default',
};

const PRIORITY_VARIANTS: Record<string, 'default' | 'warning' | 'error'> = {
  LOW: 'default',
  NORMAL: 'default',
  HIGH: 'warning',
  URGENT: 'error',
};

const TYPE_LABELS: Record<string, string> = {
  VIDEO_REVIEW: 'Video Review',
  TECHNIQUE_CHECK: 'Technique Check',
  FORM_ANALYSIS: 'Form Analysis',
  TRAINING_QUESTION: 'Training Question',
  STRATEGY_ADVICE: 'Strategy Advice',
  GENERAL: 'General',
};

export function CoachingRequestList({
  requests,
  view,
  onSelectRequest,
}: CoachingRequestListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    onSelectRequest?.(id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 1000 / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  if (requests.length === 0) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-lg">
        <div className="text-center py-12">
          <p className="text-gray-500">
            {view === 'coach'
              ? 'No coaching requests yet.'
              : 'You haven\'t submitted any requests yet.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => {
        const isSelected = selectedId === request.id;
        const messageCount = request._count?.messages || request.messages.length;
        const attachmentCount = request._count?.attachments || 0;
        const lastMessage = request.messages[0];

        return (
          <div
            key={request.id}
            className={`rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-lg cursor-pointer transition-all hover:border-gray-700 ${
              isSelected ? 'ring-2 ring-accent' : ''
            }`}
            onClick={() => handleSelect(request.id)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white truncate">
                    {request.title}
                  </h3>
                  <Badge variant={STATUS_VARIANTS[request.status] || 'default'}>
                    {request.status.replace(/_/g, ' ')}
                  </Badge>
                  {request.priority !== 'NORMAL' && (
                    <Badge variant={PRIORITY_VARIANTS[request.priority] || 'default'}>
                      {request.priority}
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                  {request.description}
                </p>

                <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                  <span>{TYPE_LABELS[request.type] || request.type}</span>

                  {view === 'coach' && request.user && (
                    <span>
                      {request.user.firstName} {request.user.lastName}
                    </span>
                  )}

                  {view === 'student' && request.coach && (
                    <span>Coach: {request.coach.displayName}</span>
                  )}

                  <span>{formatDate(request.submittedAt)}</span>

                  {messageCount > 0 && (
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      {messageCount}
                    </span>
                  )}

                  {attachmentCount > 0 && (
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                      {attachmentCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
