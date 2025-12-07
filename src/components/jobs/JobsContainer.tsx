/**
 * @file src/components/jobs/JobsContainer.tsx
 * @description Main jobs container with filters and listing
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { jobAPINew as jobAPI, skillAPI } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import JobsHeader from "./JobsHeader";
import JobsFilters from "./JobsFilters";
import JobsList from "./JobsList";

export interface JobFilters {
  q: string;
  skills: string[];
  workType: string;
  location: string;
  minSalary: number;
  sort: string;
}

export interface Job {
  _id: string;
  title: string;
  companyName: string;
  description: string;
  location: {
    city?: string;
    state?: string;
    country?: string;
  };
  workType: string;
  requiredSkills: string[];
  preferredSkills: string[];
  minYearsExperience: number;
  maxYearsExperience: number | null;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
    isVisible?: boolean;
  };
  employmentType: string;
  applicationDeadline: string | null;
  isActive: boolean;
  isFeatured: boolean;
  viewCount: number;
  createdAt: string;
  recruiter: {
    _id: string;
    username: string;
    avatar: string | null;
  };
  applicationCount?: number;
}

export default function JobsContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  // Get initial values from URL with null checks
  const initialQuery = searchParams?.get("q") || "";
  const initialWorkType = searchParams?.get("workType") || "";
  const initialSkills =
    searchParams?.get("skills")?.split(",").filter(Boolean) || [];

  const [filters, setFilters] = useState<JobFilters>({
    q: initialQuery,
    skills: initialSkills,
    workType: initialWorkType,
    location: "",
    minSalary: 0,
    sort: "newest",
  });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [availableSkills, setAvailableSkills] = useState<any[]>([]);

  // Ref for debounce timeout
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch available skills for filter
  useEffect(() => {
    skillAPI.getAll().then((res) => {
      setAvailableSkills(res.data.data || []);
    });
  }, []);

  // Update URL with filters
  const updateURL = useCallback(
    (f: JobFilters) => {
      const params = new URLSearchParams();
      if (f.q) params.set("q", f.q);
      if (f.workType) params.set("workType", f.workType);
      if (f.skills.length > 0) params.set("skills", f.skills.join(","));

      const newUrl = params.toString() ? `/jobs?${params.toString()}` : "/jobs";
      router.push(newUrl, { scroll: false });
    },
    [router]
  );

  // Fetch jobs
  const fetchJobs = useCallback(
    async (searchFilters: JobFilters, pageNum: number, append = false) => {
      setLoading(true);
      setError(null);

      try {
        const response = await jobAPI.getAll({
          q: searchFilters.q,
          skills:
            searchFilters.skills.length > 0 ? searchFilters.skills : undefined,
          workType: searchFilters.workType || undefined,
          page: pageNum,
          limit: 10,
        });

        const data = response.data.data;
        const newJobs = data.jobs || [];

        if (append) {
          setJobs((prev) => [...prev, ...newJobs]);
        } else {
          setJobs(newJobs);
        }

        setTotalCount(data.pagination?.total || 0);
        setHasMore(newJobs.length === 10);
      } catch (err: any) {
        console.error("Failed to fetch jobs:", err);
        setError(err.response?.data?.message || "Failed to load jobs");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Fetch featured jobs
  useEffect(() => {
    jobAPI.getFeatured(3).then((res) => {
      setFeaturedJobs(res.data.data || []);
    });
  }, []);

  // Fetch on filter change with debounce
  useEffect(() => {
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchJobs(filters, 1, false);
      updateURL(filters);
    }, 300);

    // Cleanup
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [filters, fetchJobs, updateURL]);

  // Load more
  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchJobs(filters, nextPage, true);
    }
  };

  // Handle filter change
  const handleFilterChange = (newFilters: Partial<JobFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      q: "",
      skills: [],
      workType: "",
      location: "",
      minSalary: 0,
      sort: "newest",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <JobsHeader
        query={filters.q}
        onQueryChange={(q) => handleFilterChange({ q })}
        totalCount={totalCount}
        loading={loading}
        isRecruiter={user?.role === "RECRUITER"}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <JobsFilters
              filters={filters}
              availableSkills={availableSkills}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
            />
          </aside>

          {/* Jobs List */}
          <main className="flex-1">
            <JobsList
              jobs={jobs}
              featuredJobs={featuredJobs}
              loading={loading}
              error={error}
              hasMore={hasMore}
              onLoadMore={loadMore}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
