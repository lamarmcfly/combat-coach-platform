'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDistanceToNow } from 'date-fns';

interface SparringRequestCardProps {
  request: any;
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  onComplete?: () => void;
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'default' | 'info' }> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  ACCEPTED: { label: 'Accepted', variant: 'success' },
  DECLINED: { label: 'Declined', variant: 'error' },
  CANCELED: { label: 'Canceled', variant: 'default' },
  COMPLETED: { label: 'Completed', variant: 'info' },
};

export function SparringRequestCard({
  request,
  onAccept,
  onDecline,
  onCancel,
  onComplete,
}: SparringRequestCardProps) {
  const isReceived = request.type === 'received';
  const otherUser = request.otherUser;
  const status = statusConfig[request.status] || statusConfig.PENDING;

  const displayName =
    otherUser?.firstName && otherUser?.lastName
      ? `${otherUser.firstName} ${otherUser.lastName}`
      : otherUser?.firstName || 'Unknown';

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white">{displayName}</h3>
            <span className="text-xs text-gray-500">
              {isReceived ? 'sent you a request' : 'requested by you'}
            </span>
          </div>
          <p className="text-sm text-gray-400">
            {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
          </p>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      {/* Request Details */}
      <div className="space-y-2 mb-3">
        {request.discipline && (
          <div className="text-sm">
            <span className="text-gray-500">Discipline:</span>{' '}
            <span className="text-gray-300">{request.discipline}</span>
          </div>
        )}
        {request.proposedDate && (
          <div className="text-sm">
            <span className="text-gray-500">Date:</span>{' '}
            <span className="text-gray-300">
              {new Date(request.proposedDate).toLocaleDateString()}
              {request.proposedTime && ` at ${request.proposedTime}`}
            </span>
          </div>
        )}
        {request.location && (
          <div className="text-sm">
            <span className="text-gray-500">Location:</span>{' '}
            <span className="text-gray-300">{request.location}</span>
          </div>
        )}
        {request.intensity && (
          <div className="text-sm">
            <span className="text-gray-500">Intensity:</span>{' '}
            <span className="text-gray-300">{request.intensity}</span>
          </div>
        )}
        {request.duration && (
          <div className="text-sm">
            <span className="text-gray-500">Duration:</span>{' '}
            <span className="text-gray-300">{request.duration} min</span>
          </div>
        )}
      </div>

      {/* Message */}
      {request.message && (
        <div className="mb-3 p-3 rounded bg-gray-900/50 border border-gray-700">
          <p className="text-sm text-gray-300">{request.message}</p>
        </div>
      )}

      {/* Response Note */}
      {request.responseNote && (
        <div className="mb-3 p-3 rounded bg-gray-900/50 border border-gray-700">
          <p className="text-xs text-gray-500 mb-1">Response:</p>
          <p className="text-sm text-gray-300">{request.responseNote}</p>
        </div>
      )}

      {/* Partner Info */}
      {otherUser?.sparringPreference && (
        <div className="mb-3 flex flex-wrap gap-1">
          {otherUser.sparringPreference.weightClass && (
            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
              {otherUser.sparringPreference.weightClass}
            </span>
          )}
          {otherUser.sparringPreference.skillLevel && (
            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
              {otherUser.sparringPreference.skillLevel}
            </span>
          )}
          {otherUser.sparringPreference.disciplines?.slice(0, 3).map((d: string) => (
            <span key={d} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
              {d}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {request.status === 'PENDING' && isReceived && (
          <>
            <Button onClick={onAccept} size="sm" className="flex-1">
              Accept
            </Button>
            <Button onClick={onDecline} variant="outline" size="sm" className="flex-1">
              Decline
            </Button>
          </>
        )}
        {request.status === 'PENDING' && !isReceived && (
          <Button onClick={onCancel} variant="outline" size="sm">
            Cancel Request
          </Button>
        )}
        {request.status === 'ACCEPTED' && (
          <Button onClick={onComplete} size="sm" className="w-full">
            Mark as Completed
          </Button>
        )}
      </div>
    </div>
  );
}
