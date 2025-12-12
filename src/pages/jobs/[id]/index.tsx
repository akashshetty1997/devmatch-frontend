/**
 * @file src/pages/jobs/[id]/index.tsx
 * @description Job details page - displays full job information
 */

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiMapPin,
  FiBriefcase,
  FiClock,
  FiDollarSign,
  FiCalendar,
  FiExternalLink,
  FiEdit2,
  FiUsers,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { jobAPINew } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  Card,
  CardBody,
  Button,
  Badge,
  PageLoading,
  // EmptyState, // Remove this import
} from "@/components/common";

export default function JobDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated } = useAuthStore();

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch job details
  useEffect(() => {
    if (!id || typeof id !== "string") return;

    setLoading(true);
    setError(null);

    jobAPINew
      .getById(id)
      .then((res) => {
        setJob(res.data.data);
      })
      .catch((err) => {
        const message = err.response?.data?.message || "Failed to load job";
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  // Check if current user owns this job
  const isOwner = user?.id === job?.recruiter?._id || user?.role === "ADMIN";
  const isRecruiter = user?.role === "RECRUITER" || user?.role === "ADMIN";
  const isDeveloper = user?.role === "DEVELOPER";

  // Format salary
  const formatSalary = (salary: any) => {
    if (!salary || (!salary.min && !salary.max)) return null;

    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: salary.currency || "USD",
      maximumFractionDigits: 0,
    });

    if (salary.min && salary.max) {
      return `${formatter.format(salary.min)} - ${formatter.format(
        salary.max
      )}`;
    } else if (salary.min) {
      return `From ${formatter.format(salary.min)}`;
    } else if (salary.max) {
      return `Up to ${formatter.format(salary.max)}`;
    }
    return null;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format work type
  const formatWorkType = (type: string) => {
    return type.charAt(0) + type.slice(1).toLowerCase();
  };

  // Format employment type
  const formatEmploymentType = (type: string) => {
    return type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return <PageLoading />;
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="mx-auto mb-4">
              <FiUsers className="w-16 h-16 text-gray-300 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Job Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              This job posting may have been removed or doesn't exist.
            </p>
            <Link href="/jobs">
              <Button>Browse All Jobs</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{job.title} | DevMatch</title>
        <meta name="description" content={job.description?.substring(0, 160)} />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Jobs
            </Link>
          </motion.div>

          {/* Job Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="mb-6">
              <CardBody className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    {/* Status Badge */}
                    {!job.isActive && (
                      <Badge variant="warning" className="mb-2">
                        Inactive
                      </Badge>
                    )}

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {job.title}
                    </h1>

                    {/* Company/Recruiter */}
                    <p className="text-lg text-gray-600 mb-4">
                      {job.recruiter?.company?.name || job.recruiter?.name}
                    </p>

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {job.location?.city && (
                        <span className="flex items-center gap-1.5">
                          <FiMapPin className="w-4 h-4" />
                          {[
                            job.location.city,
                            job.location.state,
                            job.location.country,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <FiBriefcase className="w-4 h-4" />
                        {formatWorkType(job.workType)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FiClock className="w-4 h-4" />
                        {formatEmploymentType(job.employmentType)}
                      </span>
                      {job.salary?.isVisible && formatSalary(job.salary) && (
                        <span className="flex items-center gap-1.5">
                          <FiDollarSign className="w-4 h-4" />
                          {formatSalary(job.salary)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {isOwner && (
                      <>
                        <Link href={`/jobs/${job._id}/edit`}>
                          <Button
                            variant="outline"
                            leftIcon={<FiEdit2 />}
                            className="w-full"
                          >
                            Edit Job
                          </Button>
                        </Link>
                        <Link href={`/jobs/${job._id}/applications`}>
                          <Button
                            variant="outline"
                            leftIcon={<FiUsers />}
                            className="w-full"
                          >
                            View Applications ({job.applicationCount || 0})
                          </Button>
                        </Link>
                      </>
                    )}
                    {isDeveloper && job.isActive && (
                      <>
                        {job.externalApplicationUrl ? (
                          <a
                            href={job.externalApplicationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              leftIcon={<FiExternalLink />}
                              className="w-full"
                            >
                              Apply Externally
                            </Button>
                          </a>
                        ) : (
                          <Link href={`/jobs/${job._id}/apply`}>
                            <Button className="w-full">Apply Now</Button>
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardBody className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Job Description
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="whitespace-pre-wrap text-gray-700">
                      {job.description}
                    </p>
                  </div>
                </CardBody>
              </Card>
            </motion.div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              {/* Skills */}
              <Card>
                <CardBody className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Required Skills
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.requiredSkills?.length > 0 ? (
                      job.requiredSkills.map((skill: string) => (
                        <Badge key={skill} variant="primary">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">
                        Not specified
                      </span>
                    )}
                  </div>

                  {job.preferredSkills?.length > 0 && (
                    <>
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Nice to Have
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {job.preferredSkills.map((skill: string) => (
                          <Badge key={skill} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </CardBody>
              </Card>

              {/* Experience */}
              <Card>
                <CardBody className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Experience
                  </h3>
                  <p className="text-gray-700">
                    {job.minYearsExperience || 0}
                    {job.maxYearsExperience
                      ? ` - ${job.maxYearsExperience}`
                      : "+"}{" "}
                    years
                  </p>
                </CardBody>
              </Card>

              {/* Deadline */}
              {job.applicationDeadline && (
                <Card>
                  <CardBody className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Application Deadline
                    </h3>
                    <p className="flex items-center gap-2 text-gray-700">
                      <FiCalendar className="w-4 h-4" />
                      {formatDate(job.applicationDeadline)}
                    </p>
                  </CardBody>
                </Card>
              )}

              {/* Posted Date */}
              <Card>
                <CardBody className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Posted</h3>
                  <p className="text-gray-700">{formatDate(job.createdAt)}</p>
                </CardBody>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
