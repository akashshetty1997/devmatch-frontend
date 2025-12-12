/**
 * @file src/components/profile/FollowList.tsx
 * @description Reddit-style followers/following list (dark-mode safe, sticky header, clean rows)
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiArrowLeft, FiUserPlus, FiUserCheck } from "react-icons/fi";
import toast from "react-hot-toast";
import { userAPINew } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  Card,
  CardBody,
  Avatar,
  Button,
  Badge,
  PageLoading,
} from "@/components/common";

interface FollowListProps {
  username: string;
  type: "followers" | "following";
}

interface UserItem {
  _id: string;
  username: string;
  avatar: string | null;
  role: string;
  headline?: string;
  isFollowing: boolean;
}

export default function FollowList({ username, type }: FollowListProps) {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuthStore() as {
    user?: { _id?: string };
    isAuthenticated: boolean;
  };

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const title = useMemo(
    () => (type === "followers" ? "Followers" : "Following"),
    [type]
  );

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      try {
        page === 1 ? setLoading(true) : setLoadingMore(true);

        const res =
          type === "followers"
            ? await userAPINew.getFollowers(username, page)
            : await userAPINew.getFollowing(username, page);

        const newUsers: UserItem[] = res.data.data?.users || [];
        if (!isMounted) return;

        setUsers((prev) => (page === 1 ? newUsers : [...prev, ...newUsers]));
        setHasMore(newUsers.length >= 20);
      } catch (err) {
        console.error(`Failed to fetch ${type}:`, err);
      } finally {
        if (!isMounted) return;
        setLoading(false);
        setLoadingMore(false);
      }
    };

    fetchUsers();
    return () => {
      isMounted = false;
    };
  }, [username, type, page]);

  const handleFollow = async (userId: string, isFollowing: boolean) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // optimistic
    setUsers((prev) =>
      prev.map((u) =>
        u._id === userId ? { ...u, isFollowing: !isFollowing } : u
      )
    );

    try {
      if (isFollowing) await userAPINew.unfollow(userId);
      else await userAPINew.follow(userId);

      toast.success(isFollowing ? "Unfollowed" : "Following");
    } catch (error: any) {
      // revert
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isFollowing } : u))
      );
      toast.error(error.response?.data?.message || "Action failed");
    }
  };

  if (loading && page === 1) return <PageLoading />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b0f14]">
      <div className="mx-auto max-w-2xl px-4 pb-10 pt-6">
        {/* Sticky Header (Reddit-ish) */}
        <div className="sticky top-0 z-10 -mx-4 mb-5 border-b border-gray-200 bg-gray-50/90 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-[#0b0f14]/90">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="rounded-xl p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-white/60 dark:hover:bg-white/[0.06] dark:hover:text-white"
              aria-label="Back"
            >
              <FiArrowLeft className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
              <p className="text-xs text-gray-500 dark:text-white/45 truncate">
                @{username}
              </p>
            </div>
          </div>
        </div>

        {/* List */}
        {users.length > 0 ? (
          <div className="space-y-3">
            {users.map((u, idx) => {
              const isMe = currentUser?._id && currentUser._id === u._id;

              return (
                <motion.div
                  key={u._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.18) }}
                >
                  <Card className="border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
                    <CardBody className="flex items-center gap-3">
                      {/* User */}
                      <Link
                        href={`/profile/${u.username}`}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        <Avatar src={u.avatar} name={u.username} size="md" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-gray-900 dark:text-white">
                                {u.username}
                              </p>
                            </div>

                            <Badge
                              variant={
                                u.role === "DEVELOPER" ? "primary" : "success"
                              }
                              size="sm"
                              className="shrink-0 dark:border dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70"
                            >
                              {u.role === "DEVELOPER" ? "Dev" : "Recruiter"}
                            </Badge>
                          </div>

                          {u.headline ? (
                            <p className="truncate text-sm text-gray-600 dark:text-white/55">
                              {u.headline}
                            </p>
                          ) : (
                            <p className="truncate text-sm text-gray-400 dark:text-white/35">
                              No headline
                            </p>
                          )}
                        </div>
                      </Link>

                      {/* Follow button */}
                      {!isMe && (
                        <Button
                          variant={u.isFollowing ? "outline" : "primary"}
                          size="sm"
                          leftIcon={
                            u.isFollowing ? <FiUserCheck /> : <FiUserPlus />
                          }
                          onClick={() => handleFollow(u._id, u.isFollowing)}
                          className={[
                            "shrink-0",
                            // dark-mode safety (your Button component may ignore className; fix there if needed)
                            "dark:border-white/10",
                            u.isFollowing
                              ? "dark:bg-white/[0.03] dark:text-white/80"
                              : "dark:bg-blue-600 dark:text-white",
                          ].join(" ")}
                        >
                          {u.isFollowing ? "Following" : "Follow"}
                        </Button>
                      )}
                    </CardBody>
                  </Card>
                </motion.div>
              );
            })}

            {/* Load more */}
            {hasMore && (
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={loadingMore}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/70 dark:hover:bg-white/[0.06]"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            )}
          </div>
        ) : (
          <Card className="border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
            <CardBody className="py-12 text-center">
              <p className="text-gray-600 dark:text-white/55">
                {type === "followers"
                  ? "No followers yet"
                  : "Not following anyone yet"}
              </p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
