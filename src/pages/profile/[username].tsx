/**
 * @file src/pages/profile/[username].tsx
 * @description Profile page - clean skeleton + better SEO + not-null rendering
 */

import { useMemo } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { FiArrowLeft, FiUser } from "react-icons/fi";
import { ProfileContainer } from "@/components/profile";

function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/95">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm dark:bg-white/[0.03] dark:border-white/10">
              <FiUser className="h-4 w-4 text-gray-700 dark:text-white/70" />
            </div>
            <div>
              <div className="h-3 w-40 rounded bg-gray-200 dark:bg-white/[0.08]" />
              <div className="mt-2 h-3 w-56 rounded bg-gray-200 dark:bg-white/[0.08]" />
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/70 dark:hover:bg-white/[0.06]"
          >
            <FiArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>

        {/* Cover + header skeleton */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="h-32 sm:h-44 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700" />
          <div className="px-6 pb-6">
            <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="h-24 w-24 rounded-2xl border-4 border-white bg-gray-200 shadow-sm dark:border-black/60 dark:bg-white/[0.08]" />
                <div className="pb-1">
                  <div className="h-4 w-48 rounded bg-gray-200 dark:bg-white/[0.08]" />
                  <div className="mt-3 h-3 w-72 rounded bg-gray-200 dark:bg-white/[0.08]" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-28 rounded-xl bg-gray-200 dark:bg-white/[0.08]" />
                <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-white/[0.08]" />
              </div>
            </div>

            {/* Content skeleton */}
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              <div className="space-y-4">
                <div className="h-28 rounded-2xl bg-gray-100 border border-gray-200 dark:bg-white/[0.04] dark:border-white/10" />
                <div className="h-28 rounded-2xl bg-gray-100 border border-gray-200 dark:bg-white/[0.04] dark:border-white/10" />
                <div className="h-28 rounded-2xl bg-gray-100 border border-gray-200 dark:bg-white/[0.04] dark:border-white/10" />
              </div>
              <div className="lg:col-span-2 space-y-4">
                <div className="h-12 rounded-2xl bg-gray-100 border border-gray-200 dark:bg-white/[0.04] dark:border-white/10" />
                <div className="h-40 rounded-2xl bg-gray-100 border border-gray-200 dark:bg-white/[0.04] dark:border-white/10" />
                <div className="h-40 rounded-2xl bg-gray-100 border border-gray-200 dark:bg-white/[0.04] dark:border-white/10" />
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400 dark:text-white/35">
          If this loads forever, your auth/profile fetch is broken. Fix the
          API/state, not the UI.
        </p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const username = useMemo(() => {
    const u = router.query.username;
    return typeof u === "string" ? u : null;
  }, [router.query.username]);

  const title = username ? `${username} | DevMatch` : "Profile | DevMatch";
  const desc = username
    ? `${username}'s profile on DevMatch`
    : "User profile on DevMatch";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <meta name="robots" content="index,follow" />
        {/* nice-to-have: helps when people share profile links */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
      </Head>

      {/* Never return null. Show skeleton instead. */}
      {!router.isReady || !username ? (
        <ProfilePageSkeleton />
      ) : (
        <ProfileContainer username={username} />
      )}
    </>
  );
}
