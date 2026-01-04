import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import {
  getConversationMessages,
  sendMessage,
  markMessagesAsRead,
  deleteMessage,
} from '@/lib/chat';
import { apiRatelimit, checkRateLimit } from '@/lib/ratelimit';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const getMessagesSchema = z.object({
  conversationId: z.string().min(1),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});

const sendMessageSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  content: z.string().min(1, 'Message content is required').max(5000, 'Message too long'),
  replyToId: z.string().optional(),
});

const deleteMessageSchema = z.object({
  messageId: z.string().min(1, 'Message ID is required'),
});

/**
 * GET /api/chat/messages
 * Get messages for a conversation
 */
export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const validation = getMessagesSchema.safeParse({
      conversationId: searchParams.get('conversationId'),
      cursor: searchParams.get('cursor') || undefined,
      limit: searchParams.get('limit') || 50,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const { conversationId, cursor, limit } = validation.data;

    const result = await getConversationMessages(
      conversationId,
      session.user.id,
      cursor,
      limit
    );

    // Mark messages as read when fetching
    await markMessagesAsRead(conversationId, session.user.id).catch(() => {
      // Ignore errors from marking as read
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting messages:', error);
    if (error instanceof Error && error.message === 'Not a participant of this conversation') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/messages
 * Send a message
 */
export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await checkRateLimit(req, apiRatelimit);
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const validation = sendMessageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const { conversationId, content, replyToId } = validation.data;

    const message = await sendMessage(
      conversationId,
      session.user.id,
      content,
      replyToId
    );

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    if (error instanceof Error && error.message === 'Not a participant of this conversation') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chat/messages
 * Delete a message
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const validation = deleteMessageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const { messageId } = validation.data;

    await deleteMessage(messageId, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    if (error instanceof Error && error.message === 'Cannot delete this message') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
