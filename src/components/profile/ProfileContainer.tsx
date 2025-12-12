/**
 * @file src/components/profile/ProfileContainer.tsx
 * @description Main profile container - Reddit-ish layout + dark-mode safe
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { userAPINew } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoading } from "@/components/common";
import ProfileHeader from "./ProfileHeader";
import ProfileTabs from "./ProfileTabs";
import DeveloperProfile from "./DeveloperProfile";
import RecruiterProfile from "./RecruiterProfile";

interface ProfileContainerProps {
  username: string;
}

interface ProfileData {
  user: {
    _id: string;
    username: string;
    email?: string;
    role: string;
    avatar: string | null;
    createdAt: string;
  };
  profile: any;
  stats: {
    followers: number;
    following: number;
    posts: number;
    repos?: number;
    jobs?: number;
  };
  isFollowing: boolean;
}

export default function ProfileContainer({ username }: ProfileContainerProps) {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuth();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const isOwnProfile = useMemo(
    () => currentUser?.username === username,
    [currentUser?.username, username]
  );

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setPageError(null);

        const response = await userAPINew.getProfile(username);
        const data = response.data.data;

        if (!isMounted) return;

        setProfileData({
          user: {
            _id: data.id,
            username: data.username,
            email: data.email,
            role: data.role,
            avatar: data.avatar,
            createdAt: data.createdAt,
          },
          profile: data.profile,
          stats: data.stats,
          isFollowing: data.isFollowing,
        });
      } catch (err: any) {
        const msg = err.response?.data?.message || "Failed to load profile";
        if (!isMounted) return;

        setProfileData(null);
        setPageError(msg);

        if (err.response?.status === 404) toast.error("User not found");
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [username]);

  const handleFollow = async () => {
    if (!profileData) return;

    if (!isAuthenticated) {
      router.push(
        `/login?redirect=${encodeURIComponent(`/profile/${username}`)}`
      );
      return;
    }

    // optimistic
    const wasFollowing = profileData.isFollowing;
    setProfileData((prev) =>
      prev
        ? {
            ...prev,
            isFollowing: !wasFollowing,
            stats: {
              ...prev.stats,
              followers: Math.max(
                0,
                prev.stats.followers + (wasFollowing ? -1 : 1)
              ),
            },
          }
        : prev
    );

    try {
      if (wasFollowing) {
        await userAPINew.unfollow(profileData.user.username);
        toast.success("Unfollowed");
      } else {
        await userAPINew.follow(profileData.user.username);
        toast.success("Following");
      }
    } catch (err: any) {
      // revert
      setProfileData((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: wasFollowing,
              stats: {
                ...prev.stats,
                followers: Math.max(
                  0,
                  prev.stats.followers + (wasFollowing ? 1 : -1)
                ),
              },
            }
          : prev
      );
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  if (loading) return <PageLoading />;

  if (pageError || !profileData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0b0f14] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Profile Not Found
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-white/55">
            {pageError || "This user does not exist."}
          </p>

          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Go Home
            </button>
            <button
              onClick={() => router.back()}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/70 dark:hover:bg-white/[0.06]"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 dark:bg-[#0b0f14]"
    >
      {/* Header */}
      <ProfileHeader
        user={profileData.user}
        profile={profileData.profile}
        stats={profileData.stats}
        isOwnProfile={isOwnProfile}
        isFollowing={profileData.isFollowing}
        onFollow={handleFollow}
      />

      {/* Reddit-ish layout: narrow content + side gutters on large screens */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* Main */}
          <div className="min-w-0">
            {profileData.user.role === "DEVELOPER" ? (
              <DeveloperProfile
                profile={profileData.profile}
                user={profileData.user}
                isOwnProfile={isOwnProfile}
              />
            ) : profileData.user.role === "RECRUITER" ? (
              <RecruiterProfile
                profile={profileData.profile}
                user={profileData.user}
                isOwnProfile={isOwnProfile}
              />
            ) : (
              <ProfileTabs username={username} isOwnProfile={isOwnProfile} />
            )}
          </div>

          {/* Right rail (optional quick actions / info) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/45">
                  Quick actions
                </p>

                <div className="mt-3 space-y-2">
                  <button
                    onClick={() =>
                      router.push(
                        `/feed?u=${encodeURIComponent(
                          profileData.user.username
                        )}`
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/75 dark:hover:bg-white/[0.06]"
                  >
                    View activity
                  </button>

                  {!isOwnProfile && (
                    <button
                      onClick={handleFollow}
                      className={`w-full rounded-xl px-3 py-2 text-sm font-semibold ${
                        profileData.isFollowing
                          ? "border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/75 dark:hover:bg-white/[0.06]"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {profileData.isFollowing ? "Following" : "Follow"}
                    </button>
                  )}

                  <button
                    onClick={() =>
                      router.push(
                        `/search?user=${encodeURIComponent(
                          profileData.user.username
                        )}`
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/75 dark:hover:bg-white/[0.06]"
                  >
                    Search repos
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55">
                <div className="flex items-center justify-between">
                  <span>Followers</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {profileData.stats.followers}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span>Following</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {profileData.stats.following}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span>Posts</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {profileData.stats.posts}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </motion.div>
  );
}
