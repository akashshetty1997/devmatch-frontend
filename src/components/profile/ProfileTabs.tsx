/**
 * @file src/components/profile/ProfileTabs.tsx
 * @description Profile tabs content (repos, posts, reviews)
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiStar, FiGitBranch, FiHeart, FiMessageCircle } from "react-icons/fi";
import { developerAPI, postAPINew, reviewAPINew, repoAPI } from "@/lib/api";
import { Card, CardBody, Badge, CardSkeleton } from "@/components/common";
import { formatRelativeTime, formatNumber } from "@/lib/utils";

interface ProfileTabsProps {
  username: string;
  isOwnProfile: boolean;
  tab?: string;
}

export default function ProfileTabs({
  username,
  isOwnProfile,
  tab = "posts", // Changed default to "posts" since repos endpoint may not exist
}: ProfileTabsProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        let response;
        switch (tab) {
          case "repos":
            try {
              response = await developerAPI.getRepos(username, page);
            } catch (err: any) {
              // If 404, the endpoint doesn't exist - show empty state
              if (err.response?.status === 404) {
                setData([]);
                setHasMore(false);
                setLoading(false);
                return;
              }
              throw err;
            }
            break;
          case "posts":
            try {
              response = await postAPINew.getByUsername(username, page);
            } catch (err: any) {
              if (err.response?.status === 404) {
                setData([]);
                setHasMore(false);
                setLoading(false);
                return;
              }
              throw err;
            }
            break;
          case "reviews":
            try {
              response = await reviewAPINew.getByUsername(username, page);
            } catch (err: any) {
              if (err.response?.status === 404) {
                setData([]);
                setHasMore(false);
                setLoading(false);
                return;
              }
              throw err;
            }
            break;
          default:
            response = { data: { data: [] } };
        }

        const responseData = response.data?.data;
        const newData = Array.isArray(responseData)
          ? responseData
          : responseData?.[tab] ||
            responseData?.posts ||
            responseData?.repos ||
            responseData?.reviews ||
            [];

        setData(page === 1 ? newData : [...data, ...newData]);
        setHasMore(newData.length >= 10);
      } catch (err: any) {
        console.error(`Failed to fetch ${tab}:`, err);
        setError(`Failed to load ${tab}`);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tab, username, page]);

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
    setData([]);
  }, [tab]);

  if (loading && page === 1) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <p className="text-red-500">{error}</p>
        </CardBody>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <p className="text-gray-500">No {tab} found</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tab === "repos" &&
        data.map((repo) => <RepoItem key={repo._id || repo.id} repo={repo} />)}
      {tab === "posts" &&
        data.map((post) => <PostItem key={post._id || post.id} post={post} />)}
      {tab === "reviews" &&
        data.map((review) => (
          <ReviewItem key={review._id || review.id} review={review} />
        ))}

      {hasMore && (
        <button
          onClick={() => setPage(page + 1)}
          disabled={loading}
          className="w-full py-3 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}

// Repo Item
function RepoItem({ repo }: { repo: any }) {
  return (
    <Link href={`/repos/${repo._id || repo.id}`}>
      <Card hover>
        <CardBody>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 mb-1">
                {repo.fullName || repo.name}
              </h4>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {repo.description || "No description"}
              </p>
              <div className="flex flex-wrap gap-2">
                {repo.topics?.slice(0, 3).map((topic: string) => (
                  <Badge key={topic} variant="outline" size="sm">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 flex-shrink-0">
              <span className="flex items-center gap-1">
                <FiStar className="w-4 h-4" />
                {formatNumber(repo.stars || repo.stargazers_count || 0)}
              </span>
              <span className="flex items-center gap-1">
                <FiGitBranch className="w-4 h-4" />
                {formatNumber(repo.forks || repo.forks_count || 0)}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}

// Post Item
function PostItem({ post }: { post: any }) {
  return (
    <Card>
      <CardBody>
        <p className="text-gray-700 mb-3">{post.content}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <FiHeart className="w-4 h-4" />
              {post.likesCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <FiMessageCircle className="w-4 h-4" />
              {post.commentsCount || 0}
            </span>
          </div>
          <span>{formatRelativeTime(post.createdAt)}</span>
        </div>
      </CardBody>
    </Card>
  );
}

// Review Item
function ReviewItem({ review }: { review: any }) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-start gap-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <FiStar
                key={star}
                className={`w-4 h-4 ${
                  star <= review.rating
                    ? "text-yellow-400 fill-current"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <div className="flex-1">
            {review.title && (
              <h4 className="font-medium text-gray-900 mb-1">{review.title}</h4>
            )}
            <p className="text-gray-600 text-sm">{review.content}</p>
            <p className="text-xs text-gray-400 mt-2">
              {formatRelativeTime(review.createdAt)}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
