import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/db/client';

type RouteParams = { params: Promise<{ courseId: string; reviewId: string }> };

/**
 * PUT /api/courses/[courseId]/reviews/[reviewId]
 * Update a review
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { reviewId } = await params;
    const body = await req.json();
    const { rating, title, content } = body;

    // Find the review
    const review = await prisma.courseReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (review.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own reviews' },
        { status: 403 }
      );
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const updatedReview = await prisma.courseReview.update({
      where: { id: reviewId },
      data: {
        ...(rating !== undefined && { rating }),
        ...(title !== undefined && { title: title?.trim() || null }),
        ...(content !== undefined && { content: content?.trim() || null }),
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: updatedReview.id,
      rating: updatedReview.rating,
      title: updatedReview.title,
      content: updatedReview.content,
      helpful: updatedReview.helpful,
      verified: updatedReview.verified,
      createdAt: updatedReview.createdAt,
      user: {
        displayName: updatedReview.user.firstName
          ? `${updatedReview.user.firstName} ${updatedReview.user.lastName?.charAt(0) || ''}.`
          : 'Anonymous',
      },
    });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/courses/[courseId]/reviews/[reviewId]
 * Delete a review
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { reviewId } = await params;

    // Find the review
    const review = await prisma.courseReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (review.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own reviews' },
        { status: 403 }
      );
    }

    await prisma.courseReview.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/courses/[courseId]/reviews/[reviewId]/helpful
 * Mark a review as helpful
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { reviewId } = await params;

    // Find the review
    const review = await prisma.courseReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Can't mark your own review as helpful
    if (review.userId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot mark your own review as helpful' },
        { status: 400 }
      );
    }

    // Increment helpful count
    const updatedReview = await prisma.courseReview.update({
      where: { id: reviewId },
      data: {
        helpful: { increment: 1 },
      },
    });

    return NextResponse.json({
      helpful: updatedReview.helpful,
    });
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    return NextResponse.json(
      { error: 'Failed to mark review as helpful' },
      { status: 500 }
    );
  }
}
