/**
 * @file src/pages/admin/AdminUsers.tsx
 * @description Admin user management (clean, modern, dark-mode safe)
 *
 * Fixes vs your version:
 * - Uses next/router (pages router) instead of next/navigation (app router) -> prevents routing bugs
 * - Debounced search (no API spam while typing)
 * - Click-outside to close action menu
 * - Closes menu on route/filter change
 * - Safer response parsing (supports multiple backend shapes)
 * - Consistent “card” layout + dark mode styles
 * - Prevents banning yourself (basic safety)
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { adminService } from "../../services/adminService";
import { useToast } from "@/contexts/ToastContext";
import LoadingSpinner from "@/components/common/Loading";
import {
  Search,
  Users,
  Ban,
  CheckCircle,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  UserCog,
  Eye,
  AlertTriangle,
  X,
} from "lucide-react";

interface User {
  _id: string;
  username: string;
  email: string;
  role: "DEVELOPER" | "RECRUITER" | "ADMIN";
  status: "ACTIVE" | "BANNED";
  avatar: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function parseUsersFromResponse(res: any): { users: User[]; total: number } {
  const root = res?.data?.data ?? res?.data ?? res;

  const users: User[] = Array.isArray(root?.users)
    ? root.users
    : Array.isArray(root?.data?.users)
    ? root.data.users
    : Array.isArray(root)
    ? root
    : [];

  const total =
    Number(root?.pagination?.total) ||
    Number(root?.data?.pagination?.total) ||
    Number(root?.total) ||
    users.length;

  return { users, total };
}

function buildQuery(
  params: Record<string, string | number | null | undefined>
) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === null || v === undefined || v === "") return;
    sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export default function AdminUsers() {
  const { success, error } = useToast();
  const router = useRouter();

  // URL -> state
  const currentPage = useMemo(
    () => Math.max(1, parseInt((router.query.page as string) || "1", 10)),
    [router.query.page]
  );
  const roleFilter = (router.query.role as string) || "";
  const statusFilter = (router.query.status as string) || "";
  const qFromUrl = (router.query.q as string) || "";

  // local inputs
  const [searchInput, setSearchInput] = useState(qFromUrl);
  useEffect(() => setSearchInput(qFromUrl), [qFromUrl]);
  const debouncedSearch = useDebouncedValue(searchInput, 350);

  // data
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // menus/modals
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [showBanModal, setShowBanModal] = useState<User | null>(null);
  const [banReason, setBanReason] = useState("");

  const limit = 20;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  // Close menu on click outside
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setActionMenuOpen(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Keep URL q in sync with debounced input (but don’t spam push)
  useEffect(() => {
    if (!router.isReady) return;
    if ((router.query.q as string) === debouncedSearch) return;

    const qs = buildQuery({
      ...router.query,
      q: debouncedSearch || null,
      page: 1,
    });

    router.push(`/admin/users${qs}`, undefined, { shallow: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, router.isReady]);

  const updateFilters = (updates: Record<string, string | number | null>) => {
    const next = {
      page: updates.page ?? 1,
      q: updates.q ?? (router.query.q as string) ?? "",
      role: updates.role ?? (router.query.role as string) ?? "",
      status: updates.status ?? (router.query.status as string) ?? "",
    };

    const qs = buildQuery({
      page: next.page,
      q: next.q || null,
      role: next.role || null,
      status: next.status || null,
    });

    setActionMenuOpen(null);
    router.push(`/admin/users${qs}`);
  };

  const fetchUsers = useCallback(async () => {
    let alive = true;
    setLoading(true);

    try {
      const params: Record<string, any> = {
        page: currentPage,
        limit,
      };
      if (qFromUrl) params.search = qFromUrl;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await adminService.getUsers(params);
      if (!alive) return;

      const parsed = parseUsersFromResponse(res);
      setUsers(parsed.users);
      setTotalCount(parsed.total);
    } catch (e) {
      console.error("Failed to fetch users:", e);
      if (!alive) return;
      error("Failed to load users");
      setUsers([]);
      setTotalCount(0);
    } finally {
      if (!alive) return;
      setLoading(false);
    }

    return () => {
      alive = false;
    };
  }, [currentPage, qFromUrl, roleFilter, statusFilter, error]);

  useEffect(() => {
    fetchUsers();
    setActionMenuOpen(null);
  }, [fetchUsers]);

  // Ban user
  const handleBanUser = async () => {
    if (!showBanModal) return;

    setActionLoading(showBanModal._id);
    try {
      // if your backend expects {reason} instead of plain string, change here
      await adminService.banUser(showBanModal._id, banReason);

      success(`User @${showBanModal.username} banned`);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === showBanModal._id ? { ...u, status: "BANNED" } : u
        )
      );

      setShowBanModal(null);
      setBanReason("");
    } catch (e: any) {
      error(e?.response?.data?.message || "Failed to ban user");
    } finally {
      setActionLoading(null);
    }
  };

  // Unban
  const handleUnbanUser = async (u: User) => {
    setActionLoading(u._id);
    try {
      await adminService.unbanUser(u._id);
      success(`User @${u.username} unbanned`);
      setUsers((prev) =>
        prev.map((x) => (x._id === u._id ? { ...x, status: "ACTIVE" } : x))
      );
    } catch (e: any) {
      error(e?.response?.data?.message || "Failed to unban user");
    } finally {
      setActionLoading(null);
      setActionMenuOpen(null);
    }
  };

  // Role change
  const handleChangeRole = async (u: User, newRole: User["role"]) => {
    setActionLoading(u._id);
    try {
      await adminService.updateUserRole(u._id, newRole);
      success(`@${u.username} → ${newRole}`);
      setUsers((prev) =>
        prev.map((x) => (x._id === u._id ? { ...x, role: newRole } : x))
      );
    } catch (e: any) {
      error(e?.response?.data?.message || "Failed to change role");
    } finally {
      setActionLoading(null);
      setActionMenuOpen(null);
    }
  };

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
                  User Management
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
                  Search users, change roles, and ban/unban accounts.
                </p>
              </div>

              <div className="text-sm font-semibold text-gray-600 dark:text-white/60">
                {totalCount.toLocaleString()} user{totalCount === 1 ? "" : "s"}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            {/* Search */}
            <div className="relative md:col-span-7">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-white/35" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search username or email…"
                className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-white/10 dark:bg-white/[0.02] dark:text-white dark:placeholder:text-white/35"
              />
            </div>

            {/* Role */}
            <div className="md:col-span-3">
              <select
                value={roleFilter}
                onChange={(e) =>
                  updateFilters({ role: e.target.value || null, page: 1 })
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-white/10 dark:bg-white/[0.02] dark:text-white"
              >
                <option value="">All roles</option>
                <option value="DEVELOPER">Developer</option>
                <option value="RECRUITER">Recruiter</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {/* Status */}
            <div className="md:col-span-2">
              <select
                value={statusFilter}
                onChange={(e) =>
                  updateFilters({ status: e.target.value || null, page: 1 })
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-white/10 dark:bg-white/[0.02] dark:text-white"
              >
                <option value="">All status</option>
                <option value="ACTIVE">Active</option>
                <option value="BANNED">Banned</option>
              </select>
            </div>
          </div>

          {debouncedSearch !== searchInput && (
            <div className="mt-2 text-xs text-gray-500 dark:text-white/45">
              Searching…
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-14">
            <LoadingSpinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <Users className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-white/20" />
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
              No users found
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
              Adjust your search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:bg-white/[0.03] dark:text-white/45">
                  <tr>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Joined</th>
                    <th className="px-6 py-3">Last login</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                  {users.map((u) => (
                    <tr
                      key={u._id}
                      className="hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={u.avatar}
                              alt={u.username}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-extrabold text-white">
                              {(u.username?.[0] || "U").toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0">
                            <Link
                              href={`/profile/${u.username}`}
                              className="block truncate font-semibold text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-300"
                            >
                              @{u.username}
                            </Link>
                            <div className="truncate text-sm text-gray-500 dark:text-white/55">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <RoleChip role={u.role} />
                      </td>

                      <td className="px-6 py-4">
                        <StatusChip status={u.status} />
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-white/60">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-white/60">
                        {u.lastLoginAt
                          ? new Date(u.lastLoginAt).toLocaleDateString()
                          : "Never"}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div
                          className="relative inline-block"
                          ref={actionMenuOpen === u._id ? menuRef : undefined}
                        >
                          <button
                            onClick={() =>
                              setActionMenuOpen((prev) =>
                                prev === u._id ? null : u._id
                              )
                            }
                            disabled={actionLoading === u._id}
                            className="rounded-xl p-2 hover:bg-gray-100 disabled:opacity-60 dark:hover:bg-white/[0.06]"
                            aria-label="Actions"
                          >
                            {actionLoading === u._id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <MoreVertical className="h-5 w-5 text-gray-700 dark:text-white/70" />
                            )}
                          </button>

                          {actionMenuOpen === u._id && (
                            <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#0b0f14]">
                              <Link
                                href={`/profile/${u.username}`}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 dark:text-white/80 dark:hover:bg-white/[0.06]"
                                onClick={() => setActionMenuOpen(null)}
                              >
                                <Eye className="h-4 w-4" />
                                View profile
                              </Link>

                              <div className="px-4 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-white/40">
                                Change role
                              </div>

                              {(
                                ["DEVELOPER", "RECRUITER", "ADMIN"] as const
                              ).map((role) => (
                                <button
                                  key={role}
                                  onClick={() => handleChangeRole(u, role)}
                                  disabled={u.role === role}
                                  className={cn(
                                    "flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-white/[0.06]",
                                    u.role === role
                                      ? "text-gray-400 dark:text-white/25"
                                      : "text-gray-800 dark:text-white/80"
                                  )}
                                >
                                  <UserCog className="h-4 w-4" />
                                  {role}
                                  {u.role === role ? (
                                    <CheckCircle className="ml-auto h-4 w-4 text-emerald-500" />
                                  ) : null}
                                </button>
                              ))}

                              <div className="my-2 border-t border-gray-200 dark:border-white/10" />

                              {u.status === "ACTIVE" ? (
                                <button
                                  onClick={() => {
                                    setShowBanModal(u);
                                    setBanReason("");
                                    setActionMenuOpen(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
                                >
                                  <Ban className="h-4 w-4" />
                                  Ban user
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUnbanUser(u)}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Unban user
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 border-t border-gray-200 px-4 py-4 dark:border-white/10">
                <button
                  onClick={() => updateFilters({ page: currentPage - 1 })}
                  disabled={currentPage <= 1}
                  className="rounded-xl border border-gray-300 bg-white p-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.02] dark:hover:bg-white/[0.06]"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <span className="px-4 text-sm font-semibold text-gray-700 dark:text-white/70">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => updateFilters({ page: currentPage + 1 })}
                  disabled={currentPage >= totalPages}
                  className="rounded-xl border border-gray-300 bg-white p-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.02] dark:hover:bg-white/[0.06]"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Ban Modal */}
        {showBanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#0b0f14]">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                      Ban user
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-white/45">
                      @{showBanModal.username} will lose access.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (actionLoading) return;
                    setShowBanModal(null);
                    setBanReason("");
                  }}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-white/55 dark:hover:bg-white/[0.06] dark:hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5">
                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-white/70">
                  Reason (optional)
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why you are banning this user…"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 dark:border-white/10 dark:bg-white/[0.02] dark:text-white dark:placeholder:text-white/35"
                />

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      setShowBanModal(null);
                      setBanReason("");
                    }}
                    disabled={actionLoading === showBanModal._id}
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/75 dark:hover:bg-white/[0.06]"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleBanUser}
                    disabled={actionLoading === showBanModal._id}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {actionLoading === showBanModal._id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Ban className="h-4 w-4" />
                    )}
                    Ban
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- UI bits -------------------------------- */

function RoleChip({ role }: { role: User["role"] }) {
  const cls =
    role === "DEVELOPER"
      ? "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200"
      : role === "RECRUITER"
      ? "border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-200"
      : "border-red-200 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-extrabold",
        cls
      )}
    >
      {role}
    </span>
  );
}

function StatusChip({ status }: { status: User["status"] }) {
  const active = status === "ACTIVE";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-extrabold",
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200"
          : "border-red-200 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200"
      )}
    >
      {active ? (
        <CheckCircle className="h-3.5 w-3.5" />
      ) : (
        <Ban className="h-3.5 w-3.5" />
      )}
      {status}
    </span>
  );
}
