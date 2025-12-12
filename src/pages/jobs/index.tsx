/**
 * @file src/pages/jobs/index.tsx
 * @description Jobs listing page - browse all job postings (dark premium theme)
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
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
  Sparkles,
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

/** Glass card wrapper */
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

const pop: Variants = {
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

export default function JobsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

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
    if (filters) setSearchInput(filters.q);
  }, [filters?.q]);

  // Fetch skills for filter (once on mount)
  useEffect(() => {
    if (!mounted) return;

    const fetchSkills = async () => {
      try {
        const response = await skillService.getSkills();
        const data = response.data?.data || response.data;
        setSkills(Array.isArray(data) ? data : []);
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
        const data = response.data?.data || response.data;
        setFeaturedJobs(data?.jobs || []);
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
        if (filters.employmentType)
          params.employmentType = filters.employmentType;

        const response = await jobService.getJobs(params);
        const data = response.data?.data || response.data;
        setJobs(data?.jobs || []);
        setTotalCount(data?.pagination?.total || 0);
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

    router.push({ pathname: "/jobs", query: newQuery }, undefined, {
      shallow: true,
    });
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
  const hasActiveFilters =
    filters &&
    (filters.q ||
      filters.skills ||
      filters.workType ||
      filters.country ||
      filters.employmentType);

  const totalPages = Math.ceil(totalCount / limit);
  const currentPage = filters?.page || 1;
  const isRecruiter = user?.role === "RECRUITER";

  // SSR and initial client render
  if (!mounted) {
    return (
      <>
        <Head>
          <title>Jobs - DevMatch</title>
        </Head>
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Find Jobs</h1>
            <p className="mt-2 text-white/60">
              Discover developer opportunities from top companies
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
        <title>Jobs - DevMatch</title>
        <meta
          name="description"
          content="Browse developer job opportunities from top companies"
        />
      </Head>

      {/* Page background accents (match Home vibe) */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-[10%] h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="absolute -top-24 right-[12%] h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="absolute top-40 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:28px_28px] opacity-40" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-10">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75">
                <Sparkles size={16} className="text-yellow-300" />
                Fresh roles. Better signal.
              </div>
              <h1 className="mt-4 text-3xl md:text-4xl font-bold text-white">
                Find Jobs
              </h1>
              <p className="mt-2 text-white/60">
                Discover developer opportunities from top companies.
              </p>
            </div>

            {isRecruiter && (
              <Link
                href="/jobs/create"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90"
              >
                <Plus size={18} />
                Post a Job
              </Link>
            )}
          </div>

          {/* Featured Jobs */}
          {featuredJobs.length > 0 && !hasActiveFilters && (
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-2 text-white/90">
                <Star className="text-yellow-300" size={18} />
                <h2 className="text-sm font-semibold tracking-wide uppercase">
                  Featured Jobs
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {featuredJobs.map((job) => (
                  <FeaturedJobCard key={job._id} job={job} />
                ))}
              </div>
            </div>
          )}

          {/* Search + Filters */}
          <GlassCard className="p-4 md:p-5 mb-6">
            <div className="flex flex-col gap-4 md:flex-row">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45"
                    size={18}
                  />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by title, company, or skills..."
                    className={[
                      "w-full rounded-2xl border border-white/10 bg-white/5",
                      "pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/35",
                      "outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400/40",
                    ].join(" ")}
                  />
                </div>
              </form>

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={[
                  "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold",
                  "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10",
                  showFilters || hasActiveFilters
                    ? "ring-2 ring-sky-500/30"
                    : "",
                ].join(" ")}
              >
                <Filter size={18} />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 rounded-full bg-white text-black text-xs px-2 py-0.5">
                    {
                      [
                        filters?.q,
                        filters?.skills,
                        filters?.workType,
                        filters?.country,
                        filters?.employmentType,
                      ].filter(Boolean).length
                    }
                  </span>
                )}
                <ChevronDown
                  size={16}
                  className={[
                    "transition-transform",
                    showFilters ? "rotate-180" : "",
                  ].join(" ")}
                />
              </button>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={pop}
                  className="mt-4 border-t border-white/10 pt-4"
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Work type */}
                    <div>
                      <label className="block text-sm font-medium text-white/75 mb-2">
                        Work Type
                      </label>
                      <select
                        value={filters?.workType || ""}
                        onChange={(e) =>
                          updateFilters({ workType: e.target.value || null })
                        }
                        className={[
                          "w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white",
                          "outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400/40",
                        ].join(" ")}
                      >
                        <option value="">All Types</option>
                        <option value="REMOTE">Remote</option>
                        <option value="ONSITE">On-site</option>
                        <option value="HYBRID">Hybrid</option>
                      </select>
                    </div>

                    {/* Employment type */}
                    <div>
                      <label className="block text-sm font-medium text-white/75 mb-2">
                        Employment Type
                      </label>
                      <select
                        value={filters?.employmentType || ""}
                        onChange={(e) =>
                          updateFilters({
                            employmentType: e.target.value || null,
                          })
                        }
                        className={[
                          "w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white",
                          "outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400/40",
                        ].join(" ")}
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
                      <label className="block text-sm font-medium text-white/75 mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        value={filters?.country || ""}
                        onChange={(e) =>
                          updateFilters({ country: e.target.value || null })
                        }
                        placeholder="e.g., United States"
                        className={[
                          "w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-white/35",
                          "outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400/40",
                        ].join(" ")}
                      />
                    </div>

                    {/* Clear */}
                    <div className="flex items-end">
                      <button
                        onClick={clearFilters}
                        disabled={!hasActiveFilters}
                        className={[
                          "w-full inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold",
                          "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                        ].join(" ")}
                      >
                        <X size={18} />
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mt-5">
                    <label className="block text-sm font-medium text-white/75 mb-3">
                      Skills
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                      {skills.slice(0, 30).map((skill) => {
                        const active = selectedSkills.includes(skill.slug);
                        return (
                          <button
                            key={skill._id}
                            onClick={() => toggleSkill(skill.slug)}
                            className={[
                              "rounded-full px-3 py-1 text-sm transition-colors border",
                              active
                                ? "border-sky-400/30 bg-sky-500/15 text-white"
                                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
                            ].join(" ")}
                          >
                            {skill.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* Active filters chips */}
          {hasActiveFilters && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="text-sm text-white/45">Active filters:</span>

              {filters?.q && (
                <Chip onClear={() => updateFilters({ q: null })}>
                  Search: “{filters.q}”
                </Chip>
              )}

              {filters?.workType && (
                <Chip onClear={() => updateFilters({ workType: null })}>
                  {formatWorkType(filters.workType)}
                </Chip>
              )}

              {filters?.employmentType && (
                <Chip onClear={() => updateFilters({ employmentType: null })}>
                  {formatEmploymentType(filters.employmentType)}
                </Chip>
              )}

              {selectedSkills.map((slug) => (
                <Chip key={slug} onClear={() => toggleSkill(slug)}>
                  {skills.find((s) => s.slug === slug)?.name || slug}
                </Chip>
              ))}
            </div>
          )}

          {/* Results count */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-white/60 text-sm">
              {loading
                ? "Loading..."
                : `${totalCount} job${totalCount !== 1 ? "s" : ""} found`}
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* List */}
          {!loading && jobs.length > 0 && (
            <div className="space-y-4 mb-8">
              {jobs.map((job) => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && jobs.length === 0 && (
            <GlassCard className="p-10 text-center">
              <Briefcase className="mx-auto text-white/25 mb-4" size={64} />
              <h3 className="text-lg font-semibold text-white mb-2">
                No jobs found
              </h3>
              <p className="text-white/55 mb-4">
                Try adjusting your search or filters
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sky-300 hover:text-sky-200 font-semibold"
                >
                  Clear all filters
                </button>
              )}
            </GlassCard>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
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

/* ---------- UI Helpers ---------- */

function Chip({
  children,
  onClear,
}: {
  children: React.ReactNode;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/75">
      {children}
      <button
        type="button"
        onClick={onClear}
        className="rounded-full p-1 hover:bg-white/10 text-white/60 hover:text-white"
        aria-label="Remove filter"
      >
        <X size={14} />
      </button>
    </span>
  );
}

/* ---------- Cards ---------- */

function FeaturedJobCard({ job }: { job: Job }) {
  const locationString = [job.location?.city, job.location?.country]
    .filter(Boolean)
    .join(", ");

  return (
    <Link href={`/jobs/${job._id}`} className="block">
      <GlassCard className="p-5 hover:bg-white/[0.06] transition-colors">
        <div className="flex items-start justify-between mb-3">
          <span className="inline-flex items-center gap-1 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-3 py-1 text-xs font-semibold text-yellow-200">
            <Star size={12} className="text-yellow-200" />
            Featured
          </span>

          <span className="text-xs text-white/55">
            {formatWorkType(job.workType)}
          </span>
        </div>

        <h3 className="text-white font-semibold line-clamp-1">{job.title}</h3>
        <p className="mt-1 text-sm text-white/60">{job.companyName}</p>

        {locationString && (
          <div className="mt-3 flex items-center gap-2 text-xs text-white/55">
            <MapPin size={12} className="text-white/45" />
            {locationString}
          </div>
        )}
      </GlassCard>
    </Link>
  );
}

function JobCard({ job }: { job: Job }) {
  const locationString = [
    job.location?.city,
    job.location?.state,
    job.location?.country,
  ]
    .filter(Boolean)
    .join(", ");

  const salaryString =
    job.salary?.isVisible && job.salary?.min
      ? formatSalary(job.salary.min, job.salary.max, job.salary.currency)
      : null;

  const postedDate = formatRelativeTime(job.createdAt);

  return (
    <Link href={`/jobs/${job._id}`} className="block">
      <GlassCard className="p-6 hover:bg-white/[0.06] transition-colors">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          {/* Left */}
          <div className="flex-1">
            <div className="flex items-start gap-4">
              {/* Company initial */}
              <div className="h-12 w-12 rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/40 to-fuchsia-500/20 grid place-items-center text-white font-bold">
                {job.companyName?.charAt(0).toUpperCase() || "C"}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-semibold text-lg truncate">
                    {job.title}
                  </h3>
                  {job.isFeatured && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-2 py-0.5 text-[11px] font-semibold text-yellow-200">
                      <Star size={10} className="text-yellow-200" />
                      Featured
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-white/60 mb-2">
                  <Building2 size={14} className="text-white/40" />
                  <span className="truncate">{job.companyName}</span>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/55">
                  {locationString && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-white/40" />
                      {locationString}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Briefcase size={14} className="text-white/40" />
                    {formatWorkType(job.workType)}
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-white/40" />
                    {formatEmploymentType(job.employmentType)}
                  </div>

                  {salaryString && (
                    <div className="flex items-center gap-2 text-emerald-200 font-semibold">
                      <DollarSign size={14} />
                      {salaryString}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Skills */}
            {job.requiredSkills?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {job.requiredSkills.slice(0, 6).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                  >
                    {skill}
                  </span>
                ))}
                {job.requiredSkills.length > 6 && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/55">
                    +{job.requiredSkills.length - 6}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right */}
          <div className="flex md:flex-col items-start md:items-end gap-3 text-sm text-white/55">
            <span>{postedDate}</span>
            {job.applicationCount !== undefined && (
              <div className="flex items-center gap-2">
                <Users size={14} className="text-white/45" />
                {job.applicationCount} applicant
                {job.applicationCount !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}

/* ---------- Helper functions (unchanged logic) ---------- */

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
  if (max) return `${currency} ${formatNum(min)} - ${formatNum(max)}`;
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
