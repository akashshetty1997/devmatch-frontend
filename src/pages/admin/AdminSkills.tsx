/**
 * @file src/pages/admin/AdminSkills.tsx
 * @description Admin skill management page
 * - View all skills
 * - Add new skills
 * - Edit/delete skills
 * - Activate/deactivate skills
 */

import { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";
import { skillService } from "../../services/skillService";
import { useToast } from "../../contexts/ToastContext";
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
} from "lucide-react";

const SKILL_CATEGORIES = [
  "LANGUAGE",
  "FRONTEND",
  "BACKEND",
  "DATABASE",
  "DEVOPS",
  "MOBILE",
  "TOOLS",
  "SOFT_SKILL",
  "OTHER",
];

interface Skill {
  _id: string;
  name: string;
  slug: string;
  category: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

const AdminSkills = () => {
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
    icon: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<Skill | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch skills
  const fetchSkills = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (searchQuery) params.search = searchQuery;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.isActive = statusFilter === "active";

      const response = await adminService.getSkills(params);
      setSkills(response.data?.skills || []);
    } catch (err) {
      console.error("Failed to fetch skills:", err);
      error("Failed to load skills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, [searchQuery, categoryFilter, statusFilter]);

  // Open modal for create/edit
  const openModal = (skill?: Skill) => {
    if (skill) {
      setEditingSkill(skill);
      setFormData({
        name: skill.name,
        category: skill.category,
        icon: "",
      });
    } else {
      setEditingSkill(null);
      setFormData({ name: "", category: "OTHER", icon: "" });
    }
    setShowModal(true);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      error("Skill name is required");
      return;
    }

    setFormLoading(true);
    try {
      if (editingSkill) {
        await adminService.updateSkill(editingSkill._id, formData);
        success("Skill updated successfully");
      } else {
        await adminService.createSkill(formData);
        success("Skill created successfully");
      }
      setShowModal(false);
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
        success(`Skill "${skill.name}" deactivated`);
      } else {
        await adminService.activateSkill(skill._id);
        success(`Skill "${skill.name}" activated`);
      }
      fetchSkills();
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
      success(`Skill "${deleteConfirm.name}" deleted`);
      setDeleteConfirm(null);
      fetchSkills();
    } catch (err: any) {
      error(err.response?.data?.message || "Failed to delete skill");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Group skills by category for display
  const groupedSkills = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Skill Management
          </h1>
          <p className="text-gray-600">Manage platform skills and categories</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={18} />
          Add Skill
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
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
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search skills..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {SKILL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace("_", " ")}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Refresh */}
          <button
            onClick={fetchSkills}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-2xl font-bold text-gray-900">{skills.length}</p>
          <p className="text-sm text-gray-500">Total Skills</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-2xl font-bold text-green-600">
            {skills.filter((s) => s.isActive).length}
          </p>
          <p className="text-sm text-gray-500">Active</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-2xl font-bold text-gray-400">
            {skills.filter((s) => !s.isActive).length}
          </p>
          <p className="text-sm text-gray-500">Inactive</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-2xl font-bold text-blue-600">
            {Object.keys(groupedSkills).length}
          </p>
          <p className="text-sm text-gray-500">Categories</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Skills by Category */}
      {!loading && (
        <div className="space-y-6">
          {Object.entries(groupedSkills).map(([category, categorySkills]) => (
            <div
              key={category}
              className="bg-white rounded-lg border border-gray-200"
            >
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Code size={18} className="text-gray-400" />
                  {category.replace("_", " ")}
                  <span className="text-sm font-normal text-gray-500">
                    ({categorySkills.length})
                  </span>
                </h3>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {categorySkills.map((skill) => (
                    <div
                      key={skill._id}
                      className={`group flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                        skill.isActive
                          ? "bg-white border-gray-200 hover:border-blue-300"
                          : "bg-gray-50 border-gray-200 opacity-60"
                      }`}
                    >
                      <span
                        className={
                          skill.isActive ? "text-gray-900" : "text-gray-500"
                        }
                      >
                        {skill.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({skill.usageCount})
                      </span>

                      {/* Action buttons */}
                      <div className="hidden group-hover:flex items-center gap-1 ml-2">
                        <button
                          onClick={() => handleToggleStatus(skill)}
                          className={`p-1 rounded ${
                            skill.isActive
                              ? "hover:bg-red-100 text-red-500"
                              : "hover:bg-green-100 text-green-500"
                          }`}
                          title={skill.isActive ? "Deactivate" : "Activate"}
                        >
                          {skill.isActive ? (
                            <XCircle size={14} />
                          ) : (
                            <CheckCircle size={14} />
                          )}
                        </button>
                        <button
                          onClick={() => openModal(skill)}
                          className="p-1 rounded hover:bg-blue-100 text-blue-500"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(skill)}
                          className="p-1 rounded hover:bg-red-100 text-red-500"
                          title="Delete"
                          disabled={skill.usageCount > 0}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && skills.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Code className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No skills found
          </h3>
          <p className="text-gray-500 mb-4">
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
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingSkill ? "Edit Skill" : "Add New Skill"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skill Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., React, Python, Docker"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {SKILL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon (optional)
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                  placeholder="Icon name or URL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
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
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="text-red-600" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Skill
              </h3>
            </div>

            <p className="text-gray-600 mb-4">
              Are you sure you want to delete{" "}
              <strong>"{deleteConfirm.name}"</strong>? This action cannot be
              undone.
            </p>

            {deleteConfirm.usageCount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  This skill is used by {deleteConfirm.usageCount}{" "}
                  profiles/jobs. Consider deactivating instead.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Trash2 size={18} />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSkills;