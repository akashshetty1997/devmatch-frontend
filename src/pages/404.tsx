/**
 * @file src/pages/NotFound.tsx
 * @description 404 Not Found page (clean, modern, dark-mode safe)
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home, Search, Compass, HelpCircle } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-[75vh] bg-gray-50 px-4 py-12 dark:bg-[#0b0f14]">
      <div className="mx-auto max-w-3xl">
        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          {/* Top bar */}
          <div className="relative h-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 dark:from-[#1b3a7a] dark:via-[#2a1b6b] dark:to-[#3a145a]">
            <div className="pointer-events-none absolute inset-0 opacity-25 [background:radial-gradient(circle_at_20%_20%,white,transparent_40%)]" />
          </div>

          <div className="p-6 sm:p-10">
            {/* Header */}
            <div className="flex flex-col items-center text-center">
              <div className="-mt-14 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0f14]">
                <HelpCircle className="h-8 w-8 text-blue-600 dark:text-blue-300" />
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-extrabold text-gray-900 dark:text-white">
                  404
                </span>
                <span className="text-sm font-semibold text-gray-500 dark:text-white/55">
                  Not Found
                </span>
              </div>

              <h1 className="mt-3 text-2xl font-extrabold text-gray-900 dark:text-white">
                This page doesn’t exist
              </h1>
              <p className="mt-2 max-w-lg text-sm text-gray-600 dark:text-white/60">
                The URL may be wrong, or the page was moved. Use the buttons
                below to get back to something real.
              </p>

              {/* Actions */}
              <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                  <Home className="h-4 w-4" />
                  Home
                </Link>

                <button
                  type="button"
                  onClick={() => router.back()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/75 dark:hover:bg-white/[0.06]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Go back
                </button>

                <Link
                  href="/search"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/75 dark:hover:bg-white/[0.06]"
                >
                  <Search className="h-4 w-4" />
                  Search
                </Link>
              </div>
            </div>

            {/* Helpful links */}
            <div className="mt-10 border-t border-gray-200 pt-6 dark:border-white/10">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/45">
                <Compass className="h-4 w-4" />
                Shortcuts
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <QuickLink href="/jobs" label="Browse jobs" />
                <QuickLink href="/developers" label="Find developers" />
                <QuickLink href="/feed" label="View feed" />
                <QuickLink href="/repos" label="Explore repos" />
              </div>

              <p className="mt-4 text-xs text-gray-500 dark:text-white/45">
                If you got here from an in-app link, that route is broken.
                Fix the href or route file.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/75 dark:hover:bg-white/[0.06]"
    >
      <span>{label}</span>
      <span className="text-xs text-gray-400 dark:text-white/35">→</span>
    </Link>
  );
}
