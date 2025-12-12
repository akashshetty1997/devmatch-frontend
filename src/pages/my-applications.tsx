/**
 * @file src/pages/my-applications.tsx
 * @description Developer's view of their job applications
 */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import { applicationService } from "@/services/applicationService";
import { useToast } from "@/contexts/ToastContext";
import LoadingSpinner from "@/components/common/Loading";
import {
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MapPin,
  Building,
  Calendar,
  Trash2,
  ExternalLink,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Application {
  _id: string;
  jobPost: {
    _id: string;
    title: string;
    companyName: string;
    location: {
      city?: string;
      country?: string;
    };
    workType: string;
    isActive: boolean;
  };
  status: "PENDING" | "REVIEWED" | "SHORTLISTED" | "REJECTED";
  coverLetter?: string;
  appliedAt: string;
  updatedAt: string;
}

interface ApplicationParams {
  page: number;
  limit: number;
  status?: string;
}

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  REVIEWED: {
    label: "Reviewed",
    color: "bg-blue-100 text-blue-800",
    icon: Eye,
  },
  SHORTLISTED: {
    label: "Shortlisted",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
} as const;

export default function MyApplications() {
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  // Use ref to prevent duplicate fetches
  const hasFetched = useRef(false);
  const lastFetchKey = useRef("");

  // Get query params from Next.js router
  const { page, status } = router.query;
  const currentPage = parseInt((page as string) || "1", 10);
  const statusFilter = (status as string) || "";
  const limit = 10;

  // Fetch applications
  useEffect(() => {
    if (!router.isReady) return;

    const fetchKey = `${currentPage}-${statusFilter}`;

    // Prevent duplicate fetches for same params
    if (lastFetchKey.current === fetchKey && hasFetched.current) {
      return;
    }

    const fetchApplications = async () => {
      setLoading(true);
      lastFetchKey.current = fetchKey;
      hasFetched.current = true;

      try {
        const params: ApplicationParams = { page: currentPage, limit };
        if (statusFilter) params.status = statusFilter;

        const response = await applicationService.getMyApplications(params);
        const data = response.data?.data || response.data;
        setApplications(data?.applications || []);
        setTotalCount(data?.pagination?.total || 0);
      } catch (err) {
        showError("Failed to load applications");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [router.isReady, currentPage, statusFilter]);

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

    router.push({ pathname: "/my-applications", query: newQuery }, undefined, {
      shallow: true,
    });
  };

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage.toString() });
  };

  const handleWithdraw = async (applicationId: string) => {
    if (!window.confirm("Are you sure you want to withdraw this application?"))
      return;

    setWithdrawing(applicationId);
    try {
      await applicationService.withdrawApplication(applicationId);
      setApplications((prev) => prev.filter((a) => a._id !== applicationId));
      setTotalCount((prev) => prev - 1);
      success("Application withdrawn");
    } catch (err) {
      showError("Failed to withdraw application");
    } finally {
      setWithdrawing(null);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <>
      <Head>
        <title>My Applications - DevMatch</title>
        <meta name="description" content="Track your job applications" />
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Applications
          </h1>
          <p className="text-gray-600">Track your job applications</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateFilters({ status: null })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !statusFilter
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All ({totalCount})
            </button>
            {Object.entries(STATUS_CONFIG).map(([statusKey, config]) => {
              const IconComponent = config.icon;
              return (
                <button
                  key={statusKey}
                  onClick={() => updateFilters({ status: statusKey })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    statusFilter === statusKey
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <IconComponent size={14} />
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Applications List */}
        {!loading && applications.length > 0 && (
          <div className="space-y-4 mb-8">
            {applications.map((application) => {
              const statusConfig = STATUS_CONFIG[application.status];
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={application._id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Link
                          href={`/jobs/${application.jobPost._id}`}
                          className="font-semibold text-gray-900 hover:text-blue-600"
                        >
                          {application.jobPost.title}
                        </Link>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}
                        >
                          <StatusIcon size={12} />
                          {statusConfig.label}
                        </span>
                        {!application.jobPost.isActive && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                            Job Closed
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building size={14} />
                          {application.jobPost.companyName}
                        </span>
                        {application.jobPost.location?.city && (
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {application.jobPost.location.city}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Briefcase size={14} />
                          {application.jobPost.workType}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          Applied:{" "}
                          {new Date(application.appliedAt).toLocaleDateString()}
                        </span>
                        {application.updatedAt !== application.appliedAt && (
                          <span>
                            Updated:{" "}
                            {new Date(
                              application.updatedAt
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/jobs/${application.jobPost._id}`}
                        className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-sm"
                      >
                        <ExternalLink size={16} />
                        View Job
                      </Link>
                      {application.status === "PENDING" && (
                        <button
                          onClick={() => handleWithdraw(application._id)}
                          disabled={withdrawing === application._id}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 text-sm disabled:opacity-50"
                        >
                          {withdrawing === application._id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && applications.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <FileText className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No applications found
            </h3>
            <p className="text-gray-500 mb-4">
              {statusFilter
                ? "Try a different filter"
                : "Start applying to jobs to track them here"}
            </p>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Briefcase size={18} />
              Browse Jobs
            </Link>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>

            <span className="px-4 py-2 text-gray-600">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
