/**
 * @file src/components/details/RepoReviews.tsx
 * @description Repository reviews section with form and list (redesigned + dark mode safe)
 */

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiStar,
  FiEdit2,
  FiTrash2,
  FiUser,
  FiMessageSquare,
} from "react-icons/fi";
import {
  Card,
  CardBody,
  CardHeader,
  Avatar,
  Button,
  Textarea,
} from "@/components/common";
import { formatRelativeTime } from "@/lib/utils";

interface Review {
  _id: string;
  rating: number;
  title: string;
  content: string;
  reviewer: {
    _id: string;
    username: string;
    avatar: string | null;
  } | null;
  createdAt: string;
}

interface RepoReviewsProps {
  reviews: Review[];
  userReview: Review | null;
  isAuthenticated: boolean;
  currentUserId?: string;
  onSubmit: (data: {
    rating: number;
    title: string;
    content: string;
  }) => Promise<void>;
  onUpdate: (
    reviewId: string,
    data: { rating: number; title: string; content: string }
  ) => Promise<void>;
  onDelete: (reviewId: string) => void;
}

/**
 * NOTE:
 * - Dark mode support is done via Tailwind `dark:` classes.
 * - This assumes you toggle dark mode by adding `class="dark"` to <html>.
 * - If your Card/Textarea components hardcode colors, that will override these classes.
 */
export default function RepoReviews({
  reviews,
  userReview,
  isAuthenticated,
  currentUserId,
  onSubmit,
  onUpdate,
  onDelete,
}: RepoReviewsProps) {
  const [isWriting, setIsWriting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    rating: userReview?.rating || 5,
    title: userReview?.title || "",
    content: userReview?.content || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const otherReviews = useMemo(
    () => reviews.filter((r) => r._id !== userReview?._id),
    [reviews, userReview?._id]
  );

  const stats = useMemo(() => {
    const count = reviews.length;
    const avg =
      count > 0
        ? reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / count
        : 0;

    const dist = [0, 0, 0, 0, 0]; // index 0 => 1-star
    for (const r of reviews) {
      const v = Math.min(5, Math.max(1, Number(r.rating) || 1));
      dist[v - 1] += 1;
    }
    return { count, avg, dist };
  }, [reviews]);

  const startWriting = () => {
    setIsWriting(true);
    setIsEditing(false);
    if (!userReview) {
      setFormData({ rating: 5, title: "", content: "" });
    }
  };

  const startEditing = () => {
    if (!userReview) return;
    setFormData({
      rating: userReview.rating,
      title: userReview.title || "",
      content: userReview.content || "",
    });
    setIsEditing(true);
    setIsWriting(true);
  };

  const cancelForm = () => {
    setIsWriting(false);
    setIsEditing(false);
    setFormData({
      rating: userReview?.rating || 5,
      title: userReview?.title || "",
      content: userReview?.content || "",
    });
  };

  const handleDelete = (reviewId: string) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      onDelete(reviewId);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const validate = () => {
    const content = formData.content.trim();
    if (!content) return "Please write a review";
    if (content.length < 10)
      return "Review must be at least 10 characters long";
    if (formData.title && formData.title.length > 100)
      return "Title must be less than 100 characters";
    if (!formData.rating || formData.rating < 1 || formData.rating > 5)
      return "Please select a rating between 1 and 5";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && userReview) {
        await onUpdate(userReview._id, formData);
      } else {
        await onSubmit(formData);
      }

      setIsWriting(false);
      setIsEditing(false);

      if (!isEditing) {
        setFormData({ rating: 5, title: "", content: "" });
      }
    } catch (err2) {
      console.error("Review submission error:", err2);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
        <CardBody className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <FiMessageSquare className="text-gray-500 dark:text-white/60" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Reviews
                </h3>
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
                {stats.count > 0
                  ? `${stats.count} review${
                      stats.count === 1 ? "" : "s"
                    } • Average ${stats.avg.toFixed(1)}/5`
                  : "No reviews yet."}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              {stats.count > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <StarRatingDisplay rating={stats.avg} />
                  <span className="text-gray-700 dark:text-white/80">
                    {stats.avg.toFixed(1)}
                  </span>
                </div>
              )}

              {isAuthenticated ? (
                userReview ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={startEditing}
                      className="border-gray-300 bg-transparent text-gray-800 hover:bg-gray-50 dark:border-white/15 dark:text-white dark:hover:bg-white/[0.06]"
                      leftIcon={<FiEdit2 />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDelete(userReview._id)}
                      className="border-red-200 bg-transparent text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                      leftIcon={<FiTrash2 />}
                    >
                      Delete
                    </Button>
                  </div>
                ) : (
                  <Button onClick={startWriting}>Write a Review</Button>
                )
              ) : (
                <Link href="/login" className="inline-block">
                  <Button>Sign In</Button>
                </Link>
              )}
            </div>
          </div>

          {/* Distribution */}
          {stats.count > 0 && (
            <div className="mt-5 grid gap-2">
              {[5, 4, 3, 2, 1].map((s) => {
                const count = stats.dist[s - 1];
                const pct = stats.count
                  ? Math.round((count / stats.count) * 100)
                  : 0;
                return (
                  <div key={s} className="flex items-center gap-3">
                    <div className="w-14 text-xs font-medium text-gray-600 dark:text-white/60">
                      {s}★
                    </div>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-14 text-right text-xs text-gray-600 dark:text-white/60">
                      {pct}%
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Your review card (read-only) */}
      {userReview && !isWriting && (
        <Card className="border-blue-200 bg-blue-50/30 dark:border-blue-500/30 dark:bg-blue-500/10">
          <CardBody className="p-5">
            <div className="flex items-start gap-4">
              <Avatar
                src={userReview.reviewer?.avatar ?? null}
                name={userReview.reviewer?.username || "You"}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Your Review
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <StarRatingDisplay rating={userReview.rating} />
                      <span className="text-sm text-gray-500 dark:text-white/60">
                        {formatRelativeTime(userReview.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {userReview.title && (
                  <h4 className="mt-3 font-medium text-gray-900 dark:text-white">
                    {userReview.title}
                  </h4>
                )}

                <p className="mt-2 whitespace-pre-wrap text-gray-700 dark:text-white/80">
                  {userReview.content}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Form */}
      <AnimatePresence>
        {isWriting && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
              <CardHeader className="border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {isEditing ? "Edit your review" : "Write a review"}
                  </h3>
                  <div className="text-xs text-gray-500 dark:text-white/50">
                    {isEditing
                      ? "Update your feedback"
                      : "Be specific and useful"}
                  </div>
                </div>
              </CardHeader>

              <CardBody className="p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Rating */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white/70">
                      Rating <span className="text-red-500">*</span>
                    </label>
                    <StarRating
                      value={formData.rating}
                      onChange={(rating) =>
                        setFormData((p) => ({ ...p, rating }))
                      }
                    />
                  </div>

                  {/* Title */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white/70">
                      Title (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, title: e.target.value }))
                      }
                      placeholder="Short summary"
                      maxLength={100}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-white/40"
                    />
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-white/50">
                      <span>Keep it under 100 characters</span>
                      <span>{formData.title.length}/100</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white/70">
                      Your review <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, content: e.target.value }))
                      }
                      placeholder="What worked? What didn’t? Anything others should know?"
                      rows={4}
                      className="w-full border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-white/40"
                      required
                    />
                    <div className="mt-1 text-xs text-gray-500 dark:text-white/50">
                      Minimum 10 characters ({formData.content.trim().length}{" "}
                      written)
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end dark:border-white/10">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={cancelForm}
                      disabled={isSubmitting}
                      className="text-gray-700 hover:bg-gray-50 dark:text-white dark:hover:bg-white/[0.06]"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      isLoading={isSubmitting}
                      disabled={!!validate()}
                    >
                      {isEditing ? "Update Review" : "Submit Review"}
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login prompt (only show when unauthenticated and not currently writing) */}
      {!isAuthenticated && (
        <Card className="border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
          <CardBody className="py-8 text-center">
            <FiUser className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-white/20" />
            <p className="mb-4 text-gray-600 dark:text-white/60">
              Sign in to leave a review
            </p>
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          </CardBody>
        </Card>
      )}

      {/* All reviews */}
      {otherReviews.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            All Reviews ({reviews.length})
          </h3>

          {otherReviews.map((review, index) => (
            <motion.div
              key={review._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <ReviewCard review={review} currentUserId={currentUserId} />
            </motion.div>
          ))}
        </div>
      ) : (
        !userReview && (
          <Card className="border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
            <CardBody className="py-8 text-center">
              <p className="text-gray-500 dark:text-white/50">
                No reviews yet. Be the first to review.
              </p>
            </CardBody>
          </Card>
        )
      )}
    </div>
  );
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="rounded-md p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
          >
            <FiStar
              className={`h-6 w-6 ${
                active
                  ? "text-yellow-400 fill-current"
                  : "text-gray-300 dark:text-white/25"
              }`}
            />
          </button>
        );
      })}
      <span className="ml-2 text-sm text-gray-600 dark:text-white/60">
        {value === 1 ? "1 star" : `${value} stars`}
      </span>
    </div>
  );
}

function StarRatingDisplay({ rating }: { rating: number }) {
  const safe = Number(rating) || 0;
  const rounded = Math.round(safe);

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <FiStar
          key={star}
          className={`h-4 w-4 ${
            star <= rounded
              ? "text-yellow-400 fill-current"
              : "text-gray-300 dark:text-white/25"
          }`}
        />
      ))}
    </div>
  );
}

function ReviewCard({
  review,
  currentUserId,
}: {
  review: Review;
  currentUserId?: string;
}) {
  const authorUsername = review.reviewer?.username || "Anonymous";
  const authorAvatar = review.reviewer?.avatar || null;
  const isCurrentUser = review.reviewer?._id === currentUserId;

  return (
    <Card className="border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
      <CardBody className="p-5">
        <div className="flex items-start gap-4">
          {review.reviewer ? (
            <Link href={`/profile/${encodeURIComponent(authorUsername)}`}>
              <Avatar src={authorAvatar} name={authorUsername} size="md" />
            </Link>
          ) : (
            <Avatar src={null} name="Anonymous" size="md" />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                {review.reviewer ? (
                  <Link
                    href={`/profile/${encodeURIComponent(authorUsername)}`}
                    className="truncate font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                  >
                    {authorUsername}
                  </Link>
                ) : (
                  <span className="font-medium text-gray-900 dark:text-white">
                    Anonymous
                  </span>
                )}

                {isCurrentUser && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                    You
                  </span>
                )}
              </div>

              <span className="text-sm text-gray-500 dark:text-white/50">
                {formatRelativeTime(review.createdAt)}
              </span>
            </div>

            <div className="mt-1 flex items-center gap-2">
              <StarRatingDisplay rating={review.rating} />
              <span className="text-sm text-gray-600 dark:text-white/60">
                {(Number(review.rating) || 0).toFixed(1)}
              </span>
            </div>

            {review.title && (
              <h4 className="mt-3 font-medium text-gray-900 dark:text-white">
                {review.title}
              </h4>
            )}

            <p className="mt-2 whitespace-pre-wrap text-gray-700 dark:text-white/80">
              {review.content}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
