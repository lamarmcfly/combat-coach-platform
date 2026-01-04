import { ConversationType, MessageStatus } from '@prisma/client';
import { prisma } from '@/db/client';

export interface MessageWithSender {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  status: MessageStatus;
  isEdited: boolean;
  createdAt: Date;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
}

export interface ConversationWithParticipants {
  id: string;
  type: ConversationType;
  title: string | null;
  lastMessageAt: Date | null;
  participants: Array<{
    userId: string;
    name: string;
    avatar?: string;
    isOnline: boolean;
  }>;
  lastMessage?: {
    content: string;
    senderName: string;
    createdAt: Date;
  };
  unreadCount: number;
}

/**
 * Get or create a direct conversation between two users
 */
export async function getOrCreateDirectConversation(
  userId1: string,
  userId2: string
): Promise<string> {
  // Find existing conversation
  const existingConversation = await prisma.conversation.findFirst({
    where: {
      type: ConversationType.DIRECT,
      AND: [
        { participants: { some: { userId: userId1, leftAt: null } } },
        { participants: { some: { userId: userId2, leftAt: null } } },
      ],
    },
    select: { id: true },
  });

  if (existingConversation) {
    return existingConversation.id;
  }

  // Create new conversation
  const conversation = await prisma.conversation.create({
    data: {
      type: ConversationType.DIRECT,
      participants: {
        create: [
          { userId: userId1 },
          { userId: userId2 },
        ],
      },
    },
  });

  return conversation.id;
}

/**
 * Get conversations for a user
 */
export async function getUserConversations(
  userId: string,
  limit: number = 50
): Promise<ConversationWithParticipants[]> {
  const conversations = await prisma.conversation.findMany({
    where: {
      isArchived: false,
      participants: {
        some: {
          userId,
          leftAt: null,
        },
      },
    },
    include: {
      participants: {
        where: { leftAt: null },
        include: {
          // We'll need to join with User manually
        },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { lastMessageAt: 'desc' },
    take: limit,
  });

  // Get user details and unread counts
  const result = await Promise.all(
    conversations.map(async (conv) => {
      const participantIds = conv.participants.map((p) => p.userId);

      const users = await prisma.user.findMany({
        where: { id: { in: participantIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          coachProfile: {
            select: { avatarUrl: true },
          },
        },
      });

      const presences = await prisma.userPresence.findMany({
        where: { userId: { in: participantIds } },
        select: { userId: true, isOnline: true },
      });

      const userParticipant = conv.participants.find((p) => p.userId === userId);
      const lastReadAt = userParticipant?.lastReadAt || new Date(0);

      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conv.id,
          senderId: { not: userId },
          createdAt: { gt: lastReadAt },
        },
      });

      const lastMessage = conv.messages[0];
      let lastMessageSender: string | undefined;
      if (lastMessage) {
        const sender = users.find((u) => u.id === lastMessage.senderId);
        lastMessageSender = sender
          ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'Unknown'
          : 'Unknown';
      }

      return {
        id: conv.id,
        type: conv.type,
        title: conv.title,
        lastMessageAt: conv.lastMessageAt,
        participants: users
          .filter((u) => u.id !== userId)
          .map((u) => ({
            userId: u.id,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown',
            avatar: u.coachProfile?.avatarUrl || undefined,
            isOnline: presences.find((p) => p.userId === u.id)?.isOnline || false,
          })),
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              senderName: lastMessageSender!,
              createdAt: lastMessage.createdAt,
            }
          : undefined,
        unreadCount,
      };
    })
  );

  return result;
}

/**
 * Get messages for a conversation
 */
export async function getConversationMessages(
  conversationId: string,
  userId: string,
  cursor?: string,
  limit: number = 50
): Promise<{ messages: MessageWithSender[]; nextCursor: string | null }> {
  // Verify user is a participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId,
      },
    },
  });

  if (!participant || participant.leftAt) {
    throw new Error('Not a participant of this conversation');
  }

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      isDeleted: false,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    include: {
      replyTo: {
        select: {
          id: true,
          content: true,
          senderId: true,
        },
      },
    },
  });

  const hasMore = messages.length > limit;
  const messageList = hasMore ? messages.slice(0, limit) : messages;

  // Get sender info
  const senderIds = [...new Set(messageList.map((m) => m.senderId))];
  const replyToSenderIds = messageList
    .filter((m) => m.replyTo)
    .map((m) => m.replyTo!.senderId);
  const allUserIds = [...new Set([...senderIds, ...replyToSenderIds])];

  const users = await prisma.user.findMany({
    where: { id: { in: allUserIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      coachProfile: {
        select: { avatarUrl: true },
      },
    },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  const formattedMessages: MessageWithSender[] = messageList.map((msg) => {
    const sender = userMap.get(msg.senderId);
    const replyToSender = msg.replyTo ? userMap.get(msg.replyTo.senderId) : null;

    return {
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      senderName: sender
        ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'Unknown'
        : 'Unknown',
      senderAvatar: sender?.coachProfile?.avatarUrl || undefined,
      status: msg.status,
      isEdited: msg.isEdited,
      createdAt: msg.createdAt,
      replyTo: msg.replyTo
        ? {
            id: msg.replyTo.id,
            content: msg.replyTo.content,
            senderName: replyToSender
              ? `${replyToSender.firstName || ''} ${replyToSender.lastName || ''}`.trim() ||
                'Unknown'
              : 'Unknown',
          }
        : undefined,
    };
  });

  return {
    messages: formattedMessages.reverse(), // Return in chronological order
    nextCursor: hasMore ? messageList[messageList.length - 1].createdAt.toISOString() : null,
  };
}

/**
 * Send a message
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  replyToId?: string
): Promise<MessageWithSender> {
  // Verify sender is a participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: senderId,
      },
    },
  });

  if (!participant || participant.leftAt) {
    throw new Error('Not a participant of this conversation');
  }

  // Create message and update conversation
  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
        replyToId,
        status: MessageStatus.SENT,
      },
      include: {
        replyTo: {
          select: {
            id: true,
            content: true,
            senderId: true,
          },
        },
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  // Get sender info
  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: {
      firstName: true,
      lastName: true,
      coachProfile: {
        select: { avatarUrl: true },
      },
    },
  });

  let replyToSenderName: string | undefined;
  if (message.replyTo) {
    const replyToSender = await prisma.user.findUnique({
      where: { id: message.replyTo.senderId },
      select: { firstName: true, lastName: true },
    });
    replyToSenderName = replyToSender
      ? `${replyToSender.firstName || ''} ${replyToSender.lastName || ''}`.trim() || 'Unknown'
      : 'Unknown';
  }

  return {
    id: message.id,
    content: message.content,
    senderId: message.senderId,
    senderName: sender
      ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'Unknown'
      : 'Unknown',
    senderAvatar: sender?.coachProfile?.avatarUrl || undefined,
    status: message.status,
    isEdited: message.isEdited,
    createdAt: message.createdAt,
    replyTo: message.replyTo
      ? {
          id: message.replyTo.id,
          content: message.replyTo.content,
          senderName: replyToSenderName!,
        }
      : undefined,
  };
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const now = new Date();

  await prisma.$transaction([
    prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: { lastReadAt: now },
    }),
    prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        status: { not: MessageStatus.READ },
      },
      data: { status: MessageStatus.READ },
    }),
  ]);
}

/**
 * Update user presence
 */
export async function updateUserPresence(
  userId: string,
  isOnline: boolean,
  currentPage?: string
): Promise<void> {
  await prisma.userPresence.upsert({
    where: { userId },
    create: {
      userId,
      isOnline,
      lastSeenAt: new Date(),
      currentPage,
    },
    update: {
      isOnline,
      lastSeenAt: new Date(),
      currentPage,
    },
  });
}

/**
 * Get unread message count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const participants = await prisma.conversationParticipant.findMany({
    where: {
      userId,
      leftAt: null,
      conversation: { isArchived: false },
    },
    select: {
      conversationId: true,
      lastReadAt: true,
    },
  });

  if (participants.length === 0) return 0;

  let totalUnread = 0;
  for (const participant of participants) {
    const count = await prisma.message.count({
      where: {
        conversationId: participant.conversationId,
        senderId: { not: userId },
        createdAt: { gt: participant.lastReadAt || new Date(0) },
      },
    });
    totalUnread += count;
  }

  return totalUnread;
}

/**
 * Delete a message (soft delete)
 */
export async function deleteMessage(
  messageId: string,
  userId: string
): Promise<void> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { senderId: true },
  });

  if (!message || message.senderId !== userId) {
    throw new Error('Cannot delete this message');
  }

  await prisma.message.update({
    where: { id: messageId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
}
