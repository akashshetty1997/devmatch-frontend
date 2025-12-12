/**
 * @file src/pages/my-jobs.tsx
 * @description Recruiter's view of their posted jobs
 */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import { jobService } from "../services/jobService";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/common/Loading";
import {
  Plus,
  Briefcase,
  MapPin,
  Users,
  Eye,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Calendar,
  ExternalLink,
} from "lucide-react";

interface Job {
  _id: string;
  title: string;
  companyName: string;
  location: {
    city?: string;
    country?: string;
  };
  workType: string;
  isActive: boolean;
  viewCount: number;
  applicationCount: number;
  createdAt: string;
}

const MyJobs = () => {
  const { success, error } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Prevent duplicate API calls
  const hasFetched = useRef(false);

  // Redirect if not authenticated or not a recruiter
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push("/login?redirect=/my-jobs");
      return;
    }
    if (user?.role !== "RECRUITER") {
      router.push("/");
      return;
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Fetch jobs only once
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== "RECRUITER") return;
    if (hasFetched.current) return;

    const fetchJobs = async () => {
      hasFetched.current = true;
      try {
        const response = await jobService.getMyJobs();
        const data = response.data?.data || response.data;
        setJobs(Array.isArray(data) ? data : data?.jobs || []);
      } catch (err: any) {
        if (err.response?.status !== 429) {
          error("Failed to load jobs");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [authLoading, isAuthenticated, user, error]);

  const handleToggleStatus = async (job: Job) => {
    setActionLoading(job._id);
    try {
      if (job.isActive) {
        await jobService.deactivateJob(job._id);
        success("Job deactivated");
      } else {
        await jobService.activateJob(job._id);
        success("Job activated");
      }
      setJobs((prev) =>
        prev.map((j) =>
          j._id === job._id ? { ...j, isActive: !j.isActive } : j
        )
      );
    } catch (err) {
      error("Failed to update job status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;

    setActionLoading(jobId);
    try {
      await jobService.deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
      success("Job deleted");
    } catch (err) {
      error("Failed to delete job");
    } finally {
      setActionLoading(null);
    }
  };

  // Show loading while checking authentication
  if (authLoading || (!isAuthenticated && loading)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Don't render if not recruiter (will redirect)
  if (!isAuthenticated || user?.role !== "RECRUITER") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const activeJobs = jobs.filter((j) => j.isActive);
  const totalApplications = jobs.reduce(
    (sum, j) => sum + (j.applicationCount || 0),
    0
  );

  return (
    <>
      <Head>
        <title>My Jobs - DevMatch</title>
        <meta name="description" content="Manage your job postings" />
      </Head>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Jobs</h1>
            <p className="text-gray-600">Manage your job postings</p>
          </div>
          <Link
            href="/jobs/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            <Plus size={18} />
            Post New Job
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
            <p className="text-sm text-gray-500">Total Jobs</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-2xl font-bold text-green-600">
              {activeJobs.length}
            </p>
            <p className="text-sm text-gray-500">Active</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-2xl font-bold text-blue-600">
              {totalApplications}
            </p>
            <p className="text-sm text-gray-500">Total Applications</p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Jobs List */}
        {!loading && jobs.length > 0 && (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job._id}
                className={`bg-white rounded-lg border p-6 transition-opacity ${
                  job.isActive
                    ? "border-gray-200"
                    : "border-gray-200 opacity-60"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Link
                        href={`/jobs/${job._id}`}
                        className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {job.title}
                      </Link>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          job.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {job.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span>{job.companyName}</span>
                      {job.location?.city && (
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {job.location.city}
                        </span>
                      )}
                      <span>{job.workType}</span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye size={14} />
                        {job.viewCount || 0} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {job.applicationCount || 0} applications
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/jobs/${job._id}/applications`}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Applications"
                    >
                      <Users size={18} />
                    </Link>
                    <Link
                      href={`/jobs/${job._id}`}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View"
                    >
                      <ExternalLink size={18} />
                    </Link>
                    <Link
                      href={`/jobs/${job._id}/edit`}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </Link>
                    <button
                      onClick={() => handleToggleStatus(job)}
                      disabled={actionLoading === job._id}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
                      title={job.isActive ? "Deactivate" : "Activate"}
                    >
                      {actionLoading === job._id ? (
                        <LoadingSpinner size="sm" />
                      ) : job.isActive ? (
                        <ToggleRight size={18} className="text-green-500" />
                      ) : (
                        <ToggleLeft size={18} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(job._id)}
                      disabled={actionLoading === job._id}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-colors"
                      title="Delete"
                    >
                      {actionLoading === job._id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && jobs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Briefcase className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No jobs posted yet
            </h3>
            <p className="text-gray-500 mb-4">
              Start attracting talent by posting your first job
            </p>
            <Link
              href="/jobs/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              Post Your First Job
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default MyJobs;
