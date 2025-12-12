/**
 * @file src/pages/feed.tsx
 * @description Reddit-style feed redesign (layout + cards + dark mode)
 */
"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { postService } from "@/services/postService";
import { githubService } from "@/services/githubService";
import LoadingSpinner from "@/components/common/Loading";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Send,
  Briefcase,
  Github,
  Trash2,
  Flag,
  Edit,
  X,
  Star,
  ExternalLink,
  Bookmark,
  Code,
  Search,
  Flame,
  Clock,
  TrendingUp,
} from "lucide-react";

interface Post {
  _id: string;
  author: {
    _id: string;
    username: string;
    avatar: string | null;
    role: string;
  };
  content: string;
  type: "TEXT" | "SHARE_REPO" | "SHARE_JOB";
  repo?: {
    _id: string;
    name: string;
    fullName: string;
    description: string;
    stars: number;
    language: string;
    htmlUrl: string;
  };
  jobPost?: {
    _id: string;
    title: string;
    companyName: string;
    location: { city?: string; country?: string };
    workType: string;
  };
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  createdAt: string;
}

interface Comment {
  _id: string;
  author: {
    _id: string;
    username: string;
    avatar: string | null;
  };
  content: string;
  createdAt: string;
}

interface RepoResult {
  id: number;
  name: string;
  full_name: string;
  description: string;
  stargazers_count: number;
  language: string;
  html_url: string;
}

const Feed = () => {
  const { user, isAuthenticated } = useAuth();
  const { success, error } = useToast();
  const router = useRouter();

  const currentUserId = (user as any)?._id ?? (user as any)?.id;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const [newPostContent, setNewPostContent] = useState("");
  const [postType, setPostType] = useState<"TEXT" | "SHARE_REPO" | "SHARE_JOB">(
    "TEXT"
  );
  const [isPosting, setIsPosting] = useState(false);

  const [showRepoModal, setShowRepoModal] = useState(false);
  const [repoSearchQuery, setRepoSearchQuery] = useState("");
  const [repoResults, setRepoResults] = useState<RepoResult[]>([]);
  const [searchingRepos, setSearchingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<RepoResult | null>(null);

  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const [sortUi, setSortUi] = useState<"hot" | "new" | "top">("hot");
  const sortPills = useMemo(
    () => [
      { id: "hot" as const, label: "Hot", icon: Flame },
      { id: "new" as const, label: "New", icon: Clock },
      { id: "top" as const, label: "Top", icon: TrendingUp },
    ],
    []
  );

  const fetchPosts = useCallback(
    async (pageNum: number, append = false) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const response = await postService.getFeed({
          page: pageNum,
          limit: 10,
          sort: sortUi, // backend can ignore if unsupported
        });

        const rawPosts = response.data?.data?.posts || [];
        const newPosts = rawPosts.map((post: any) => ({
          ...post,
          isLiked: post.hasLiked || post.isLiked || false,
        }));

        setPosts((prev) => (append ? [...prev, ...newPosts] : newPosts));
        setHasMore(newPosts.length === 10);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
        error("Failed to load feed");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [error, sortUi]
  );

  // initial + sort change refresh
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchPosts(1, false);
  }, [fetchPosts]);

  // infinite scroll
  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;

    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (!hasMore || loadingMore) return;

        setPage((prev) => {
          const nextPage = prev + 1;
          fetchPosts(nextPage, true);
          return nextPage;
        });
      },
      { threshold: 0.15 }
    );

    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);

    return () => observerRef.current?.disconnect();
  }, [loading, loadingMore, hasMore, fetchPosts]);

  const handleSearchRepos = async () => {
    if (!repoSearchQuery.trim()) return;
    setSearchingRepos(true);
    try {
      const response = await githubService.searchRepos({ q: repoSearchQuery });
      const repos = response.data?.data?.items || response.data?.items || [];
      setRepoResults(repos);
    } catch (err) {
      error("Failed to search repositories");
    } finally {
      setSearchingRepos(false);
    }
  };

  const handleSelectRepo = (repo: RepoResult) => {
    setSelectedRepo(repo);
    setPostType("SHARE_REPO");
    setShowRepoModal(false);
    setRepoSearchQuery("");
    setRepoResults([]);
  };

  const handleClearRepo = () => {
    setSelectedRepo(null);
    setPostType("TEXT");
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return error("Please enter some content");
    if (postType === "SHARE_REPO" && !selectedRepo)
      return error("Please select a repository to share");

    setIsPosting(true);
    try {
      const postData: any = { content: newPostContent, type: postType };

      if (postType === "SHARE_REPO" && selectedRepo) {
        postData.githubId = selectedRepo.id;
        postData.repoFullName = selectedRepo.full_name;
      }
      if (postType === "SHARE_JOB" && selectedJob) postData.jobPostId = selectedJob._id;

      const response = await postService.createPost(postData);
      const newPost = response.data?.data || response.data;

      setPosts((prev) => [{ ...newPost, isLiked: false }, ...prev]);

      setNewPostContent("");
      setPostType("TEXT");
      setSelectedRepo(null);
      setSelectedJob(null);

      success("Post created successfully");
    } catch (err: any) {
      error(err.response?.data?.message || "Failed to create post");
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent("/feed")}`);
      return;
    }

    const existing = posts.find((p) => p._id === postId);
    if (!existing) return;

    const oldLiked = !!existing.isLiked;
    const oldLikes = existing.likesCount;

    // optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId
          ? {
              ...p,
              isLiked: !oldLiked,
              likesCount: oldLiked ? oldLikes - 1 : oldLikes + 1,
            }
          : p
      )
    );

    try {
      if (oldLiked) await postService.unlikePost(postId);
      else await postService.likePost(postId);
    } catch (err) {
      // revert to exact previous state (your old code was wrong here)
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ? { ...p, isLiked: oldLiked, likesCount: oldLikes } : p
        )
      );
      error("Failed to update like");
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await postService.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      success("Post deleted");
    } catch (err) {
      error("Failed to delete post");
    }
  };

  const handleCommentAdded = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#0b0f14] dark:text-white">
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        {/* Left gutter */}
        <div className="hidden lg:block lg:w-56">
          <div className="sticky top-6 space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                Home
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-white/55">
                Your personal DevMatch feed.
              </p>

              {!isAuthenticated ? (
                <div className="mt-4 space-y-2">
                  <Link
                    href="/login?redirect=/feed"
                    className="block rounded-xl bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="block rounded-xl border border-gray-200 px-3 py-2 text-center text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-white/10 dark:text-white dark:hover:bg-white/[0.06]"
                  >
                    Sign up
                  </Link>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  <Link
                    href={`/profile/${user?.username}`}
                    className="block rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-white/10 dark:text-white dark:hover:bg-white/[0.06]"
                  >
                    View profile
                  </Link>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                Tips
              </div>
              <ul className="mt-2 space-y-2 text-xs text-gray-600 dark:text-white/60">
                <li>• Share repos with context (what problem it solves).</li>
                <li>• Keep posts short. Add links in the repo card.</li>
                <li>• Use comments for discussion, not essays.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main column */}
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Feed</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-white/55">
                What developers and recruiters are sharing
              </p>
            </div>

            <div className="hidden items-center gap-2 rounded-2xl border border-gray-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:flex">
              {sortPills.map((p) => {
                const Icon = p.icon;
                const active = sortUi === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSortUi(p.id)}
                    className={[
                      "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                      active
                        ? "bg-gray-900 text-white dark:bg-white dark:text-black"
                        : "text-gray-600 hover:bg-gray-50 dark:text-white/60 dark:hover:bg-white/[0.06]",
                    ].join(" ")}
                  >
                    <Icon size={16} />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Create Post */}
          {isAuthenticated && (
            <div className="mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex gap-3 p-4">
                <Link href={`/profile/${user?.username}`} className="shrink-0">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Create post"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/35"
                  />

                  {selectedRepo && (
                    <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                            <Github
                              size={16}
                              className="flex-shrink-0 text-gray-500 dark:text-white/60"
                            />
                            <span className="truncate">{selectedRepo.full_name}</span>
                          </div>
                          {selectedRepo.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-white/60">
                              {selectedRepo.description}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-white/55">
                            {selectedRepo.language && (
                              <span className="inline-flex items-center gap-1">
                                <Code size={12} />
                                {selectedRepo.language}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <Star size={12} />
                              {selectedRepo.stargazers_count}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={handleClearRepo}
                          className="flex-shrink-0 rounded-lg p-1 text-gray-400 hover:bg-white hover:text-gray-700 dark:hover:bg-white/[0.06] dark:hover:text-white"
                          title="Remove repo"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedJob && (
                    <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                            <Briefcase
                              size={16}
                              className="flex-shrink-0 text-gray-500 dark:text-white/60"
                            />
                            <span className="truncate">{selectedJob.title}</span>
                          </div>
                          <p className="mt-1 text-xs text-gray-600 dark:text-white/60">
                            {selectedJob.companyName}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedJob(null);
                            setPostType("TEXT");
                          }}
                          className="flex-shrink-0 rounded-lg p-1 text-gray-400 hover:bg-white hover:text-gray-700 dark:hover:bg-white/[0.06] dark:hover:text-white"
                          title="Remove job"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowRepoModal(true)}
                        className={[
                          "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
                          selectedRepo
                            ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.02] dark:text-white/80 dark:hover:bg-white/[0.06]",
                        ].join(" ")}
                      >
                        <Github size={16} />
                        Share repo
                      </button>

                      <button
                        onClick={() => setShowJobModal(true)}
                        className={[
                          "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
                          selectedJob
                            ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-500/40 dark:bg-purple-500/10 dark:text-purple-200"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.02] dark:text-white/80 dark:hover:bg-white/[0.06]",
                        ].join(" ")}
                      >
                        <Briefcase size={16} />
                        Share job
                      </button>
                    </div>

                    <button
                      onClick={handleCreatePost}
                      disabled={isPosting || !newPostContent.trim()}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isPosting ? <LoadingSpinner size="sm" /> : <Send size={16} />}
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isAuthenticated && (
            <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
              <Link href="/login?redirect=/feed" className="font-semibold hover:underline">
                Login
              </Link>{" "}
              or{" "}
              <Link href="/register" className="font-semibold hover:underline">
                register
              </Link>{" "}
              to create posts and interact with the community.
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {!loading && (
            <div className="space-y-3">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUserId={currentUserId}
                  onLike={handleLike}
                  onDelete={handleDeletePost}
                  onCommentAdded={handleCommentAdded}
                />
              ))}

              <div ref={loadMoreRef} className="h-10" />

              {loadingMore && (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="md" />
                </div>
              )}

              {!hasMore && posts.length > 0 && (
                <p className="py-6 text-center text-sm text-gray-500 dark:text-white/50">
                  You&apos;ve reached the end of the feed
                </p>
              )}
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <MessageCircle className="mx-auto mb-4 text-gray-300 dark:text-white/15" size={56} />
              <h3 className="text-lg font-semibold">No posts yet</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-white/55">
                Be the first to share something.
              </p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="hidden xl:block xl:w-72">
          <div className="sticky top-6 space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <div className="text-sm font-semibold">Community</div>
              <p className="mt-1 text-xs text-gray-500 dark:text-white/55">
                Keep it useful. Explain why you shared a repo/job.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="text-xs text-gray-500 dark:text-white/55">Posts</div>
                  <div className="mt-1 text-lg font-semibold">{posts.length}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="text-xs text-gray-500 dark:text-white/55">Sort</div>
                  <div className="mt-1 text-lg font-semibold capitalize">{sortUi}</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <div className="text-sm font-semibold">Quick actions</div>
              <div className="mt-3 space-y-2">
                <Link
                  href="/search"
                  className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-white/10 dark:text-white dark:hover:bg-white/[0.06]"
                >
                  Explore repos
                  <ExternalLink size={16} className="text-gray-400 dark:text-white/40" />
                </Link>
                <Link
                  href="/jobs"
                  className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-white/10 dark:text-white dark:hover:bg-white/[0.06]"
                >
                  Browse jobs
                  <ExternalLink size={16} className="text-gray-400 dark:text-white/40" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Repo Modal */}
      {showRepoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0f1620]">
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-white/10">
              <div>
                <h3 className="text-base font-semibold">Select a repository</h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-white/55">
                  Search GitHub and attach a repo card to your post.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowRepoModal(false);
                  setRepoSearchQuery("");
                  setRepoResults([]);
                }}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-white/[0.06] dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/35"
                    size={16}
                  />
                  <input
                    type="text"
                    value={repoSearchQuery}
                    onChange={(e) => setRepoSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchRepos()}
                    placeholder="e.g., nextjs, react-query, shadcn"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/35"
                  />
                </div>
                <button
                  onClick={handleSearchRepos}
                  disabled={searchingRepos || !repoSearchQuery.trim()}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {searchingRepos ? <LoadingSpinner size="sm" /> : "Search"}
                </button>
              </div>

              <div className="mt-4 max-h-[55vh] space-y-2 overflow-y-auto pr-1">
                {searchingRepos && (
                  <div className="flex justify-center py-10">
                    <LoadingSpinner size="md" />
                  </div>
                )}

                {!searchingRepos && repoResults.length === 0 && (
                  <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-white/10 dark:text-white/55">
                    {repoSearchQuery ? "No repositories found." : "Search to see results."}
                  </div>
                )}

                {repoResults.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => handleSelectRepo(repo)}
                    className="w-full rounded-xl border border-gray-200 bg-white p-3 text-left hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.02] dark:hover:bg-white/[0.06]"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Github size={16} className="flex-shrink-0 text-gray-500 dark:text-white/60" />
                      <span className="truncate">{repo.full_name}</span>
                    </div>
                    {repo.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-white/60">
                        {repo.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-white/55">
                      {repo.language && (
                        <span className="inline-flex items-center gap-1">
                          <Code size={12} /> {repo.language}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Star size={12} /> {repo.stargazers_count}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Modal */}
      {showJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0f1620]">
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-white/10">
              <h3 className="text-base font-semibold">Select a job</h3>
              <button
                onClick={() => setShowJobModal(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-white/[0.06] dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 text-sm text-gray-600 dark:text-white/60">
              Hook this modal to your jobs list. For now, it&apos;s a UI shell.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------- Post Card -------------------------------- */

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
  onCommentAdded: (postId: string) => void;
}

const PostCard = ({ post, currentUserId, onLike, onDelete, onCommentAdded }: PostCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const { error } = useToast();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  const isAuthor = !!currentUserId && currentUserId === post.author._id;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const loadComments = async () => {
    if (showComments) return setShowComments(false);

    setShowComments(true);
    setLoadingComments(true);
    try {
      const response = await postService.getComments(post._id);
      const commentsData =
        response.data?.data?.comments || response.data?.data || response.data?.comments || [];
      setComments(commentsData);
    } catch (err) {
      error("Failed to load comments");
    } finally {
      setLoadingComments(false);
    }
  };

  const handlePostComment = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent("/feed")}`);
      return;
    }
    if (!newComment.trim()) return;

    setPostingComment(true);
    try {
      const response = await postService.addComment(post._id, newComment);
      const newCommentData = response.data?.data || response.data;
      setComments((prev) => [...prev, newCommentData]);
      setNewComment("");
      onCommentAdded(post._id);
    } catch (err) {
      error("Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  };

  const handleLikeClick = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent("/feed")}`);
      return;
    }
    onLike(post._id);
  };

  const score = post.likesCount;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-colors hover:bg-gray-50/40 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]">
      <div className="flex">
        {/* Vote rail */}
        <div className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-gray-100 bg-gray-50 py-3 dark:border-white/10 dark:bg-white/[0.02]">
          <button
            onClick={handleLikeClick}
            className={[
              "rounded-lg p-1 transition-colors",
              post.isLiked
                ? "text-rose-600 dark:text-rose-400"
                : "text-gray-400 hover:bg-white hover:text-gray-600 dark:text-white/35 dark:hover:bg-white/[0.06] dark:hover:text-white/70",
            ].join(" ")}
            title="Upvote"
          >
            <Heart size={18} fill={post.isLiked ? "currentColor" : "none"} />
          </button>

          <div className="text-xs font-bold text-gray-700 dark:text-white/80">{score}</div>

          <div className="h-6 w-px bg-gray-200 dark:bg-white/10" />

          <button
            onClick={loadComments}
            className="rounded-lg p-1 text-gray-400 hover:bg-white hover:text-gray-600 dark:text-white/35 dark:hover:bg-white/[0.06] dark:hover:text-white/70"
            title="Comments"
          >
            <MessageCircle size={18} />
          </button>
        </div>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          {/* Meta header */}
          <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-3">
            <div className="flex min-w-0 items-center gap-2">
              <Link href={`/profile/${post.author.username}`} className="shrink-0">
                {post.author.avatar ? (
                  <img
                    src={post.author.avatar}
                    alt={post.author.username}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white">
                    {post.author.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-white/55">
                  <Link
                    href={`/profile/${post.author.username}`}
                    className="font-semibold text-gray-900 hover:underline dark:text-white"
                  >
                    @{post.author.username}
                  </Link>
                  <span>•</span>
                  <span>{formatDate(post.createdAt)}</span>

                  {post.type !== "TEXT" && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        {post.type === "SHARE_REPO" ? (
                          <>
                            <Github size={12} /> repo
                          </>
                        ) : (
                          <>
                            <Briefcase size={12} /> job
                          </>
                        )}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-white/35 dark:hover:bg-white/[0.06] dark:hover:text-white"
              >
                <MoreHorizontal size={18} />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-white/10 dark:bg-[#0f1620]">
                  <button className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-white/[0.06]">
                    <Bookmark size={14} />
                    Save
                  </button>

                  {isAuthor ? (
                    <>
                      <button className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-white/[0.06]">
                        <Edit size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          onDelete(post._id);
                          setShowMenu(false);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-rose-600 hover:bg-gray-50 dark:text-rose-400 dark:hover:bg-white/[0.06]"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </>
                  ) : (
                    <button className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-rose-600 hover:bg-gray-50 dark:text-rose-400 dark:hover:bg-white/[0.06]">
                      <Flag size={14} />
                      Report
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="px-4 pb-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900 dark:text-white">
              {post.content}
            </p>
          </div>

          {/* Repo Attachment (FIXED: broken anchor + encoded internal route) */}
          {post.type === "SHARE_REPO" && post.repo && (
            <div className="mx-4 mb-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/details/${encodeURIComponent(post.repo.fullName)}`}
                      className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-blue-700 hover:underline dark:text-blue-300"
                    >
                      <Github size={16} className="flex-shrink-0" />
                      <span className="truncate">{post.repo.fullName}</span>
                    </Link>

                    <a
                      href={`https://github.com/${post.repo.fullName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 rounded-lg p-1 text-gray-400 hover:bg-white hover:text-gray-600 dark:hover:bg-white/[0.06] dark:hover:text-white"
                      title="Open on GitHub"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>

                  {post.repo.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-white/60">
                      {post.repo.description}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-white/55">
                    {post.repo.language && (
                      <span className="inline-flex items-center gap-1">
                        <Code size={12} /> {post.repo.language}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Star size={12} /> {post.repo.stars}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Job Attachment */}
          {post.type === "SHARE_JOB" && post.jobPost && (
            <div className="mx-4 mb-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <Link
                href={`/jobs/${post.jobPost._id}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline dark:text-blue-300"
              >
                <Briefcase size={16} className="flex-shrink-0" />
                <span className="truncate">{post.jobPost.title}</span>
              </Link>
              <p className="mt-1 text-xs text-gray-600 dark:text-white/60">{post.jobPost.companyName}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-white/55">
                <span>{post.jobPost.workType}</span>
                {post.jobPost.location?.city && (
                  <>
                    <span>•</span>
                    <span>{post.jobPost.location.city}</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2 text-xs text-gray-500 dark:border-white/10 dark:text-white/55">
            <div className="flex items-center gap-2">
              <button
                onClick={handleLikeClick}
                className={[
                  "inline-flex items-center gap-2 rounded-xl px-3 py-2 font-semibold transition-colors",
                  post.isLiked
                    ? "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300"
                    : "hover:bg-gray-100 dark:hover:bg-white/[0.06]",
                ].join(" ")}
              >
                <Heart size={16} fill={post.isLiked ? "currentColor" : "none"} />
                Like
              </button>

              <button
                onClick={loadComments}
                className={[
                  "inline-flex items-center gap-2 rounded-xl px-3 py-2 font-semibold transition-colors",
                  showComments
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200"
                    : "hover:bg-gray-100 dark:hover:bg-white/[0.06]",
                ].join(" ")}
              >
                <MessageCircle size={16} />
                Comment
              </button>

              <button className="inline-flex items-center gap-2 rounded-xl px-3 py-2 font-semibold hover:bg-gray-100 dark:hover:bg-white/[0.06]">
                <Share2 size={16} />
                Share
              </button>
            </div>

            <div className="flex items-center gap-3">
              {post.commentsCount > 0 && (
                <button onClick={loadComments} className="hover:underline">
                  {post.commentsCount} comment{post.commentsCount !== 1 ? "s" : ""}
                </button>
              )}
            </div>
          </div>

          {/* Comments */}
          {showComments && (
            <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.02]">
              {loadingComments && (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              )}

              {!loadingComments && comments.length > 0 && (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment._id} className="flex gap-2">
                      <Link href={`/profile/${comment.author.username}`} className="shrink-0">
                        {comment.author.avatar ? (
                          <img
                            src={comment.author.avatar}
                            alt={comment.author.username}
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-[10px] font-bold text-white">
                            {comment.author.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </Link>

                      <div className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            href={`/profile/${comment.author.username}`}
                            className="truncate text-xs font-semibold text-gray-900 hover:underline dark:text-white"
                          >
                            @{comment.author.username}
                          </Link>
                          <span className="shrink-0 text-[11px] text-gray-400 dark:text-white/40">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-700 dark:text-white/75">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loadingComments && comments.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500 dark:border-white/10 dark:text-white/55">
                  No comments yet.
                </div>
              )}

              <div className="mt-3 flex gap-2">
                {isAuthenticated ? (
                  <>
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment…"
                      className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder:text-white/35"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handlePostComment();
                        }
                      }}
                    />
                    <button
                      onClick={handlePostComment}
                      disabled={postingComment || !newComment.trim()}
                      className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                      title="Send"
                    >
                      {postingComment ? <LoadingSpinner size="sm" /> : <Send size={16} />}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => router.push(`/login?redirect=${encodeURIComponent("/feed")}`)}
                    className="w-full rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200"
                  >
                    Log in to comment
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Feed;
