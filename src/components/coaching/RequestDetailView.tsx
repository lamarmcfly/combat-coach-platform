'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Message {
  id: string;
  content: string;
  isCoachResponse: boolean;
  createdAt: string;
  attachments: Array<{
    id: string;
    url: string;
    filename: string;
    type: string;
  }>;
}

interface RequestDetail {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  tags: string[];
  submittedAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  coach: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    tagline: string | null;
  };
  messages: Message[];
  attachments: Array<{
    id: string;
    url: string;
    filename: string;
    type: string;
  }>;
}

interface RequestDetailViewProps {
  request: RequestDetail;
  currentUserId: string;
  isCoach: boolean;
  onSendMessage: (content: string) => Promise<void>;
  onUpdateStatus: (status: string) => Promise<void>;
}

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  PENDING: 'warning',
  IN_REVIEW: 'info',
  RESPONDED: 'info',
  COMPLETED: 'success',
  ARCHIVED: 'default',
};

export function RequestDetailView({
  request,
  currentUserId,
  isCoach,
  onSendMessage,
  onUpdateStatus,
}: RequestDetailViewProps) {
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim()) return;

    setIsSending(true);
    try {
      await onSendMessage(messageContent);
      setMessageContent('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getAttachmentIcon = (type: string) => {
    if (type === 'VIDEO') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      );
    } else if (type === 'IMAGE') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">
                {request.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant={STATUS_VARIANTS[request.status] || 'default'}>
                  {request.status.replace(/_/g, ' ')}
                </Badge>
                <Badge variant="info">{request.type.replace(/_/g, ' ')}</Badge>
                {request.priority !== 'NORMAL' && (
                  <Badge variant="warning">{request.priority}</Badge>
                )}
              </div>
              {request.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {request.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {isCoach && (
              <div className="flex gap-2">
                {request.status === 'PENDING' && (
                  <Button
                    onClick={() => onUpdateStatus('IN_REVIEW')}
                    variant="secondary"
                    size="sm"
                  >
                    Start Review
                  </Button>
                )}
                {(request.status === 'IN_REVIEW' || request.status === 'RESPONDED') && (
                  <Button
                    onClick={() => onUpdateStatus('COMPLETED')}
                    size="sm"
                  >
                    Mark Complete
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-gray-800 pt-4">
            <p className="text-gray-300 whitespace-pre-wrap">{request.description}</p>
          </div>

          {request.attachments.length > 0 && (
            <div className="border-t border-gray-800 pt-4">
              <h3 className="font-semibold text-white mb-2">Attachments</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {request.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 border border-gray-700 rounded-lg hover:bg-gray-800"
                  >
                    {getAttachmentIcon(attachment.type)}
                    <span className="text-sm text-gray-300 truncate">
                      {attachment.filename}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-gray-800 pt-4 flex items-center justify-between text-sm text-gray-500">
            <div>
              Submitted by {request.user.firstName} {request.user.lastName}
            </div>
            <div>{formatDate(request.submittedAt)}</div>
          </div>
        </div>
      </Card>

      {/* Messages */}
      <Card>
        <h3 className="font-semibold text-white mb-4">
          Messages ({request.messages.length})
        </h3>

        <div className="space-y-4 mb-4">
          {request.messages.map((message) => {
            const isOwnMessage = !message.isCoachResponse;
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage && !isCoach ? 'justify-end' : ''}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.isCoachResponse
                      ? 'bg-accent/10 border border-accent/30'
                      : 'bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-sm text-white">
                      {message.isCoachResponse ? request.coach.displayName : 'You'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(message.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-300 whitespace-pre-wrap">{message.content}</p>

                  {message.attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-accent hover:text-accent/80"
                        >
                          {getAttachmentIcon(attachment.type)}
                          {attachment.filename}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Message input */}
        {request.status !== 'COMPLETED' && request.status !== 'ARCHIVED' && (
          <form onSubmit={handleSendMessage} className="border-t border-gray-800 pt-4">
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
              rows={3}
              placeholder={
                isCoach
                  ? 'Provide your feedback...'
                  : 'Reply or ask follow-up questions...'
              }
              disabled={isSending}
            />
            <div className="flex justify-end mt-2">
              <Button type="submit" disabled={isSending || !messageContent.trim()}>
                {isSending ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
