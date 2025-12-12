/**
 * @file src/pages/admin/reports.tsx
 * @description Admin reports management page - view and resolve flagged content
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Flag,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  MessageSquare,
  Briefcase,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Ban,
  Trash2,
  Clock,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { adminService } from "@/services/adminService";
import { PageLoading } from "@/components/common";
import { formatDate, formatRelativeTime } from "@/lib/utils";

// Report types
type ReportType = "POST" | "COMMENT" | "USER" | "JOB";
type ReportStatus = "PENDING" | "REVIEWED" | "RESOLVED";
type ReportAction = "DISMISS" | "WARN" | "REMOVE" | "BAN";

interface Reporter {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
}

interface ReportedUser {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  role: string;
}

interface ReportedContent {
  _id: string;
  content?: string;
  title?: string;
  username?: string;
  author?: {
    _id: string;
    username: string;
  };
}

interface Report {
  _id: string;
  type: ReportType;
  reason: string;
  description?: string;
  status: ReportStatus;
  reporter: Reporter;
  reportedUser?: ReportedUser;
  reportedContent?: ReportedContent;
  resolvedBy?: {
    _id: string;
    username: string;
  };
  resolvedAt?: string;
  action?: ReportAction;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Report reason options
const REPORT_REASONS: Record<string, string> = {
  SPAM: "Spam or misleading",
  HARASSMENT: "Harassment or bullying",
  HATE_SPEECH: "Hate speech or discrimination",
  INAPPROPRIATE: "Inappropriate content",
  FAKE: "Fake or fraudulent",
  COPYRIGHT: "Copyright violation",
  OTHER: "Other",
};

export default function AdminReportsPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuthStore();

  // State
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?redirect=/admin/reports");
    } else if (!authLoading && isAuthenticated && user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Fetch reports
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: currentPage,
        limit: 10,
      };

      if (typeFilter !== "all") params.type = typeFilter;
      if (statusFilter !== "all") params.status = statusFilter;

      const response = await adminService.getReports(params);
      const data = response.data?.data || response.data;

      setReports(data?.reports || []);
      setPagination(data?.pagination || null);
    } catch (err: any) {
      console.error("Failed to fetch reports:", err);
      setError(err.response?.data?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [currentPage, typeFilter, statusFilter]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "ADMIN") {
      fetchReports();
    }
  }, [fetchReports, isAuthenticated, user]);

  // Resolve report
  const handleResolve = async (reportId: string, action: ReportAction) => {
    try {
      setActionLoading(reportId);
      await adminService.resolveReport(reportId, action);

      // Update local state
      setReports((prev) =>
        prev.map((r) =>
          r._id === reportId
            ? { ...r, status: "RESOLVED" as ReportStatus, action }
            : r
        )
      );

      setSelectedReport(null);
    } catch (err: any) {
      console.error("Failed to resolve report:", err);
      alert(err.response?.data?.message || "Failed to resolve report");
    } finally {
      setActionLoading(null);
    }
  };

  // Get type icon
  const getTypeIcon = (type: ReportType) => {
    switch (type) {
      case "POST":
        return <FileText size={16} />;
      case "COMMENT":
        return <MessageSquare size={16} />;
      case "USER":
        return <User size={16} />;
      case "JOB":
        return <Briefcase size={16} />;
      default:
        return <Flag size={16} />;
    }
  };

  // Get type color
  const getTypeColor = (type: ReportType) => {
    switch (type) {
      case "POST":
        return "bg-blue-100 text-blue-700";
      case "COMMENT":
        return "bg-purple-100 text-purple-700";
      case "USER":
        return "bg-orange-100 text-orange-700";
      case "JOB":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Get status color
  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "REVIEWED":
        return "bg-blue-100 text-blue-700";
      case "RESOLVED":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Get action color
  const getActionColor = (action: ReportAction) => {
    switch (action) {
      case "DISMISS":
        return "text-gray-600";
      case "WARN":
        return "text-yellow-600";
      case "REMOVE":
        return "text-red-600";
      case "BAN":
        return "text-red-700 font-semibold";
      default:
        return "text-gray-600";
    }
  };

  // Show loading while checking auth
  if (authLoading || (!isAuthenticated && !authLoading)) {
    return <PageLoading />;
  }

  if (user?.role !== "ADMIN") {
    return null;
  }

  return (
    <>
      <Head>
        <title>Reports | Admin - DevMatch</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link href="/admin" className="hover:text-blue-600">
                Admin
              </Link>
              <ChevronRight size={16} />
              <span className="text-gray-900">Reports</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <AlertTriangle className="text-orange-600" />
                  Reports & Flagged Content
                </h1>
                <p className="text-gray-600 mt-1">
                  Review and resolve reported content from users
                </p>
              </div>
              <button
                onClick={fetchReports}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw
                  size={18}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Type Filter */}
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-gray-400" />
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="POST">Posts</option>
                  <option value="COMMENT">Comments</option>
                  <option value="USER">Users</option>
                  <option value="JOB">Jobs</option>
                </select>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="RESOLVED">Resolved</option>
              </select>

              {/* Stats */}
              {pagination && (
                <div className="flex items-center gap-4 ml-auto text-sm">
                  <span className="text-gray-500">
                    {pagination.totalItems} total reports
                  </span>
                  {statusFilter === "PENDING" && (
                    <span className="text-yellow-600 font-medium">
                      {reports.length} pending review
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="text-red-500" size={20} />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Reports List */}
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-lg border border-gray-200 p-20 flex justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : reports.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-20 text-center">
                <CheckCircle
                  className="mx-auto text-green-400 mb-4"
                  size={48}
                />
                <p className="text-gray-500 text-lg">No reports found</p>
                <p className="text-gray-400 text-sm mt-1">
                  {statusFilter === "PENDING"
                    ? "All caught up! No pending reports to review."
                    : "No reports match your current filters."}
                </p>
              </div>
            ) : (
              reports.map((report, index) => (
                <motion.div
                  key={report._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Report Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          {/* Type Badge */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(
                              report.type
                            )}`}
                          >
                            {getTypeIcon(report.type)}
                            {report.type}
                          </span>

                          {/* Status Badge */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              report.status
                            )}`}
                          >
                            {report.status === "PENDING" && <Clock size={12} />}
                            {report.status === "REVIEWED" && <Eye size={12} />}
                            {report.status === "RESOLVED" && (
                              <CheckCircle size={12} />
                            )}
                            {report.status}
                          </span>

                          {/* Action taken (if resolved) */}
                          {report.action && (
                            <span
                              className={`text-xs ${getActionColor(
                                report.action
                              )}`}
                            >
                              Action: {report.action}
                            </span>
                          )}
                        </div>

                        {/* Reason */}
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {REPORT_REASONS[report.reason] || report.reason}
                        </h3>

                        {/* Description */}
                        {report.description && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {report.description}
                          </p>
                        )}

                        {/* Reported Content Preview */}
                        {report.reportedContent && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-3 border-l-4 border-gray-300">
                            {report.type === "POST" ||
                            report.type === "COMMENT" ? (
                              <p className="text-sm text-gray-700 line-clamp-2">
                                &quot;{report.reportedContent.content}&quot;
                              </p>
                            ) : report.type === "JOB" ? (
                              <p className="text-sm text-gray-700">
                                Job: {report.reportedContent.title}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-700">
                                User: @{report.reportedContent.username}
                              </p>
                            )}
                            {report.reportedContent.author && (
                              <p className="text-xs text-gray-500 mt-1">
                                By @{report.reportedContent.author.username}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <User size={14} />
                            Reported by @
                            {report.reporter?.username || "Unknown"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {formatRelativeTime(report.createdAt)}
                          </span>
                          {report.resolvedBy && (
                            <span className="flex items-center gap-1">
                              <CheckCircle
                                size={14}
                                className="text-green-500"
                              />
                              Resolved by @{report.resolvedBy.username}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2">
                        {/* View Details */}
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>

                        {report.status === "PENDING" && (
                          <>
                            {/* Quick Dismiss */}
                            <button
                              onClick={() =>
                                handleResolve(report._id, "DISMISS")
                              }
                              disabled={actionLoading === report._id}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Dismiss Report"
                            >
                              <XCircle size={18} />
                            </button>

                            {/* Quick Remove Content */}
                            <button
                              onClick={() =>
                                handleResolve(report._id, "REMOVE")
                              }
                              disabled={actionLoading === report._id}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove Content"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 bg-white rounded-lg border border-gray-200 px-6 py-4">
              <p className="text-sm text-gray-500">
                Showing {(currentPage - 1) * 10 + 1} to{" "}
                {Math.min(currentPage * 10, pagination.totalItems)} of{" "}
                {pagination.totalItems} reports
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrevPage}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(pagination.totalPages, p + 1)
                    )
                  }
                  disabled={!pagination.hasNextPage}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Detail Modal */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(
                      selectedReport.type
                    )}`}
                  >
                    {getTypeIcon(selectedReport.type)}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Report Details
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedReport.type} Report
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Status */}
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(
                      selectedReport.status
                    )}`}
                  >
                    {selectedReport.status === "PENDING" && <Clock size={14} />}
                    {selectedReport.status === "REVIEWED" && <Eye size={14} />}
                    {selectedReport.status === "RESOLVED" && (
                      <CheckCircle size={14} />
                    )}
                    {selectedReport.status}
                  </span>
                  {selectedReport.action && (
                    <span
                      className={`text-sm ${getActionColor(
                        selectedReport.action
                      )}`}
                    >
                      Action taken: {selectedReport.action}
                    </span>
                  )}
                </div>

                {/* Reason */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Reason
                  </h3>
                  <p className="text-gray-900">
                    {REPORT_REASONS[selectedReport.reason] ||
                      selectedReport.reason}
                  </p>
                </div>

                {/* Description */}
                {selectedReport.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Additional Details
                    </h3>
                    <p className="text-gray-700">
                      {selectedReport.description}
                    </p>
                  </div>
                )}

                {/* Reported Content */}
                {selectedReport.reportedContent && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Reported Content
                    </h3>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      {(selectedReport.type === "POST" ||
                        selectedReport.type === "COMMENT") && (
                        <p className="text-gray-800">
                          {selectedReport.reportedContent.content}
                        </p>
                      )}
                      {selectedReport.type === "JOB" && (
                        <div>
                          <p className="font-medium text-gray-900">
                            {selectedReport.reportedContent.title}
                          </p>
                        </div>
                      )}
                      {selectedReport.type === "USER" && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User size={20} className="text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              @{selectedReport.reportedContent.username}
                            </p>
                          </div>
                        </div>
                      )}
                      {selectedReport.reportedContent.author && (
                        <p className="text-sm text-gray-500 mt-2">
                          Author: @
                          {selectedReport.reportedContent.author.username}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Reporter Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Reported By
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User size={20} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        @{selectedReport.reporter?.username || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedReport.reporter?.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span>Reported: {formatDate(selectedReport.createdAt)}</span>
                  {selectedReport.resolvedAt && (
                    <span>
                      Resolved: {formatDate(selectedReport.resolvedAt)}
                    </span>
                  )}
                </div>
              </div>

              {/* Modal Footer - Actions */}
              {selectedReport.status === "PENDING" && (
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Take Action
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {/* Dismiss */}
                    <button
                      onClick={() =>
                        handleResolve(selectedReport._id, "DISMISS")
                      }
                      disabled={actionLoading === selectedReport._id}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      <XCircle size={18} />
                      Dismiss
                    </button>

                    {/* Warn User */}
                    <button
                      onClick={() => handleResolve(selectedReport._id, "WARN")}
                      disabled={actionLoading === selectedReport._id}
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50"
                    >
                      <AlertTriangle size={18} />
                      Warn User
                    </button>

                    {/* Remove Content */}
                    <button
                      onClick={() =>
                        handleResolve(selectedReport._id, "REMOVE")
                      }
                      disabled={actionLoading === selectedReport._id}
                      className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={18} />
                      Remove Content
                    </button>

                    {/* Ban User */}
                    <button
                      onClick={() => handleResolve(selectedReport._id, "BAN")}
                      disabled={actionLoading === selectedReport._id}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      <Ban size={18} />
                      Ban User
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
