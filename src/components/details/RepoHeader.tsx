/**
 * @file src/components/details/RepoHeader.tsx
 * @description Repository header (redesigned for dark / glass details page)
 */

"use client";

import { useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiGithub,
  FiExternalLink,
  FiStar,
  FiBookmark,
  FiShare2,
  FiArrowLeft,
} from "react-icons/fi";
import { Button, Badge } from "@/components/common";
import { useToast } from "@/contexts/ToastContext";

interface RepoHeaderProps {
  repo: {
    name: string;
    fullName: string;
    description: string | null;
    htmlUrl: string;
    ownerLogin: string;
    topics: string[];
  };
  avgRating: number;
  reviewCount: number;
  isPinned: boolean;
  onPin: () => void;
  isAuthenticated: boolean;
  isDeveloper: boolean;
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
        "shadow-[0_28px_120px_-90px_rgba(0,0,0,0.95)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export default function RepoHeader({
  repo,
  avgRating = 0,
  reviewCount = 0,
  isPinned = false,
  onPin,
  isAuthenticated = false,
  isDeveloper = false,
}: RepoHeaderProps) {
  const router = useRouter();
  const toast = useToast();

  const easeOut = useMemo(() => [0.16, 1, 0.3, 1] as const, []);

  const handleBack = () => {
    try {
      if (window.history.length > 1) router.back();
      else router.push("/search");
    } catch {
      router.push("/search");
    }
  };

  const handleShare = async () => {
    try {
      const url = window.location.href;

      if (navigator.share) {
        try {
          await navigator.share({
            title: repo.fullName || "Repository",
            text: repo.description || "Check out this repository on DevMatch",
            url,
          });
          return;
        } catch {
          // fallthrough
        }
      }

      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to share. Please copy the URL manually.");
    }
  };

  const handlePin = () => {
    try {
      onPin();
    } catch {
      toast.error("Failed to update pin status");
    }
  };

  const renderStars = (rating: number) => {
    const safe = Math.max(0, Math.min(5, Number(rating) || 0));
    const rounded = Math.round(safe);
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <FiStar
            key={i}
            className={[
              "h-4 w-4",
              i <= rounded ? "text-amber-300 fill-current" : "text-white/25",
            ].join(" ")}
          />
        ))}
      </div>
    );
  };

  const repoName = repo?.name || "Unknown Repository";
  const ownerLogin = repo?.ownerLogin || "unknown";
  const description = repo?.description;
  const topics = Array.isArray(repo?.topics) ? repo.topics : [];
  const htmlUrl =
    repo?.htmlUrl || `https://github.com/${ownerLogin}/${repoName}`;

  return (
    <header className="relative overflow-hidden bg-[#070A12]">
      {/* Ambient gradient / blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-56 -right-40 h-[560px] w-[560px] rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent" />
        <div className="absolute inset-0 [mask-image:radial-gradient(60%_60%_at_50%_10%,black,transparent)] bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="relative border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-10">
          {/* Back */}
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 text-sm transition"
          >
            <FiArrowLeft className="h-4 w-4" />
            Back to Search
          </button>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: easeOut }}
            className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start"
          >
            {/* Left */}
            <div className="min-w-0">
              {/* Breadcrumb-ish */}
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`https://github.com/${encodeURIComponent(ownerLogin)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition"
                >
                  {ownerLogin}
                </Link>
                <span className="text-white/35">/</span>
                <h1 className="text-2xl sm:text-3xl font-bold text-white break-words">
                  {repoName}
                </h1>
              </div>

              {/* Meta row */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70">
                  <FiGithub className="h-4 w-4 text-white/70" />
                  {repo.fullName || `${ownerLogin}/${repoName}`}
                </span>

                {reviewCount > 0 && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70">
                    {renderStars(avgRating)}
                    <span className="font-semibold text-white">
                      {Number(avgRating || 0).toFixed(1)}
                    </span>
                    <span className="text-white/55">
                      ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                    </span>
                  </span>
                )}
              </div>

              {/* Description */}
              {description && (
                <p className="mt-4 max-w-3xl text-sm sm:text-base leading-relaxed text-white/75">
                  {description}
                </p>
              )}

              {/* Topics */}
              {topics.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {topics.slice(0, 10).map((topic) => (
                    <Link
                      key={topic}
                      href={`/search?q=${encodeURIComponent(topic || "")}`}
                      className="transition-transform hover:scale-[1.02]"
                    >
                      <Badge
                        variant="primary"
                        size="sm"
                        className="bg-white/10 text-white border border-white/10 hover:bg-white/15"
                      >
                        {topic || "topic"}
                      </Badge>
                    </Link>
                  ))}
                  {topics.length > 10 && (
                    <Badge
                      variant="default"
                      size="sm"
                      className="bg-white/[0.06] text-white/70 border border-white/10"
                    >
                      +{topics.length - 10} more
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Right actions */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
              <GlassCard className="p-3 sm:p-4">
                <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
                  <a
                    href={htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <Button
                      variant="outline"
                      leftIcon={<FiGithub />}
                      className="border-white/15 text-white hover:bg-white/10"
                    >
                      View on GitHub
                      <FiExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </a>

                  {isAuthenticated && isDeveloper && (
                    <Button
                      variant={isPinned ? "primary" : "outline"}
                      leftIcon={
                        <FiBookmark
                          className={isPinned ? "fill-current" : ""}
                        />
                      }
                      onClick={handlePin}
                      className={
                        isPinned
                          ? "bg-white text-black hover:bg-white/90"
                          : "border-white/15 text-white hover:bg-white/10"
                      }
                    >
                      {isPinned ? "Pinned" : "Pin"}
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10"
                    onClick={handleShare}
                    title="Share this repository"
                  >
                    <FiShare2 className="w-5 h-5" />
                  </Button>
                </div>
              </GlassCard>

              {/* Small hint card */}
              <div className="hidden lg:block text-xs text-white/55 max-w-[260px] text-right">
                Pin repos that represent your best work. Don’t pin random stuff.
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
