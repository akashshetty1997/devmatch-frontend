/**
 * @file src/pages/feed.tsx
 * @description Social feed page with repo/job sharing
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

  // State
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Create post state
  const [newPostContent, setNewPostContent] = useState("");
  const [postType, setPostType] = useState<"TEXT" | "SHARE_REPO" | "SHARE_JOB">(
    "TEXT"
  );
  const [isPosting, setIsPosting] = useState(false);

  // Repo selection state
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [repoSearchQuery, setRepoSearchQuery] = useState("");
  const [repoResults, setRepoResults] = useState<RepoResult[]>([]);
  const [searchingRepos, setSearchingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<RepoResult | null>(null);

  // Job selection state
  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  // Infinite scroll ref
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch posts
  const fetchPosts = useCallback(
    async (pageNum: number, append = false) => {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const response = await postService.getFeed({
          page: pageNum,
          limit: 10,
        });
        const rawPosts = response.data?.data?.posts || [];

        // Map hasLiked to isLiked for frontend consistency
        const newPosts = rawPosts.map((post: any) => ({
          ...post,
          isLiked: post.hasLiked || false,
        }));

        if (append) {
          setPosts((prev) => [...prev, ...newPosts]);
        } else {
          setPosts(newPosts);
        }

        setHasMore(newPosts.length === 10);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
        error("Failed to load feed");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [error]
  );

  // Initial fetch
  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  // Infinite scroll
  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchPosts(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, loadingMore, hasMore, page, fetchPosts]);

  // Search repos
  const handleSearchRepos = async () => {
    console.log("Searching repos for query:", repoSearchQuery);
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

  // Select repo
  const handleSelectRepo = (repo: RepoResult) => {
    setSelectedRepo(repo);
    setPostType("SHARE_REPO");
    setShowRepoModal(false);
    setRepoSearchQuery("");
    setRepoResults([]);
  };

  // Clear selected repo
  const handleClearRepo = () => {
    setSelectedRepo(null);
    setPostType("TEXT");
  };

  // Create new post
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      error("Please enter some content");
      return;
    }

    // Validate repo selection for SHARE_REPO type
    if (postType === "SHARE_REPO" && !selectedRepo) {
      error("Please select a repository to share");
      return;
    }

    setIsPosting(true);
    try {
      const postData: any = {
        content: newPostContent,
        type: postType,
      };

      if (postType === "SHARE_REPO" && selectedRepo) {
        // Send both githubId and repoFullName for backend to create/find RepoSnapshot
        postData.githubId = selectedRepo.id;
        postData.repoFullName = selectedRepo.full_name;
      }
      if (postType === "SHARE_JOB" && selectedJob) {
        postData.jobPostId = selectedJob._id;
      }

      const response = await postService.createPost(postData);
      const newPost = response.data?.data || response.data;

      // Add new post to top of feed with isLiked = false
      setPosts((prev) => [{ ...newPost, isLiked: false }, ...prev]);

      // Reset form
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

  // Handle like
  const handleLike = async (postId: string) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent("/feed")}`);
      return;
    }

    try {
      const post = posts.find((p) => p._id === postId);
      if (!post) return;

      // Optimistic update
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? {
                ...p,
                isLiked: !p.isLiked,
                likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
              }
            : p
        )
      );

      if (post.isLiked) {
        await postService.unlikePost(postId);
      } else {
        await postService.likePost(postId);
      }
    } catch (err) {
      // Revert on error
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? {
                ...p,
                isLiked: !p.isLiked,
                likesCount: p.isLiked ? p.likesCount + 1 : p.likesCount - 1,
              }
            : p
        )
      );
      error("Failed to update like");
    }
  };

  // Handle delete post
  const handleDeletePost = async (postId: string) => {
    try {
      await postService.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      success("Post deleted");
    } catch (err) {
      error("Failed to delete post");
    }
  };

  // Handle comment count update
  const handleCommentAdded = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
      )
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Feed</h1>
        <p className="text-gray-600">
          See what developers and recruiters are sharing
        </p>
      </div>

      {/* Create Post */}
      {isAuthenticated && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex gap-3">
            {/* Avatar */}
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Input */}
            <div className="flex-1">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />

              {/* Selected Repo Preview */}
              {selectedRepo && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <Github size={16} />
                        {selectedRepo.full_name}
                      </div>
                      {selectedRepo.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {selectedRepo.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        {selectedRepo.language && (
                          <span className="flex items-center gap-1">
                            <Code size={10} />
                            {selectedRepo.language}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Star size={10} />
                          {selectedRepo.stargazers_count}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleClearRepo}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Selected Job Preview */}
              {selectedJob && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <Briefcase size={16} />
                        {selectedJob.title}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {selectedJob.companyName}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedJob(null);
                        setPostType("TEXT");
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowRepoModal(true)}
                    className={`p-2 rounded-lg transition-colors ${
                      selectedRepo
                        ? "bg-blue-100 text-blue-600"
                        : "hover:bg-gray-100 text-gray-500"
                    }`}
                    title="Share Repository"
                  >
                    <Github size={18} />
                  </button>
                  <button
                    onClick={() => setShowJobModal(true)}
                    className={`p-2 rounded-lg transition-colors ${
                      selectedJob
                        ? "bg-purple-100 text-purple-600"
                        : "hover:bg-gray-100 text-gray-500"
                    }`}
                    title="Share Job"
                  >
                    <Briefcase size={18} />
                  </button>
                </div>

                <button
                  onClick={handleCreatePost}
                  disabled={isPosting || !newPostContent.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isPosting ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Send size={16} />
                  )}
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Repo Selection Modal */}
      {showRepoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Select a Repository
              </h3>
              <button
                onClick={() => {
                  setShowRepoModal(false);
                  setRepoSearchQuery("");
                  setRepoResults([]);
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              {/* Search */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={repoSearchQuery}
                    onChange={(e) => setRepoSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearchRepos();
                      }
                    }}
                    placeholder="Search GitHub repositories..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={handleSearchRepos}
                  disabled={searchingRepos || !repoSearchQuery.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {searchingRepos ? <LoadingSpinner size="sm" /> : "Search"}
                </button>
              </div>

              {/* Results */}
              <div className="max-h-[50vh] overflow-y-auto space-y-2">
                {searchingRepos && (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="md" />
                  </div>
                )}

                {!searchingRepos &&
                  repoResults.length === 0 &&
                  repoSearchQuery && (
                    <p className="text-center text-gray-500 py-8">
                      No repositories found. Try a different search.
                    </p>
                  )}

                {!searchingRepos &&
                  repoResults.length === 0 &&
                  !repoSearchQuery && (
                    <p className="text-center text-gray-500 py-8">
                      Search for a GitHub repository to share
                    </p>
                  )}

                {repoResults.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => handleSelectRepo(repo)}
                    className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 font-medium text-gray-900">
                      <Github size={16} />
                      {repo.full_name}
                    </div>
                    {repo.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {repo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <Code size={12} />
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Star size={12} />
                        {repo.stargazers_count}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login prompt for anonymous users */}
      {!isAuthenticated && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800">
            <Link
              href="/login?redirect=/feed"
              className="font-medium hover:underline"
            >
              Login
            </Link>{" "}
            or{" "}
            <Link href="/register" className="font-medium hover:underline">
              register
            </Link>{" "}
            to create posts and interact with the community.
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Posts */}
      {!loading && (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUserId={user?.id}
              onLike={handleLike}
              onDelete={handleDeletePost}
              onCommentAdded={handleCommentAdded}
            />
          ))}

          {/* Load more trigger */}
          <div ref={loadMoreRef} className="h-10" />

          {/* Loading more indicator */}
          {loadingMore && (
            <div className="flex justify-center py-4">
              <LoadingSpinner size="md" />
            </div>
          )}

          {/* No more posts */}
          {!hasMore && posts.length > 0 && (
            <p className="text-center text-gray-500 py-4">
              You've reached the end of the feed
            </p>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && posts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <MessageCircle className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No posts yet
          </h3>
          <p className="text-gray-500">Be the first to share something!</p>
        </div>
      )}
    </div>
  );
};

// Post Card Component
interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
  onCommentAdded: (postId: string) => void;
}

const PostCard = ({
  post,
  currentUserId,
  onLike,
  onDelete,
  onCommentAdded,
}: PostCardProps) => {
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

  const isAuthor = currentUserId === post.author._id;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Load comments
  const loadComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }

    setShowComments(true);
    setLoadingComments(true);
    try {
      const response = await postService.getComments(post._id);
      const commentsData =
        response.data?.data?.comments ||
        response.data?.data ||
        response.data?.comments ||
        [];
      setComments(commentsData);
    } catch (err) {
      error("Failed to load comments");
    } finally {
      setLoadingComments(false);
    }
  };

  // Post comment
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

  // Handle like click
  const handleLikeClick = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent("/feed")}`);
      return;
    }
    onLike(post._id);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.author.username}`}>
            {post.author.avatar ? (
              <img
                src={post.author.avatar}
                alt={post.author.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {post.author.username.charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
          <div>
            <Link
              href={`/profile/${post.author.username}`}
              className="font-semibold text-gray-900 hover:text-blue-600"
            >
              @{post.author.username}
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{formatDate(post.createdAt)}</span>
              {post.type !== "TEXT" && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    {post.type === "SHARE_REPO" && (
                      <>
                        <Github size={12} />
                        Shared a repo
                      </>
                    )}
                    {post.type === "SHARE_JOB" && (
                      <>
                        <Briefcase size={12} />
                        Shared a job
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
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <MoreHorizontal size={18} className="text-gray-500" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50">
                <Bookmark size={14} />
                Save Post
              </button>
              {isAuthor && (
                <>
                  <button className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50">
                    <Edit size={14} />
                    Edit Post
                  </button>
                  <button
                    onClick={() => {
                      onDelete(post._id);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 text-red-600"
                  >
                    <Trash2 size={14} />
                    Delete Post
                  </button>
                </>
              )}
              {!isAuthor && (
                <button className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 text-red-600">
                  <Flag size={14} />
                  Report
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Shared Repo */}
      {post.type === "SHARE_REPO" && post.repo && (
        <div className="mx-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <a
                href={post.repo.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <Github size={16} />
                {post.repo.fullName}
                <ExternalLink size={12} />
              </a>
              {post.repo.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {post.repo.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                {post.repo.language && (
                  <span className="flex items-center gap-1">
                    <Code size={12} />
                    {post.repo.language}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Star size={12} />
                  {post.repo.stars}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shared Job */}
      {post.type === "SHARE_JOB" && post.jobPost && (
        <div className="mx-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <Link
            href={`/jobs/${post.jobPost._id}`}
            className="font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            <Briefcase size={16} />
            {post.jobPost.title}
          </Link>
          <p className="text-sm text-gray-600 mt-1">
            {post.jobPost.companyName}
          </p>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
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

      {/* Engagement Stats */}
      {(post.likesCount > 0 || post.commentsCount > 0) && (
        <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-4 text-sm text-gray-500">
          {post.likesCount > 0 && (
            <span className="flex items-center gap-1">
              <Heart size={14} className="text-red-500" fill="currentColor" />
              {post.likesCount}
            </span>
          )}
          {post.commentsCount > 0 && (
            <button onClick={loadComments} className="hover:underline">
              {post.commentsCount} comment{post.commentsCount !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-2">
        <button
          onClick={handleLikeClick}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
            post.isLiked
              ? "text-red-500 bg-red-50 hover:bg-red-100"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          <Heart size={18} fill={post.isLiked ? "currentColor" : "none"} />
          Like
        </button>
        <button
          onClick={loadComments}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
            showComments
              ? "text-blue-500 bg-blue-50"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          <MessageCircle size={18} />
          Comment
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-500 hover:bg-gray-100">
          <Share2 size={18} />
          Share
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          {/* Loading */}
          {loadingComments && (
            <div className="flex justify-center py-4">
              <LoadingSpinner size="sm" />
            </div>
          )}

          {/* Comments List */}
          {!loadingComments && comments.length > 0 && (
            <div className="space-y-3 mb-4">
              {comments.map((comment) => (
                <div key={comment._id} className="flex gap-2">
                  <Link href={`/profile/${comment.author.username}`}>
                    {comment.author.avatar ? (
                      <img
                        src={comment.author.avatar}
                        alt={comment.author.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                        {comment.author.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 bg-white rounded-lg px-3 py-2">
                    <Link
                      href={`/profile/${comment.author.username}`}
                      className="font-medium text-sm text-gray-900 hover:text-blue-600"
                    >
                      @{comment.author.username}
                    </Link>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                    <span className="text-xs text-gray-400">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No comments */}
          {!loadingComments && comments.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-2">
              No comments yet. Be the first to comment!
            </p>
          )}

          {/* Add Comment */}
          {isAuthenticated ? (
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handlePostComment();
                  }
                }}
              />
              <button
                onClick={handlePostComment}
                disabled={postingComment || !newComment.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {postingComment ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={() =>
                router.push(`/login?redirect=${encodeURIComponent("/feed")}`)
              }
              className="w-full mt-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
            >
              Login to comment
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Feed;
