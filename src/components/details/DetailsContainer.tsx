/**
 * @file src/components/details/DetailsContainer.tsx
 * @description Main container for repo details page
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { githubAPI, reviewAPINew, commentAPINew } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoading } from "@/components/common";
import RepoHeader from "./RepoHeader";
import RepoStats from "./RepoStats";
import RepoReadme from "./RepoReadme";
import RepoReviews from "./RepoReviews";
import RepoComments from "./RepoComments";
import RepoSidebar from "./RepoSidebar";

interface RepoData {
  _id: string;
  githubId: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  cloneUrl: string;
  language: string | null;
  languages: { name: string; bytes: number; percentage: number }[];
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  topics: string[];
  license: string | null;
  defaultBranch: string;
  ownerLogin: string;
  readme: string | null;
  aiSummary: string | null;
  aiTechStack: string[];
  githubCreatedAt: string;
  githubUpdatedAt: string;
  lastSyncedAt: string;
}

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

interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    username: string;
    avatar: string | null;
  };
  createdAt: string;
}

export default function DetailsContainer({ repoId }: { repoId: string }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [repo, setRepo] = useState<RepoData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"readme" | "reviews" | "comments">(
    "readme"
  );
  const [isPinned, setIsPinned] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);

  // Fetch repo data
  useEffect(() => {
    const fetchData = async () => {
      if (!repoId) return;

      setLoading(true);
      setError(null);

      try {
        let repoData: RepoData;

        // Check if repoId is owner/repo format (contains /)
        if (repoId.includes("/")) {
          // Fetch by fullName (owner/repo)
          const repoResponse = await githubAPI.getRepoByFullName(repoId);
          repoData = repoResponse.data?.data || repoResponse.data;
        } else {
          // Assume it's a MongoDB _id
          const repoResponse = await githubAPI.getRepo(repoId);
          repoData = repoResponse.data?.data || repoResponse.data;
        }

        setRepo(repoData);

        // Use MongoDB _id for API calls that need database ID
        const mongoId = repoData._id;

        if (mongoId) {
          try {
            // Fetch reviews using MongoDB _id
            const reviewsResponse = await reviewAPINew.getByRepo(mongoId);
            const reviewsData = reviewsResponse.data?.data?.reviews || [];
            setReviews(reviewsData);

            // Check if current user has reviewed
            if (user) {
              const existingReview = reviewsData.find(
                (r: Review) => r.author._id === user.id
              );
              setUserReview(existingReview || null);
            }
          } catch (reviewError) {
            console.log("No reviews found or error fetching reviews");
            setReviews([]);
          }

          try {
            // Fetch comments using MongoDB _id
            const commentsResponse = await commentAPINew.getByRepo(mongoId);
            setComments(commentsResponse.data?.data?.comments || []);
          } catch (commentError) {
            console.log("No comments found or error fetching comments");
            setComments([]);
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch repo details:", err);
        setError(err.response?.data?.message || "Failed to load repository");
        if (err.response?.status === 404) {
          toast.error("Repository not found");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [repoId, user]);

  // Handle new review
  const handleReviewSubmit = async (data: {
    rating: number;
    title: string;
    content: string;
  }) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/details/${encodeURIComponent(repoId)}`);
      return;
    }

    try {
      const mongoId = repo?._id;
      if (!mongoId) {
        throw new Error("Repository ID not found");
      }

      const response = await reviewAPINew.createForRepo(mongoId, data);
      const newReview = response.data?.data || response.data;

      setReviews((prev) => [newReview, ...prev]);
      setUserReview(newReview);
      toast.success("Review submitted!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit review");
      throw err;
    }
  };

  // Handle review update
  const handleReviewUpdate = async (
    reviewId: string,
    data: { rating: number; title: string; content: string }
  ) => {
    try {
      const response = await reviewAPINew.update(reviewId, data);
      const updatedReview = response.data?.data || response.data;

      setReviews((prev) =>
        prev.map((r) => (r._id === reviewId ? updatedReview : r))
      );
      setUserReview(updatedReview);
      toast.success("Review updated!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update review");
      throw err;
    }
  };

  // Handle review delete
  const handleReviewDelete = async (reviewId: string) => {
    try {
      await reviewAPINew.delete(reviewId);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      setUserReview(null);
      toast.success("Review deleted");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete review");
    }
  };

  // Handle new comment
  const handleCommentSubmit = async (content: string) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/details/${encodeURIComponent(repoId)}`);
      return;
    }

    try {
      const mongoId = repo?._id;
      if (!mongoId) {
        throw new Error("Repository ID not found");
      }

      const response = await commentAPINew.createOnRepo(mongoId, { content });
      const newComment = response.data?.data || response.data;
      setComments((prev) => [newComment, ...prev]);
      toast.success("Comment added!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add comment");
      throw err;
    }
  };

  // Handle comment delete
  const handleCommentDelete = async (commentId: string) => {
    try {
      await commentAPINew.delete(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      toast.success("Comment deleted");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete comment");
    }
  };

  // Handle pin repo
  const handlePinRepo = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/details/${encodeURIComponent(repoId)}`);
      return;
    }

    toast.success(isPinned ? "Unpinned from profile" : "Pinned to profile");
    setIsPinned(!isPinned);
  };

  if (loading) {
    return <PageLoading />;
  }

  if (error || !repo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Repository Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            {error || "This repository does not exist."}
          </p>
          <button
            onClick={() => router.push("/search")}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50"
    >
      <RepoHeader
        repo={repo}
        avgRating={avgRating}
        reviewCount={reviews.length}
        isPinned={isPinned}
        onPin={handlePinRepo}
        isAuthenticated={isAuthenticated}
        isDeveloper={user?.role === "DEVELOPER"}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <RepoStats repo={repo} />

            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {[
                { id: "readme", label: "README" },
                { id: "reviews", label: `Reviews (${reviews.length})` },
                { id: "comments", label: `Comments (${comments.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "readme" && (
                <RepoReadme readme={repo.readme} aiSummary={repo.aiSummary} />
              )}

              {activeTab === "reviews" && (
                <RepoReviews
                  reviews={reviews}
                  userReview={userReview}
                  isAuthenticated={isAuthenticated}
                  currentUserId={user?.id}
                  onSubmit={handleReviewSubmit}
                  onUpdate={handleReviewUpdate}
                  onDelete={handleReviewDelete}
                />
              )}

              {activeTab === "comments" && (
                <RepoComments
                  comments={comments}
                  isAuthenticated={isAuthenticated}
                  currentUserId={user?.id}
                  onSubmit={handleCommentSubmit}
                  onDelete={handleCommentDelete}
                />
              )}
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <RepoSidebar repo={repo} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
