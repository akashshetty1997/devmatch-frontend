/**
 * @file src/pages/search.tsx
 * @description Search GitHub repositories - 3rd party API integration
 */

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { githubService } from "@/services/githubService";
import LoadingSpinner from "@/components/common/Loading";
import {
  Search,
  Filter,
  Star,
  GitFork,
  Eye,
  Code,
  ExternalLink,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Github,
  Clock,
  Scale,
} from "lucide-react";

interface Repository {
  _id?: string;
  githubId: number;
  name: string;
  fullName: string;
  ownerLogin: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  htmlUrl: string;
  topics: string[];
  license: string | null;
  githubUpdatedAt: string;
  githubCreatedAt: string;
}

const LANGUAGES = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "Go",
  "Rust",
  "C++",
  "C#",
  "Ruby",
  "PHP",
  "Swift",
  "Kotlin",
];

const SORT_OPTIONS = [
  { value: "stars", label: "Most Stars" },
  { value: "forks", label: "Most Forks" },
  { value: "updated", label: "Recently Updated" },
  { value: "help-wanted-issues", label: "Help Wanted" },
];

export default function SearchPage() {
  const router = useRouter();

  // Mounted state for hydration
  const [mounted, setMounted] = useState(false);

  // Data state
  const [results, setResults] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const perPage = 12;

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Parse URL params
  const filters = useMemo(() => {
    if (!mounted || !router.isReady) return null;

    const { query } = router;
    return {
      page: parseInt((query.page as string) || "1", 10),
      q: (query.q as string) || "",
      language: (query.language as string) || "",
      sort: (query.sort as string) || "stars",
      order: (query.order as string) || "desc",
    };
  }, [mounted, router.isReady, router.query]);

  // Sync search input with URL
  useEffect(() => {
    if (filters) {
      setSearchInput(filters.q);
    }
  }, [filters?.q]);

  // Fetch repos when filters change
  useEffect(() => {
    if (!filters || !filters.q) {
      setResults([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    const searchRepos = async () => {
      setLoading(true);
      try {
        const response = await githubService.searchRepos({
          q: filters.q,
          language: filters.language || undefined,
          sort: filters.sort,
          order: filters.order,
          page: filters.page,
          per_page: perPage,
        });

        // Fix: Handle nested data structure from ApiResponse
        // Response is: { success: true, message: "...", data: { repos, totalCount, ... } }
        const responseData = response.data?.data || response.data;

        // Transform GitHub API response to match Repository interface
        const items = responseData?.items || [];
        const transformedRepos = items.map((item: any) => ({
          githubId: item.id,
          name: item.name,
          fullName: item.full_name,
          ownerLogin: item.owner?.login,
          description: item.description,
          language: item.language,
          stars: item.stargazers_count,
          forks: item.forks_count || item.forks,
          watchers: item.watchers_count || item.watchers,
          openIssues: item.open_issues_count || item.open_issues,
          htmlUrl: item.html_url,
          topics: item.topics || [],
          license: item.license?.spdx_id || item.license?.name || null,
          githubUpdatedAt: item.updated_at,
          githubCreatedAt: item.created_at,
        }));

        setResults(transformedRepos);
        setTotalCount(responseData?.total_count || 0);
      } catch (err) {
        console.error("Failed to search repos:", err);
        setResults([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    searchRepos();
  }, [filters]);

  // Update URL params
  const updateFilters = (updates: Record<string, string | null>) => {
    const newQuery: Record<string, string> = { ...router.query } as Record<
      string,
      string
    >;

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        delete newQuery[key];
      } else {
        newQuery[key] = value;
      }
    });

    if (!updates.hasOwnProperty("page")) {
      newQuery.page = "1";
    }

    router.push({ pathname: "/search", query: newQuery }, undefined, {
      shallow: true,
    });
  };

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      updateFilters({ q: searchInput.trim() });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchInput("");
    router.push("/search", undefined, { shallow: true });
  };

  // Check if any filters are active
  const hasActiveFilters = filters && (filters.q || filters.language);

  const totalPages = Math.ceil(Math.min(totalCount, 1000) / perPage); // GitHub limits to 1000 results
  const currentPage = filters?.page || 1;

  // Server-side and initial client render
  if (!mounted) {
    return (
      <>
        <Head>
          <title>Search Repositories - DevMatch</title>
        </Head>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Search GitHub Repositories
            </h1>
            <p className="text-gray-600">
              Discover amazing open source projects
            </p>
          </div>
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>
          {filters?.q ? `${filters.q} - Search` : "Search Repositories"} -
          DevMatch
        </title>
        <meta
          name="description"
          content="Search GitHub repositories and discover amazing open source projects"
        />
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Search GitHub Repositories
          </h1>
          <p className="text-gray-600">
            Discover amazing open source projects from GitHub
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <form
            onSubmit={handleSearch}
            className="flex flex-col md:flex-row gap-4"
          >
            <div className="flex-1 relative">
              <Github
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search repositories... (e.g., react, machine learning, api)"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={!searchInput.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Search size={20} />
              Search
            </button>
          </form>

          {/* Filter Toggle */}
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters || filters?.language
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter size={18} />
              Filters
              <ChevronDown
                size={16}
                className={`transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>

            {filters?.q && (
              <p className="text-sm text-gray-600">
                {loading ? (
                  "Searching..."
                ) : (
                  <>
                    Found{" "}
                    <span className="font-semibold">
                      {totalCount.toLocaleString()}
                    </span>{" "}
                    repositories
                    {totalCount > 1000 && (
                      <span className="text-gray-400"> (showing top 1000)</span>
                    )}
                  </>
                )}
              </p>
            )}
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language
                  </label>
                  <select
                    value={filters?.language || ""}
                    onChange={(e) =>
                      updateFilters({ language: e.target.value || null })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Languages</option>
                    {LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <select
                    value={filters?.sort || "stars"}
                    onChange={(e) => updateFilters({ sort: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order
                  </label>
                  <select
                    value={filters?.order || "desc"}
                    onChange={(e) => updateFilters({ order: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="mt-4">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <X size={14} />
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-sm text-gray-500">Searching for:</span>
            {filters?.q && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                &quot;{filters.q}&quot;
                <button onClick={() => updateFilters({ q: null })}>
                  <X size={14} />
                </button>
              </span>
            )}
            {filters?.language && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                {filters.language}
                <button onClick={() => updateFilters({ language: null })}>
                  <X size={14} />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Initial State - No Search */}
        {!loading && !filters?.q && (
          <div className="text-center py-16">
            <Github className="mx-auto text-gray-300 mb-4" size={80} />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Search GitHub Repositories
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Enter a search term to discover millions of open source projects,
              libraries, and tools
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {["react", "machine learning", "api", "typescript", "nodejs"].map(
                (term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setSearchInput(term);
                      updateFilters({ q: term });
                    }}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    {term}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && filters?.q && results.length > 0 && (
          <div className="space-y-4 mb-8">
            {results.map((repo) => (
              <RepoCard key={repo.githubId} repo={repo} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filters?.q && results.length === 0 && (
          <div className="text-center py-12">
            <Search className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No repositories found
            </h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search or filters
            </p>
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {!loading && filters?.q && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() =>
                updateFilters({ page: (currentPage - 1).toString() })
              }
              disabled={currentPage <= 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                updateFilters({ page: (currentPage + 1).toString() })
              }
              disabled={currentPage >= totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// Repository Card Component
function RepoCard({ repo }: { repo: Repository }) {
  const updatedDate = formatRelativeTime(repo.githubUpdatedAt);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center shrink-0">
              <Github size={20} className="text-gray-500" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/details/${repo.fullName}`}
                  className="text-lg font-semibold text-blue-600 hover:underline truncate"
                >
                  {repo.fullName}
                </Link>
                <a
                  href={repo.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ExternalLink size={16} />
                </a>
              </div>

              {repo.description && (
                <p className="text-gray-600 mt-1 line-clamp-2">
                  {repo.description}
                </p>
              )}
            </div>
          </div>

          {/* Topics */}
          {repo.topics && repo.topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3 mb-3">
              {repo.topics.slice(0, 6).map((topic) => (
                <span
                  key={topic}
                  className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs"
                >
                  {topic}
                </span>
              ))}
              {repo.topics.length > 6 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                  +{repo.topics.length - 6}
                </span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            {repo.language && (
              <div className="flex items-center gap-1">
                <Code size={14} className="text-gray-400" />
                {repo.language}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Star size={14} className="text-yellow-500" />
              {repo.stars.toLocaleString()}
            </div>
            <div className="flex items-center gap-1">
              <GitFork size={14} className="text-gray-400" />
              {repo.forks.toLocaleString()}
            </div>
            <div className="flex items-center gap-1">
              <Eye size={14} className="text-gray-400" />
              {repo.watchers.toLocaleString()}
            </div>
            {repo.license && (
              <div className="flex items-center gap-1">
                <Scale size={14} className="text-gray-400" />
                {repo.license}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock size={14} className="text-gray-400" />
              Updated {updatedDate}
            </div>
          </div>
        </div>

        {/* Right side - View button */}
        <div className="shrink-0">
          <Link
            href={`/details/${repo.fullName}`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

// Helper function
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30)
    return `${Math.floor(diffDays / 7)} week${
      Math.floor(diffDays / 7) > 1 ? "s" : ""
    } ago`;
  if (diffDays < 365)
    return `${Math.floor(diffDays / 30)} month${
      Math.floor(diffDays / 30) > 1 ? "s" : ""
    } ago`;
  return `${Math.floor(diffDays / 365)} year${
    Math.floor(diffDays / 365) > 1 ? "s" : ""
  } ago`;
}
