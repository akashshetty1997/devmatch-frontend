/**
 * @file src/components/search/SearchResults.tsx
 * @description Search results list
 */

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiStar,
  FiGitBranch,
  FiEye,
  FiExternalLink,
  FiCode,
  FiSearch,
  FiAlertCircle,
} from "react-icons/fi";
import {
  Card,
  CardBody,
  Badge,
  CardSkeleton,
  Button,
} from "@/components/common";
import { formatNumber, formatRelativeTime } from "@/lib/utils";
import { SearchResult } from "./SearchContainer";

interface SearchResultsProps {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  query: string;
  hasMore: boolean;
  onLoadMore: () => void;
}

const languageColors: Record<string, string> = {
  JavaScript: "bg-yellow-400",
  TypeScript: "bg-blue-500",
  Python: "bg-green-500",
  Java: "bg-red-500",
  Go: "bg-cyan-400",
  Rust: "bg-orange-500",
  "C++": "bg-pink-500",
  "C#": "bg-purple-500",
  Ruby: "bg-red-600",
  PHP: "bg-indigo-400",
  Swift: "bg-orange-400",
  Kotlin: "bg-purple-400",
  HTML: "bg-orange-600",
  CSS: "bg-blue-400",
  Shell: "bg-green-400",
};

// Helper to get license name
function getLicenseName(license: unknown): string {
  if (!license) return "";
  if (typeof license === "string") return license;
  if (typeof license === "object" && license !== null) {
    const lic = license as { name?: string; spdx_id?: string };
    return lic.name || lic.spdx_id || "";
  }
  return "";
}

export default function SearchResults({
  results,
  loading,
  error,
  query,
  hasMore,
  onLoadMore,
}: SearchResultsProps) {
  // Empty state - no query
  if (!query) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiSearch className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Search GitHub Repositories
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Enter a search term to discover amazing open source projects. You can
          search by name, description, topics, and more.
        </p>

        {/* Popular Searches */}
        <div className="mt-8">
          <p className="text-sm text-gray-500 mb-3">Popular searches:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "react",
              "machine learning",
              "typescript",
              "nextjs",
              "api",
              "docker",
            ].map((term) => (
              <Link
                key={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Search Error
          </h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardBody>
      </Card>
    );
  }

  // Loading state (initial)
  if (loading && results.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // No results
  if (!loading && results.length === 0 && query) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCode className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Results Found
          </h3>
          <p className="text-gray-500">
            No repositories found for &quot;{query}&quot;. Try different
            keywords or filters.
          </p>
        </CardBody>
      </Card>
    );
  }

  // Results list
  return (
    <div className="space-y-4">
      {results.map((repo, index) => (
        <motion.div
          key={`${repo.githubId}-${index}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(index * 0.05, 0.5) }}
        >
          <RepoCard repo={repo} />
        </motion.div>
      ))}

      {/* Load More */}
      {hasMore && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            isLoading={loading}
            className="min-w-[200px]"
          >
            Load More Results
          </Button>
        </div>
      )}

      {/* End of results */}
      {!hasMore && results.length > 0 && (
        <p className="text-center text-gray-500 py-4">
          You&apos;ve reached the end of the results
        </p>
      )}
    </div>
  );
}

// Repository Card
function RepoCard({ repo }: { repo: SearchResult }) {
  const licenseName = getLicenseName(repo.license);

  return (
    <Card hover>
      <CardBody>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Repo Name & Owner */}
            <div className="flex items-start gap-2 mb-2">
              <Link
                href={`/details/${repo._id || repo.githubId}`}
                className="text-lg font-semibold text-blue-600 hover:text-blue-700 hover:underline truncate"
              >
                {repo.fullName || repo.name}
              </Link>

              <a
                href={repo.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-1"
              >
                <FiExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-3 line-clamp-2">
              {repo.description || "No description provided"}
            </p>

            {/* Topics */}
            {repo.topics && repo.topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {repo.topics.slice(0, 5).map((topic) => (
                  <Link
                    key={topic}
                    href={`/search?q=${encodeURIComponent(topic)}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Badge
                      variant="primary"
                      size="sm"
                      className="hover:bg-blue-200"
                    >
                      {topic}
                    </Badge>
                  </Link>
                ))}
                {repo.topics.length > 5 && (
                  <Badge variant="default" size="sm">
                    +{repo.topics.length - 5}
                  </Badge>
                )}
              </div>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
              {repo.language && (
                <span className="flex items-center gap-1.5">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      languageColors[repo.language] || "bg-gray-400"
                    }`}
                  />
                  {repo.language}
                </span>
              )}
              <span className="flex items-center gap-1">
                <FiStar className="w-4 h-4" />
                {formatNumber(repo.stars)}
              </span>
              <span className="flex items-center gap-1">
                <FiGitBranch className="w-4 h-4" />
                {formatNumber(repo.forks)}
              </span>
              <span className="flex items-center gap-1">
                <FiEye className="w-4 h-4" />
                {formatNumber(repo.watchers)}
              </span>
              {licenseName && (
                <span className="text-gray-400">{licenseName}</span>
              )}
              <span className="text-gray-400">
                Updated {formatRelativeTime(repo.updatedAt)}
              </span>
            </div>
          </div>

          {/* View Details Button (Desktop) */}
          <div className="hidden sm:block flex-shrink-0">
            <Link href={`/details/${repo._id || repo.githubId}`}>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </Link>
          </div>
        </div>

        {/* View Details Button (Mobile) */}
        <div className="sm:hidden mt-4">
          <Link href={`/details/${repo._id || repo.githubId}`}>
            <Button variant="outline" className="w-full">
              View Details
            </Button>
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
