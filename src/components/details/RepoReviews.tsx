/**
 * @file src/components/details/RepoReviews.tsx
 * @description Repository reviews section with form and list
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FiStar, FiEdit2, FiTrash2, FiUser } from "react-icons/fi";
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
  author: {
    _id: string;
    username: string;
    avatar: string | null;
  };
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) return;

    setIsSubmitting(true);
    try {
      if (isEditing && userReview) {
        await onUpdate(userReview._id, formData);
      } else {
        await onSubmit(formData);
      }
      setIsWriting(false);
      setIsEditing(false);
    } catch (err) {
      // Error handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = () => {
    if (userReview) {
      setFormData({
        rating: userReview.rating,
        title: userReview.title,
        content: userReview.content,
      });
      setIsEditing(true);
      setIsWriting(true);
    }
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

  // Star rating selector
  const StarRating = ({
    value,
    onChange,
  }: {
    value: number;
    onChange: (v: number) => void;
  }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-1 hover:scale-110 transition-transform"
        >
          <FiStar
            className={`w-6 h-6 ${
              star <= value ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Write Review Button / Form */}
      {isAuthenticated && !userReview && !isWriting && (
        <Card>
          <CardBody className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Share your experience with this repository
            </p>
            <Button onClick={() => setIsWriting(true)}>Write a Review</Button>
          </CardBody>
        </Card>
      )}

      {/* Review Form */}
      <AnimatePresence>
        {isWriting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-gray-900">
                  {isEditing ? "Edit Your Review" : "Write a Review"}
                </h3>
              </CardHeader>
              <CardBody>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating
                    </label>
                    <StarRating
                      value={formData.rating}
                      onChange={(rating) =>
                        setFormData((prev) => ({ ...prev, rating }))
                      }
                    />
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Summarize your review"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength={100}
                    />
                  </div>

                  {/* Content */}
                  <Textarea
                    label="Your Review"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    placeholder="What did you like or dislike about this repository?"
                    rows={4}
                  />

                  {/* Actions */}
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={cancelForm}>
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={isSubmitting}>
                      {isEditing ? "Update Review" : "Submit Review"}
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User's Review (if exists and not editing) */}
      {userReview && !isWriting && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardBody>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar
                  src={userReview.author.avatar}
                  name={userReview.author.username}
                  size="md"
                />
                <div>
                  <p className="font-medium text-gray-900">Your Review</p>
                  <div className="flex items-center gap-2">
                    <StarRatingDisplay rating={userReview.rating} />
                    <span className="text-sm text-gray-500">
                      {formatRelativeTime(userReview.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={startEditing}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <FiEdit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(userReview._id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {userReview.title && (
              <h4 className="font-medium text-gray-900 mb-2">
                {userReview.title}
              </h4>
            )}
            <p className="text-gray-700">{userReview.content}</p>
          </CardBody>
        </Card>
      )}

      {/* Login Prompt */}
      {!isAuthenticated && (
        <Card>
          <CardBody className="text-center py-8">
            <FiUser className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Sign in to leave a review</p>
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          </CardBody>
        </Card>
      )}

      {/* Reviews List */}
      {reviews.filter((r) => r._id !== userReview?._id).length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">
            All Reviews ({reviews.length})
          </h3>
          {reviews
            .filter((r) => r._id !== userReview?._id)
            .map((review, index) => (
              <motion.div
                key={review._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ReviewCard review={review} />
              </motion.div>
            ))}
        </div>
      ) : (
        !userReview && (
          <Card>
            <CardBody className="text-center py-8">
              <p className="text-gray-500">
                No reviews yet. Be the first to review!
              </p>
            </CardBody>
          </Card>
        )
      )}
    </div>
  );
}

// Star rating display (read-only)
function StarRatingDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <FiStar
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

// Individual review card
function ReviewCard({ review }: { review: Review }) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-start gap-4">
          <Link href={`/profile/${review.author.username}`}>
            <Avatar
              src={review.author.avatar}
              name={review.author.username}
              size="md"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <Link
                href={`/profile/${review.author.username}`}
                className="font-medium text-gray-900 hover:text-blue-600"
              >
                {review.author.username}
              </Link>
              <span className="text-sm text-gray-500">
                {formatRelativeTime(review.createdAt)}
              </span>
            </div>
            <StarRatingDisplay rating={review.rating} />
            {review.title && (
              <h4 className="font-medium text-gray-900 mt-2">{review.title}</h4>
            )}
            <p className="text-gray-700 mt-1">{review.content}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
