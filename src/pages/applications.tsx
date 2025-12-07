/**
 * @file src/pages/applications.tsx
 * @description Recruiter dashboard to view and manage job applications
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { applicationService } from '../services/applicationService';
import { jobService } from '../services/jobService';
import LoadingSpinner from '../components/common/Loading';
import {
  Briefcase,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  ChevronDown,
  ExternalLink,
  Calendar,
  MapPin,
  Mail,
  Github,
} from 'lucide-react';

interface Application {
  _id: string;
  applicant: {
    _id: string;
    username: string;
    email: string;
    avatar: string | null;
  };
  jobPost: {
    _id: string;
    title: string;
    companyName: string;
  };
  status: 'PENDING' | 'REVIEWED' | 'SHORTLISTED' | 'REJECTED';
  coverLetter?: string;
  resumeUrl?: string;
  appliedAt: string;
  updatedAt: string;
  developerProfile?: {
    headline: string;
    skills: string[];
    yearsOfExperience: number;
    location: {
      city?: string;
      country?: string;
    };
    githubUsername?: string;
  };
}

interface Job {
  _id: string;
  title: string;
  applicationCount: number;
}

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock
  },
  REVIEWED: {
    label: 'Reviewed',
    color: 'bg-blue-100 text-blue-800',
    icon: Eye
  },
  SHORTLISTED: {
    label: 'Shortlisted',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800',
    icon: XCircle
  }
};

export default function Applications() {
  const router = useRouter();
  const { user } = useAuth();
  const { success, error: showError } = useToast();

  // Get query params from Next.js router
  const { page, job, status, sort } = router.query;

  const currentPage = parseInt((page as string) || '1', 10);
  const selectedJob = (job as string) || '';
  const selectedStatus = (status as string) || '';
  const sortBy = (sort as string) || 'newest';

  // State
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showStatusMenu, setShowStatusMenu] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  const limit = 10;

  // Fetch recruiter's jobs for filter dropdown
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await jobService.getMyJobs();
        setJobs(response.data?.jobs || []);
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
      }
    };
    fetchJobs();
  }, []);

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: currentPage,
        limit,
        sort: sortBy
      };

      if (selectedJob) params.jobId = selectedJob;
      if (selectedStatus) params.status = selectedStatus;

      const response = await applicationService.getRecruiterApplications(params);
      setApplications(response.data?.applications || []);
      setTotalCount(response.data?.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      showError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedJob, selectedStatus, sortBy, showError]);

  useEffect(() => {
    if (router.isReady) {
      fetchApplications();
    }
  }, [router.isReady, fetchApplications]);

  // Update URL params
  const updateFilters = (updates: Record<string, string | null>) => {
    const newQuery: Record<string, string> = { ...router.query } as Record<string, string>;
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        delete newQuery[key];
      } else {
        newQuery[key] = value;
      }
    });

    if (!updates.hasOwnProperty('page')) {
      newQuery.page = '1';
    }

    router.push({ pathname: '/applications', query: newQuery }, undefined, { shallow: true });
  };

  // Update application status
  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    setStatusUpdating(applicationId);
    try {
      await applicationService.updateStatus(applicationId, newStatus);
      success(`Application marked as ${newStatus.toLowerCase()}`);
      
      setApplications(prev =>
        prev.map(app =>
          app._id === applicationId
            ? { ...app, status: newStatus as Application['status'] }
            : app
        )
      );
      
      setShowStatusMenu(null);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusUpdating(null);
    }
  };

  // Get statistics
  const stats = {
    total: totalCount,
    pending: applications.filter(a => a.status === 'PENDING').length,
    shortlisted: applications.filter(a => a.status === 'SHORTLISTED').length,
    rejected: applications.filter(a => a.status === 'REJECTED').length
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <>
      <Head>
        <title>Applications - DevMatch</title>
        <meta name="description" content="Manage job applications" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Applications
          </h1>
          <p className="text-gray-600">
            Manage applications to your job postings
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="text-yellow-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.shortlisted}</p>
                <p className="text-sm text-gray-500">Shortlisted</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="text-red-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                <p className="text-sm text-gray-500">Rejected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Job Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Job
              </label>
              <select
                value={selectedJob}
                onChange={(e) => updateFilters({ job: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Jobs</option>
                {jobs.map((j) => (
                  <option key={j._id} value={j._id}>
                    {j.title} ({j.applicationCount} applications)
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => updateFilters({ status: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Sort */}
            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Applications List */}
        {!loading && applications.length > 0 && (
          <div className="space-y-4 mb-8">
            {applications.map((application) => (
              <ApplicationCard
                key={application._id}
                application={application}
                showStatusMenu={showStatusMenu}
                setShowStatusMenu={setShowStatusMenu}
                statusUpdating={statusUpdating}
                onStatusUpdate={handleStatusUpdate}
                onViewDetails={() => setSelectedApplication(application)}
              />
            ))}
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
              {selectedJob || selectedStatus
                ? 'Try adjusting your filters'
                : 'Applications will appear here when developers apply to your jobs'}
            </p>
            {!selectedJob && !selectedStatus && (
              <Link
                href="/jobs/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Briefcase size={18} />
                Post a Job
              </Link>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => updateFilters({ page: (currentPage - 1).toString() })}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => updateFilters({ page: (currentPage + 1).toString() })}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Application Detail Modal */}
        {selectedApplication && (
          <ApplicationDetailModal
            application={selectedApplication}
            onClose={() => setSelectedApplication(null)}
            onStatusUpdate={handleStatusUpdate}
            statusUpdating={statusUpdating}
          />
        )}
      </div>
    </>
  );
}

// Application Card Component
interface ApplicationCardProps {
  application: Application;
  showStatusMenu: string | null;
  setShowStatusMenu: (id: string | null) => void;
  statusUpdating: string | null;
  onStatusUpdate: (id: string, status: string) => void;
  onViewDetails: () => void;
}

const ApplicationCard = ({
  application,
  showStatusMenu,
  setShowStatusMenu,
  statusUpdating,
  onStatusUpdate,
  onViewDetails
}: ApplicationCardProps) => {
  const statusConfig = STATUS_CONFIG[application.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Applicant Info */}
        <div className="flex items-center gap-4 flex-1">
          {application.applicant.avatar ? (
            <img
              src={application.applicant.avatar}
              alt={application.applicant.username}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {application.applicant.username.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/profile/${application.applicant.username}`}
                className="font-semibold text-gray-900 hover:text-blue-600"
              >
                @{application.applicant.username}
              </Link>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                <StatusIcon size={12} />
                {statusConfig.label}
              </span>
            </div>
            {application.developerProfile?.headline && (
              <p className="text-sm text-gray-600 truncate">
                {application.developerProfile.headline}
              </p>
            )}
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Briefcase size={12} />
                {application.jobPost.title}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {new Date(application.appliedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Skills Preview */}
        {application.developerProfile?.skills && (
          <div className="hidden lg:flex flex-wrap gap-1 max-w-xs">
            {application.developerProfile.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
              >
                {skill}
              </span>
            ))}
            {application.developerProfile.skills.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                +{application.developerProfile.skills.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onViewDetails}
            className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-sm"
          >
            <Eye size={16} />
            View
          </button>

          {/* Status Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(
                showStatusMenu === application._id ? null : application._id
              )}
              disabled={statusUpdating === application._id}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {statusUpdating === application._id ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  Update Status
                  <ChevronDown size={14} />
                </>
              )}
            </button>

            {showStatusMenu === application._id && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                  <button
                    key={status}
                    onClick={() => onStatusUpdate(application._id, status)}
                    disabled={application.status === status}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                      application.status === status ? 'bg-gray-50' : ''
                    }`}
                  >
                    <config.icon size={14} />
                    {config.label}
                    {application.status === status && (
                      <CheckCircle size={14} className="ml-auto text-green-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Application Detail Modal
interface ApplicationDetailModalProps {
  application: Application;
  onClose: () => void;
  onStatusUpdate: (id: string, status: string) => void;
  statusUpdating: string | null;
}

const ApplicationDetailModal = ({
  application,
  onClose,
  onStatusUpdate,
  statusUpdating
}: ApplicationDetailModalProps) => {
  const statusConfig = STATUS_CONFIG[application.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {application.applicant.avatar ? (
                <img
                  src={application.applicant.avatar}
                  alt={application.applicant.username}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                  {application.applicant.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  @{application.applicant.username}
                </h2>
                {application.developerProfile?.headline && (
                  <p className="text-gray-600">
                    {application.developerProfile.headline}
                  </p>
                )}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-2 ${statusConfig.color}`}>
                  <StatusIcon size={12} />
                  {statusConfig.label}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Applied To */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Applied To</h3>
            <Link
              href={`/jobs/${application.jobPost._id}`}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <Briefcase size={16} />
              {application.jobPost.title} at {application.jobPost.companyName}
              <ExternalLink size={14} />
            </Link>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Contact</h3>
            <div className="space-y-2">
              <a
                href={`mailto:${application.applicant.email}`}
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
              >
                <Mail size={16} />
                {application.applicant.email}
              </a>
              {application.developerProfile?.githubUsername && (
                <a
                  href={`https://github.com/${application.developerProfile.githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
                >
                  <Github size={16} />
                  {application.developerProfile.githubUsername}
                </a>
              )}
            </div>
          </div>

          {/* Experience & Location */}
          <div className="grid grid-cols-2 gap-4">
            {application.developerProfile?.yearsOfExperience !== undefined && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Experience</h3>
                <p className="text-gray-900">
                  {application.developerProfile.yearsOfExperience} years
                </p>
              </div>
            )}
            {application.developerProfile?.location && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Location</h3>
                <p className="text-gray-900 flex items-center gap-1">
                  <MapPin size={14} />
                  {[
                    application.developerProfile.location.city,
                    application.developerProfile.location.country
                  ].filter(Boolean).join(', ')}
                </p>
              </div>
            )}
          </div>

          {/* Skills */}
          {application.developerProfile?.skills && application.developerProfile.skills.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {application.developerProfile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Cover Letter */}
          {application.coverLetter && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Cover Letter</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {application.coverLetter}
                </p>
              </div>
            </div>
          )}

          {/* Resume */}
          {application.resumeUrl && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Resume</h3>
              <a
                href={application.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <FileText size={16} />
                View Resume
                <ExternalLink size={14} />
              </a>
            </div>
          )}

          {/* Timeline */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={14} />
                Applied: {new Date(application.appliedAt).toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock size={14} />
                Last Updated: {new Date(application.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4">
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/profile/${application.applicant.username}`}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white flex items-center gap-2"
            >
              <User size={16} />
              View Profile
            </Link>
            <a
              href={`mailto:${application.applicant.email}`}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white flex items-center gap-2"
            >
              <Mail size={16} />
              Email
            </a>
            <div className="flex-1" />
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <button
                key={status}
                onClick={() => onStatusUpdate(application._id, status)}
                disabled={statusUpdating === application._id || application.status === status}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm disabled:opacity-50 ${
                  application.status === status
                    ? `${config.color} cursor-default`
                    : 'border border-gray-300 text-gray-700 hover:bg-white'
                }`}
              >
                <config.icon size={16} />
                {config.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};