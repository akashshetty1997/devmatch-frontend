/**
 * @file src/components/jobs/JobsList.tsx
 * @description Jobs listing with featured and regular jobs
 */

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiMapPin,
  FiBriefcase,
  FiClock,
  FiDollarSign,
  FiStar,
  FiUsers,
  FiAlertCircle,
} from "react-icons/fi";
import {
  Card,
  CardBody,
  Badge,
  Button,
  Avatar,
  CardSkeleton,
} from "@/components/common";
import { formatRelativeTime, formatNumber } from "@/lib/utils";
import { Job } from "./JobsContainer";

interface JobsListProps {
  jobs: Job[];
  featuredJobs: Job[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
}

export default function JobsList({
  jobs,
  featuredJobs,
  loading,
  error,
  hasMore,
  onLoadMore,
}: JobsListProps) {
  // Error state
  if (error) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Jobs
          </h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardBody>
      </Card>
    );
  }

  // Loading state
  if (loading && jobs.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (!loading && jobs.length === 0) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiBriefcase className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Jobs Found
          </h3>
          <p className="text-gray-500">
            Try adjusting your filters or search terms
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Featured Jobs */}
      {featuredJobs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiStar className="w-5 h-5 text-yellow-500" />
            Featured Jobs
          </h2>
          <div className="grid gap-4">
            {featuredJobs.map((job, index) => (
              <motion.div
                key={job._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <JobCard job={job} featured />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* All Jobs */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Jobs</h2>
        <div className="space-y-4">
          {jobs.map((job, index) => (
            <motion.div
              key={job._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.5) }}
            >
              <JobCard job={job} />
            </motion.div>
          ))}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="text-center pt-6">
            <Button
              variant="outline"
              onClick={onLoadMore}
              isLoading={loading}
              className="min-w-[200px]"
            >
              Load More Jobs
            </Button>
          </div>
        )}

        {/* End of results */}
        {!hasMore && jobs.length > 0 && (
          <p className="text-center text-gray-500 py-4">
            You&apos;ve seen all available jobs
          </p>
        )}
      </div>
    </div>
  );
}

// Individual Job Card
function JobCard({ job, featured = false }: { job: Job; featured?: boolean }) {
  const formatSalary = () => {
    if (!job.salary?.isVisible || !job.salary.min) return null;
    const currency = job.salary.currency || "USD";
    const min =
      job.salary.min >= 1000
        ? `${(job.salary.min / 1000).toFixed(0)}k`
        : job.salary.min;
    const max = job.salary.max
      ? job.salary.max >= 1000
        ? `${(job.salary.max / 1000).toFixed(0)}k`
        : job.salary.max
      : null;
    return max ? `${currency} ${min} - ${max}` : `${currency} ${min}+`;
  };

  const getLocation = () => {
    if (job.workType === "REMOTE") return "Remote";
    const parts = [];
    if (job.location?.city) parts.push(job.location.city);
    if (job.location?.country) parts.push(job.location.country);
    return parts.join(", ") || "Location not specified";
  };

  const salary = formatSalary();

  return (
    <Link href={`/jobs/${job._id}`}>
      <Card
        hover
        className={featured ? "border-yellow-200 bg-yellow-50/30" : ""}
      >
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Company Logo */}
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                {job.companyName.charAt(0)}
              </div>
            </div>

            {/* Job Info */}
            <div className="flex-1 min-w-0">
              {/* Title & Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {job.title}
                </h3>
                {featured && (
                  <Badge variant="warning" size="sm">
                    <FiStar className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {job.employmentType !== "FULL_TIME" && (
                  <Badge variant="outline" size="sm">
                    {job.employmentType.replace("_", " ")}
                  </Badge>
                )}
              </div>

              {/* Company */}
              <p className="text-gray-600 mb-3">{job.companyName}</p>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <FiMapPin className="w-4 h-4" />
                  {getLocation()}
                </span>
                <span className="flex items-center gap-1">
                  <FiBriefcase className="w-4 h-4" />
                  {job.workType}
                </span>
                {salary && (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <FiDollarSign className="w-4 h-4" />
                    {salary}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <FiClock className="w-4 h-4" />
                  {formatRelativeTime(job.createdAt)}
                </span>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.slice(0, 5).map((skill) => (
                  <Badge key={skill} variant="default" size="sm">
                    {skill}
                  </Badge>
                ))}
                {job.requiredSkills.length > 5 && (
                  <Badge variant="default" size="sm">
                    +{job.requiredSkills.length - 5}
                  </Badge>
                )}
              </div>
            </div>

            {/* Right Side - Applicants & CTA */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-3">
              {job.applicationCount !== undefined && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <FiUsers className="w-4 h-4" />
                  {formatNumber(job.applicationCount)} applicants
                </div>
              )}
              <Button size="sm" className="whitespace-nowrap">
                View Job
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
