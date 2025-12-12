/**
 * @file src/pages/developers.tsx
 * @description Browse and search developers (dark premium theme)
 */

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { developerService } from "@/services/developerService";
import { skillService } from "@/services/skillService";
import LoadingSpinner from "@/components/common/Loading";
import {
  Search,
  Filter,
  MapPin,
  Briefcase,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Github,
  Users,
  Sparkles,
} from "lucide-react";

interface Developer {
  _id: string;
  user: {
    _id: string;
    username: string;
    avatar: string | null;
  } | null;
  headline: string;
  bio: string;
  skills: string[];
  yearsOfExperience: number;
  location: {
    city?: string;
    state?: string;
    country?: string;
  };
  isOpenToWork: boolean;
  preferredWorkTypes: string[];
  githubUsername: string | null;
  profileCompleteness: number;
}

interface Skill {
  _id: string;
  name: string;
  slug: string;
  category: string;
}

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

export default function DevelopersPage() {
  const router = useRouter();

  // State
  const [mounted, setMounted] = useState(false);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const limit = 12;

  // Handle hydration - only run on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Parse URL params - only when mounted and router ready
  const filters = useMemo(() => {
    if (!mounted || !router.isReady) return null;

    const { query } = router;
    return {
      page: parseInt((query.page as string) || "1", 10),
      q: (query.q as string) || "",
      skills: (query.skills as string) || "",
      minExp: (query.minExp as string) || "",
      maxExp: (query.maxExp as string) || "",
      country: (query.country as string) || "",
      openToWork: query.openToWork === "true",
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
        setSkills(response.data?.data || response.data || []);
      } catch (err) {
        console.error("Failed to fetch skills:", err);
      }
    };
    fetchSkills();
  }, [mounted]);

  // Fetch developers when filters change
  useEffect(() => {
    if (!filters) return;

    const fetchDevelopers = async () => {
      setLoading(true);
      try {
        const params: Record<string, any> = {
          page: filters.page,
          limit,
        };

        if (filters.q) params.q = filters.q;
        if (filters.skills) params.skills = filters.skills;
        if (filters.minExp) params.minExp = filters.minExp;
        if (filters.maxExp) params.maxExp = filters.maxExp;
        if (filters.country) params.country = filters.country;
        if (filters.openToWork) params.openToWork = true;

        const response = await developerService.getDevelopers(params);
        setDevelopers(response.data?.data?.developers || []);
        setTotalCount(response.data?.data?.pagination?.total || 0);
      } catch (err) {
        console.error("Failed to fetch developers:", err);
        setDevelopers([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchDevelopers();
  }, [filters]);

  // Update URL params
  const updateFilters = (updates: Record<string, string | null>) => {
    const newQuery: Record<string, string> = {
      ...router.query,
    } as Record<string, string>;

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

    router.push({ pathname: "/developers", query: newQuery }, undefined, {
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
    router.push("/developers", undefined, { shallow: true });
  };

  // Check if any filters are active
  const hasActiveFilters =
    filters &&
    (filters.q ||
      filters.skills ||
      filters.minExp ||
      filters.maxExp ||
      filters.country ||
      filters.openToWork);

  const totalPages = Math.ceil(totalCount / limit);
  const currentPage = filters?.page || 1;

  // Server-side and initial client render
  if (!mounted) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Find Developers</h1>
          <p className="mt-2 text-white/60">
            Discover talented developers for your next project
          </p>
        </div>
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-[10%] h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -top-24 right-[12%] h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute top-40 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:28px_28px] opacity-40" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75">
            <Sparkles size={16} className="text-yellow-300" />
            Signal-first profiles.
          </div>

          <h1 className="mt-4 text-3xl md:text-4xl font-bold text-white">
            Find Developers
          </h1>
          <p className="mt-2 text-white/60">
            Discover talented developers for your next project
          </p>
        </div>

        {/* Search + Filters */}
        <GlassCard className="p-4 md:p-5 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
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
                  placeholder="Search by name, headline, or skills..."
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
                showFilters || hasActiveFilters ? "ring-2 ring-sky-500/30" : "",
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
                      filters?.minExp,
                      filters?.maxExp,
                      filters?.country,
                      filters?.openToWork,
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

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={panel}
                className="mt-4 pt-4 border-t border-white/10"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Experience */}
                  <div>
                    <label className="block text-sm font-medium text-white/75 mb-2">
                      Experience (years)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={filters?.minExp || ""}
                        onChange={(e) =>
                          updateFilters({ minExp: e.target.value || null })
                        }
                        placeholder="Min"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:ring-2 focus:ring-sky-500/40"
                      />
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={filters?.maxExp || ""}
                        onChange={(e) =>
                          updateFilters({ maxExp: e.target.value || null })
                        }
                        placeholder="Max"
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:ring-2 focus:ring-sky-500/40"
                      />
                    </div>
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
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:ring-2 focus:ring-sky-500/40"
                    />
                  </div>

                  {/* Open to work */}
                  <div>
                    <label className="block text-sm font-medium text-white/75 mb-2">
                      Availability
                    </label>
                    <button
                      onClick={() =>
                        updateFilters({
                          openToWork: filters?.openToWork ? null : "true",
                        })
                      }
                      className={[
                        "w-full rounded-2xl px-3 py-3 text-sm font-semibold border transition-colors",
                        filters?.openToWork
                          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                          : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10",
                      ].join(" ")}
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        <CheckCircle size={18} />
                        Open to Work Only
                      </span>
                    </button>
                  </div>

                  {/* Clear */}
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      disabled={!hasActiveFilters}
                      className="w-full rounded-2xl px-3 py-3 text-sm font-semibold border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
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

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-sm text-white/45">Active filters:</span>

            {filters?.q && (
              <Chip onClear={() => updateFilters({ q: null })}>
                Search: “{filters.q}”
              </Chip>
            )}

            {filters?.openToWork && (
              <Chip onClear={() => updateFilters({ openToWork: null })}>
                Open to Work
              </Chip>
            )}

            {selectedSkills.map((slug) => (
              <Chip key={slug} onClear={() => toggleSkill(slug)}>
                {skills.find((s) => s.slug === slug)?.name || slug}
              </Chip>
            ))}
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-white/60 text-sm">
            {loading
              ? "Loading..."
              : `${totalCount} developer${totalCount !== 1 ? "s" : ""} found`}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Grid */}
        {!loading && developers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {developers
              .filter((d) => d.user !== null)
              .map((developer) => (
                <DeveloperCard key={developer._id} developer={developer} />
              ))}
          </div>
        )}

        {/* Empty */}
        {!loading && developers.length === 0 && (
          <GlassCard className="p-10 text-center">
            <Users className="mx-auto text-white/25 mb-4" size={64} />
            <h3 className="text-lg font-semibold text-white mb-2">
              No developers found
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
  );
}

/* ---------- Developer Card ---------- */

function DeveloperCard({ developer }: { developer: Developer }) {
  const locationString = [
    developer.location?.city,
    developer.location?.state,
    developer.location?.country,
  ]
    .filter(Boolean)
    .join(", ");

  const username = developer.user?.username || "Developer";
  const profileHref = developer.user?.username
    ? `/profile/${developer.user.username}`
    : "/developers";

  const gradients = [
    "from-sky-500/40 to-fuchsia-500/20",
    "from-emerald-500/40 to-cyan-500/20",
    "from-orange-500/40 to-rose-500/20",
    "from-violet-500/40 to-fuchsia-500/20",
    "from-teal-500/40 to-sky-500/20",
    "from-pink-500/40 to-amber-500/20",
  ];
  const gradient = gradients[username.charCodeAt(0) % gradients.length];

  return (
    <Link href={profileHref} className="group block">
      <GlassCard className="overflow-hidden hover:bg-white/[0.06] transition-colors">
        {/* Banner */}
        <div className={`relative h-20 bg-gradient-to-br ${gradient}`}>
          {developer.isOpenToWork && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Open to Work
              </span>
            </div>
          )}
        </div>

        <div className="px-5 pb-5">
          {/* Avatar */}
          <div className="-mt-10 mb-3">
            {developer.user?.avatar ? (
              <img
                src={developer.user.avatar}
                alt={username}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-[#070A12] shadow-md"
              />
            ) : (
              <div
                className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-2xl font-bold border-4 border-[#070A12] shadow-md`}
              >
                {username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name */}
          <div className="mb-4">
            <h3 className="font-semibold text-lg text-white group-hover:text-sky-300 transition-colors">
              {username}
            </h3>

            {developer.headline ? (
              <p className="text-sm text-white/60 line-clamp-2 mt-1">
                {developer.headline}
              </p>
            ) : (
              <p className="text-sm text-white/45 mt-1">Developer</p>
            )}
          </div>

          {/* Info pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {developer.yearsOfExperience > 0 && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/75">
                <Briefcase size={12} className="text-white/55" />
                {developer.yearsOfExperience} yr
                {developer.yearsOfExperience !== 1 ? "s" : ""} exp
              </span>
            )}

            {locationString && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/75">
                <MapPin size={12} className="text-white/55" />
                <span className="truncate max-w-[160px]">{locationString}</span>
              </span>
            )}

            {developer.githubUsername && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/75">
                <Github size={12} className="text-white/55" />
                {developer.githubUsername}
              </span>
            )}
          </div>

          {/* Skills */}
          {developer.skills?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {developer.skills.slice(0, 6).map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-200"
                >
                  {skill}
                </span>
              ))}
              {developer.skills.length > 6 && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                  +{developer.skills.length - 6}
                </span>
              )}
            </div>
          ) : (
            <div className="text-xs text-white/45">No skills added yet</div>
          )}
        </div>
      </GlassCard>
    </Link>
  );
}
