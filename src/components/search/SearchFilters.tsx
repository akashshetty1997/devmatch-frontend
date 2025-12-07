/**
 * @file src/components/search/SearchFilters.tsx
 * @description Search filters sidebar
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiFilter, FiChevronDown, FiX } from "react-icons/fi";
import { Card, CardBody, Button } from "@/components/common";
import { cn } from "@/lib/utils";
import { SearchFilters as FilterType } from "./SearchContainer";

interface SearchFiltersProps {
  filters: FilterType;
  onFilterChange: (filters: Partial<FilterType>) => void;
  onClearFilters: () => void;
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
  "HTML",
  "CSS",
  "Shell",
];

const SORT_OPTIONS = [
  { value: "stars", label: "Stars" },
  { value: "forks", label: "Forks" },
  { value: "updated", label: "Recently Updated" },
  { value: "help-wanted-issues", label: "Help Wanted Issues" },
];

export default function SearchFilters({
  filters,
  onFilterChange,
  onClearFilters,
}: SearchFiltersProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    language: true,
    sort: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const hasActiveFilters =
    filters.language || filters.sort !== "stars" || filters.order !== "desc";

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center text-red-600 hover:bg-red-50"
          onClick={onClearFilters}
          leftIcon={<FiX />}
        >
          Clear All Filters
        </Button>
      )}

      {/* Language Filter */}
      <div>
        <button
          onClick={() => toggleSection("language")}
          className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3"
        >
          <span>Language</span>
          <FiChevronDown
            className={cn(
              "w-4 h-4 text-gray-500 transition-transform",
              expandedSections.language && "rotate-180"
            )}
          />
        </button>
        <AnimatePresence>
          {expandedSections.language && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-1 max-h-64 overflow-y-auto pr-2">
                <button
                  onClick={() => onFilterChange({ language: "" })}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    !filters.language
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  All Languages
                </button>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => onFilterChange({ language: lang })}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2",
                      filters.language === lang
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <LanguageDot language={lang} />
                    {lang}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sort Filter */}
      <div>
        <button
          onClick={() => toggleSection("sort")}
          className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3"
        >
          <span>Sort By</span>
          <FiChevronDown
            className={cn(
              "w-4 h-4 text-gray-500 transition-transform",
              expandedSections.sort && "rotate-180"
            )}
          />
        </button>
        <AnimatePresence>
          {expandedSections.sort && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-1">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => onFilterChange({ sort: option.value })}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      filters.sort === option.value
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Order Toggle */}
      <div>
        <p className="font-medium text-gray-900 mb-3">Order</p>
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => onFilterChange({ order: "desc" })}
            className={cn(
              "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              filters.order === "desc"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            Descending
          </button>
          <button
            onClick={() => onFilterChange({ order: "asc" })}
            className={cn(
              "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              filters.order === "asc"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            Ascending
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          className="w-full"
          leftIcon={<FiFilter />}
          onClick={() => setShowMobileFilters(true)}
        >
          Filters
          {hasActiveFilters && (
            <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full" />
          )}
        </Button>
      </div>

      {/* Desktop Filters */}
      <div className="hidden lg:block sticky top-36">
        <Card>
          <CardBody>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiFilter className="w-4 h-4" />
              Filters
            </h3>
            <FilterContent />
          </CardBody>
        </Card>
      </div>

      {/* Mobile Filters Modal */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              onClick={() => setShowMobileFilters(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-white z-50 lg:hidden overflow-y-auto"
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <FilterContent />
              </div>
              <div className="p-4 border-t border-gray-200">
                <Button
                  className="w-full"
                  onClick={() => setShowMobileFilters(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Language color dot
function LanguageDot({ language }: { language: string }) {
  const colors: Record<string, string> = {
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

  return (
    <span
      className={cn("w-3 h-3 rounded-full", colors[language] || "bg-gray-400")}
    />
  );
}
