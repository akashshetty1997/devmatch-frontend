/**
 * @file src/pages/jobs/[id]/apply.tsx
 * @description Apply to job page - developers only
 */

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiSend,
  FiBriefcase,
  FiMapPin,
  FiDollarSign,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { jobAPINew, applicationAPI } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Badge,
  Textarea,
  Input,
  PageLoading,
} from "@/components/common";

export default function ApplyToJobPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState(false);

  const [formData, setFormData] = useState({
    coverLetter: "",
    resumeUrl: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if not authenticated or not a developer
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/jobs/${id}/apply`);
      return;
    }

    if (user?.role !== "DEVELOPER") {
      toast.error("Only developers can apply to jobs");
      router.push(`/jobs/${id}`);
      return;
    }
  }, [authLoading, isAuthenticated, user, router, id]);

  // Fetch job details
  useEffect(() => {
    if (!id || typeof id !== "string") return;
    if (authLoading || !isAuthenticated) return;

    const fetchJob = async () => {
      setLoading(true);
      try {
        const response = await jobAPINew.getById(id);
        const jobData = response.data.data;

        // Check if job is active
        if (!jobData.isActive) {
          toast.error("This job is no longer accepting applications");
          router.push(`/jobs/${id}`);
          return;
        }

        // Check if deadline passed
        if (jobData.applicationDeadline) {
          const deadline = new Date(jobData.applicationDeadline);
          if (deadline < new Date()) {
            toast.error("Application deadline has passed");
            router.push(`/jobs/${id}`);
            return;
          }
        }

        // Check if external application
        if (jobData.externalApplicationUrl) {
          window.location.href = jobData.externalApplicationUrl;
          return;
        }

        setJob(jobData);
      } catch (err: any) {
        const message = err.response?.data?.message || "Failed to load job";
        toast.error(message);
        router.push("/jobs");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id, authLoading, isAuthenticated, router]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when field is modified
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.coverLetter.trim()) {
      newErrors.coverLetter = "Please write a cover letter";
    } else if (formData.coverLetter.length < 50) {
      newErrors.coverLetter = "Cover letter must be at least 50 characters";
    } else if (formData.coverLetter.length > 5000) {
      newErrors.coverLetter = "Cover letter cannot exceed 5000 characters";
    }

    if (formData.resumeUrl && formData.resumeUrl.trim()) {
      try {
        new URL(formData.resumeUrl);
      } catch {
        newErrors.resumeUrl = "Please enter a valid URL";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setSubmitting(true);

    try {
      await applicationAPI.apply(id as string, {
        coverLetter: formData.coverLetter.trim(),
        resumeUrl: formData.resumeUrl.trim() || undefined,
      });

      setApplicationSuccess(true);
      toast.success("Application submitted successfully!");
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Failed to submit application";

      if (message.toLowerCase().includes("already applied")) {
        setAlreadyApplied(true);
      }

      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

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

  // Format work type
  const formatWorkType = (type: string) => {
    return type?.charAt(0) + type?.slice(1).toLowerCase();
  };

  // Format employment type
  const formatEmploymentType = (type: string) => {
    return type?.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (authLoading || loading) {
    return <PageLoading />;
  }

  // Success state
  if (applicationSuccess) {
    return (
      <>
        <Head>
          <title>Application Submitted | DevMatch</title>
        </Head>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-lg mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card>
                <CardBody className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiCheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Application Submitted!
                  </h1>
                  <p className="text-gray-600 mb-6">
                    Your application for <strong>{job?.title}</strong> at{" "}
                    <strong>{job?.companyName}</strong> has been submitted
                    successfully. The recruiter will review your application and
                    get back to you.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/applications">
                      <Button variant="primary">View My Applications</Button>
                    </Link>
                    <Link href="/jobs">
                      <Button variant="outline">Browse More Jobs</Button>
                    </Link>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          </div>
        </div>
      </>
    );
  }

  // Already applied state
  if (alreadyApplied) {
    return (
      <>
        <Head>
          <title>Already Applied | DevMatch</title>
        </Head>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-lg mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card>
                <CardBody className="p-8 text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiAlertCircle className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Already Applied
                  </h1>
                  <p className="text-gray-600 mb-6">
                    You have already applied to this job. You can track your
                    application status in your applications page.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/applications">
                      <Button variant="primary">View My Applications</Button>
                    </Link>
                    <Link href="/jobs">
                      <Button variant="outline">Browse More Jobs</Button>
                    </Link>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          </div>
        </div>
      </>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-lg mx-auto px-4 text-center">
          <FiBriefcase className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Job Not Found
          </h3>
          <p className="text-gray-500 mb-4">
            This job posting may have been removed.
          </p>
          <Link href="/jobs">
            <Button>Browse Jobs</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Apply to {job.title} | DevMatch</title>
        <meta
          name="description"
          content={`Apply to ${job.title} at ${job.companyName}`}
        />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <h1 className="text-2xl font-bold text-gray-900">
              Apply to this Job
            </h1>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Application Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2"
            >
              <form onSubmit={handleSubmit}>
                <Card>
                  <CardHeader>
                    <h2 className="font-semibold text-gray-900">
                      Your Application
                    </h2>
                    <p className="text-sm text-gray-500">
                      Tell the recruiter why you're a great fit for this role
                    </p>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    {/* Cover Letter */}
                    <div>
                      <Textarea
                        label="Cover Letter *"
                        name="coverLetter"
                        value={formData.coverLetter}
                        onChange={handleChange}
                        placeholder="Introduce yourself and explain why you're interested in this position. Highlight relevant experience and skills that make you a strong candidate..."
                        rows={10}
                        error={errors.coverLetter}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.coverLetter.length}/5000 characters (minimum
                        50)
                      </p>
                    </div>

                    {/* Resume URL */}
                    <div>
                      <Input
                        label="Resume URL (Optional)"
                        name="resumeUrl"
                        value={formData.resumeUrl}
                        onChange={handleChange}
                        placeholder="https://drive.google.com/your-resume or LinkedIn profile"
                        error={errors.resumeUrl}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Link to your resume, portfolio, or LinkedIn profile
                      </p>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                      <Button
                        type="submit"
                        leftIcon={<FiSend />}
                        isLoading={submitting}
                        className="w-full sm:w-auto"
                      >
                        Submit Application
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </form>
            </motion.div>

            {/* Job Summary Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardBody className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {job.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{job.companyName}</p>

                  <div className="space-y-3 text-sm">
                    {job.location?.city && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <FiMapPin className="w-4 h-4 text-gray-400" />
                        {[
                          job.location.city,
                          job.location.state,
                          job.location.country,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-gray-600">
                      <FiBriefcase className="w-4 h-4 text-gray-400" />
                      {formatWorkType(job.workType)} •{" "}
                      {formatEmploymentType(job.employmentType)}
                    </div>

                    {job.salary?.isVisible && formatSalary(job.salary) && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <FiDollarSign className="w-4 h-4 text-gray-400" />
                        {formatSalary(job.salary)}
                      </div>
                    )}

                    {job.applicationDeadline && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <FiClock className="w-4 h-4 text-gray-400" />
                        Deadline:{" "}
                        {new Date(job.applicationDeadline).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Required Skills */}
                  {job.requiredSkills?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Required Skills
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {job.requiredSkills.map((skill: string) => (
                          <Badge key={skill} variant="primary" size="sm">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Link
                      href={`/jobs/${id}`}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      View full job description →
                    </Link>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
