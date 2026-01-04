'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  helpful: number;
  verified: boolean;
  createdAt: string;
  user: {
    id: string;
    displayName: string;
  };
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
}

interface CourseReviewsProps {
  courseId: string;
  userHasPurchased?: boolean;
}

function StarRating({
  rating,
  size = 'md',
  interactive = false,
  onChange,
}: {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
}) {
  const [hoverRating, setHoverRating] = useState(0);
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          className={`${interactive ? 'cursor-pointer' : 'cursor-default'} focus:outline-none`}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          <svg
            className={`${sizeClass} ${
              (hoverRating || rating) >= star
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300 dark:text-gray-600'
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function RatingDistribution({ stats }: { stats: ReviewStats }) {
  const maxCount = Math.max(...Object.values(stats.distribution));

  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = stats.distribution[star] || 0;
        const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

        return (
          <div key={star} className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
              {star} star
            </span>
            <div className="flex-grow h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400 w-8 text-right">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function CourseReviews({ courseId, userHasPurchased = false }: CourseReviewsProps) {
  const { data: session } = useSession();
  const { success, error: showError } = useToast();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent');

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [userReview, setUserReview] = useState<Review | null>(null);

  const fetchReviews = async () => {
    try {
      const response = await fetch(
        `/api/courses/${courseId}/reviews?page=${page}&sortBy=${sortBy}`
      );
      const data = await response.json();

      if (response.ok) {
        setReviews(data.reviews);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);

        // Check if current user has a review
        if (session?.user?.id) {
          const existingReview = data.reviews.find(
            (r: Review) => r.user.id === session.user.id
          );
          if (existingReview) {
            setUserReview(existingReview);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [courseId, page, sortBy, session?.user?.id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/courses/${courseId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: newRating,
          title: newTitle,
          content: newContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      success('Review Submitted', 'Thank you for your review!');
      setShowReviewForm(false);
      setNewRating(5);
      setNewTitle('');
      setNewContent('');
      fetchReviews();
    } catch (err) {
      showError('Error', err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      const response = await fetch(
        `/api/courses/${courseId}/reviews/${reviewId}`,
        { method: 'POST' }
      );

      if (response.ok) {
        const data = await response.json();
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId ? { ...r, helpful: data.helpful } : r
          )
        );
      }
    } catch (err) {
      console.error('Error marking as helpful:', err);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
        Loading reviews...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Summary */}
      {stats && stats.totalReviews > 0 && (
        <div className="grid md:grid-cols-2 gap-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <span className="text-5xl font-bold">
                {stats.averageRating.toFixed(1)}
              </span>
              <div>
                <StarRating rating={Math.round(stats.averageRating)} size="lg" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
          <RatingDistribution stats={stats} />
        </div>
      )}

      {/* Write Review Button / Form */}
      {session?.user && !userReview && (
        <div>
          {!showReviewForm ? (
            <button
              onClick={() => setShowReviewForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Write a Review
            </button>
          ) : (
            <form
              onSubmit={handleSubmitReview}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4"
            >
              <h3 className="text-lg font-semibold">Write Your Review</h3>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Rating
                </label>
                <StarRating
                  rating={newRating}
                  size="lg"
                  interactive
                  onChange={setNewRating}
                />
              </div>

              <div>
                <label htmlFor="review-title" className="block text-sm font-medium mb-2">
                  Title (optional)
                </label>
                <input
                  id="review-title"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Summarize your experience"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label htmlFor="review-content" className="block text-sm font-medium mb-2">
                  Your Review (optional)
                </label>
                <textarea
                  id="review-content"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Share your experience with this course..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* User's existing review notice */}
      {userReview && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-green-800 dark:text-green-200">
            You&apos;ve already reviewed this course. Thank you for your feedback!
          </p>
        </div>
      )}

      {/* Sort Options */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">Sort by:</span>
          <div className="flex gap-2">
            {(['recent', 'helpful', 'rating'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  sortBy === option
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {option === 'recent' ? 'Most Recent' : option === 'helpful' ? 'Most Helpful' : 'Highest Rated'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>No reviews yet. Be the first to review this course!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <StarRating rating={review.rating} size="sm" />
                    {review.verified && (
                      <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  {review.title && (
                    <h4 className="font-semibold mt-2">{review.title}</h4>
                  )}
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {format(new Date(review.createdAt), 'MMM d, yyyy')}
                </span>
              </div>

              {review.content && (
                <p className="text-gray-700 dark:text-gray-300 mt-3">
                  {review.content}
                </p>
              )}

              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {review.user.displayName}
                </span>

                {session?.user && session.user.id !== review.user.id && (
                  <button
                    onClick={() => handleMarkHelpful(review.id)}
                    className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                      />
                    </svg>
                    Helpful ({review.helpful})
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
