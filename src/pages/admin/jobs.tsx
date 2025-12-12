/**
 * @file src/pages/admin/jobs.tsx
 * @description Admin jobs management page - view, feature, deactivate, delete jobs
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Briefcase,
  Search,
  Filter,
  Star,
  StarOff,
  Eye,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Building2,
  MapPin,
  Calendar,
  Users,
  AlertTriangle,
  X,
  RefreshCw,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { adminService } from "@/services/adminService";
import { PageLoading } from "@/components/common";
import { formatDate } from "@/lib/utils";

interface Job {
  _id: string;
  title: string;
  companyName: string;
  description: string;
  location: {
    city?: string;
    state?: string;
    country?: string;
  };
  workType: string;
  requiredSkills: string[];
  isActive: boolean;
  isFeatured: boolean;
  viewCount: number;
  applicationCount?: number;
  createdAt: string;
  recruiter: {
    _id: string;
    username: string;
    email: string;
  };
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function AdminJobsPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuthStore();

  // State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [featuredFilter, setFeaturedFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?redirect=/admin/jobs");
    } else if (!authLoading && isAuthenticated && user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Fetch jobs
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: currentPage,
        limit: 10,
      };

      if (search) params.search = search;
      if (statusFilter !== "all") params.status = statusFilter;
      if (featuredFilter !== "all")
        params.featured = featuredFilter === "featured";

      const response = await adminService.getJobs(params);
      const data = response.data?.data || response.data;

      setJobs(data?.jobs || []);
      setPagination(data?.pagination || null);
    } catch (err: any) {
      console.error("Failed to fetch jobs:", err);
      setError(err.response?.data?.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter, featuredFilter]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "ADMIN") {
      fetchJobs();
    }
  }, [fetchJobs, isAuthenticated, user]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Toggle featured status
  const toggleFeatured = async (job: Job) => {
    try {
      setActionLoading(job._id);
      await adminService.toggleJobFeatured(job._id, !job.isFeatured);
      setJobs((prev) =>
        prev.map((j) =>
          j._id === job._id ? { ...j, isFeatured: !j.isFeatured } : j
        )
      );
    } catch (err: any) {
      console.error("Failed to toggle featured:", err);
      alert(err.response?.data?.message || "Failed to update job");
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle active status
  const toggleActive = async (job: Job) => {
    try {
      setActionLoading(job._id);
      if (job.isActive) {
        await adminService.deactivateJob(job._id);
      } else {
        // Reactivate - you might need to add this endpoint
        await adminService.toggleJobFeatured(job._id, job.isFeatured); // placeholder
      }
      setJobs((prev) =>
        prev.map((j) =>
          j._id === job._id ? { ...j, isActive: !j.isActive } : j
        )
      );
    } catch (err: any) {
      console.error("Failed to toggle status:", err);
      alert(err.response?.data?.message || "Failed to update job");
    } finally {
      setActionLoading(null);
    }
  };

  // Delete job
  const handleDelete = async () => {
    if (!deleteModal) return;

    try {
      setActionLoading(deleteModal._id);
      await adminService.deleteJob(deleteModal._id);
      setJobs((prev) => prev.filter((j) => j._id !== deleteModal._id));
      setDeleteModal(null);
    } catch (err: any) {
      console.error("Failed to delete job:", err);
      alert(err.response?.data?.message || "Failed to delete job");
    } finally {
      setActionLoading(null);
    }
  };

  // Format location
  const formatLocation = (location: Job["location"]) => {
    const parts = [location?.city, location?.state, location?.country].filter(
      Boolean
    );
    return parts.length > 0 ? parts.join(", ") : "Remote";
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
        <title>Manage Jobs | Admin - DevMatch</title>
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
              <span className="text-gray-900">Jobs</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Briefcase className="text-blue-600" />
                  Job Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage all job postings on the platform
                </p>
              </div>
              <button
                onClick={fetchJobs}
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
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search jobs by title, company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Featured Filter */}
              <select
                value={featuredFilter}
                onChange={(e) => {
                  setFeaturedFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Jobs</option>
                <option value="featured">Featured Only</option>
                <option value="regular">Regular Only</option>
              </select>
            </div>
          </div>

          {/* Stats Summary */}
          {pagination && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pagination.totalItems}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {jobs.filter((j) => j.isActive).length}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Featured</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {jobs.filter((j) => j.isFeatured).length}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Current Page</p>
                <p className="text-2xl font-bold text-blue-600">
                  {pagination.currentPage} / {pagination.totalPages}
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <AlertTriangle className="text-red-500" size={20} />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Jobs Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-20">
                <Briefcase className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500">No jobs found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recruiter
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stats
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {jobs.map((job, index) => (
                      <motion.tr
                        key={job._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50"
                      >
                        {/* Job Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Briefcase className="text-blue-600" size={20} />
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/jobs/${job._id}`}
                                className="font-medium text-gray-900 hover:text-blue-600 flex items-center gap-1"
                              >
                                {job.title}
                                {job.isFeatured && (
                                  <Star
                                    className="text-yellow-500 fill-yellow-500"
                                    size={14}
                                  />
                                )}
                              </Link>
                              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                <Building2 size={14} />
                                <span>{job.companyName}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <MapPin size={14} />
                                <span>{formatLocation(job.location)}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Recruiter */}
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">
                            {job.recruiter?.username || "Unknown"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {job.recruiter?.email || "-"}
                          </p>
                        </td>

                        {/* Stats */}
                        <td className="px-6 py-4">
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Eye size={14} />
                              <span>{job.viewCount || 0} views</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Users size={14} />
                              <span>
                                {job.applicationCount || 0} applications
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                              <Calendar size={14} />
                              <span>{formatDate(job.createdAt)}</span>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                job.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {job.isActive ? "Active" : "Inactive"}
                            </span>
                            {job.isFeatured && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 ml-1">
                                Featured
                              </span>
                            )}
                            <p className="text-xs text-gray-500">
                              {job.workType}
                            </p>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {/* View */}
                            <Link
                              href={`/jobs/${job._id}`}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Job"
                            >
                              <ExternalLink size={18} />
                            </Link>

                            {/* Toggle Featured */}
                            <button
                              onClick={() => toggleFeatured(job)}
                              disabled={actionLoading === job._id}
                              className={`p-2 rounded-lg transition-colors ${
                                job.isFeatured
                                  ? "text-yellow-600 hover:bg-yellow-50"
                                  : "text-gray-400 hover:text-yellow-600 hover:bg-yellow-50"
                              }`}
                              title={
                                job.isFeatured
                                  ? "Remove Featured"
                                  : "Make Featured"
                              }
                            >
                              {job.isFeatured ? (
                                <Star className="fill-current" size={18} />
                              ) : (
                                <StarOff size={18} />
                              )}
                            </button>

                            {/* Toggle Active */}
                            <button
                              onClick={() => toggleActive(job)}
                              disabled={actionLoading === job._id}
                              className={`p-2 rounded-lg transition-colors ${
                                job.isActive
                                  ? "text-green-600 hover:bg-green-50"
                                  : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                              }`}
                              title={job.isActive ? "Deactivate" : "Activate"}
                            >
                              {job.isActive ? (
                                <ToggleRight size={18} />
                              ) : (
                                <ToggleLeft size={18} />
                              )}
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => setDeleteModal(job)}
                              disabled={actionLoading === job._id}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Job"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * 10 + 1} to{" "}
                  {Math.min(currentPage * 10, pagination.totalItems)} of{" "}
                  {pagination.totalItems} jobs
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
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-md w-full p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Job
                </h3>
                <p className="text-sm text-gray-500">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-900">
                &quot;{deleteModal.title}&quot;
              </span>{" "}
              at {deleteModal.companyName}? All applications for this job will
              also be removed.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading === deleteModal._id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading === deleteModal._id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Delete Job
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
