/**
 * @file src/components/search/SearchHeader.tsx
 * @description Search header with search input
 */

"use client";

import { FiSearch, FiX } from "react-icons/fi";
import { motion } from "framer-motion";
import { formatNumber } from "@/lib/utils";

interface SearchHeaderProps {
  query: string;
  onQueryChange: (query: string) => void;
  totalCount: number;
  loading: boolean;
}

export default function SearchHeader({
  query,
  onQueryChange,
  totalCount,
  loading,
}: SearchHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl"
        >
          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Search Repositories
          </h1>

          {/* Search Input */}
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search GitHub repositories..."
              className="w-full pl-12 pr-12 py-4 text-lg rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              autoFocus
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
          {query && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-gray-600"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  Searching...
                </span>
              ) : (
                <>
                  Found{" "}
                  <span className="font-semibold text-gray-900">
                    {formatNumber(totalCount)}
                  </span>{" "}
                  repositories
                  {totalCount > 1000 && (
                    <span className="text-gray-500"> (showing top 1000)</span>
                  )}
                </>
              )}
            </motion.p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
