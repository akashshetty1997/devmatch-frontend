/**
 * @file src/pages/profile/[username]/following.tsx
 * @description Following list page (Reddit-ish UI + correct pagination append)
 */

import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FiArrowLeft, FiSearch, FiUsers } from "react-icons/fi";
import { followAPI } from "@/lib/api";
import { Avatar, Card, CardBody, Button } from "@/components/common";

interface User {
  _id: string;
  username: string;
  avatar: string | null;
  role: string;
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/95">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white border border-gray-200 shadow-sm dark:bg-white/[0.03] dark:border-white/10" />
          <div className="flex-1">
            <div className="h-4 w-40 rounded bg-gray-200 dark:bg-white/[0.08]" />
            <div className="mt-2 h-3 w-60 rounded bg-gray-200 dark:bg-white/[0.08]" />
          </div>
        </div>

        <div className="mb-4 h-11 rounded-2xl bg-white border border-gray-200 shadow-sm dark:bg-white/[0.03] dark:border-white/10" />

        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]"
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-gray-200 dark:bg-white/[0.08]" />
                <div className="flex-1">
                  <div className="h-3 w-40 rounded bg-gray-200 dark:bg-white/[0.08]" />
                  <div className="mt-2 h-3 w-24 rounded bg-gray-200 dark:bg-white/[0.08]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FollowingPage() {
  const router = useRouter();

  const username = useMemo(() => {
    const u = router.query.username;
    return typeof u === "string" ? u : null;
  }, [router.query.username]);

  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Reddit-ish: quick filter
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!router.isReady || !username) return;

    const fetchFollowing = async () => {
      try {
        setError(null);
        if (page === 1) setLoading(true);
        else setLoadingMore(true);

        const res = await followAPI.getFollowing(username, page);
        const data: User[] = res.data?.data?.following || res.data?.data || [];

        // IMPORTANT: append on load-more
        setFollowing((prev) => (page === 1 ? data : [...prev, ...data]));
        setHasMore(data.length >= 20);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load following");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    fetchFollowing();
  }, [router.isReady, username, page]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return following;
    return following.filter((u) => u.username.toLowerCase().includes(term));
  }, [following, q]);

  if (!router.isReady || !username) return <PageSkeleton />;
  if (loading) return <PageSkeleton />;

  return (
    <>
      <Head>
        <title>People @{username} Follows | DevMatch</title>
        <meta
          name="description"
          content={`People @${username} follows on DevMatch`}
        />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-black/95">
        <div className="mx-auto max-w-2xl px-4 py-8">
          {/* Top bar */}
          <div className="mb-6 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
              aria-label="Go back"
            >
              <FiArrowLeft className="h-4 w-4 text-gray-700 dark:text-white/70" />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-gray-900 dark:text-white">
                Following
              </h1>
              <p className="truncate text-sm text-gray-500 dark:text-white/50">
                People <span className="font-semibold">@{username}</span>{" "}
                follows
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-center gap-2 px-4 py-3">
              <FiSearch className="h-4 w-4 text-gray-400 dark:text-white/35" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search following by username…"
                className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none dark:text-white"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-white/50 dark:hover:text-white/80"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <Card className="border-red-200 bg-red-50/40 dark:border-red-500/20 dark:bg-red-500/10">
              <CardBody className="py-10 text-center">
                <p className="text-sm font-semibold text-red-700 dark:text-red-200">
                  {error}
                </p>
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" onClick={() => setPage(1)}>
                    Retry
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Empty */}
          {!error && following.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
              <FiUsers className="mx-auto h-10 w-10 text-gray-300 dark:text-white/20" />
              <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                Not following anyone yet
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-white/50">
                If you expected entries here, your API response mapping is
                wrong.
              </p>
            </div>
          )}

          {/* List */}
          {!error && following.length > 0 && (
            <div className="space-y-2">
              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-sm text-gray-600 dark:text-white/60">
                    No matches for <span className="font-semibold">{q}</span>
                  </p>
                </div>
              ) : (
                filtered.map((u) => (
                  <Link
                    key={u._id}
                    href={`/profile/${u.username}`}
                    className="block"
                  >
                    <div className="group rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <Avatar src={u.avatar} name={u.username} size="md" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                              @{u.username}
                            </p>
                            <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
                              {u.role === "DEVELOPER" ? "Dev" : "Recruiter"}
                            </span>
                          </div>
                          <p className="truncate text-xs text-gray-500 dark:text-white/45">
                            View profile
                          </p>
                        </div>

                        <span className="text-xs font-semibold text-gray-400 group-hover:text-gray-600 dark:text-white/30 dark:group-hover:text-white/60">
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}

              {/* Load more */}
              {hasMore && (
                <div className="pt-4">
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={loadingMore}
                    className="w-full rounded-2xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/70 dark:hover:bg-white/[0.06]"
                  >
                    {loadingMore ? "Loading…" : "Load more"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
