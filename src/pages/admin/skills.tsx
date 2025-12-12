/**
 * @file src/pages/admin/skills.tsx
 * @description Admin skill management page
 */

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { adminService } from "@/services/adminService";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/common/Loading";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Code,
  CheckCircle,
  XCircle,
  RefreshCw,
  X,
  Save,
  ArrowLeft,
  Filter,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Layers,
} from "lucide-react";

const SKILL_CATEGORIES = [
  { value: "LANGUAGE", label: "Programming Languages", color: "blue" },
  { value: "FRONTEND", label: "Frontend", color: "purple" },
  { value: "BACKEND", label: "Backend", color: "green" },
  { value: "DATABASE", label: "Database", color: "orange" },
  { value: "DEVOPS", label: "DevOps", color: "red" },
  { value: "MOBILE", label: "Mobile", color: "pink" },
  { value: "TOOLS", label: "Tools", color: "yellow" },
  { value: "SOFT_SKILL", label: "Soft Skills", color: "teal" },
  { value: "OTHER", label: "Other", color: "gray" },
];

const getCategoryColor = (category: string) => {
  const cat = SKILL_CATEGORIES.find((c) => c.value === category);
  const colors: Record<string, string> = {
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200",
    green: "bg-green-100 text-green-800 border-green-200",
    orange: "bg-orange-100 text-orange-800 border-orange-200",
    red: "bg-red-100 text-red-800 border-red-200",
    pink: "bg-pink-100 text-pink-800 border-pink-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    teal: "bg-teal-100 text-teal-800 border-teal-200",
    gray: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return colors[cat?.color || "gray"];
};

interface Skill {
  _id: string;
  name: string;
  slug: string;
  category: string;
  isActive: boolean;
  usageCount?: number;
  createdAt: string;
}

export default function AdminSkillsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { success, error } = useToast();

  // State
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "OTHER",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<Skill | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Prevent duplicate fetches
  const hasFetched = useRef(false);
  const lastFetchKey = useRef("");

  // Redirect if not admin
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push("/auth/login?redirect=/admin/skills");
      return;
    }

    if (user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Fetch skills
  const fetchSkills = async () => {
    const fetchKey = `${searchQuery}-${categoryFilter}-${statusFilter}`;
    if (fetchKey === lastFetchKey.current && hasFetched.current) return;

    setLoading(true);
    lastFetchKey.current = fetchKey;
    hasFetched.current = true;

    try {
      const params: Record<string, any> = {};
      if (searchQuery) params.search = searchQuery;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.isActive = statusFilter === "active";

      const response = await adminService.getSkills(params);
      const data = response.data?.data || response.data;
      setSkills(Array.isArray(data) ? data : data?.skills || []);
    } catch (err: any) {
      console.error("Failed to fetch skills:", err);
      if (err.response?.status !== 429) {
        error("Failed to load skills");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !isAuthenticated || user?.role !== "ADMIN") return;
    fetchSkills();
  }, [
    searchQuery,
    categoryFilter,
    statusFilter,
    authLoading,
    isAuthenticated,
    user,
  ]);

  // Open modal for create/edit
  const openModal = (skill?: Skill) => {
    if (skill) {
      setEditingSkill(skill);
      setFormData({
        name: skill.name,
        category: skill.category,
      });
    } else {
      setEditingSkill(null);
      setFormData({ name: "", category: "OTHER" });
    }
    setFormErrors({});
    setShowModal(true);
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Skill name is required";
    } else if (formData.name.length < 2) {
      errors.name = "Skill name must be at least 2 characters";
    } else if (formData.name.length > 50) {
      errors.name = "Skill name cannot exceed 50 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setFormLoading(true);
    try {
      // Generate slug from name
      const slug = formData.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const payload = {
        ...formData,
        slug,
      };

      if (editingSkill) {
        await adminService.updateSkill(editingSkill._id, payload);
        success("Skill updated successfully");
      } else {
        await adminService.createSkill(payload);
        success("Skill created successfully");
      }
      setShowModal(false);
      hasFetched.current = false;
      fetchSkills();
    } catch (err: any) {
      error(err.response?.data?.message || "Failed to save skill");
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle skill active status
  const handleToggleStatus = async (skill: Skill) => {
    try {
      if (skill.isActive) {
        await adminService.deactivateSkill(skill._id);
        success(`"${skill.name}" deactivated`);
      } else {
        await adminService.activateSkill(skill._id);
        success(`"${skill.name}" activated`);
      }
      setSkills((prev) =>
        prev.map((s) =>
          s._id === skill._id ? { ...s, isActive: !s.isActive } : s
        )
      );
    } catch (err: any) {
      error(err.response?.data?.message || "Failed to update skill");
    }
  };

  // Delete skill
  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setDeleteLoading(true);
    try {
      await adminService.deleteSkill(deleteConfirm._id);
      success(`"${deleteConfirm.name}" deleted`);
      setDeleteConfirm(null);
      setSkills((prev) => prev.filter((s) => s._id !== deleteConfirm._id));
    } catch (err: any) {
      error(err.response?.data?.message || "Failed to delete skill");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setStatusFilter("");
    hasFetched.current = false;
  };

  // Group skills by category
  const groupedSkills = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  // Stats
  const stats = {
    total: skills.length,
    active: skills.filter((s) => s.isActive).length,
    inactive: skills.filter((s) => !s.isActive).length,
    categories: Object.keys(groupedSkills).length,
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Don't render if not admin
  if (!isAuthenticated || user?.role !== "ADMIN") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Skill Management - Admin | DevMatch</title>
        <meta name="description" content="Manage platform skills" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Skill Management
                </h1>
                <p className="text-gray-600">
                  Manage platform skills and categories
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openModal()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-600/20"
              >
                <Plus size={18} />
                Add Skill
              </motion.button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            {[
              {
                label: "Total Skills",
                value: stats.total,
                icon: Code,
                color: "blue",
              },
              {
                label: "Active",
                value: stats.active,
                icon: CheckCircle,
                color: "green",
              },
              {
                label: "Inactive",
                value: stats.inactive,
                icon: XCircle,
                color: "gray",
              },
              {
                label: "Categories",
                value: stats.categories,
                icon: Layers,
                color: "purple",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      stat.color === "blue"
                        ? "bg-blue-100 text-blue-600"
                        : stat.color === "green"
                        ? "bg-green-100 text-green-600"
                        : stat.color === "purple"
                        ? "bg-purple-100 text-purple-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <stat.icon size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-gray-200 p-4 mb-6"
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    hasFetched.current = false;
                  }}
                  placeholder="Search skills..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <Filter
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    hasFetched.current = false;
                  }}
                  className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                >
                  <option value="">All Categories</option>
                  {SKILL_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  hasFetched.current = false;
                }}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              {/* Reset & Refresh */}
              <div className="flex gap-2">
                {(searchQuery || categoryFilter || statusFilter) && (
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <X size={18} />
                    Clear
                  </button>
                )}
                <button
                  onClick={() => {
                    hasFetched.current = false;
                    fetchSkills();
                  }}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* Skills by Category */}
          {!loading && skills.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              {Object.entries(groupedSkills).map(
                ([category, categorySkills], index) => {
                  const categoryInfo = SKILL_CATEGORIES.find(
                    (c) => c.value === category
                  );

                  return (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                    >
                      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Code size={18} className="text-gray-400" />
                          {categoryInfo?.label || category.replace("_", " ")}
                          <span className="text-sm font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                            {categorySkills.length}
                          </span>
                        </h3>
                      </div>
                      <div className="p-4">
                        <div className="flex flex-wrap gap-2">
                          {categorySkills.map((skill) => (
                            <motion.div
                              key={skill._id}
                              layout
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                                skill.isActive
                                  ? "bg-white border-gray-200 hover:border-blue-300 hover:shadow-md"
                                  : "bg-gray-50 border-gray-200 opacity-60"
                              }`}
                            >
                              <span
                                className={`font-medium ${
                                  skill.isActive
                                    ? "text-gray-900"
                                    : "text-gray-500"
                                }`}
                              >
                                {skill.name}
                              </span>
                              {skill.usageCount !== undefined && (
                                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                  {skill.usageCount}
                                </span>
                              )}

                              {/* Action buttons on hover */}
                              <div className="hidden group-hover:flex items-center gap-1 ml-2 pl-2 border-l border-gray-200">
                                <button
                                  onClick={() => handleToggleStatus(skill)}
                                  className={`p-1.5 rounded-md transition-colors ${
                                    skill.isActive
                                      ? "hover:bg-red-100 text-red-500"
                                      : "hover:bg-green-100 text-green-500"
                                  }`}
                                  title={
                                    skill.isActive ? "Deactivate" : "Activate"
                                  }
                                >
                                  {skill.isActive ? (
                                    <ToggleRight size={16} />
                                  ) : (
                                    <ToggleLeft size={16} />
                                  )}
                                </button>
                                <button
                                  onClick={() => openModal(skill)}
                                  className="p-1.5 rounded-md hover:bg-blue-100 text-blue-500 transition-colors"
                                  title="Edit"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(skill)}
                                  className="p-1.5 rounded-md hover:bg-red-100 text-red-500 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                }
              )}
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && skills.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-white rounded-xl border border-gray-200"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Code className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No skills found
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || categoryFilter || statusFilter
                  ? "Try adjusting your filters"
                  : "Get started by adding your first skill"}
              </p>
              <button
                onClick={() => openModal()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={18} />
                Add Skill
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingSkill ? "Edit Skill" : "Add New Skill"}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Skill Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., React, Python, Docker"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.name ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-600 mt-1">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {SKILL_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Preview */}
                <div className="pt-2">
                  <p className="text-sm text-gray-500 mb-2">Preview:</p>
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getCategoryColor(
                      formData.category
                    )}`}
                  >
                    <Code size={14} />
                    {formData.name || "Skill Name"}
                  </span>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                  >
                    {formLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Save size={18} />
                    )}
                    {editingSkill ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Skill
                  </h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <p className="text-gray-600 mb-4">
                Are you sure you want to delete{" "}
                <strong>"{deleteConfirm.name}"</strong>?
              </p>

              {deleteConfirm.usageCount && deleteConfirm.usageCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800 flex items-center gap-2">
                    <AlertTriangle size={16} />
                    This skill is used by {deleteConfirm.usageCount}{" "}
                    profiles/jobs. Consider deactivating instead.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {deleteLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Trash2 size={18} />
                  )}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
