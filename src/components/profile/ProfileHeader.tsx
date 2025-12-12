/**
 * @file src/components/profile/ProfileHeader.tsx
 * @description Profile header (Reddit-ish, clean, dark-mode safe) — FIXED stacking/z-index
 */

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiMapPin,
  FiLink,
  FiCalendar,
  FiEdit2,
  FiSettings,
  FiUserPlus,
  FiUserCheck,
  FiGithub,
  FiLinkedin,
  FiTwitter,
  FiBriefcase,
  FiCheckCircle,
} from "react-icons/fi";
import { Avatar, Button, Badge } from "@/components/common";
import { formatDate } from "@/lib/utils";
import EditProfileModal from "./EditProfileModal";

interface ProfileHeaderProps {
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
  isOwnProfile: boolean;
  isFollowing: boolean;
  onFollow: () => void;
}

export default function ProfileHeader({
  user,
  profile,
  stats,
  isOwnProfile,
  isFollowing,
  onFollow,
}: ProfileHeaderProps) {
  const [showEditModal, setShowEditModal] = useState(false);

  const isDeveloper = user.role === "DEVELOPER";
  const isRecruiter = user.role === "RECRUITER";

  const location = useMemo(() => {
    if (!profile?.location) return null;
    const parts: string[] = [];
    if (profile.location.city) parts.push(profile.location.city);
    if (profile.location.state) parts.push(profile.location.state);
    if (profile.location.country) parts.push(profile.location.country);
    return parts.join(", ") || null;
  }, [profile?.location]);

  const headline = useMemo(() => {
    if (isDeveloper) return profile?.headline || "";
    if (profile?.positionTitle && profile?.companyName) {
      return `${profile.positionTitle} at ${profile.companyName}`;
    }
    return profile?.positionTitle || profile?.companyName || "";
  }, [
    isDeveloper,
    profile?.headline,
    profile?.positionTitle,
    profile?.companyName,
  ]);

  return (
    <>
      {/* IMPORTANT FIX:
          Wrap banner + card in ONE stacking context and force z-order.
          This prevents the gradient "cover" from overlapping the card.
      */}
      <section className="relative isolate bg-gray-50 dark:bg-[#0b0f14]">
        {/* Banner (always behind) */}
        <div className="relative z-0">
          <div className="h-28 sm:h-36 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 dark:from-[#1b3a7a] dark:via-[#2a1b6b] dark:to-[#3a145a]" />
            <div className="pointer-events-none absolute inset-0 opacity-20 [background:radial-gradient(circle_at_20%_20%,white,transparent_40%)]" />
          </div>
        </div>

        {/* Content shell */}
        <div className="relative z-10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-6">
            {/* Card (always above banner) */}
            <div className="-mt-10 sm:-mt-12 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left */}
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="relative shrink-0"
                    >
                      <Avatar
                        src={user.avatar}
                        name={user.username}
                        size="xl"
                        className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-white shadow-sm dark:border-white/10"
                      />
                      {isRecruiter && profile?.isVerified && (
                        <div className="absolute -bottom-1 -right-1 rounded-full bg-blue-600 p-1.5 text-white shadow-sm">
                          <FiCheckCircle className="h-4 w-4" />
                        </div>
                      )}
                    </motion.div>

                    {/* Identity */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="truncate text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                          {user.username}
                        </h1>

                        <Badge
                          variant={isDeveloper ? "primary" : "success"}
                          size="sm"
                        >
                          {isDeveloper ? "Developer" : "Recruiter"}
                        </Badge>

                        {isDeveloper && profile?.isOpenToWork && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300">
                            <FiBriefcase className="h-3.5 w-3.5" />
                            Open to work
                          </span>
                        )}
                      </div>

                      {headline ? (
                        <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-white/60">
                          {headline}
                        </p>
                      ) : null}

                      {/* Meta */}
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-500 dark:text-white/45">
                        {location ? (
                          <span className="inline-flex items-center gap-1">
                            <FiMapPin className="h-4 w-4" />
                            <span className="truncate">{location}</span>
                          </span>
                        ) : null}

                        {profile?.portfolioUrl ? (
                          <a
                            href={profile.portfolioUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-300"
                          >
                            <FiLink className="h-4 w-4" />
                            Portfolio
                          </a>
                        ) : null}

                        <span className="inline-flex items-center gap-1">
                          <FiCalendar className="h-4 w-4" />
                          Joined {formatDate(user.createdAt)}
                        </span>
                      </div>

                      {/* Social */}
                      <div className="mt-3 flex items-center gap-3 text-gray-500 dark:text-white/45">
                        {profile?.githubUsername ? (
                          <a
                            href={`https://github.com/${profile.githubUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-1.5 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/[0.06] dark:hover:text-white"
                            aria-label="GitHub"
                          >
                            <FiGithub className="h-5 w-5" />
                          </a>
                        ) : null}

                        {profile?.linkedinUrl ? (
                          <a
                            href={profile.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-1.5 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-white/[0.06] dark:hover:text-blue-300"
                            aria-label="LinkedIn"
                          >
                            <FiLinkedin className="h-5 w-5" />
                          </a>
                        ) : null}

                        {profile?.twitterUrl ? (
                          <a
                            href={profile.twitterUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-1.5 hover:bg-gray-100 hover:text-sky-600 dark:hover:bg-white/[0.06] dark:hover:text-sky-300"
                            aria-label="Twitter"
                          >
                            <FiTwitter className="h-5 w-5" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Right */}
                  <div className="flex flex-col gap-3 sm:items-end">
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {isOwnProfile ? (
                        <>
                          <Button
                            variant="outline"
                            leftIcon={<FiEdit2 />}
                            onClick={() => setShowEditModal(true)}
                          >
                            Edit Profile
                          </Button>
                          <Link href="/settings">
                            <Button
                              variant="ghost"
                              className="px-3"
                              title="Settings"
                              aria-label="Settings"
                            >
                              <FiSettings className="h-5 w-5" />
                            </Button>
                          </Link>
                        </>
                      ) : (
                        <Button
                          variant={isFollowing ? "outline" : "primary"}
                          leftIcon={
                            isFollowing ? <FiUserCheck /> : <FiUserPlus />
                          }
                          onClick={onFollow}
                        >
                          {isFollowing ? "Following" : "Follow"}
                        </Button>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
                      <StatPill
                        href={`/profile/${encodeURIComponent(
                          user.username
                        )}/followers`}
                        label="Followers"
                        value={stats.followers}
                      />
                      <StatPill
                        href={`/profile/${encodeURIComponent(
                          user.username
                        )}/following`}
                        label="Following"
                        value={stats.following}
                      />
                      {isDeveloper && stats.repos !== undefined ? (
                        <StatPill label="Repos" value={stats.repos} />
                      ) : null}
                      {isRecruiter && stats.jobs !== undefined ? (
                        <StatPill label="Jobs" value={stats.jobs} />
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Work types */}
                {isDeveloper &&
                profile?.isOpenToWork &&
                profile?.preferredWorkTypes?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.preferredWorkTypes.map((t: string) => (
                      <span
                        key={t}
                        className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {showEditModal && (
        <EditProfileModal
          user={user}
          profile={profile}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}

function StatPill({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string;
}) {
  const content = (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-left shadow-sm hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]">
      <div className="text-base font-bold text-gray-900 dark:text-white">
        {value}
      </div>
      <div className="text-xs text-gray-500 dark:text-white/45">{label}</div>
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}
