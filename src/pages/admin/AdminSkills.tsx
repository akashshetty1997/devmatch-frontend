/**
 * @file src/pages/admin/AdminSkills.tsx
 * @description Admin skill management (clean, modern, dark-mode safe)
 *
 * Notes (fixes vs your version):
 * - Debounced search (prevents API spam on every keypress)
 * - Stable fetch with abort-guard (prevents setState after unmount)
 * - No unused imports (removed skillService)
 * - Better empty states + consistent “cards”
 * - Safer API response parsing (supports {data:{data:{skills}}} or {data:{skills}} etc.)
 * - Delete disabled when usageCount > 0, and UI explains why
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { adminService } from "../../services/adminService";
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
  AlertTriangle,
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
] as const;

type SkillCategory = (typeof SKILL_CATEGORIES)[number];

interface Skill {
  _id: string;
  name: string;
  slug: string;
  category: SkillCategory | string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

function safeArray<T>(v: any): T[] {
  return Array.isArray(v) ? v : [];
}

function parseSkillsFromResponse(res: any): Skill[] {
  const root = res?.data?.data ?? res?.data ?? res;
  // common patterns:
  // root.skills
  // root.data.skills
  // root.data
  return safeArray<Skill>(root?.skills ?? root?.data ?? root);
}

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function AdminSkills() {
  const { success, error } = useToast();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // modal state
  const [showModal, setShowModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "OTHER" as SkillCategory,
    icon: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  // delete state
  const [deleteConfirm, setDeleteConfirm] = useState<Skill | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const debouncedSearch = useDebouncedValue(searchQuery, 350);

  const stats = useMemo(() => {
    const total = skills.length;
    const active = skills.filter((s) => s.isActive).length;
    const inactive = total - active;
    const categories = new Set(skills.map((s) => s.category)).size;
    return { total, active, inactive, categories };
  }, [skills]);

  const groupedSkills = useMemo(() => {
    const map: Record<string, Skill[]> = {};
    for (const s of skills) {
      const key = (s.category || "OTHER").toString();
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    // sort each category by usageCount desc then name
    Object.values(map).forEach((arr) =>
      arr.sort(
        (a, b) =>
          (b.usageCount || 0) - (a.usageCount || 0) ||
          a.name.localeCompare(b.name)
      )
    );
    return map;
  }, [skills]);

  const fetchSkills = async () => {
    let alive = true;
    setLoading(true);

    try {
      const params: Record<string, any> = {};
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.isActive = statusFilter === "active";

      const res = await adminService.getSkills(params);
      if (!alive) return;

      const list = parseSkillsFromResponse(res);
      setSkills(list);
    } catch (e) {
      console.error("Failed to fetch skills:", e);
      if (!alive) return;
      error("Failed to load skills");
      setSkills([]);
    } finally {
      if (!alive) return;
      setLoading(false);
    }

    return () => {
      alive = false;
    };
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const params: Record<string, any> = {};
        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
        if (categoryFilter) params.category = categoryFilter;
        if (statusFilter) params.isActive = statusFilter === "active";

        const res = await adminService.getSkills(params);
        if (!alive) return;
        setSkills(parseSkillsFromResponse(res));
      } catch (e) {
        console.error(e);
        if (!alive) return;
        error("Failed to load skills");
        setSkills([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, categoryFilter, statusFilter]);

  const openModal = (skill?: Skill) => {
    if (skill) {
      setEditingSkill(skill);
      setFormData({
        name: skill.name || "",
        category: (skill.category as SkillCategory) || "OTHER",
        icon: "",
      });
    } else {
      setEditingSkill(null);
      setFormData({ name: "", category: "OTHER", icon: "" });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    if (formLoading) return;
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = formData.name.trim();
    if (!name) return error("Skill name is required");

    setFormLoading(true);
    try {
      const payload = { ...formData, name };

      if (editingSkill) {
        await adminService.updateSkill(editingSkill._id, payload);
        success("Skill updated");
      } else {
        await adminService.createSkill(payload);
        success("Skill created");
      }

      setShowModal(false);

      // refresh list with current filters
      const res = await adminService.getSkills({
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
        ...(categoryFilter ? { category: categoryFilter } : {}),
        ...(statusFilter ? { isActive: statusFilter === "active" } : {}),
      });
      setSkills(parseSkillsFromResponse(res));
    } catch (e: any) {
      console.error(e);
      error(e?.response?.data?.message || "Failed to save skill");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (skill: Skill) => {
    try {
      if (skill.isActive) {
        await adminService.deactivateSkill(skill._id);
        success(`"${skill.name}" deactivated`);
      } else {
        await adminService.activateSkill(skill._id);
        success(`"${skill.name}" activated`);
      }
      // fast local update (no full refetch)
      setSkills((prev) =>
        prev.map((s) =>
          s._id === skill._id ? { ...s, isActive: !s.isActive } : s
        )
      );
    } catch (e: any) {
      console.error(e);
      error(e?.response?.data?.message || "Failed to update skill");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    if ((deleteConfirm.usageCount || 0) > 0) {
      error("This skill is in use. Deactivate instead of deleting.");
      return;
    }

    setDeleteLoading(true);
    try {
      await adminService.deleteSkill(deleteConfirm._id);
      success(`"${deleteConfirm.name}" deleted`);
      setSkills((prev) => prev.filter((s) => s._id !== deleteConfirm._id));
      setDeleteConfirm(null);
    } catch (e: any) {
      console.error(e);
      error(e?.response?.data?.message || "Failed to delete skill");
    } finally {
      setDeleteLoading(false);
    }
  };

  const hasFilters = Boolean(
    debouncedSearch.trim() || categoryFilter || statusFilter
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-[#0b0f14]">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="relative h-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 dark:from-[#1b3a7a] dark:via-[#2a1b6b] dark:to-[#3a145a]">
            <div className="pointer-events-none absolute inset-0 opacity-25 [background:radial-gradient(circle_at_20%_20%,white,transparent_40%)]" />
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  Skill Management
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
                  Create, edit, activate/deactivate skills used across profiles
                  and jobs.
                </p>
              </div>

              <button
                onClick={() => openModal()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                <Plus className="h-4 w-4" />
                Add Skill
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            {/* Search */}
            <div className="relative md:col-span-6">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-white/35" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skills…"
                className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-white/10 dark:bg-white/[0.02] dark:text-white dark:placeholder:text-white/35"
              />
            </div>

            {/* Category */}
            <div className="md:col-span-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-white/10 dark:bg-white/[0.02] dark:text-white"
              >
                <option value="">All categories</option>
                {SKILL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="md:col-span-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-white/10 dark:bg-white/[0.02] dark:text-white"
              >
                <option value="">All status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Refresh */}
            <div className="md:col-span-1">
              <button
                onClick={() => fetchSkills()}
                title="Refresh"
                className="flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white py-2 hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.02] dark:hover:bg-white/[0.06]"
              >
                <RefreshCw className="h-4 w-4 text-gray-700 dark:text-white/70" />
              </button>
            </div>
          </div>

          {debouncedSearch !== searchQuery && (
            <div className="mt-2 text-xs text-gray-500 dark:text-white/45">
              Searching…
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatBox
            label="Total skills"
            value={stats.total}
            icon={<Code className="h-4 w-4" />}
          />
          <StatBox
            label="Active"
            value={stats.active}
            accent="green"
            icon={<CheckCircle className="h-4 w-4" />}
          />
          <StatBox
            label="Inactive"
            value={stats.inactive}
            accent="gray"
            icon={<XCircle className="h-4 w-4" />}
          />
          <StatBox
            label="Categories"
            value={stats.categories}
            icon={<Code className="h-4 w-4" />}
          />
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-14">
            <LoadingSpinner size="lg" />
          </div>
        ) : skills.length === 0 ? (
          <EmptyState
            hasFilters={hasFilters}
            onCreate={() => openModal()}
            onClear={() => {
              setSearchQuery("");
              setCategoryFilter("");
              setStatusFilter("");
            }}
          />
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedSkills)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([category, categorySkills]) => (
                <div
                  key={category}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]"
                >
                  <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/80">
                        <Code className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-gray-900 dark:text-white">
                          {category.replaceAll("_", " ")}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-white/45">
                          {categorySkills.length} skills
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {categorySkills.map((skill) => {
                        const locked = (skill.usageCount || 0) > 0;
                        return (
                          <div
                            key={skill._id}
                            className={cn(
                              "group inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
                              skill.isActive
                                ? "border-gray-200 bg-white hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.02] dark:hover:bg-white/[0.06]"
                                : "border-gray-200 bg-gray-50 opacity-70 dark:border-white/10 dark:bg-white/[0.02] dark:opacity-60"
                            )}
                          >
                            <span
                              className={cn(
                                "font-semibold",
                                skill.isActive
                                  ? "text-gray-900 dark:text-white"
                                  : "text-gray-600 dark:text-white/70"
                              )}
                            >
                              {skill.name}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-white/35">
                              ({skill.usageCount || 0})
                            </span>

                            <div className="ml-1 hidden items-center gap-1 group-hover:flex">
                              <button
                                onClick={() => handleToggleStatus(skill)}
                                className={cn(
                                  "rounded-lg p-1",
                                  skill.isActive
                                    ? "text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
                                    : "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                                )}
                                title={
                                  skill.isActive ? "Deactivate" : "Activate"
                                }
                              >
                                {skill.isActive ? (
                                  <XCircle className="h-4 w-4" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </button>

                              <button
                                onClick={() => openModal(skill)}
                                className="rounded-lg p-1 text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/10"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>

                              <button
                                onClick={() => setDeleteConfirm(skill)}
                                disabled={locked}
                                className={cn(
                                  "rounded-lg p-1",
                                  locked
                                    ? "cursor-not-allowed text-gray-300 dark:text-white/20"
                                    : "text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
                                )}
                                title={
                                  locked
                                    ? `In use by ${skill.usageCount} items (delete disabled)`
                                    : "Delete"
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <ModalShell
            onClose={closeModal}
            title={editingSkill ? "Edit Skill" : "Add Skill"}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Skill Name *">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g., React, Python, Docker"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-white/10 dark:bg-white/[0.02] dark:text-white dark:placeholder:text-white/35"
                />
              </Field>

              <Field label="Category *">
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      category: (e.target.value as SkillCategory) || "OTHER",
                    }))
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-white/10 dark:bg-white/[0.02] dark:text-white"
                >
                  {SKILL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Icon (optional)">
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, icon: e.target.value }))
                  }
                  placeholder="Icon name or URL"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-white/10 dark:bg-white/[0.02] dark:text-white dark:placeholder:text-white/35"
                />
              </Field>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={formLoading}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/75 dark:hover:bg-white/[0.06]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                  {formLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {editingSkill ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </ModalShell>
        )}

        {/* Delete Modal */}
        {deleteConfirm && (
          <ModalShell
            onClose={() => (deleteLoading ? null : setDeleteConfirm(null))}
            title="Delete Skill"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-700 dark:text-white/70">
                  Delete{" "}
                  <span className="font-bold">"{deleteConfirm.name}"</span>?
                  This cannot be undone.
                </p>

                {(deleteConfirm.usageCount || 0) > 0 && (
                  <div className="mt-3 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-500/20 dark:bg-yellow-500/10 dark:text-yellow-200">
                    This skill is used by {deleteConfirm.usageCount} items.
                    Delete is blocked. Deactivate it instead.
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    disabled={deleteLoading}
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/75 dark:hover:bg-white/[0.06]"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleDelete}
                    disabled={
                      deleteLoading || (deleteConfirm.usageCount || 0) > 0
                    }
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleteLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </ModalShell>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- Components ------------------------------ */

function StatBox({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: number;
  accent?: "green" | "gray";
  icon?: React.ReactNode;
}) {
  const valueCls =
    accent === "green"
      ? "text-emerald-700 dark:text-emerald-200"
      : accent === "gray"
      ? "text-gray-500 dark:text-white/55"
      : "text-gray-900 dark:text-white";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-600 dark:text-white/55">
          {label}
        </p>
        {icon ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/80">
            {icon}
          </div>
        ) : null}
      </div>
      <p className={cn("mt-3 text-3xl font-extrabold", valueCls)}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function EmptyState({
  hasFilters,
  onCreate,
  onClear,
}: {
  hasFilters: boolean;
  onCreate: () => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70">
        <Code className="h-6 w-6" />
      </div>
      <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
        No skills found
      </h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
        {hasFilters
          ? "Try adjusting your filters."
          : "Start by adding your first skill."}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-white/90"
        >
          <Plus className="h-4 w-4" />
          Add Skill
        </button>
        {hasFilters ? (
          <button
            onClick={onClear}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/75 dark:hover:bg-white/[0.06]"
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#0b0f14]">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-white/10">
          <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-white/55 dark:hover:bg-white/[0.06] dark:hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-white/70">
        {label}
      </label>
      {children}
    </div>
  );
}
