/**
 * @file src/components/details/DetailsContainer.tsx
 * @description Main container for repo details page (redesigned: dark + glass + smooth motion)
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { githubAPI, reviewAPINew, developerAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoading } from "@/components/common";
import RepoHeader from "./RepoHeader";
import RepoStats from "./RepoStats";
import RepoReadme from "./RepoReadme";
import RepoReviews from "./RepoReviews";
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
  reviewer: {
    _id: string;
    username: string;
    avatar: string | null;
  };
  createdAt: string;
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-md",
        "shadow-[0_30px_120px_-80px_rgba(0,0,0,0.95)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function GradientBg() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -top-28 left-[8%] h-80 w-80 rounded-full bg-sky-500/12 blur-3xl" />
      <div className="absolute -top-32 right-[10%] h-80 w-80 rounded-full bg-fuchsia-500/12 blur-3xl" />
      <div className="absolute top-56 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:28px_28px] opacity-35" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#070A12]/30 to-[#070A12]" />
    </div>
  );
}

export default function DetailsContainer({ repoId }: { repoId: string }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [repo, setRepo] = useState<RepoData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"readme" | "reviews">("readme");
  const [isPinned, setIsPinned] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);

  const easeOut = useMemo(() => [0.16, 1, 0.3, 1] as const, []);

  // Fetch repo data
  useEffect(() => {
    const fetchData = async () => {
      if (!repoId) {
        setError("Repository ID is required");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let repoData: any;

        if (repoId.includes("/")) {
          const repoResponse = await githubAPI.getRepoByFullName(repoId);
          repoData = repoResponse.data?.data || repoResponse.data;
        } else {
          const repoResponse = await githubAPI.getRepo(repoId);
          repoData = repoResponse.data?.data || repoResponse.data;
        }

        if (!repoData) throw new Error("Repository not found");

        const mappedData: RepoData = {
          _id: repoData._id || "",
          githubId: repoData.githubId || repoData.id || 0,
          name: repoData.name || "",
          fullName: repoData.fullName || repoData.full_name || "",
          description: repoData.description || null,
          htmlUrl: repoData.htmlUrl || repoData.html_url || "",
          cloneUrl: repoData.cloneUrl || repoData.clone_url || "",
          language: repoData.language || null,
          languages: Array.isArray(repoData.languages)
            ? repoData.languages
            : [],
          stars: Number(repoData.stars || repoData.stargazers_count) || 0,
          forks: Number(repoData.forks || repoData.forks_count) || 0,
          watchers: Number(repoData.watchers || repoData.watchers_count) || 0,
          openIssues:
            Number(repoData.openIssues || repoData.open_issues_count) || 0,
          topics: Array.isArray(repoData.topics) ? repoData.topics : [],
          license:
            typeof repoData.license === "object"
              ? repoData.license?.name || repoData.license?.spdx_id || null
              : repoData.license || null,
          defaultBranch:
            repoData.defaultBranch || repoData.default_branch || "main",
          ownerLogin: repoData.ownerLogin || repoData.owner?.login || "",
          readme: repoData.readme || null,
          aiSummary: repoData.aiSummary || null,
          aiTechStack: Array.isArray(repoData.aiTechStack)
            ? repoData.aiTechStack
            : [],
          githubCreatedAt:
            repoData.githubCreatedAt || repoData.created_at || "",
          githubUpdatedAt:
            repoData.githubUpdatedAt || repoData.updated_at || "",
          lastSyncedAt: repoData.lastSyncedAt || new Date().toISOString(),
        };

        const isValidMongoId =
          mappedData._id &&
          mappedData._id.length === 24 &&
          /^[a-f0-9]+$/i.test(mappedData._id);

        // Fetch README if not included
        if (!mappedData.readme && mappedData._id && isValidMongoId) {
          try {
            const readmeResponse = await githubAPI.getReadme(mappedData._id);
            const readmeData = readmeResponse.data?.data || readmeResponse.data;
            mappedData.readme =
              readmeData?.readme || readmeData?.content || null;
          } catch {
            // ignore
          }
        }

        setRepo(mappedData);

        // Fetch reviews
        if (isValidMongoId) {
          try {
            const reviewsResponse = await reviewAPINew.getByRepo(
              mappedData._id
            );
            const reviewsData =
              reviewsResponse.data?.data?.reviews ||
              reviewsResponse.data?.data ||
              [];

            const mappedReviews = Array.isArray(reviewsData)
              ? reviewsData.map((r: any) => ({
                  ...r,
                  reviewer: r.reviewer || r.author || null,
                }))
              : [];

            setReviews(mappedReviews);

            if (user && mappedReviews.length > 0) {
              const existingReview = mappedReviews.find(
                (r: Review) => r.reviewer?._id === user.id
              );
              setUserReview(existingReview || null);
            }
          } catch (reviewError) {
            console.log("Error fetching reviews:", reviewError);
            setReviews([]);
          }

          // Check if repo is pinned (only for authenticated developers)
          if (isAuthenticated && user?.role === "DEVELOPER") {
            try {
              const pinnedResponse = await developerAPI.getPinnedRepos(
                user.username
              );
              const pinnedRepos = pinnedResponse.data?.data?.pinnedRepos || [];
              const isRepoPinned = pinnedRepos.some(
                (r: any) => r._id === mappedData._id
              );
              setIsPinned(isRepoPinned);
            } catch (pinnedError) {
              console.log("Error checking pinned status:", pinnedError);
            }
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch repo details:", err);
        let errorMessage = "Failed to load repository";

        if (err.response?.status === 404) {
          errorMessage = "Repository not found";
          toast.error("Repository not found");
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [repoId, user, isAuthenticated]);

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

    const mongoId = repo?._id;
    if (!mongoId || mongoId.length !== 24) {
      toast.error("Cannot submit review - invalid repository ID");
      throw new Error("Invalid repository ID");
    }

    const response = await reviewAPINew.createForRepo(mongoId, data);
    const newReview = response.data?.data || response.data;

    const mappedReview = {
      ...newReview,
      reviewer: newReview.reviewer || newReview.author || null,
    };

    setReviews((prev) => [mappedReview, ...prev]);
    setUserReview(mappedReview);
    toast.success("Review submitted!");
  };

  // Handle review update
  const handleReviewUpdate = async (
    reviewId: string,
    data: { rating: number; title: string; content: string }
  ) => {
    const response = await reviewAPINew.update(reviewId, data);
    const updatedReview = response.data?.data || response.data;

    const mappedReview = {
      ...updatedReview,
      reviewer: updatedReview.reviewer || updatedReview.author || null,
    };

    setReviews((prev) =>
      prev.map((r) => (r._id === reviewId ? mappedReview : r))
    );
    setUserReview(mappedReview);
    toast.success("Review updated!");
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

  // Handle pin repo
  const handlePinRepo = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/details/${encodeURIComponent(repoId)}`);
      return;
    }

    if (user?.role !== "DEVELOPER") {
      toast.error("Only developers can pin repositories");
      return;
    }

    const mongoId = repo?._id;
    if (!mongoId || mongoId.length !== 24) {
      toast.error("Cannot pin - invalid repository ID");
      return;
    }

    try {
      if (isPinned) {
        await developerAPI.unpinRepo(mongoId);
        setIsPinned(false);
        toast.success("Unpinned from profile");
      } else {
        await developerAPI.pinRepo(mongoId);
        setIsPinned(true);
        toast.success("Pinned to profile!");
      }
    } catch (err: any) {
      console.error("Pin/unpin error:", err);
      const message =
        err.response?.data?.message || "Failed to update pin status";
      toast.error(message);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/search");
    }
  };

  if (loading) {
    // Keep your existing PageLoading behavior, but put it on the dark canvas
    return (
      <div className="relative min-h-screen bg-[#070A12] text-white">
        <GradientBg />
        <div className="relative">
          <PageLoading />
        </div>
      </div>
    );
  }

  if (error || !repo) {
    return (
      <div className="relative min-h-screen bg-[#070A12] text-white">
        <GradientBg />
        <div className="relative mx-auto max-w-7xl px-4 py-14">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: easeOut }}
            className="mx-auto max-w-xl"
          >
            <GlassCard className="p-8">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">
                  🔍
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white">
                    Repository Not Found
                  </h2>
                  <p className="mt-1 text-sm text-white/70">
                    {error ||
                      "This repository does not exist or could not be loaded."}
                  </p>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleBack}
                      className="inline-flex items-center justify-center rounded-xl bg-white text-[#0B1020] px-4 py-2.5 font-semibold hover:bg-white/90 transition"
                    >
                      Back to Search
                    </button>

                    <button
                      onClick={() => router.push("/search")}
                      className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 font-semibold text-white hover:bg-white/10 transition"
                    >
                      Go to Search
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    );
  }

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) /
        reviews.length
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className="relative min-h-screen bg-[#070A12] text-white"
    >
      <GradientBg />

      {/* Header (kept as-is; if this component is still light-themed, you must restyle RepoHeader too) */}
      <div className="relative">
        <RepoHeader
          repo={repo}
          avgRating={avgRating}
          reviewCount={reviews.length}
          isPinned={isPinned}
          onPin={handlePinRepo}
          isAuthenticated={isAuthenticated}
          isDeveloper={user?.role === "DEVELOPER"}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            <GlassCard className="p-5 sm:p-6">
              <RepoStats repo={repo} />
            </GlassCard>

            {/* Tabs */}
            <div className="sticky top-[72px] z-20">
              <GlassCard className="p-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveTab("readme")}
                    className={[
                      "rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
                      activeTab === "readme"
                        ? "bg-white text-[#0B1020]"
                        : "bg-white/5 text-white/75 hover:bg-white/10",
                    ].join(" ")}
                  >
                    README
                  </button>
                  <button
                    onClick={() => setActiveTab("reviews")}
                    className={[
                      "rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
                      activeTab === "reviews"
                        ? "bg-white text-[#0B1020]"
                        : "bg-white/5 text-white/75 hover:bg-white/10",
                    ].join(" ")}
                  >
                    Reviews ({reviews.length})
                  </button>
                </div>
              </GlassCard>
            </div>

            {/* Tab content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: easeOut }}
            >
              <GlassCard className="p-5 sm:p-6">
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
              </GlassCard>
            </motion.div>
          </div>

          {/* Right */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-[96px]">
              <GlassCard className="p-5 sm:p-6">
                <RepoSidebar repo={repo} />
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
