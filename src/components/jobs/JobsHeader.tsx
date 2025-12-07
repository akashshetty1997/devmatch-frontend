/**
 * @file src/components/jobs/JobsHeader.tsx
 * @description Jobs page header with search and post job button
 */

"use client";

import Link from "next/link";
import { FiSearch, FiX, FiPlus } from "react-icons/fi";
import { motion } from "framer-motion";
import { Button } from "@/components/common";
import { formatNumber } from "@/lib/utils";

interface JobsHeaderProps {
  query: string;
  onQueryChange: (query: string) => void;
  totalCount: number;
  loading: boolean;
  isRecruiter: boolean;
}

export default function JobsHeader({
  query,
  onQueryChange,
  totalCount,
  loading,
  isRecruiter,
}: JobsHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Developer Jobs
              </h1>
              <p className="text-gray-600 mt-1">
                Find your next opportunity at top tech companies
              </p>
            </div>

            {/* Post Job Button (Recruiters only) */}
            {isRecruiter && (
              <Link href="/jobs/create">
                <Button leftIcon={<FiPlus />}>Post a Job</Button>
              </Link>
            )}
          </div>

          {/* Search Input */}
          <div className="relative max-w-2xl">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search jobs by title, company, or skills..."
              className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {query && (
              <button
                onClick={() => onQueryChange("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <FiX className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Results count */}
          <p className="mt-3 text-gray-600 text-sm">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Searching...
              </span>
            ) : (
              <>
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {formatNumber(totalCount)}
                </span>{" "}
                jobs
              </>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
