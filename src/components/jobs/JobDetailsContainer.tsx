/**
 * @file src/components/jobs/JobDetailsContainer.tsx
 * @description Job details page container
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FiArrowLeft,
  FiMapPin,
  FiBriefcase,
  FiClock,
  FiDollarSign,
  FiUsers,
  FiCalendar,
  FiExternalLink,
  FiSend,
  FiBookmark,
  FiShare2,
  FiCheckCircle,
  FiEdit2,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { jobAPINew } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Badge,
  Avatar,
  PageLoading,
} from '@/components/common';
import { formatDate, formatRelativeTime } from '@/lib/utils';

interface JobDetails {
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
  preferredSkills: string[];
  minYearsExperience: number;
  maxYearsExperience: number | null;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
    isVisible?: boolean;
  };
  employmentType: string;
  applicationDeadline: string | null;
  externalApplicationUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  viewCount: number;
  createdAt: string;
  recruiter: {
    _id: string;
    username: string;
    avatar: string | null;
  };
  recruiterProfile?: {
    companyName: string;
    companyWebsite?: string;
    companyDescription?: string;
    companySize?: string;
    industry?: string;
    isVerified: boolean;
  };
  hasApplied?: boolean;
  applicationCount?: number;
}

export default function JobDetailsContainer({ jobId }: { jobId: string }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const isOwner = user?.id === job?.recruiter._id;
  const isDeveloper = user?.role === 'DEVELOPER';

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await jobAPINew.getById(jobId);
        setJob(response.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load job');
        if (err.response?.status === 404) {
          toast.error('Job not found');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const handleApply = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/jobs/${jobId}`);
      return;
    }

    if (!isDeveloper) {
      toast.error('Only developers can apply for jobs');
      return;
    }

    if (job?.externalApplicationUrl) {
      window.open(job.externalApplicationUrl, '_blank');
      return;
    }

    setIsApplying(true);
    try {
      await jobAPINew.apply(jobId);
      setJob((prev) => prev ? { ...prev, hasApplied: true } : null);
      toast.success('Application submitted successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    } finally {
      setIsApplying(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: job?.title,
          text: `Check out this job: ${job?.title} at ${job?.companyName}`,
          url,
        });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const formatSalary = () => {
    if (!job?.salary?.isVisible || !job.salary.min) return null;
    const currency = job.salary.currency || 'USD';
    const format = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(0)}k` : n);
    return job.salary.max
      ? `${currency} ${format(job.salary.min)} - ${format(job.salary.max)}`
      : `${currency} ${format(job.salary.min)}+`;
  };

  const getLocation = () => {
    if (job?.workType === 'REMOTE') return 'Remote';
    const parts = [];
    if (job?.location?.city) parts.push(job.location.city);
    if (job?.location?.state) parts.push(job.location.state);
    if (job?.location?.country) parts.push(job.location.country);
    return parts.join(', ') || 'Location not specified';
  };

  if (loading) return <PageLoading />;

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/jobs" className="text-blue-600 hover:text-blue-700 font-medium">
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  const salary = formatSalary();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50"
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Link */}
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Jobs
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Job Info */}
            <div className="flex gap-4">
              {/* Company Logo */}
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                {job.companyName.charAt(0)}
              </div>

              <div>
                {/* Title & Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                  {job.isFeatured && (
                    <Badge variant="warning" size="sm">Featured</Badge>
                  )}
                  {!job.isActive && (
                    <Badge variant="danger" size="sm">Closed</Badge>
                  )}
                </div>

                {/* Company */}
                <p className="text-lg text-gray-600 mb-3">
                  {job.companyName}
                  {job.recruiterProfile?.isVerified && (
                    <FiCheckCircle className="inline-block w-4 h-4 text-blue-500 ml-1" />
                  )}
                </p>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <FiMapPin className="w-4 h-4" />
                    {getLocation()}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiBriefcase className="w-4 h-4" />
                    {job.workType} • {job.employmentType.replace('_', ' ')}
                  </span>
                  {salary && (
                    <span className="flex items-center gap-1 text-green-600 font-medium">
                      <FiDollarSign className="w-4 h-4" />
                      {salary}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <FiClock className="w-4 h-4" />
                    Posted {formatRelativeTime(job.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {isOwner ? (
                <Link href={`/jobs/${jobId}/edit`}>
                  <Button leftIcon={<FiEdit2 />}>Edit Job</Button>
                </Link>
              ) : isDeveloper && job.isActive ? (
                <Button
                  onClick={handleApply}
                  isLoading={isApplying}
                  disabled={job.hasApplied}
                  leftIcon={job.hasApplied ? <FiCheckCircle /> : <FiSend />}
                >
                  {job.hasApplied ? 'Applied' : 'Apply Now'}
                </Button>
              ) : null}

              <Button variant="outline" onClick={() => setIsSaved(!isSaved)}>
                <FiBookmark className={isSaved ? 'fill-current' : ''} />
              </Button>

              <Button variant="ghost" onClick={handleShare}>
                <FiShare2 />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Job Description</h2>
              </CardHeader>
              <CardBody>
                <div className="prose prose-gray max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700">{job.description}</p>
                </div>
              </CardBody>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">Requirements</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                {/* Experience */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Experience</h4>
                  <p className="text-gray-900">
                    {job.minYearsExperience}
                    {job.maxYearsExperience ? ` - ${job.maxYearsExperience}` : '+'} years
                  </p>
                </div>

                {/* Required Skills */}
                {job.requiredSkills.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {job.requiredSkills.map((skill) => (
                        <Badge key={skill} variant="primary" size="md">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preferred Skills */}
                {job.preferredSkills.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Nice to Have</h4>
                    <div className="flex flex-wrap gap-2">
                      {job.preferredSkills.map((skill) => (
                        <Badge key={skill} variant="outline" size="md">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job Stats */}
            <Card>
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Views</span>
                  <span className="font-medium text-gray-900">{job.viewCount}</span>
                </div>
                {job.applicationCount !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Applicants</span>
                    <span className="font-medium text-gray-900">{job.applicationCount}</span>
                  </div>
                )}
                {job.applicationDeadline && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Deadline</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(job.applicationDeadline)}
                    </span>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Company Info */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-gray-900">About the Company</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                    {job.companyName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{job.companyName}</p>
                    {job.recruiterProfile?.industry && (
                      <p className="text-sm text-gray-500">{job.recruiterProfile.industry}</p>
                    )}
                  </div>
                </div>

                {job.recruiterProfile?.companyDescription && (
                  <p className="text-sm text-gray-600 line-clamp-4">
                    {job.recruiterProfile.companyDescription}
                  </p>
                )}

                {job.recruiterProfile?.companySize && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FiUsers className="w-4 h-4" />
                    {job.recruiterProfile.companySize} employees
                  </div>
                )}

                {job.recruiterProfile?.companyWebsite && (
                  <a
                    href={job.recruiterProfile.companyWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <FiExternalLink className="w-4 h-4" />
                    Company Website
                  </a>
                )}

                <Link
                  href={`/profile/${job.recruiter.username}`}
                  className="flex items-center gap-3 pt-4 border-t border-gray-100"
                >
                  <Avatar
                    src={job.recruiter.avatar}
                    name={job.recruiter.username}
                    size="sm"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Posted by {job.recruiter.username}
                    </p>
                    <p className="text-xs text-blue-600">View Profile</p>
                  </div>
                </Link>
              </CardBody>
            </Card>

            {/* Apply CTA */}
            {isDeveloper && job.isActive && !job.hasApplied && (
              <Card className="bg-blue-50 border-blue-200">
                <CardBody className="text-center">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Interested in this job?
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Apply now and take the next step in your career
                  </p>
                  <Button onClick={handleApply} isLoading={isApplying} className="w-full">
                    Apply Now
                  </Button>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}