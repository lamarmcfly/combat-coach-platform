import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import {
  getUserConversations,
  getOrCreateDirectConversation,
  getUnreadCount,
} from '@/lib/chat';
import { apiRatelimit, checkRateLimit } from '@/lib/ratelimit';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const createConversationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

/**
 * GET /api/chat/conversations
 * Get all conversations for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [conversations, unreadCount] = await Promise.all([
      getUserConversations(session.user.id),
      getUnreadCount(session.user.id),
    ]);

    return NextResponse.json({
      conversations,
      unreadCount,
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    return NextResponse.json(
      { error: 'Failed to get conversations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/conversations
 * Create or get a direct conversation with another user
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

    const validation = createConversationSchema.safeParse(body);
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

    const { userId: otherUserId } = validation.data;

    // Can't create conversation with yourself
    if (otherUserId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot create conversation with yourself' },
        { status: 400 }
      );
    }

    const conversationId = await getOrCreateDirectConversation(
      session.user.id,
      otherUserId
    );

    return NextResponse.json({ conversationId });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
