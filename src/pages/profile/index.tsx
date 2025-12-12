/**
 * @file src/pages/profile/index.tsx
 * @description Redirects to user's own profile or login page (polished loader + helpful fallback)
 */

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { FiArrowLeft, FiUser } from "react-icons/fi";

export default function ProfileRedirect() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  // If your AuthContext does not provide 'loading', set it to false or handle accordingly:
  const loading = false; // Replace with actual loading logic if available

  const target = useMemo(() => {
    if (loading) return null;
    if (isAuthenticated && user?.username) return `/profile/${user.username}`;
    return "/login?redirect=/profile";
  }, [loading, isAuthenticated, user?.username]);

  useEffect(() => {
    if (!target) return;
    router.replace(target);
  }, [target, router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/95">
      <div className="mx-auto max-w-md px-4 py-14">
        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-700 dark:bg-white/[0.06] dark:text-white/70">
                  <FiUser className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-gray-900 dark:text-white">
                    Opening your profile
                  </p>
                  <p className="text-xs text-gray-500 dark:text-white/50">
                    Redirecting securely…
                  </p>
                </div>
              </div>

              {/* Back (only useful if router is stuck / slow) */}
              <Link
                href="/"
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-white/60 dark:hover:bg-white/[0.06] dark:hover:text-white"
              >
                <FiArrowLeft className="h-4 w-4" />
                Home
              </Link>
            </div>
          </div>

          <div className="px-5 py-6">
            {/* Reddit-ish loader block */}
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 shrink-0">
                <div className="absolute inset-0 rounded-xl bg-gray-100 dark:bg-white/[0.06]" />
                <div className="absolute inset-0 rounded-xl border-2 border-blue-600 border-t-transparent animate-spin" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="h-3 w-40 rounded bg-gray-100 dark:bg-white/[0.06]" />
                <div className="mt-2 h-3 w-64 rounded bg-gray-100 dark:bg-white/[0.06]" />
              </div>
            </div>

            {/* Helpful text */}
            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/65">
              {loading ? (
                <p>Checking your session…</p>
              ) : isAuthenticated && user?.username ? (
                <p>
                  Taking you to{" "}
                  <span className="font-semibold">@{user.username}</span>.
                </p>
              ) : (
                <p>You’re not signed in. Redirecting to login.</p>
              )}
            </div>

            {/* Fallback actions (if redirect fails) */}
            {!loading && (
              <div className="mt-5 flex flex-col gap-2">
                <Link
                  href={
                    isAuthenticated && user?.username
                      ? `/profile/${user.username}`
                      : "/login?redirect=/profile"
                  }
                  className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                  Continue
                </Link>

                <button
                  type="button"
                  onClick={() => router.reload()}
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/70 dark:hover:bg-white/[0.06]"
                >
                  Reload
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tiny footer note */}
        <p className="mt-4 text-center text-xs text-gray-400 dark:text-white/35">
          If this keeps looping, your auth state is not stabilizing. Fix your
          AuthContext (persist + hydration) instead of “loading spinners
          everywhere”.
        </p>
      </div>
    </div>
  );
}
