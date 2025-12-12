/**
 * @file src/components/profile/ProfileTabs.tsx
 * @description Profile tabs content (repos, posts, reviews) - Reddit-ish, dark-mode safe
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FiStar, FiGitBranch, FiHeart, FiMessageCircle } from "react-icons/fi";
import { developerAPI, postAPINew, reviewAPINew } from "@/lib/api";
import { Card, CardBody, Badge, CardSkeleton } from "@/components/common";
import { formatRelativeTime, formatNumber } from "@/lib/utils";

interface ProfileTabsProps {
  username: string;
  isOwnProfile: boolean;
  tab?: string;
}

const PAGE_SIZE = 10;

export default function ProfileTabs({
  username,
  isOwnProfile,
  tab = "posts",
}: ProfileTabsProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Reset on tab/user change
  useEffect(() => {
    setPage(1);
    setItems([]);
    setHasMore(true);
    setError(null);
  }, [tab, username]);

  const title = useMemo(() => {
    if (tab === "repos") return "Repositories";
    if (tab === "reviews") return "Reviews";
    return "Posts";
  }, [tab]);

  useEffect(() => {
    let alive = true;

    const fetchData = async () => {
      if (page === 1) setLoading(true);
      else setLoadMoreLoading(true);

      setError(null);

      try {
        let response: any;

        if (tab === "repos") {
          response = await developerAPI.getRepos(username, page);
        } else if (tab === "posts") {
          response = await postAPINew.getByUsername(username, page);
        } else if (tab === "reviews") {
          response = await reviewAPINew.getByUsername(username, page);
        } else {
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

        if (!alive) return;

        setItems((prev) => (page === 1 ? newData : [...prev, ...newData]));
        setHasMore(newData.length >= PAGE_SIZE);
      } catch (err: any) {
        if (!alive) return;

        // If endpoint doesn't exist, show empty state (common in early backends)
        if (err?.response?.status === 404) {
          setItems([]);
          setHasMore(false);
          setError(null);
          return;
        }

        console.error(`Failed to fetch ${tab}:`, err);
        setError(`Failed to load ${title.toLowerCase()}`);
        setItems([]);
        setHasMore(false);
      } finally {
        if (!alive) return;
        setLoading(false);
        setLoadMoreLoading(false);
      }
    };

    fetchData();
    return () => {
      alive = false;
    };
  }, [tab, username, page, title]);

  if (loading && page === 1) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50/40 dark:border-red-500/20 dark:bg-red-500/10">
          <CardBody className="py-10 text-center">
            <p className="text-sm font-semibold text-red-700 dark:text-red-200">
              {error}
            </p>
            <p className="mt-1 text-sm text-red-600/80 dark:text-red-200/70">
              Try reloading or check your API route.
            </p>
          </CardBody>
        </Card>
      )}

      {/* Empty */}
      {!error && items.length === 0 && (
        <Card className="border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
          <CardBody className="py-12 text-center">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              No {title.toLowerCase()} yet
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-white/50">
              {tab === "repos"
                ? "Pinned/public repos will show up here."
                : tab === "reviews"
                ? "Reviews will appear once they post them."
                : "Posts will appear once they share something."}
            </p>
          </CardBody>
        </Card>
      )}

      {/* List */}
      {!error && items.length > 0 && (
        <div className="space-y-3">
          {tab === "repos" &&
            items.map((repo) => <RepoRow key={repo._id || repo.id} repo={repo} />)}

          {tab === "posts" &&
            items.map((post) => <PostRow key={post._id || post.id} post={post} />)}

          {tab === "reviews" &&
            items.map((review) => (
              <ReviewRow key={review._id || review.id} review={review} />
            ))}
        </div>
      )}

      {/* Load more */}
      {!error && hasMore && items.length > 0 && (
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={loadMoreLoading}
          className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:hover:bg-white/[0.06]"
        >
          {loadMoreLoading ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}

/* ---------------------------- Repo Row (Reddit-ish) ---------------------------- */

function RepoRow({ repo }: { repo: any }) {
  const name = repo.fullName || repo.name;
  const desc = repo.description || "No description";
  const stars = repo.stars ?? repo.stargazers_count ?? 0;
  const forks = repo.forks ?? repo.forks_count ?? 0;

  return (
    <Link href={`/repos/${repo._id || repo.id}`} className="block">
      <Card
        hover
        className="border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]"
      >
        <CardBody className="p-0">
          <div className="flex gap-3 p-4">
            {/* left rail (upvote-style) */}
            <div className="flex w-12 shrink-0 flex-col items-center justify-start rounded-xl bg-gray-50 py-2 text-xs font-semibold text-gray-600 dark:bg-white/[0.04] dark:text-white/60">
              <FiStar className="h-4 w-4 text-yellow-500" />
              <span className="mt-1">{formatNumber(stars)}</span>
              <span className="mt-2 text-[11px] text-gray-500 dark:text-white/45">
                forks
              </span>
              <span className="text-[11px]">{formatNumber(forks)}</span>
            </div>

            {/* content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-extrabold text-gray-900 dark:text-white">
                    {name}
                  </h4>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-white/60">
                    {desc}
                  </p>
                </div>

                {/* right meta */}
                <div className="hidden sm:flex shrink-0 items-center gap-3 text-xs text-gray-500 dark:text-white/50">
                  <span className="inline-flex items-center gap-1">
                    <FiGitBranch className="h-4 w-4" />
                    {formatNumber(forks)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FiStar className="h-4 w-4" />
                    {formatNumber(stars)}
                  </span>
                </div>
              </div>

              {repo.topics?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {repo.topics.slice(0, 4).map((topic: string) => (
                    <Badge
                      key={topic}
                      variant="outline"
                      size="sm"
                      className="border-gray-200 text-gray-700 dark:border-white/10 dark:text-white/70"
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}

/* ---------------------------- Post Row ---------------------------- */

function PostRow({ post }: { post: any }) {
  return (
    <Card className="border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
      <CardBody className="p-0">
        <div className="flex gap-3 p-4">
          {/* left rail */}
          <div className="flex w-12 shrink-0 flex-col items-center justify-start rounded-xl bg-gray-50 py-2 text-xs font-semibold text-gray-600 dark:bg-white/[0.04] dark:text-white/60">
            <FiHeart className="h-4 w-4 text-red-500" />
            <span className="mt-1">{post.likesCount || 0}</span>
            <span className="mt-2 text-[11px] text-gray-500 dark:text-white/45">
              com
            </span>
            <span className="text-[11px]">{post.commentsCount || 0}</span>
          </div>

          {/* body */}
          <div className="min-w-0 flex-1">
            <p className="whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
              {post.content}
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 dark:text-white/45">
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1">
                  <FiHeart className="h-4 w-4" />
                  {post.likesCount || 0}
                </span>
                <span className="inline-flex items-center gap-1">
                  <FiMessageCircle className="h-4 w-4" />
                  {post.commentsCount || 0}
                </span>
              </div>
              <span>{formatRelativeTime(post.createdAt)}</span>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

/* ---------------------------- Review Row ---------------------------- */

function ReviewRow({ review }: { review: any }) {
  const rating = Number(review.rating) || 0;

  return (
    <Card className="border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
      <CardBody className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* stars */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <FiStar
                key={s}
                className={`h-4 w-4 ${
                  s <= Math.round(rating)
                    ? "text-yellow-400 fill-current"
                    : "text-gray-300 dark:text-white/20"
                }`}
              />
            ))}
            <span className="ml-2 text-xs font-semibold text-gray-600 dark:text-white/60">
              {rating.toFixed(1)}
            </span>
          </div>

          <span className="text-xs text-gray-400 dark:text-white/40">
            {formatRelativeTime(review.createdAt)}
          </span>
        </div>

        {review.title ? (
          <h4 className="mt-2 text-sm font-extrabold text-gray-900 dark:text-white">
            {review.title}
          </h4>
        ) : null}

        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-white/65">
          {review.content}
        </p>
      </CardBody>
    </Card>
  );
}
