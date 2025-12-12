/**
 * @file src/components/details/RepoComments.tsx
 * @description Repository comments section (redesigned for dark/glass details page)
 */

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FiSend, FiTrash2, FiUser, FiMessageCircle } from "react-icons/fi";
import { Avatar, Button, Textarea } from "@/components/common";
import { formatRelativeTime } from "@/lib/utils";

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

interface RepoCommentsProps {
  comments: Comment[];
  isAuthenticated: boolean;
  currentUserId?: string;
  onSubmit: (content: string) => Promise<void>;
  onDelete: (commentId: string) => void;
}

function GlassPanel({
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

function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-11 w-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
      {children}
    </div>
  );
}

export default function RepoComments({
  comments,
  isAuthenticated,
  currentUserId,
  onSubmit,
  onDelete,
}: RepoCommentsProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const easeOut = useMemo(() => [0.16, 1, 0.3, 1] as const, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconBadge>
            <FiMessageCircle className="h-5 w-5 text-white/80" />
          </IconBadge>
          <div>
            <h3 className="text-base font-semibold text-white">Discussion</h3>
            <p className="text-xs text-white/60">
              {comments.length} comment{comments.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* subtle hint */}
        <div className="hidden sm:block text-xs text-white/50">
          Keep it useful. No fluff.
        </div>
      </div>

      {/* Comment Form */}
      {isAuthenticated ? (
        <GlassPanel className="p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* If your shared Textarea component forces light styles, this wrapper still helps,
                but best fix is updating Textarea to accept className or dark variants globally. */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share a concrete insight, question, or issue…"
                rows={3}
                className={
                  // this prop must exist in your Textarea component; if it doesn't, add it there
                  "w-full bg-transparent text-white placeholder:text-white/40 border-0 focus:ring-0"
                }
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-white/50">
                {content.trim().length > 0 ? (
                  <span>{content.trim().length} chars</span>
                ) : (
                  <span>Be specific. Examples help.</span>
                )}
              </div>

              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={!content.trim()}
                leftIcon={<FiSend />}
                className={
                  // this prop must exist in your Button component; if it doesn't, ignore/remove
                  "rounded-xl"
                }
              >
                Post
              </Button>
            </div>
          </form>
        </GlassPanel>
      ) : (
        <GlassPanel className="p-6">
          <div className="text-center py-2">
            <div className="mx-auto mb-3 flex justify-center">
              <IconBadge>
                <FiUser className="h-5 w-5 text-white/70" />
              </IconBadge>
            </div>
            <p className="text-sm text-white/70 mb-5">
              Sign in to join the discussion.
            </p>
            <Link href="/login">
              <Button className="rounded-xl">Sign In</Button>
            </Link>
          </div>
        </GlassPanel>
      )}

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {comments.map((comment, index) => {
              const isMine = currentUserId === comment.author._id;

              return (
                <motion.div
                  key={comment._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{
                    duration: 0.28,
                    ease: easeOut,
                    delay: Math.min(index * 0.03, 0.18),
                  }}
                >
                  <GlassPanel className="p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                      <Link href={`/profile/${comment.author.username}`}>
                        <div className="shrink-0">
                          <Avatar
                            src={comment.author.avatar}
                            name={comment.author.username}
                            size="md"
                          />
                        </div>
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link
                                href={`/profile/${comment.author.username}`}
                                className="font-semibold text-white/90 hover:text-white transition"
                              >
                                {comment.author.username}
                              </Link>
                              <span className="text-xs text-white/50">
                                {formatRelativeTime(comment.createdAt)}
                              </span>
                              {isMine && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/70">
                                  You
                                </span>
                              )}
                            </div>
                          </div>

                          {isMine && (
                            <button
                              onClick={() => onDelete(comment._id)}
                              className="shrink-0 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-white/60 hover:text-red-200 hover:bg-red-500/10 hover:border-red-500/30 transition"
                              aria-label="Delete comment"
                              title="Delete"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <p className="mt-2 text-sm leading-relaxed text-white/80 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </GlassPanel>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <GlassPanel className="p-6">
          <div className="text-center py-6">
            <p className="text-sm text-white/60">
              No comments yet. Start with a useful question or insight.
            </p>
          </div>
        </GlassPanel>
      )}
    </div>
  );
}
