/**
 * @file src/pages/developers.tsx
 * @description Browse and search developers
 */

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
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
} from "lucide-react";

interface Developer {
  _id: string;
  user: {
    _id: string;
    username: string;
    avatar: string | null;
  };
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
        setSkills(response.data?.data || response.data || []);  // FIXED: Added extra .data (if needed)
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
        setDevelopers(response.data?.data?.developers || []);  // FIXED: Added extra .data
        setTotalCount(response.data?.data?.pagination?.total || 0);  // FIXED: Added extra .data
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

    router.push({ pathname: "/developers", query: newQuery }, undefined, { shallow: true });
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
  const hasActiveFilters = filters && (
    filters.q ||
    filters.skills ||
    filters.minExp ||
    filters.maxExp ||
    filters.country ||
    filters.openToWork
  );

  const totalPages = Math.ceil(totalCount / limit);
  const currentPage = filters?.page || 1;

  // Server-side and initial client render - show consistent loading state
  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Find Developers
          </h1>
          <p className="text-gray-600">
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Find Developers
        </h1>
        <p className="text-gray-600">
          Discover talented developers for your next project
        </p>
      </div>

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
                placeholder="Search by name, headline, or skills..."
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
                  filters?.minExp,
                  filters?.maxExp,
                  filters?.country,
                  filters?.openToWork,
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
              {/* Experience Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience (years)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={filters?.minExp || ""}
                    onChange={(e) => updateFilters({ minExp: e.target.value || null })}
                    placeholder="Min"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={filters?.maxExp || ""}
                    onChange={(e) => updateFilters({ maxExp: e.target.value || null })}
                    placeholder="Max"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
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

              {/* Open to Work */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Availability
                </label>
                <button
                  onClick={() => updateFilters({ openToWork: filters?.openToWork ? null : "true" })}
                  className={`w-full px-3 py-2 border rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    filters?.openToWork
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <CheckCircle size={18} />
                  Open to Work Only
                </button>
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
          {filters?.openToWork && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              Open to Work
              <button onClick={() => updateFilters({ openToWork: null })}>
                <X size={14} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600">
          {loading
            ? "Loading..."
            : `${totalCount} developer${totalCount !== 1 ? "s" : ""} found`}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Developers Grid */}
      {!loading && developers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {developers.map((developer) => (
            <DeveloperCard key={developer._id} developer={developer} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && developers.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No developers found
          </h3>
          <p className="text-gray-500 mb-4">
            Try adjusting your search or filters
          </p>
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
  );
}

// Developer Card Component
function DeveloperCard({ developer }: { developer: Developer }) {
  const locationString = [
    developer.location?.city,
    developer.location?.state,
    developer.location?.country,
  ]
    .filter(Boolean)
    .join(", ");

  // Generate gradient based on username for variety
  const gradients = [
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-rose-600",
    "from-violet-500 to-purple-600",
    "from-cyan-500 to-blue-600",
    "from-pink-500 to-rose-600",
    "from-amber-500 to-orange-600",
    "from-teal-500 to-cyan-600",
  ];
  const gradientIndex = developer.user.username.charCodeAt(0) % gradients.length;
  const gradient = gradients[gradientIndex];

  return (
    <Link
      href={`/profile/${developer.user.username}`}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-300 block"
    >
      {/* Header Banner */}
      <div className={`h-20 bg-gradient-to-br ${gradient} relative`}>
        {developer.isOpenToWork && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/95 backdrop-blur-sm text-green-700 rounded-full text-xs font-semibold shadow-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Open to Work
            </span>
          </div>
        )}
      </div>

      <div className="px-5 pb-5">
        {/* Avatar - Overlapping banner */}
        <div className="-mt-10 mb-3">
          {developer.user.avatar ? (
            <img
              src={developer.user.avatar}
              alt={developer.user.username}
              className="w-20 h-20 rounded-xl object-cover border-4 border-white shadow-md"
            />
          ) : (
            <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-md`}>
              {developer.user.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Name & Headline */}
        <div className="mb-4">
          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
            {developer.user.username}
          </h3>
          {developer.headline ? (
            <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">
              {developer.headline}
            </p>
          ) : (
            <p className="text-sm text-gray-400 mt-0.5">Developer</p>
          )}
        </div>

        {/* Info Pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {developer.yearsOfExperience > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
              <Briefcase size={12} />
              {developer.yearsOfExperience} yr{developer.yearsOfExperience !== 1 ? "s" : ""} exp
            </span>
          )}
          {locationString && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
              <MapPin size={12} />
              <span className="truncate max-w-[120px]">{locationString}</span>
            </span>
          )}
          {developer.githubUsername && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
              <Github size={12} />
              {developer.githubUsername}
            </span>
          )}
        </div>

        {/* Skills */}
        {developer.skills && developer.skills.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {developer.skills.slice(0, 5).map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-medium"
              >
                {skill}
              </span>
            ))}
            {developer.skills.length > 5 && (
              <span className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded-md text-xs">
                +{developer.skills.length - 5}
              </span>
            )}
          </div>
        ) : (
          <div className="text-xs text-gray-400">No skills added yet</div>
        )}
      </div>
    </Link>
  );
}