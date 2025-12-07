/**
 * @file src/components/jobs/JobForm.tsx
 * @description Create/Edit job form
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowLeft, FiPlus, FiX, FiSave, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import { jobAPINew, skillAPI } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Textarea,
  Badge,
  PageLoading,
} from "@/components/common";
import { cn } from "@/lib/utils";

interface JobFormProps {
  jobId?: string;
}

const WORK_TYPES = ["REMOTE", "ONSITE", "HYBRID"];
const EMPLOYMENT_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
  "FREELANCE",
];

export default function JobForm({ jobId }: JobFormProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const isEditing = !!jobId;

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<any[]>([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [activeSkillType, setActiveSkillType] = useState<
    "required" | "preferred"
  >("required");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: {
      city: "",
      state: "",
      country: "",
    },
    workType: "REMOTE",
    employmentType: "FULL_TIME",
    requiredSkills: [] as string[],
    preferredSkills: [] as string[],
    minYearsExperience: 0,
    maxYearsExperience: null as number | null,
    salary: {
      min: null as number | null,
      max: null as number | null,
      currency: "USD",
      isVisible: true,
    },
    applicationDeadline: "",
    externalApplicationUrl: "",
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch available skills on mount
  useEffect(() => {
    skillAPI
      .getAll()
      .then((res) => {
        setAvailableSkills(res.data.data || []);
      })
      .catch((err) => {
        console.error("Failed to fetch skills:", err);
      });
  }, []);

  // Fetch existing job if editing
  useEffect(() => {
    if (isEditing && jobId) {
      setLoading(true);
      jobAPINew
        .getById(jobId)
        .then((res) => {
          const job = res.data.data;

          // Check if current user owns this job
          if (job.recruiter._id !== user?.id && user?.role !== "ADMIN") {
            toast.error("You do not have permission to edit this job");
            router.push("/jobs");
            return;
          }

          setFormData({
            title: job.title || "",
            description: job.description || "",
            location: {
              city: job.location?.city || "",
              state: job.location?.state || "",
              country: job.location?.country || "",
            },
            workType: job.workType || "REMOTE",
            employmentType: job.employmentType || "FULL_TIME",
            requiredSkills: job.requiredSkills || [],
            preferredSkills: job.preferredSkills || [],
            minYearsExperience: job.minYearsExperience || 0,
            maxYearsExperience: job.maxYearsExperience || null,
            salary: {
              min: job.salary?.min || null,
              max: job.salary?.max || null,
              currency: job.salary?.currency || "USD",
              isVisible: job.salary?.isVisible ?? true,
            },
            applicationDeadline: job.applicationDeadline
              ? new Date(job.applicationDeadline).toISOString().split("T")[0]
              : "",
            externalApplicationUrl: job.externalApplicationUrl || "",
            isActive: job.isActive ?? true,
          });
        })
        .catch((err) => {
          toast.error("Failed to load job");
          router.push("/jobs");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [jobId, isEditing, router, user]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name.startsWith("location.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        location: { ...prev.location, [field]: value },
      }));
    } else if (name.startsWith("salary.")) {
      const field = name.split(".")[1];
      let newValue: any = value;

      if (field === "isVisible") {
        newValue = checked;
      } else if (field === "min" || field === "max") {
        newValue = value ? parseInt(value, 10) : null;
      }

      setFormData((prev) => ({
        ...prev,
        salary: { ...prev.salary, [field]: newValue },
      }));
    } else if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? null : parseInt(value, 10),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error when field is modified
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Add skill to required or preferred list
  const addSkill = (skillSlug: string, type: "required" | "preferred") => {
    const field = type === "required" ? "requiredSkills" : "preferredSkills";
    const otherField =
      type === "required" ? "preferredSkills" : "requiredSkills";

    setFormData((prev) => {
      // Remove from other list if present
      const updatedOther = prev[otherField].filter((s) => s !== skillSlug);
      // Add to target list if not already present
      const updatedTarget = prev[field].includes(skillSlug)
        ? prev[field]
        : [...prev[field], skillSlug];

      return {
        ...prev,
        [field]: updatedTarget,
        [otherField]: updatedOther,
      };
    });

    setSkillSearch("");

    // Clear skills error if we now have required skills
    if (type === "required" && errors.requiredSkills) {
      setErrors((prev) => ({ ...prev, requiredSkills: "" }));
    }
  };

  // Remove skill from a list
  const removeSkill = (skillSlug: string, type: "required" | "preferred") => {
    const field = type === "required" ? "requiredSkills" : "preferredSkills";
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((s) => s !== skillSlug),
    }));
  };

  // Filter available skills based on search
  const filteredSkills = availableSkills.filter(
    (skill) =>
      skill.name.toLowerCase().includes(skillSearch.toLowerCase()) &&
      !formData.requiredSkills.includes(skill.slug) &&
      !formData.preferredSkills.includes(skill.slug)
  );

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Job title is required";
    } else if (formData.title.length < 5) {
      newErrors.title = "Job title must be at least 5 characters";
    } else if (formData.title.length > 100) {
      newErrors.title = "Job title cannot exceed 100 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Job description is required";
    } else if (formData.description.length < 100) {
      newErrors.description = "Description must be at least 100 characters";
    } else if (formData.description.length > 5000) {
      newErrors.description = "Description cannot exceed 5000 characters";
    }

    if (formData.requiredSkills.length === 0) {
      newErrors.requiredSkills = "At least one required skill is needed";
    }

    if (formData.salary.min && formData.salary.max) {
      if (formData.salary.min > formData.salary.max) {
        newErrors["salary.min"] = "Minimum salary cannot exceed maximum";
      }
    }

    if (
      formData.minYearsExperience !== null &&
      formData.maxYearsExperience !== null
    ) {
      if (formData.minYearsExperience > formData.maxYearsExperience) {
        newErrors.minYearsExperience =
          "Minimum experience cannot exceed maximum";
      }
    }

    if (formData.applicationDeadline) {
      const deadline = new Date(formData.applicationDeadline);
      if (deadline < new Date()) {
        newErrors.applicationDeadline = "Deadline cannot be in the past";
      }
    }

    if (formData.externalApplicationUrl) {
      try {
        new URL(formData.externalApplicationUrl);
      } catch {
        newErrors.externalApplicationUrl = "Please enter a valid URL";
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
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: {
          city: formData.location.city.trim() || undefined,
          state: formData.location.state.trim() || undefined,
          country: formData.location.country.trim() || undefined,
        },
        workType: formData.workType,
        employmentType: formData.employmentType,
        requiredSkills: formData.requiredSkills,
        preferredSkills: formData.preferredSkills,
        minYearsExperience: formData.minYearsExperience || 0,
        maxYearsExperience: formData.maxYearsExperience || undefined,
        salary: {
          min: formData.salary.min || undefined,
          max: formData.salary.max || undefined,
          currency: formData.salary.currency,
          isVisible: formData.salary.isVisible,
        },
        applicationDeadline: formData.applicationDeadline || undefined,
        externalApplicationUrl:
          formData.externalApplicationUrl.trim() || undefined,
        isActive: formData.isActive,
      };

      if (isEditing) {
        await jobAPINew.update(jobId!, payload);
        toast.success("Job updated successfully!");
        router.push(`/jobs/${jobId}`);
      } else {
        const response = await jobAPINew.create(payload);
        toast.success("Job posted successfully!");
        router.push(`/jobs/${response.data.data._id}`);
      }
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to save job";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle job deletion
  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this job posting? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeleting(true);

    try {
      await jobAPINew.delete(jobId!);
      toast.success("Job deleted successfully");
      router.push("/jobs/manage");
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to delete job";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  // Get skill name from slug
  const getSkillName = (slug: string): string => {
    const skill = availableSkills.find((s) => s.slug === slug);
    return skill?.name || slug;
  };

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link
            href={isEditing ? `/jobs/${jobId}` : "/jobs"}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm"
          >
            <FiArrowLeft className="w-4 h-4" />
            {isEditing ? "Back to Job" : "Back to Jobs"}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? "Edit Job Posting" : "Post a New Job"}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditing
              ? "Update your job listing details"
              : "Fill in the details to attract top talent"}
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900">
                  Basic Information
                </h2>
              </CardHeader>
              <CardBody className="space-y-4">
                {/* Job Title */}
                <Input
                  label="Job Title *"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Senior React Developer"
                  error={errors.title}
                  maxLength={100}
                />

                {/* Description */}
                <div>
                  <Textarea
                    label="Job Description *"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the role, responsibilities, team culture, and what makes this opportunity exciting..."
                    rows={10}
                    error={errors.description}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/5000 characters (minimum 100)
                  </p>
                </div>

                {/* Work Type & Employment Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Work Type *
                    </label>
                    <select
                      name="workType"
                      value={formData.workType}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      {WORK_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0) + type.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Employment Type *
                    </label>
                    <select
                      name="employmentType"
                      value={formData.employmentType}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      {EMPLOYMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type
                            .replace("_", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Location */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900">Location</h2>
                <p className="text-sm text-gray-500">
                  {formData.workType === "REMOTE"
                    ? "Optional for remote positions"
                    : "Where will the employee be working?"}
                </p>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="City"
                    name="location.city"
                    value={formData.location.city}
                    onChange={handleChange}
                    placeholder="San Francisco"
                  />
                  <Input
                    label="State / Province"
                    name="location.state"
                    value={formData.location.state}
                    onChange={handleChange}
                    placeholder="CA"
                  />
                  <Input
                    label="Country"
                    name="location.country"
                    value={formData.location.country}
                    onChange={handleChange}
                    placeholder="USA"
                  />
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Skills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900">Skills</h2>
                <p className="text-sm text-gray-500">
                  What technical skills are you looking for?
                </p>
              </CardHeader>
              <CardBody className="space-y-4">
                {/* Required Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Skills *
                  </label>
                  <div className="flex flex-wrap gap-2 min-h-[40px]">
                    {formData.requiredSkills.length > 0 ? (
                      formData.requiredSkills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="primary"
                          className="flex items-center gap-1 pr-1"
                        >
                          {getSkillName(skill)}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill, "required")}
                            className="p-0.5 hover:bg-blue-200 rounded"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">
                        No required skills added
                      </span>
                    )}
                  </div>
                  {errors.requiredSkills && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.requiredSkills}
                    </p>
                  )}
                </div>

                {/* Preferred Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nice-to-Have Skills
                  </label>
                  <div className="flex flex-wrap gap-2 min-h-[40px]">
                    {formData.preferredSkills.length > 0 ? (
                      formData.preferredSkills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="flex items-center gap-1 pr-1"
                        >
                          {getSkillName(skill)}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill, "preferred")}
                            className="p-0.5 hover:bg-gray-200 rounded"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">
                        No preferred skills added
                      </span>
                    )}
                  </div>
                </div>

                {/* Skill Search */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Add Skills
                  </label>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setActiveSkillType("required")}
                      className={cn(
                        "px-3 py-1 text-sm rounded-lg transition-colors",
                        activeSkillType === "required"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      Add as Required
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSkillType("preferred")}
                      className={cn(
                        "px-3 py-1 text-sm rounded-lg transition-colors",
                        activeSkillType === "preferred"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      Add as Preferred
                    </button>
                  </div>
                  <Input
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    placeholder="Search skills (e.g. React, Python, AWS)..."
                  />

                  {/* Skill Dropdown */}
                  {skillSearch && filteredSkills.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredSkills.slice(0, 15).map((skill) => (
                        <button
                          key={skill.slug}
                          type="button"
                          onClick={() => addSkill(skill.slug, activeSkillType)}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center justify-between group"
                        >
                          <span>{skill.name}</span>
                          <span
                            className={cn(
                              "text-xs opacity-0 group-hover:opacity-100 transition-opacity",
                              activeSkillType === "required"
                                ? "text-blue-600"
                                : "text-gray-500"
                            )}
                          >
                            + Add as {activeSkillType}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {skillSearch && filteredSkills.length === 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
                      No matching skills found
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Experience & Compensation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900">
                  Experience & Compensation
                </h2>
              </CardHeader>
              <CardBody className="space-y-4">
                {/* Experience */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Min Years of Experience"
                    type="number"
                    name="minYearsExperience"
                    value={formData.minYearsExperience ?? ""}
                    onChange={handleChange}
                    min={0}
                    max={30}
                    error={errors.minYearsExperience}
                  />
                  <Input
                    label="Max Years of Experience"
                    type="number"
                    name="maxYearsExperience"
                    value={formData.maxYearsExperience ?? ""}
                    onChange={handleChange}
                    min={0}
                    max={50}
                    placeholder="No maximum"
                  />
                </div>

                {/* Salary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Min Salary (Annual)"
                    type="number"
                    name="salary.min"
                    value={formData.salary.min ?? ""}
                    onChange={handleChange}
                    placeholder="e.g. 80000"
                    min={0}
                    error={errors["salary.min"]}
                  />
                  <Input
                    label="Max Salary (Annual)"
                    type="number"
                    name="salary.max"
                    value={formData.salary.max ?? ""}
                    onChange={handleChange}
                    placeholder="e.g. 120000"
                    min={0}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Currency
                    </label>
                    <select
                      name="salary.currency"
                      value={formData.salary.currency}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD (C$)</option>
                      <option value="AUD">AUD (A$)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                  </div>
                </div>

                {/* Show Salary Toggle */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="salaryVisible"
                    name="salary.isVisible"
                    checked={formData.salary.isVisible}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                  <label
                    htmlFor="salaryVisible"
                    className="text-sm text-gray-700"
                  >
                    Display salary range publicly on the job listing
                  </label>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Additional Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900">
                  Additional Settings
                </h2>
              </CardHeader>
              <CardBody className="space-y-4">
                {/* Application Deadline */}
                <Input
                  label="Application Deadline"
                  type="date"
                  name="applicationDeadline"
                  value={formData.applicationDeadline}
                  onChange={handleChange}
                  error={errors.applicationDeadline}
                  min={new Date().toISOString().split("T")[0]}
                />

                {/* External Application URL */}
                <div>
                  <Input
                    label="External Application URL"
                    name="externalApplicationUrl"
                    value={formData.externalApplicationUrl}
                    onChange={handleChange}
                    placeholder="https://your-company.com/careers/apply"
                    error={errors.externalApplicationUrl}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave blank to receive applications through DevMatch
                  </p>
                </div>

                {/* Active Status (only for editing) */}
                {isEditing && (
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="isActive" className="text-sm text-gray-700">
                      Job posting is active and visible to candidates
                    </label>
                  </div>
                )}
              </CardBody>
            </Card>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4"
          >
            {/* Delete Button (only for editing) */}
            {isEditing && (
              <Button
                type="button"
                variant="danger"
                leftIcon={<FiTrash2 />}
                onClick={handleDelete}
                isLoading={deleting}
                disabled={submitting}
              >
                Delete Job
              </Button>
            )}

            {/* Cancel & Submit */}
            <div className="flex gap-3 ml-auto">
              <Link href={isEditing ? `/jobs/${jobId}` : "/jobs"}>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={submitting || deleting}
                >
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                leftIcon={<FiSave />}
                isLoading={submitting}
                disabled={deleting}
              >
                {isEditing ? "Update Job" : "Post Job"}
              </Button>
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
