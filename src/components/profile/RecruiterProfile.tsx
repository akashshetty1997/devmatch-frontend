/**
 * @file src/components/profile/RecruiterProfile.tsx
 * @description Recruiter-specific profile content
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiHome,
  FiUsers,
  FiGlobe,
  FiMapPin,
  FiBriefcase,
  FiExternalLink,
  FiPlus,
} from "react-icons/fi";
import { jobAPINew } from "@/lib/api";
import {
  Card,
  CardBody,
  CardHeader,
  Badge,
  Button,
  CardSkeleton,
} from "@/components/common";
import { formatRelativeTime } from "@/lib/utils";

interface RecruiterProfileProps {
  profile: any;
  user: any;
  isOwnProfile: boolean;
}

export default function RecruiterProfile({
  profile,
  user,
  isOwnProfile,
}: RecruiterProfileProps) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await jobAPINew.getByRecruiter(user._id);
        setJobs(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [user._id]);

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Left Column - Company Info */}
      <div className="lg:col-span-1 space-y-6">
        {/* Company Card */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Company</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            {/* Company Logo/Name */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                {profile?.companyName?.charAt(0) || "C"}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  {profile?.companyName}
                </h4>
                {profile?.industry && (
                  <p className="text-sm text-gray-500">{profile.industry}</p>
                )}
              </div>
            </div>

            {/* Company Details */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              {profile?.companySize && (
                <div className="flex items-center gap-3 text-sm">
                  <FiUsers className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {profile.companySize} employees
                  </span>
                </div>
              )}
              {profile?.companyWebsite && (
                <div className="flex items-center gap-3 text-sm">
                  <FiGlobe className="w-4 h-4 text-gray-400" />
                  <a
                    href={profile.companyWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate"
                  >
                    {profile.companyWebsite.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
              {profile?.hiringRegions?.length > 0 && (
                <div className="flex items-start gap-3 text-sm">
                  <FiMapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span className="text-gray-600">
                    Hiring in: {profile.hiringRegions.join(", ")}
                  </span>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Company Description */}
        {profile?.companyDescription && (
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">About Company</h3>
            </CardHeader>
            <CardBody>
              <p className="text-gray-600 whitespace-pre-wrap">
                {profile.companyDescription}
              </p>
            </CardBody>
          </Card>
        )}

        {/* Verification Status */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              {profile?.isVerified ? (
                <>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <FiHome className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-700">
                      Verified Recruiter
                    </p>
                    <p className="text-sm text-gray-500">
                      Company verified by DevMatch
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <FiHome className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Unverified</p>
                    <p className="text-sm text-gray-500">
                      Verification pending
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Right Column - Job Posts */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Job Postings ({jobs.length})
          </h3>
          {isOwnProfile && (
            <Link href="/jobs/create">
              <Button leftIcon={<FiPlus />}>Post New Job</Button>
            </Link>
          )}
        </div>

        {/* Job List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobCard key={job._id} job={job} isOwnProfile={isOwnProfile} />
            ))}
          </div>
        ) : (
          <Card>
            <CardBody className="text-center py-12">
              <FiBriefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No job postings yet</p>
              {isOwnProfile && (
                <Link href="/jobs/create">
                  <Button>Post Your First Job</Button>
                </Link>
              )}
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

// Job Card Component
function JobCard({ job, isOwnProfile }: { job: any; isOwnProfile: boolean }) {
  return (
    <Link href={`/jobs/${job._id}`}>
      <Card hover>
        <CardBody>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-gray-900 truncate">
                  {job.title}
                </h4>
                {!job.isActive && (
                  <Badge variant="warning" size="sm">
                    Inactive
                  </Badge>
                )}
                {job.isFeatured && (
                  <Badge variant="primary" size="sm">
                    Featured
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <FiMapPin className="w-4 h-4" />
                  {job.location?.city || job.location?.country || "Remote"}
                </span>
                <span className="flex items-center gap-1">
                  <FiBriefcase className="w-4 h-4" />
                  {job.workType}
                </span>
                <span>{formatRelativeTime(job.createdAt)}</span>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills?.slice(0, 4).map((skill: string) => (
                  <Badge key={skill} variant="default" size="sm">
                    {skill}
                  </Badge>
                ))}
                {job.requiredSkills?.length > 4 && (
                  <Badge variant="default" size="sm">
                    +{job.requiredSkills.length - 4}
                  </Badge>
                )}
              </div>
            </div>

            {/* Stats */}
            {isOwnProfile && (
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-gray-900">
                  {job.applicationCount || 0}
                </p>
                <p className="text-sm text-gray-500">Applications</p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
