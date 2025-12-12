/**
 * @file src/pages/jobs/[id]/applications.tsx
 * @description View applications for a job - recruiters only
 */

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiCalendar,
  FiExternalLink,
  FiCheck,
  FiX,
  FiClock,
  FiFileText,
  FiGithub,
  FiBriefcase,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { jobAPINew, applicationAPI } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  Card,
  CardBody,
  Button,
  Badge,
  PageLoading,
} from "@/components/common";

const STATUS_CONFIG: Record<string, { label: string; variant: string; icon: any }> = {
  PENDING: { label: "Pending", variant: "warning", icon: FiClock },
  REVIEWED: { label: "Reviewed", variant: "info", icon: FiFileText },
  SHORTLISTED: { label: "Shortlisted", variant: "primary", icon: FiCheck },
  ACCEPTED: { label: "Accepted", variant: "success", icon: FiCheck },
  REJECTED: { label: "Rejected", variant: "danger", icon: FiX },
  WITHDRAWN: { label: "Withdrawn", variant: "default", icon: FiX },
};

export default function JobApplicationsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();

  const [job, setJob] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  // Redirect if not authenticated or not a recruiter
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/auth/login?redirect=/jobs/${id}/applications`);
    } else if (
      !authLoading &&
      isAuthenticated &&
      user?.role !== "RECRUITER" &&
      user?.role !== "ADMIN"
    ) {
      router.push("/jobs");
    }
  }, [authLoading, isAuthenticated, user, router, id]);

  // Fetch job and applications
  useEffect(() => {
    if (!id || typeof id !== "string") return;
    if (!isAuthenticated || (user?.role !== "RECRUITER" && user?.role !== "ADMIN")) return;

    setLoading(true);

    Promise.all([
      jobAPINew.getById(id),
      applicationAPI.getJobApplications(id, {}),
    ])
      .then(([jobRes, appRes]) => {
        const jobData = jobRes.data.data;

        // Check ownership
        if (jobData.recruiter._id !== user?.id && user?.role !== "ADMIN") {
          toast.error("You do not have permission to view these applications");
          router.push("/jobs");
          return;
        }

        setJob(jobData);
        
        // Handle different response structures
        const appData = appRes.data?.data;
        setApplications(Array.isArray(appData) ? appData : appData?.applications || []);
      })
      .catch((err) => {
        const message = err.response?.data?.message || "Failed to load applications";
        toast.error(message);
        router.push("/jobs");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, isAuthenticated, user, router]);

  // Update application status
  const updateStatus = async (applicationId: string, status: string) => {
    setUpdating(applicationId);

    try {
      await applicationAPI.updateStatus(applicationId, status);
      setApplications((prev) =>
        prev.map((app) =>
          app._id === applicationId ? { ...app, status } : app
        )
      );
      toast.success(`Application ${status.toLowerCase()}`);
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to update status";
      toast.error(message);
    } finally {
      setUpdating(null);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter applications
  const filteredApplications =
    filter === "ALL"
      ? applications
      : applications.filter((app) => app.status === filter);

  // Count by status
  const statusCounts = (Array.isArray(applications) ? applications : []).reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (authLoading || loading) {
    return <PageLoading />;
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <FiBriefcase className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Job Not Found</h3>
          <p className="text-gray-500 mb-4">This job posting may have been removed.</p>
          <Link href="/jobs/manage">
            <Button>Manage Jobs</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Applications for {job.title} | DevMatch</title>
        <meta name="description" content={`View applications for ${job.title}`} />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Link
              href={`/jobs/${id}`}
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Job
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
            <p className="text-gray-600 mt-1">{job.title}</p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 mb-6"
          >
            <button
              onClick={() => setFilter("ALL")}
              className={`p-4 rounded-lg text-center transition-all ${
                filter === "ALL"
                  ? "bg-blue-50 border-2 border-blue-500"
                  : "bg-white border border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
              <p className="text-sm text-gray-600">Total</p>
            </button>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`p-4 rounded-lg text-center transition-all ${
                  filter === status
                    ? "bg-blue-50 border-2 border-blue-500"
                    : "bg-white border border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="text-2xl font-bold text-gray-900">
                  {statusCounts[status] || 0}
                </p>
                <p className="text-sm text-gray-600">{config.label}</p>
              </button>
            ))}
          </motion.div>

          {/* Applications List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {filteredApplications.length === 0 ? (
              <Card>
                <CardBody className="p-8 text-center">
                  <FiUser className="mx-auto text-gray-300 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications</h3>
                  <p className="text-gray-500">
                    {filter === "ALL"
                      ? "No one has applied to this job yet."
                      : `No ${filter.toLowerCase()} applications.`}
                  </p>
                </CardBody>
              </Card>
            ) : (
              filteredApplications.map((application) => {
                const statusConfig = STATUS_CONFIG[application.status] || STATUS_CONFIG.PENDING;
                const StatusIcon = statusConfig.icon;

                return (
                  <Card key={application._id} className="hover:shadow-md transition-shadow">
                    <CardBody className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* Applicant Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              {application.developer?.avatar ? (
                                <img
                                  src={application.developer.avatar}
                                  alt={application.developer.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <FiUser className="w-5 h-5 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {application.developer?.name || "Unknown Applicant"}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {application.developer?.headline || "Developer"}
                              </p>
                            </div>
                            <Badge variant={statusConfig.variant as any} className="ml-auto lg:hidden">
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </div>

                          {/* Contact & Links */}
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                            {application.developer?.email && (
                              <a
                                href={`mailto:${application.developer.email}`}
                                className="flex items-center gap-1.5 hover:text-blue-600"
                              >
                                <FiMail className="w-4 h-4" />
                                {application.developer.email}
                              </a>
                            )}
                            {application.developer?.githubUsername && (
                              <a
                                href={`https://github.com/${application.developer.githubUsername}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 hover:text-blue-600"
                              >
                                <FiGithub className="w-4 h-4" />
                                {application.developer.githubUsername}
                              </a>
                            )}
                            <span className="flex items-center gap-1.5">
                              <FiCalendar className="w-4 h-4" />
                              Applied {formatDate(application.createdAt)}
                            </span>
                          </div>

                          {/* Cover Letter Preview */}
                          {application.coverLetter && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {application.coverLetter}
                            </p>
                          )}
                        </div>

                        {/* Status & Actions */}
                        <div className="flex flex-col items-end gap-3">
                          <Badge variant={statusConfig.variant as any} className="hidden lg:flex">
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>

                          <div className="flex flex-wrap gap-2">
                            <Link href={`/developers/${application.developer?._id}`}>
                              <Button variant="outline" size="sm" leftIcon={<FiExternalLink />}>
                                View Profile
                              </Button>
                            </Link>

                            {application.status === "PENDING" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateStatus(application._id, "REVIEWED")}
                                isLoading={updating === application._id}
                              >
                                Mark Reviewed
                              </Button>
                            )}

                            {(application.status === "PENDING" || application.status === "REVIEWED") && (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  leftIcon={<FiCheck />}
                                  onClick={() => updateStatus(application._id, "SHORTLISTED")}
                                  isLoading={updating === application._id}
                                >
                                  Shortlist
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  leftIcon={<FiX />}
                                  onClick={() => updateStatus(application._id, "REJECTED")}
                                  isLoading={updating === application._id}
                                >
                                  Reject
                                </Button>
                              </>
                            )}

                            {application.status === "SHORTLISTED" && (
                              <Button
                                variant="primary"
                                size="sm"
                                leftIcon={<FiCheck />}
                                onClick={() => updateStatus(application._id, "ACCEPTED")}
                                isLoading={updating === application._id}
                              >
                                Accept
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}