/**
 * @file src/pages/jobs/index.tsx
 * @description Jobs listing page - browse all job postings
 */

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { jobService } from "@/services/jobService";
import { skillService } from "@/services/skillService";
import { useAuthStore } from "@/store/authStore";
import LoadingSpinner from "@/components/common/Loading";
import {
  Search,
  Filter,
  MapPin,
  Briefcase,
  Building2,
  Clock,
  DollarSign,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Star,
  Users,
  ExternalLink,
} from "lucide-react";

interface Job {
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

interface Skill {
  _id: string;
  name: string;
  slug: string;
  category: string;
}

export default function JobsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  // Mounted state for hydration
  const [mounted, setMounted] = useState(false);

  // Data state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const limit = 12;

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
      skills: (query.skills as string) || "",
      workType: (query.workType as string) || "",
      country: (query.country as string) || "",
      employmentType: (query.employmentType as string) || "",
    };
  }, [mounted, router.isReady, router.query]);

  // Selected skills as array
  const selectedSkills = useMemo(() => {
    return filters?.skills ? filters.skills.split(",").filter(Boolean) : [];
  }, [filters?.skills]);

  // Sync search input with URL
  useEffect(() => {
    if (filters) {
      setSearchInput(filters.q);
    }
  }, [filters?.q]);

  // Fetch skills for filter (once on mount)
  useEffect(() => {
    if (!mounted) return;

    const fetchSkills = async () => {
      try {
        const response = await skillService.getSkills();
        setSkills(response.data || []);
      } catch (err) {
        console.error("Failed to fetch skills:", err);
      }
    };
    fetchSkills();
  }, [mounted]);

  // Fetch featured jobs (once on mount)
  useEffect(() => {
    if (!mounted) return;

    const fetchFeatured = async () => {
      try {
        const response = await jobService.getFeaturedJobs(3);
        setFeaturedJobs(response.data?.jobs || response.data || []);
      } catch (err) {
        console.error("Failed to fetch featured jobs:", err);
      }
    };
    fetchFeatured();
  }, [mounted]);

  // Fetch jobs when filters change
  useEffect(() => {
    if (!filters) return;

    const fetchJobs = async () => {
      setLoading(true);
      try {
        const params: Record<string, any> = {
          page: filters.page,
          limit,
        };

        if (filters.q) params.q = filters.q;
        if (filters.skills) params.skills = filters.skills;
        if (filters.workType) params.workType = filters.workType;
        if (filters.country) params.country = filters.country;
        if (filters.employmentType) params.employmentType = filters.employmentType;

        const response = await jobService.getJobs(params);
        setJobs(response.data?.jobs || []);
        setTotalCount(response.data?.pagination?.total || 0);
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
        setJobs([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [filters]);

  // Update URL params
  const updateFilters = (updates: Record<string, string | null>) => {
    const newQuery: Record<string, string> = { ...router.query } as Record<string, string>;

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

    router.push({ pathname: "/jobs", query: newQuery }, undefined, { shallow: true });
  };

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchInput || null });
  };

  // Handle skill toggle
  const toggleSkill = (slug: string) => {
    const newSkills = selectedSkills.includes(slug)
      ? selectedSkills.filter((s) => s !== slug)
      : [...selectedSkills, slug];

    updateFilters({
      skills: newSkills.length > 0 ? newSkills.join(",") : null,
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchInput("");
    router.push("/jobs", undefined, { shallow: true });
  };

  // Check if any filters are active
  const hasActiveFilters = filters && (
    filters.q ||
    filters.skills ||
    filters.workType ||
    filters.country ||
    filters.employmentType
  );

  const totalPages = Math.ceil(totalCount / limit);
  const currentPage = filters?.page || 1;
  const isRecruiter = user?.role === "RECRUITER";

  // Server-side and initial client render
  if (!mounted) {
    return (
      <>
        <Head>
          <title>Jobs - DevMatch</title>
        </Head>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Jobs</h1>
            <p className="text-gray-600">Discover developer opportunities from top companies</p>
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
        <title>Jobs - DevMatch</title>
        <meta name="description" content="Browse developer job opportunities from top companies" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Jobs</h1>
            <p className="text-gray-600">Discover developer opportunities from top companies</p>
          </div>
          {isRecruiter && (
            <Link
              href="/jobs/create"
              className="mt-4 md:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Post a Job
            </Link>
          )}
        </div>

        {/* Featured Jobs */}
        {featuredJobs.length > 0 && !hasActiveFilters && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="text-yellow-500" size={20} />
              Featured Jobs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredJobs.map((job) => (
                <FeaturedJobCard key={job._id} job={job} />
              ))}
            </div>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search jobs by title, company, or skills..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </form>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters || hasActiveFilters
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter size={20} />
              Filters
              {hasActiveFilters && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {[
                    filters?.q,
                    filters?.skills,
                    filters?.workType,
                    filters?.country,
                    filters?.employmentType,
                  ].filter(Boolean).length}
                </span>
              )}
              <ChevronDown
                size={16}
                className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Work Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Work Type
                  </label>
                  <select
                    value={filters?.workType || ""}
                    onChange={(e) => updateFilters({ workType: e.target.value || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="REMOTE">Remote</option>
                    <option value="ONSITE">On-site</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                </div>

                {/* Employment Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employment Type
                  </label>
                  <select
                    value={filters?.employmentType || ""}
                    onChange={(e) => updateFilters({ employmentType: e.target.value || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="FULL_TIME">Full-time</option>
                    <option value="PART_TIME">Part-time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERNSHIP">Internship</option>
                    <option value="FREELANCE">Freelance</option>
                  </select>
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={filters?.country || ""}
                    onChange={(e) => updateFilters({ country: e.target.value || null })}
                    placeholder="e.g., United States"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <X size={18} />
                    Clear All
                  </button>
                </div>
              </div>

              {/* Skills Filter */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {skills.slice(0, 30).map((skill) => (
                    <button
                      key={skill._id}
                      onClick={() => toggleSkill(skill.slug)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedSkills.includes(skill.slug)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {skill.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-sm text-gray-500">Active filters:</span>
            {filters?.q && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                Search: &quot;{filters.q}&quot;
                <button onClick={() => updateFilters({ q: null })}>
                  <X size={14} />
                </button>
              </span>
            )}
            {filters?.workType && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {filters.workType}
                <button onClick={() => updateFilters({ workType: null })}>
                  <X size={14} />
                </button>
              </span>
            )}
            {filters?.employmentType && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {filters.employmentType.replace("_", " ")}
                <button onClick={() => updateFilters({ employmentType: null })}>
                  <X size={14} />
                </button>
              </span>
            )}
            {selectedSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {skills.find((s) => s.slug === skill)?.name || skill}
                <button onClick={() => toggleSkill(skill)}>
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            {loading ? "Loading..." : `${totalCount} job${totalCount !== 1 ? "s" : ""} found`}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Jobs List */}
        {!loading && jobs.length > 0 && (
          <div className="space-y-4 mb-8">
            {jobs.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && jobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => updateFilters({ page: (currentPage - 1).toString() })}
              disabled={currentPage <= 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => updateFilters({ page: (currentPage + 1).toString() })}
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

// Featured Job Card Component
function FeaturedJobCard({ job }: { job: Job }) {
  const locationString = [job.location?.city, job.location?.country]
    .filter(Boolean)
    .join(", ");

  return (
    <Link
      href={`/jobs/${job._id}`}
      className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 hover:shadow-md transition-shadow block"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
          <Star size={12} />
          Featured
        </span>
        <span className="text-xs text-gray-500">{formatWorkType(job.workType)}</span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{job.title}</h3>
      <p className="text-sm text-gray-600 mb-2">{job.companyName}</p>
      {locationString && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <MapPin size={12} />
          {locationString}
        </div>
      )}
    </Link>
  );
}

// Job Card Component
function JobCard({ job }: { job: Job }) {
  const locationString = [job.location?.city, job.location?.state, job.location?.country]
    .filter(Boolean)
    .join(", ");

  const salaryString = job.salary?.isVisible && job.salary?.min
    ? formatSalary(job.salary.min, job.salary.max, job.salary.currency)
    : null;

  const postedDate = formatRelativeTime(job.createdAt);

  return (
    <Link
      href={`/jobs/${job._id}`}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow block"
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        {/* Left side - Job info */}
        <div className="flex-1">
          <div className="flex items-start gap-4">
            {/* Company avatar placeholder */}
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {job.companyName.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 text-lg">{job.title}</h3>
                {job.isFeatured && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                    <Star size={10} />
                    Featured
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Building2 size={14} className="text-gray-400" />
                <span>{job.companyName}</span>
              </div>

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                {locationString && (
                  <div className="flex items-center gap-1">
                    <MapPin size={14} className="text-gray-400" />
                    {locationString}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Briefcase size={14} className="text-gray-400" />
                  {formatWorkType(job.workType)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} className="text-gray-400" />
                  {formatEmploymentType(job.employmentType)}
                </div>
                {salaryString && (
                  <div className="flex items-center gap-1 text-green-600 font-medium">
                    <DollarSign size={14} />
                    {salaryString}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Skills */}
          {job.requiredSkills && job.requiredSkills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-4">
              {job.requiredSkills.slice(0, 6).map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                >
                  {skill}
                </span>
              ))}
              {job.requiredSkills.length > 6 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                  +{job.requiredSkills.length - 6}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right side - Posted time & stats */}
        <div className="flex md:flex-col items-center md:items-end gap-4 md:gap-2 text-sm text-gray-500">
          <span>{postedDate}</span>
          {job.applicationCount !== undefined && (
            <div className="flex items-center gap-1">
              <Users size={14} />
              {job.applicationCount} applicant{job.applicationCount !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// Helper functions
function formatWorkType(type: string): string {
  const types: Record<string, string> = {
    REMOTE: "Remote",
    ONSITE: "On-site",
    HYBRID: "Hybrid",
  };
  return types[type] || type;
}

function formatEmploymentType(type: string): string {
  const types: Record<string, string> = {
    FULL_TIME: "Full-time",
    PART_TIME: "Part-time",
    CONTRACT: "Contract",
    INTERNSHIP: "Internship",
    FREELANCE: "Freelance",
  };
  return types[type] || type;
}

function formatSalary(min: number, max?: number, currency = "USD"): string {
  const formatNum = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
    return n.toString();
  };

  if (max) {
    return `${currency} ${formatNum(min)} - ${formatNum(max)}`;
  }
  return `${currency} ${formatNum(min)}+`;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? "s" : ""} ago`;
}