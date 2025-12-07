/**
 * @file src/pages/NotFound.tsx
 * @description 404 Not Found page
 */

"use client";

import Link from "next/link";
import { Home, ArrowLeft, Search, HelpCircle } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative inline-block">
            <span className="text-9xl font-bold text-gray-200">404</span>
            <div className="absolute inset-0 flex items-center justify-center">
              <HelpCircle className="w-20 h-20 text-blue-500 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Oops! The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home size={18} />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            Here are some helpful links:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link href="/jobs" className="text-blue-600 hover:underline">
              Browse Jobs
            </Link>
            <span className="text-gray-300">•</span>
            <Link href="/developers" className="text-blue-600 hover:underline">
              Find Developers
            </Link>
            <span className="text-gray-300">•</span>
            <Link href="/search" className="text-blue-600 hover:underline">
              Search Repos
            </Link>
            <span className="text-gray-300">•</span>
            <Link href="/feed" className="text-blue-600 hover:underline">
              View Feed
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
