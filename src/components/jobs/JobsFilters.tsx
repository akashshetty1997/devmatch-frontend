/**
 * @file src/components/jobs/JobsFilters.tsx
 * @description Jobs filter sidebar
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiFilter, FiChevronDown, FiX, FiCheck } from "react-icons/fi";
import { Card, CardBody, Button } from "@/components/common";
import { cn } from "@/lib/utils";
import { JobFilters } from "./JobsContainer";

interface JobsFiltersProps {
  filters: JobFilters;
  availableSkills: any[];
  onFilterChange: (filters: Partial<JobFilters>) => void;
  onClearFilters: () => void;
}

const WORK_TYPES = [
  { value: "", label: "All Types" },
  { value: "REMOTE", label: "Remote" },
  { value: "ONSITE", label: "On-site" },
  { value: "HYBRID", label: "Hybrid" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "salary", label: "Highest Salary" },
  { value: "relevant", label: "Most Relevant" },
];

export default function JobsFilters({
  filters,
  availableSkills,
  onFilterChange,
  onClearFilters,
}: JobsFiltersProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    workType: true,
    skills: true,
    sort: false,
  });
  const [skillSearch, setSkillSearch] = useState("");

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const hasActiveFilters = filters.workType || filters.skills.length > 0;

  const toggleSkill = (skill: string) => {
    const newSkills = filters.skills.includes(skill)
      ? filters.skills.filter((s) => s !== skill)
      : [...filters.skills, skill];
    onFilterChange({ skills: newSkills });
  };

  const filteredSkills = availableSkills.filter((skill) =>
    skill.name.toLowerCase().includes(skillSearch.toLowerCase())
  );

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

      {/* Work Type Filter */}
      <div>
        <button
          onClick={() => toggleSection("workType")}
          className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3"
        >
          <span>Work Type</span>
          <FiChevronDown
            className={cn(
              "w-4 h-4 text-gray-500 transition-transform",
              expandedSections.workType && "rotate-180"
            )}
          />
        </button>
        <AnimatePresence>
          {expandedSections.workType && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-1">
                {WORK_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => onFilterChange({ workType: type.value })}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between",
                      filters.workType === type.value
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    {type.label}
                    {filters.workType === type.value && (
                      <FiCheck className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Skills Filter */}
      <div>
        <button
          onClick={() => toggleSection("skills")}
          className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-3"
        >
          <span>Skills</span>
          <FiChevronDown
            className={cn(
              "w-4 h-4 text-gray-500 transition-transform",
              expandedSections.skills && "rotate-180"
            )}
          />
        </button>
        <AnimatePresence>
          {expandedSections.skills && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {/* Selected Skills */}
              {filters.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {filters.skills.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm"
                    >
                      {skill}
                      <FiX className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              )}

              {/* Skill Search */}
              <input
                type="text"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                placeholder="Search skills..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              {/* Skills List */}
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredSkills.slice(0, 20).map((skill) => (
                  <button
                    key={skill.slug}
                    onClick={() => toggleSkill(skill.slug)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between",
                      filters.skills.includes(skill.slug)
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    {skill.name}
                    {filters.skills.includes(skill.slug) && (
                      <FiCheck className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sort */}
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
