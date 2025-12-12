/**
 * @file src/pages/my-applications.tsx
 * @description Developer's view of their job applications
 */

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { applicationService } from "../services/applicationService";
import LoadingSpinner from "../components/common/Loading";
import {
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Calendar,
  MapPin,
  ExternalLink,
  Building2,
  Trash2,
} from "lucide-react";

interface Application {
  _id: string;
  jobPost: {
    _id: string;
    title: string;
    companyName: string;
    workType: string;
    isActive: boolean;
    locationString?: string;
    salaryString?: string | null;
    isExpired?: boolean;
  };
  status: "PENDING" | "REVIEWED" | "SHORTLISTED" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  coverLetter?: string;
  resumeUrl?: string | null;
  skillsMatchPercent?: number;
  appliedAt: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
    description: "Your application is awaiting review",
  },
  REVIEWED: {
    label: "Reviewed",
    color: "bg-blue-100 text-blue-800",
    icon: Eye,
    description: "The recruiter has reviewed your application",
  },
  SHORTLISTED: {
    label: "Shortlisted",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    description: "Congratulations! You've been shortlisted",
  },
  ACCEPTED: {
    label: "Accepted",
    color: "bg-emerald-100 text-emerald-800",
    icon: CheckCircle,
    description: "Congratulations! Your application was accepted",
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
    description: "Unfortunately, your application was not selected",
  },
  WITHDRAWN: {
    label: "Withdrawn",
    color: "bg-gray-100 text-gray-800",
    icon: XCircle,
    description: "You withdrew this application",
  },
};

export default function MyApplications() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { success, error: showError } = useToast();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  // Prevent duplicate fetches
  const hasFetched = useRef(false);

  // Redirect if not developer
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push("/auth/login?redirect=/my-applications");
      return;
    }

    if (user?.role !== "DEVELOPER") {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Fetch applications
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    if (user?.role !== "DEVELOPER") return;
    if (hasFetched.current) return;

    const fetchApplications = async () => {
      hasFetched.current = true;
      setLoading(true);

      try {
        const response = await applicationService.getMyApplications({});
        const data = response.data?.data || response.data;
        setApplications(Array.isArray(data) ? data : data?.applications || []);
        setTotalCount(data?.pagination?.total || data?.applications?.length || 0);
      } catch (err: any) {
        if (err.response?.status !== 429) {
          console.error("Failed to fetch applications:", err);
          showError("Failed to load applications");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [authLoading, isAuthenticated, user, showError]);

  // Withdraw application
  const handleWithdraw = async (applicationId: string) => {
    if (!confirm("Are you sure you want to withdraw this application?")) return;

    setWithdrawing(applicationId);
    try {
      await applicationService.withdraw(applicationId);
      setApplications((prev) =>
        prev.map((app) =>
          app._id === applicationId ? { ...app, status: "WITHDRAWN" as const } : app
        )
      );
      success("Application withdrawn");
    } catch (err: any) {
      showError(err.response?.data?.message || "Failed to withdraw application");
    } finally {
      setWithdrawing(null);
    }
  };

  // Filter applications
  const filteredApplications =
    filter === "ALL"
      ? applications
      : applications.filter((app) => app.status === filter);

  // Stats
  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "PENDING").length,
    shortlisted: applications.filter((a) => a.status === "SHORTLISTED" || a.status === "ACCEPTED").length,
    rejected: applications.filter((a) => a.status === "REJECTED").length,
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Don't render if not authorized
  if (!isAuthenticated || user?.role !== "DEVELOPER") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Applications - DevMatch</title>
        <meta name="description" content="Track your job applications" />
      </Head>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Applications</h1>
          <p className="text-gray-600">Track the status of your job applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => setFilter("ALL")}
            className={`bg-white rounded-lg border p-4 text-left transition-all ${
              filter === "ALL" ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setFilter("PENDING")}
            className={`bg-white rounded-lg border p-4 text-left transition-all ${
              filter === "PENDING" ? "border-yellow-500 ring-2 ring-yellow-100" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="text-yellow-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setFilter("SHORTLISTED")}
            className={`bg-white rounded-lg border p-4 text-left transition-all ${
              filter === "SHORTLISTED" ? "border-green-500 ring-2 ring-green-100" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.shortlisted}</p>
                <p className="text-sm text-gray-500">Shortlisted</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setFilter("REJECTED")}
            className={`bg-white rounded-lg border p-4 text-left transition-all ${
              filter === "REJECTED" ? "border-red-500 ring-2 ring-red-100" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="text-red-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                <p className="text-sm text-gray-500">Rejected</p>
              </div>
            </div>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Applications List */}
        {!loading && filteredApplications.length > 0 && (
          <div className="space-y-4">
            {filteredApplications.map((application) => {
              const statusConfig = STATUS_CONFIG[application.status] || STATUS_CONFIG.PENDING;
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={application._id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {/* Job Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        {/* Company Avatar */}
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {application.jobPost.companyName?.charAt(0).toUpperCase() || "C"}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
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

                          <div className="flex items-center gap-2 text-gray-600 mb-2">
                            <Building2 size={14} className="text-gray-400" />
                            <span>{application.jobPost.companyName}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                            {application.jobPost.locationString && (
                              <span className="flex items-center gap-1">
                                <MapPin size={14} />
                                {application.jobPost.locationString}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Briefcase size={14} />
                              {application.jobPost.workType}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              Applied {new Date(application.appliedAt).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Status Description */}
                          <p className="text-sm text-gray-500 mt-2">{statusConfig.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/jobs/${application.jobPost._id}`}
                        className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-sm"
                      >
                        <ExternalLink size={16} />
                        View Job
                      </Link>

                      {(application.status === "PENDING" || application.status === "REVIEWED") && (
                        <button
                          onClick={() => handleWithdraw(application._id)}
                          disabled={withdrawing === application._id}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 text-sm disabled:opacity-50"
                        >
                          {withdrawing === application._id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <Trash2 size={16} />
                              Withdraw
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Cover Letter Preview */}
                  {application.coverLetter && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-500 mb-1">Your Cover Letter:</p>
                      <p className="text-sm text-gray-700 line-clamp-2">{application.coverLetter}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredApplications.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Briefcase className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === "ALL" ? "No applications yet" : `No ${filter.toLowerCase()} applications`}
            </h3>
            <p className="text-gray-500 mb-4">
              {filter === "ALL"
                ? "Start applying to jobs to track your applications here"
                : "Try selecting a different filter"}
            </p>
            {filter === "ALL" && (
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Briefcase size={18} />
                Browse Jobs
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}