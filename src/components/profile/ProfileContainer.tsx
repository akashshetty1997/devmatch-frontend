/**
 * @file src/components/profile/ProfileContainer.tsx
 * @description Main profile container - fetches data and renders profile
 */

"use client";

import { useEffect, useState } from "react";
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
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await userAPINew.getProfile(username);
        
        // The API returns flat structure, so map it to our interface
        const data = response.data.data;
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
        const message = err.response?.data?.message || "Failed to load profile";
        setError(message);
        if (err.response?.status === 404) {
          toast.error("User not found");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  const handleFollow = async () => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/profile/" + username);
      return;
    }

    try {
      if (profileData?.isFollowing) {
        await userAPINew.unfollow(profileData.user._id);
        setProfileData((prev) =>
          prev
            ? {
                ...prev,
                isFollowing: false,
                stats: { ...prev.stats, followers: prev.stats.followers - 1 },
              }
            : null
        );
        toast.success("Unfollowed successfully");
      } else {
        await userAPINew.follow(profileData!.user._id);
        setProfileData((prev) =>
          prev
            ? {
                ...prev,
                isFollowing: true,
                stats: { ...prev.stats, followers: prev.stats.followers + 1 },
              }
            : null
        );
        toast.success("Following!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  if (loading) {
    return <PageLoading />;
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Profile Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            {error || "This user does not exist."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50"
    >
      {/* Profile Header */}
      <ProfileHeader
        user={profileData.user}
        profile={profileData.profile}
        stats={profileData.stats}
        isOwnProfile={isOwnProfile}
        isFollowing={profileData.isFollowing}
        onFollow={handleFollow}
      />

      {/* Profile Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
    </motion.div>
  );
}
