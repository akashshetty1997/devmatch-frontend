/**
 * @file src/components/search/SearchContainer.tsx
 * @description Main search container with state management
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { githubAPI } from "@/lib/api";
import SearchHeader from "./SearchHeader";
import SearchFilters from "./SearchFilters";
import SearchResults from "./SearchResults";

export interface SearchFilters {
  language: string;
  sort: string;
  order: string;
  minStars: number;
}

export interface SearchResult {
  _id: string;
  githubId: number;
  name: string;
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  watchers: number;
  htmlUrl: string;
  topics: string[];
  ownerLogin: string;
  updatedAt: string;
  license: string | null;
}

export default function SearchContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial values from URL with null checks
  const initialQuery = searchParams?.get("q") || "";
  const initialLanguage = searchParams?.get("language") || "";
  const initialSort = searchParams?.get("sort") || "stars";
  const initialOrder = searchParams?.get("order") || "desc";

  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>({
    language: initialLanguage,
    sort: initialSort,
    order: initialOrder,
    minStars: 0,
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Ref for debounce timeout
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Update URL when search changes
  const updateURL = useCallback(
    (q: string, f: SearchFilters) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (f.language) params.set("language", f.language);
      if (f.sort !== "stars") params.set("sort", f.sort);
      if (f.order !== "desc") params.set("order", f.order);

      const newUrl = params.toString()
        ? `/search?${params.toString()}`
        : "/search";
      router.push(newUrl, { scroll: false });
    },
    [router]
  );

  // Search function
  const performSearch = useCallback(
    async (
      searchQuery: string,
      searchFilters: SearchFilters,
      pageNum: number
    ) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await githubAPI.searchRepos({
          q: searchQuery,
          language: searchFilters.language,
          sort: searchFilters.sort,
          order: searchFilters.order,
          page: pageNum,
          per_page: 20,
        });

        const data = response.data.data;
        const newResults = data.items || [];

        if (pageNum === 1) {
          setResults(newResults);
        } else {
          setResults((prev) => [...prev, ...newResults]);
        }

        setTotalCount(data.total_count || 0);
        setHasMore(
          newResults.length === 20 &&
            pageNum * 20 < Math.min(data.total_count, 1000)
        );
      } catch (err: any) {
        console.error("Search error:", err);
        setError(
          err.response?.data?.message || "Failed to search repositories"
        );
        if (pageNum === 1) {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Search when query or filters change with debounce
  useEffect(() => {
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout
    debounceRef.current = setTimeout(() => {
      setPage(1);
      performSearch(query, filters, 1);
      if (query) {
        updateURL(query, filters);
      }
    }, 500);

    // Cleanup
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, filters, performSearch, updateURL]);

  // Load more
  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      performSearch(query, filters, nextPage);
    }
  };

  // Handle filter change
  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      language: "",
      sort: "stars",
      order: "desc",
      minStars: 0,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <SearchHeader
        query={query}
        onQueryChange={setQuery}
        totalCount={totalCount}
        loading={loading}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <SearchFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
            />
          </aside>

          {/* Results */}
          <main className="flex-1">
            <SearchResults
              results={results}
              loading={loading}
              error={error}
              query={query}
              hasMore={hasMore}
              onLoadMore={loadMore}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
