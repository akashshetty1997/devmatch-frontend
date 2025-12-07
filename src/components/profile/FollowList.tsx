/**
 * @file src/components/profile/FollowList.tsx
 * @description Followers/Following list component
 */

"use client";

import { useEffect, useState } from "react";
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
  const { user: currentUser, isAuthenticated } = useAuthStore() as { user?: { _id?: string }; isAuthenticated: boolean };
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response =
          type === "followers"
            ? await userAPINew.getFollowers(username, page)
            : await userAPINew.getFollowing(username, page);

        const newUsers = response.data.data?.users || [];
        setUsers(page === 1 ? newUsers : [...users, ...newUsers]);
        setHasMore(newUsers.length >= 20);
      } catch (error) {
        console.error(`Failed to fetch ${type}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [username, type, page]);

  const handleFollow = async (userId: string, isFollowing: boolean) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    try {
      if (isFollowing) {
        await userAPINew.unfollow(userId);
      } else {
        await userAPINew.follow(userId);
      }

      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isFollowing: !isFollowing } : u
        )
      );

      toast.success(isFollowing ? "Unfollowed" : "Following!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Action failed");
    }
  };

  if (loading && page === 1) {
    return <PageLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 capitalize">
              {type}
            </h1>
            <p className="text-gray-500">@{username}</p>
          </div>
        </div>

        {/* List */}
        {users.length > 0 ? (
          <div className="space-y-3">
            {users.map((user, index) => (
              <motion.div
                key={user._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardBody className="flex items-center justify-between">
                    <Link
                      href={`/profile/${user.username}`}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <Avatar
                        src={user.avatar}
                        name={user.username}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">
                            {user.username}
                          </p>
                          <Badge
                            variant={
                              user.role === "DEVELOPER" ? "primary" : "success"
                            }
                            size="sm"
                          >
                            {user.role === "DEVELOPER" ? "Dev" : "Recruiter"}
                          </Badge>
                        </div>
                        {user.headline && (
                          <p className="text-sm text-gray-500 truncate">
                            {user.headline}
                          </p>
                        )}
                      </div>
                    </Link>

                    {/* Follow Button (don't show for own profile) */}
                    {currentUser?._id !== user._id && (
                      <Button
                        variant={user.isFollowing ? "outline" : "primary"}
                        size="sm"
                        leftIcon={
                          user.isFollowing ? <FiUserCheck /> : <FiUserPlus />
                        }
                        onClick={() => handleFollow(user._id, user.isFollowing)}
                      >
                        {user.isFollowing ? "Following" : "Follow"}
                      </Button>
                    )}
                  </CardBody>
                </Card>
              </motion.div>
            ))}

            {hasMore && (
              <button
                onClick={() => setPage(page + 1)}
                disabled={loading}
                className="w-full py-3 text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
              >
                {loading ? "Loading..." : "Load More"}
              </button>
            )}
          </div>
        ) : (
          <Card>
            <CardBody className="text-center py-12">
              <p className="text-gray-500">
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
