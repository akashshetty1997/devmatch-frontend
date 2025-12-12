/**
 * @file src/pages/search.tsx
 * @description Search GitHub repositories - 3rd party API integration (dark premium)
 */

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
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
  Sparkles,
  Zap,
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

/* ---------- UI primitives ---------- */

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-md",
        "shadow-[0_20px_80px_-60px_rgba(0,0,0,0.9)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function Chip({
  children,
  onClear,
  tone = "sky",
}: {
  children: React.ReactNode;
  onClear: () => void;
  tone?: "sky" | "purple";
}) {
  const tones =
    tone === "purple"
      ? "border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-200"
      : "border-sky-400/20 bg-sky-500/10 text-sky-200";

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm",
        tones,
      ].join(" ")}
    >
      {children}
      <button
        type="button"
        onClick={onClear}
        className="rounded-full p-1 hover:bg-white/10 text-white/70 hover:text-white"
        aria-label="Remove filter"
      >
        <X size={14} />
      </button>
    </span>
  );
}

const panel: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.99 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: 8,
    scale: 0.99,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

const itemIn: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut", delay: i * 0.03 },
  }),
};

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
    if (filters) setSearchInput(filters.q);
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

        const responseData = response.data?.data || response.data;

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

    if (!Object.prototype.hasOwnProperty.call(updates, "page")) {
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

  const totalPages = Math.ceil(Math.min(totalCount, 1000) / perPage);
  const currentPage = filters?.page || 1;

  // Server-side and initial client render
  if (!mounted) {
    return (
      <>
        <Head>
          <title>Search Repositories - DevMatch</title>
        </Head>
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">
              Search GitHub Repositories
            </h1>
            <p className="mt-2 text-white/60">
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

      <div className="relative">
        {/* Background accents */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-[10%] h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="absolute -top-28 right-[12%] h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="absolute top-44 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:28px_28px] opacity-40" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-10">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75">
              <Sparkles size={16} className="text-yellow-300" />
              GitHub search, curated for signal.
            </div>

            <h1 className="mt-4 text-3xl md:text-4xl font-bold text-white">
              Search GitHub Repositories
            </h1>
            <p className="mt-2 text-white/60">
              Discover amazing open source projects from GitHub
            </p>
          </div>

          {/* Search bar */}
          <GlassCard className="p-4 md:p-5 mb-6">
            <form
              onSubmit={handleSearch}
              className="flex flex-col md:flex-row gap-4"
            >
              <div className="flex-1 relative">
                <Github
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45"
                  size={18}
                />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search repositories... (e.g., react, machine learning, api)"
                  className={[
                    "w-full rounded-2xl border border-white/10 bg-white/5",
                    "pl-10 pr-4 py-3 text-sm md:text-base text-white placeholder:text-white/35",
                    "outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400/40",
                  ].join(" ")}
                />
              </div>

              <button
                type="submit"
                disabled={!searchInput.trim()}
                className={[
                  "rounded-2xl px-6 py-3 font-semibold text-sm md:text-base",
                  "bg-white text-black hover:bg-white/90",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "inline-flex items-center justify-center gap-2",
                ].join(" ")}
              >
                <Search size={18} />
                Search
              </button>
            </form>

            {/* Filter row */}
            <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={[
                  "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold",
                  "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10",
                  showFilters || !!filters?.language
                    ? "ring-2 ring-sky-500/30"
                    : "",
                ].join(" ")}
              >
                <Filter size={16} />
                Filters
                <ChevronDown
                  size={16}
                  className={[
                    "transition-transform",
                    showFilters ? "rotate-180" : "",
                  ].join(" ")}
                />
              </button>

              {filters?.q && (
                <p className="text-sm text-white/55">
                  {loading ? (
                    "Searching..."
                  ) : (
                    <>
                      Found{" "}
                      <span className="font-semibold text-white">
                        {totalCount.toLocaleString()}
                      </span>{" "}
                      repositories
                      {totalCount > 1000 && (
                        <span className="text-white/35">
                          {" "}
                          (showing top 1000)
                        </span>
                      )}
                    </>
                  )}
                </p>
              )}
            </div>

            {/* Expanded filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={panel}
                  className="mt-4 pt-4 border-t border-white/10"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Language */}
                    <div>
                      <label className="block text-sm font-medium text-white/75 mb-2">
                        Language
                      </label>
                      <select
                        value={filters?.language || ""}
                        onChange={(e) =>
                          updateFilters({ language: e.target.value || null })
                        }
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-sky-500/40"
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
                      <label className="block text-sm font-medium text-white/75 mb-2">
                        Sort By
                      </label>
                      <select
                        value={filters?.sort || "stars"}
                        onChange={(e) =>
                          updateFilters({ sort: e.target.value })
                        }
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-sky-500/40"
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
                      <label className="block text-sm font-medium text-white/75 mb-2">
                        Order
                      </label>
                      <select
                        value={filters?.order || "desc"}
                        onChange={(e) =>
                          updateFilters({ order: e.target.value })
                        }
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-sky-500/40"
                      >
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                      </select>
                    </div>
                  </div>

                  {hasActiveFilters && (
                    <div className="mt-4">
                      <button
                        onClick={clearFilters}
                        className="text-sm text-rose-300 hover:text-rose-200 inline-flex items-center gap-2"
                      >
                        <X size={14} />
                        Clear all filters
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* Active filters display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-sm text-white/45">Searching for:</span>

              {filters?.q && (
                <Chip tone="sky" onClear={() => updateFilters({ q: null })}>
                  “{filters.q}”
                </Chip>
              )}

              {filters?.language && (
                <Chip
                  tone="purple"
                  onClear={() => updateFilters({ language: null })}
                >
                  {filters.language}
                </Chip>
              )}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* Initial state */}
          {!loading && !filters?.q && (
            <GlassCard className="p-10 md:p-14 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                <Github className="text-white/70" size={28} />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-white">
                Search GitHub Repositories
              </h3>
              <p className="mt-2 text-white/55 max-w-md mx-auto">
                Enter a search term to discover open source projects, libraries,
                and tools.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {[
                  "react",
                  "machine learning",
                  "api",
                  "typescript",
                  "nodejs",
                ].map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setSearchInput(term);
                      updateFilters({ q: term });
                    }}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Zap size={14} className="text-yellow-300" />
                      {term}
                    </span>
                  </button>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Results */}
          {!loading && filters?.q && results.length > 0 && (
            <div className="space-y-4 mb-8">
              {results.map((repo, i) => (
                <motion.div
                  key={repo.githubId}
                  variants={itemIn}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                >
                  <RepoCard repo={repo} />
                </motion.div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && filters?.q && results.length === 0 && (
            <GlassCard className="p-10 text-center">
              <Search className="mx-auto text-white/25 mb-4" size={64} />
              <h3 className="text-lg font-semibold text-white mb-2">
                No repositories found
              </h3>
              <p className="text-white/55 mb-4">
                Try adjusting your search or filters
              </p>
              <button
                onClick={clearFilters}
                className="text-sky-300 hover:text-sky-200 font-semibold"
              >
                Clear all filters
              </button>
            </GlassCard>
          )}

          {/* Pagination */}
          {!loading && filters?.q && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() =>
                  updateFilters({ page: (currentPage - 1).toString() })
                }
                disabled={currentPage <= 1}
                className="p-2 rounded-xl border border-white/10 bg-white/5 text-white/75 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>

              <span className="px-4 py-2 text-sm text-white/60">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() =>
                  updateFilters({ page: (currentPage + 1).toString() })
                }
                disabled={currentPage >= totalPages}
                className="p-2 rounded-xl border border-white/10 bg-white/5 text-white/75 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------- Repo Card ---------- */

function RepoCard({ repo }: { repo: Repository }) {
  const updatedDate = formatRelativeTime(repo.githubUpdatedAt);

  return (
    <GlassCard className="p-5 md:p-6 hover:bg-white/[0.06] transition-colors">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        {/* Left */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
              <Github size={20} className="text-white/70" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/details/${repo.fullName}`}
                  className="text-lg font-semibold text-white hover:text-sky-300 transition-colors truncate"
                >
                  {repo.fullName}
                </Link>

                <a
                  href={repo.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/45 hover:text-white"
                  aria-label="Open on GitHub"
                >
                  <ExternalLink size={16} />
                </a>
              </div>

              {repo.description && (
                <p className="mt-2 text-white/60 line-clamp-2">
                  {repo.description}
                </p>
              )}
            </div>
          </div>

          {/* Topics */}
          {repo.topics?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {repo.topics.slice(0, 7).map((topic) => (
                <span
                  key={topic}
                  className="rounded-full border border-sky-400/15 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-200"
                >
                  {topic}
                </span>
              ))}
              {repo.topics.length > 7 && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                  +{repo.topics.length - 7}
                </span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/55">
            {repo.language && (
              <div className="flex items-center gap-2">
                <Code size={14} className="text-white/45" />
                {repo.language}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Star size={14} className="text-yellow-300" />
              {repo.stars.toLocaleString()}
            </div>

            <div className="flex items-center gap-2">
              <GitFork size={14} className="text-white/45" />
              {repo.forks.toLocaleString()}
            </div>

            <div className="flex items-center gap-2">
              <Eye size={14} className="text-white/45" />
              {repo.watchers.toLocaleString()}
            </div>

            {repo.license && (
              <div className="flex items-center gap-2">
                <Scale size={14} className="text-white/45" />
                {repo.license}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Clock size={14} className="text-white/45" />
              Updated {updatedDate}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="shrink-0">
          <Link
            href={`/details/${repo.fullName}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </GlassCard>
  );
}

/* ---------- Helper ---------- */

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const w = Math.floor(diffDays / 7);
    return `${w} week${w > 1 ? "s" : ""} ago`;
  }
  if (diffDays < 365) {
    const m = Math.floor(diffDays / 30);
    return `${m} month${m > 1 ? "s" : ""} ago`;
  }
  const y = Math.floor(diffDays / 365);
  return `${y} year${y > 1 ? "s" : ""} ago`;
}
