import webpush from 'web-push';
import { prisma } from '@/db/client';

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@combatcoach.app';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  url?: string;
  data?: Record<string, any>;
}

/**
 * Check if push notifications are configured
 */
export function isPushConfigured(): boolean {
  return !!(vapidPublicKey && vapidPrivateKey);
}

/**
 * Send push notification to a specific user
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ success: number; failed: number }> {
  if (!isPushConfigured()) {
    console.warn('Push notifications not configured - missing VAPID keys');
    return { success: 0, failed: 0 };
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  let success = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify({
          ...payload,
          icon: payload.icon || '/icons/icon-192x192.png',
          badge: payload.badge || '/icons/badge-72x72.png',
        })
      );
      success++;
    } catch (error: any) {
      failed++;
      // If subscription is no longer valid, remove it
      if (error.statusCode === 404 || error.statusCode === 410) {
        await prisma.pushSubscription.delete({
          where: { id: sub.id },
        }).catch(() => {});
      } else {
        console.error('Push notification failed:', error.message);
      }
    }
  }

  return { success, failed };
}

/**
 * Send push notification to multiple users
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<{ success: number; failed: number }> {
  let totalSuccess = 0;
  let totalFailed = 0;

  for (const userId of userIds) {
    const result = await sendPushToUser(userId, payload);
    totalSuccess += result.success;
    totalFailed += result.failed;
  }

  return { success: totalSuccess, failed: totalFailed };
}

/**
 * Send push notification for session reminder
 */
export async function sendSessionReminder(
  userId: string,
  sessionTitle: string,
  coachName: string,
  startTime: Date,
  sessionUrl?: string
): Promise<void> {
  const minutesUntil = Math.round((startTime.getTime() - Date.now()) / 60000);

  await sendPushToUser(userId, {
    title: 'Session Starting Soon',
    body: `Your session "${sessionTitle}" with ${coachName} starts in ${minutesUntil} minutes`,
    tag: 'session-reminder',
    url: sessionUrl || '/my/sessions',
    data: {
      type: 'session_reminder',
      startTime: startTime.toISOString(),
    },
  });
}

/**
 * Send push notification for coaching request update
 */
export async function sendCoachingRequestUpdate(
  userId: string,
  coachName: string,
  status: 'accepted' | 'responded' | 'declined'
): Promise<void> {
  const messages = {
    accepted: `${coachName} accepted your coaching request`,
    responded: `${coachName} responded to your coaching request`,
    declined: `${coachName} declined your coaching request`,
  };

  await sendPushToUser(userId, {
    title: 'Coaching Request Update',
    body: messages[status],
    tag: 'coaching-request',
    url: '/my/coaching',
    data: {
      type: 'coaching_request_update',
      status,
    },
  });
}

/**
 * Send push notification for new message
 */
export async function sendNewMessageNotification(
  userId: string,
  senderName: string,
  messagePreview: string
): Promise<void> {
  await sendPushToUser(userId, {
    title: `New message from ${senderName}`,
    body: messagePreview.length > 100 ? messagePreview.slice(0, 100) + '...' : messagePreview,
    tag: 'message',
    url: '/my/messages',
    data: {
      type: 'new_message',
    },
  });
}

/**
 * Send push notification for streak milestone
 */
export async function sendStreakMilestone(
  userId: string,
  streakDays: number
): Promise<void> {
  await sendPushToUser(userId, {
    title: 'Streak Milestone!',
    body: `Amazing! You've maintained a ${streakDays}-day training streak!`,
    tag: 'streak',
    url: '/my/dashboard',
    data: {
      type: 'streak_milestone',
      streakDays,
    },
  });
}

/**
 * Send push notification for goal completion
 */
export async function sendGoalCompleted(
  userId: string,
  goalTitle: string
): Promise<void> {
  await sendPushToUser(userId, {
    title: 'Goal Completed!',
    body: `Congratulations! You've completed: ${goalTitle}`,
    tag: 'goal',
    url: '/my/goals',
    data: {
      type: 'goal_completed',
    },
  });
}
