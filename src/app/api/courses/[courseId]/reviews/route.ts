import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/db/client';

/**
 * GET /api/courses/[courseId]/reviews
 * Get all reviews for a course
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'recent'; // recent, helpful, rating

    const skip = (page - 1) * limit;

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'helpful') {
      orderBy = { helpful: 'desc' };
    } else if (sortBy === 'rating') {
      orderBy = { rating: 'desc' };
    }

    const [reviews, total, stats] = await Promise.all([
      prisma.courseReview.findMany({
        where: { courseId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.courseReview.count({ where: { courseId } }),
      prisma.courseReview.aggregate({
        where: { courseId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    // Get rating distribution
    const ratingDistribution = await prisma.courseReview.groupBy({
      by: ['rating'],
      where: { courseId },
      _count: { rating: true },
    });

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDistribution.forEach((r) => {
      distribution[r.rating] = r._count.rating;
    });

    return NextResponse.json({
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        title: review.title,
        content: review.content,
        helpful: review.helpful,
        verified: review.verified,
        createdAt: review.createdAt,
        user: {
          id: review.user.id,
          displayName: review.user.firstName
            ? `${review.user.firstName} ${review.user.lastName?.charAt(0) || ''}.`
            : 'Anonymous',
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count.rating,
        distribution,
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/courses/[courseId]/reviews
 * Create a new review
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { courseId } = await params;
    const body = await req.json();
    const { rating, title, content } = body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if user already reviewed this course
    const existingReview = await prisma.courseReview.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId: session.user.id,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this course' },
        { status: 400 }
      );
    }

    // Check if user purchased the course (for verified badge)
    const purchase = await prisma.coursePurchase.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
    });

    const review = await prisma.courseReview.create({
      data: {
        courseId,
        userId: session.user.id,
        rating,
        title: title?.trim() || null,
        content: content?.trim() || null,
        verified: !!purchase,
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
      id: review.id,
      rating: review.rating,
      title: review.title,
      content: review.content,
      helpful: review.helpful,
      verified: review.verified,
      createdAt: review.createdAt,
      user: {
        displayName: review.user.firstName
          ? `${review.user.firstName} ${review.user.lastName?.charAt(0) || ''}.`
          : 'Anonymous',
      },
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
