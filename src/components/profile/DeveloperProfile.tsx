/**
 * @file src/components/profile/DeveloperProfile.tsx
 * @description Developer profile content (NO duplicate header/stats; header lives in ProfileHeader)
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiCode, FiExternalLink, FiGithub } from "react-icons/fi";
import { developerAPI, postAPINew } from "@/lib/api";
import {
  Card,
  CardBody,
  CardHeader,
  SkillBadge,
  CardSkeleton,
} from "@/components/common";
import ProfileTabs from "./ProfileTabs";

interface DeveloperProfileProps {
  profile: any;
  user: any;
  isOwnProfile: boolean;
}

type TabId = "overview" | "repos" | "posts" | "reviews";

export default function DeveloperProfile({
  profile,
  user,
  isOwnProfile,
}: DeveloperProfileProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [repos, setRepos] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs = useMemo(
    () => [
      { id: "overview" as const, label: "Overview" },
      { id: "repos" as const, label: "Repositories" },
      { id: "posts" as const, label: "Posts" },
      { id: "reviews" as const, label: "Reviews" },
    ],
    []
  );

  useEffect(() => {
    let alive = true;

    const fetchData = async () => {
      try {
        setLoading(true);

        const [reposRes, postsRes] = await Promise.all([
          developerAPI
            .getPinnedRepos(user.username)
            .catch(() => ({ data: { data: { pinnedRepos: [] } } })),
          postAPINew
            .getByUsername(user.username, 1)
            .catch(() => ({ data: { data: { posts: [] } } })),
        ]);

        if (!alive) return;

        const pinned =
          reposRes?.data?.data?.pinnedRepos ?? reposRes?.data?.data ?? [];
        const recentPosts =
          postsRes?.data?.data?.posts ?? postsRes?.data?.data ?? [];

        setRepos(Array.isArray(pinned) ? pinned : []);
        setPosts(Array.isArray(recentPosts) ? recentPosts : []);
      } catch (e) {
        console.error("Failed to fetch developer profile data:", e);
        if (!alive) return;
        setRepos([]);
        setPosts([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    if (user?.username) fetchData();
    else setLoading(false);

    return () => {
      alive = false;
    };
  }, [user?.username]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* LEFT: sidebar (no follower/following/repo counts here — header already shows that) */}
      <div className="space-y-4 lg:col-span-1">
        {/* About */}
        {profile?.bio ? (
          <Card className="border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
            <CardHeader className="border-gray-100 dark:border-white/10">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                About
              </h3>
            </CardHeader>
            <CardBody>
              <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-white/70">
                {profile.bio}
              </p>
            </CardBody>
          </Card>
        ) : null}

        {/* Skills */}
        {Array.isArray(profile?.skills) && profile.skills.length > 0 ? (
          <Card className="border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
            <CardHeader className="border-gray-100 dark:border-white/10">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Skills
              </h3>
            </CardHeader>
            <CardBody>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill: string) => (
                  <SkillBadge key={skill}>{skill}</SkillBadge>
                ))}
              </div>
            </CardBody>
          </Card>
        ) : null}

        {/* Experience */}
        {Number(profile?.yearsOfExperience) > 0 ? (
          <Card className="border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
            <CardHeader className="border-gray-100 dark:border-white/10">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Experience
              </h3>
            </CardHeader>
            <CardBody>
              <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {profile.yearsOfExperience}+
              </div>
              <div className="mt-1 text-sm text-gray-500 dark:text-white/50">
                Years
              </div>
            </CardBody>
          </Card>
        ) : null}

        {/* GitHub */}
        {profile?.githubUsername ? (
          <Card className="border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
            <CardHeader className="border-gray-100 dark:border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  GitHub
                </h3>
                <a
                  href={`https://github.com/${profile.githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-700 dark:text-white/35 dark:hover:bg-white/[0.06] dark:hover:text-white"
                  aria-label="Open GitHub"
                >
                  <FiExternalLink className="h-4 w-4" />
                </a>
              </div>
            </CardHeader>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/80">
                  <FiGithub className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    @{profile.githubUsername}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-white/55">
                    Connected
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : isOwnProfile ? (
          <Card className="border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
            <CardBody className="p-4">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                Connect GitHub
              </div>
              <p className="mt-1 text-xs text-gray-600 dark:text-white/55">
                Profiles without GitHub convert worse. Connect it.
              </p>
              <Link
                href="/settings"
                className="mt-3 inline-flex items-center justify-center rounded-xl bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                Go to settings
              </Link>
            </CardBody>
          </Card>
        ) : null}

        {/* Profile strength (own only) */}
        {isOwnProfile && profile?.profileCompleteness !== undefined ? (
          <Card className="border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
            <CardHeader className="border-gray-100 dark:border-white/10">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Profile strength
              </h3>
            </CardHeader>
            <CardBody>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-white/60">
                  Completeness
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {profile.profileCompleteness}%
                </span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-gray-200 dark:bg-white/10">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all"
                  style={{ width: `${profile.profileCompleteness}%` }}
                />
              </div>
            </CardBody>
          </Card>
        ) : null}
      </div>

      {/* RIGHT: tabs + content */}
      <div className="space-y-4 lg:col-span-2">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={[
                  "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/70 dark:hover:bg-white/[0.06]",
                ].join(" ")}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="space-y-4"
        >
          {activeTab === "overview" && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Pinned repositories
                </h3>
                {isOwnProfile ? (
                  <Link
                    href="/search"
                    className="text-xs font-semibold text-blue-700 hover:underline dark:text-blue-300"
                  >
                    Pin more
                  </Link>
                ) : null}
              </div>

              {loading ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {[1, 2].map((i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              ) : repos.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {repos.slice(0, 6).map((repo) => (
                    <RepoCard key={repo._id} repo={repo} />
                  ))}
                </div>
              ) : (
                <Card className="border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
                  <CardBody className="py-10 text-center">
                    <FiCode className="mx-auto h-10 w-10 text-gray-300 dark:text-white/20" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-white/50">
                      No pinned repositories
                    </p>
                  </CardBody>
                </Card>
              )}

              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Recent posts
              </h3>

              {posts.length > 0 ? (
                <div className="space-y-3">
                  {posts.slice(0, 5).map((post) => (
                    <Card
                      key={post._id}
                      className="border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]"
                    >
                      <CardBody>
                        <p className="text-sm text-gray-800 dark:text-white/75 line-clamp-3">
                          {post.content}
                        </p>
                        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-white/50">
                          <span>❤️ {post.likesCount || 0}</span>
                          <span>💬 {post.commentsCount || 0}</span>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
                  <CardBody className="py-10 text-center">
                    <p className="text-sm text-gray-500 dark:text-white/50">
                      No posts yet
                    </p>
                  </CardBody>
                </Card>
              )}
            </>
          )}

          {activeTab === "repos" && (
            <ProfileTabs
              username={user.username}
              isOwnProfile={isOwnProfile}
              tab="repos"
            />
          )}

          {activeTab === "posts" && (
            <ProfileTabs
              username={user.username}
              isOwnProfile={isOwnProfile}
              tab="posts"
            />
          )}

          {activeTab === "reviews" && (
            <ProfileTabs
              username={user.username}
              isOwnProfile={isOwnProfile}
              tab="reviews"
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}

function RepoCard({ repo }: { repo: any }) {
  const languageColors: Record<string, string> = {
    JavaScript: "bg-yellow-400",
    TypeScript: "bg-blue-500",
    Python: "bg-green-500",
    Java: "bg-red-500",
    Go: "bg-cyan-400",
    Rust: "bg-orange-500",
  };

  const langColor = languageColors[repo.language] || "bg-gray-400";

  return (
    <Link href={`/details/${repo._id}`} className="block">
      <div className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-colors hover:bg-gray-50/60 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-gray-900 group-hover:underline dark:text-white">
                {repo.name}
              </div>
              <div className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-white/60">
                {repo.description || "No description"}
              </div>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55">
              <FiCode className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-white/55">
            {repo.language ? (
              <span className="inline-flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${langColor}`} />
                <span className="text-gray-700 dark:text-white/70">
                  {repo.language}
                </span>
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
