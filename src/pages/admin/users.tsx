/**
 * @file src/pages/admin/users.tsx
 * @description Admin user management page
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
  Search,
  Users,
  Shield,
  Ban,
  CheckCircle,
  MoreVertical,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  UserCog,
  Eye,
  AlertTriangle,
  ArrowLeft,
  Filter,
  RefreshCw,
  UserCheck,
  UserX,
  Mail,
  Clock,
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

const ROLE_CONFIG = {
  DEVELOPER: {
    label: "Developer",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: UserCog,
  },
  RECRUITER: {
    label: "Recruiter",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Users,
  },
  ADMIN: {
    label: "Admin",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: Shield,
  },
};

const STATUS_CONFIG = {
  ACTIVE: {
    label: "Active",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  BANNED: {
    label: "Banned",
    color: "bg-red-100 text-red-800",
    icon: Ban,
  },
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { success, error } = useToast();

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Ban modal
  const [showBanModal, setShowBanModal] = useState<User | null>(null);
  const [banReason, setBanReason] = useState("");

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Pagination
  const limit = 20;

  // Prevent duplicate fetches
  const lastFetchKey = useRef("");

  // Get query params
  const currentPage = parseInt((router.query.page as string) || "1", 10);
  const searchQuery = (router.query.q as string) || "";

  // Sync search input with URL
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Redirect if not admin
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push("/auth/login?redirect=/admin/users");
      return;
    }

    if (user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Fetch users
  useEffect(() => {
    if (authLoading || !isAuthenticated || user?.role !== "ADMIN") return;
    if (!router.isReady) return;

    const fetchKey = `${currentPage}-${searchQuery}-${roleFilter}-${statusFilter}`;
    if (fetchKey === lastFetchKey.current) return;

    const fetchUsers = async () => {
      lastFetchKey.current = fetchKey;
      setLoading(true);

      try {
        const params: Record<string, any> = {
          page: currentPage,
          limit,
        };

        if (searchQuery) params.search = searchQuery;
        if (roleFilter) params.role = roleFilter;
        if (statusFilter) params.status = statusFilter;

        const response = await adminService.getUsers(params);
        const data = response.data?.data || response.data;
        setUsers(data?.users || []);
        setTotalCount(data?.pagination?.total || 0);
      } catch (err: any) {
        if (err.response?.status !== 429) {
          console.error("Failed to fetch users:", err);
          error("Failed to load users");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [
    router.isReady,
    currentPage,
    searchQuery,
    roleFilter,
    statusFilter,
    authLoading,
    isAuthenticated,
    user,
    error,
  ]);

  // Update URL params
  const updateFilters = (updates: Record<string, string | null>) => {
    const newQuery: Record<string, string> = { ...router.query } as Record<
      string,
      string
    >;

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        delete newQuery[key];
      } else {
        newQuery[key] = value;
      }
    });

    if (!updates.hasOwnProperty("page")) {
      newQuery.page = "1";
    }

    lastFetchKey.current = "";
    router.push({ pathname: "/admin/users", query: newQuery }, undefined, {
      shallow: true,
    });
  };

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchInput || null });
  };

  // Handle role filter change
  const handleRoleFilter = (role: string) => {
    setRoleFilter(role);
    updateFilters({ role: role || null });
  };

  // Handle status filter change
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    updateFilters({ status: status || null });
  };

  // Reset filters
  const resetFilters = () => {
    setSearchInput("");
    setRoleFilter("");
    setStatusFilter("");
    lastFetchKey.current = "";
    router.push("/admin/users", undefined, { shallow: true });
  };

  // Ban user
  const handleBanUser = async () => {
    if (!showBanModal) return;

    setActionLoading(showBanModal._id);
    try {
      await adminService.banUser(showBanModal._id, banReason);
      success(`User @${showBanModal.username} has been banned`);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === showBanModal._id ? { ...u, status: "BANNED" as const } : u
        )
      );
      setShowBanModal(null);
      setBanReason("");
    } catch (err: any) {
      error(err.response?.data?.message || "Failed to ban user");
    } finally {
      setActionLoading(null);
    }
  };

  // Unban user
  const handleUnbanUser = async (targetUser: User) => {
    setActionLoading(targetUser._id);
    try {
      await adminService.unbanUser(targetUser._id);
      success(`User @${targetUser.username} has been unbanned`);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === targetUser._id ? { ...u, status: "ACTIVE" as const } : u
        )
      );
    } catch (err: any) {
      error(err.response?.data?.message || "Failed to unban user");
    } finally {
      setActionLoading(null);
      setActionMenuOpen(null);
    }
  };

  // Change user role
  const handleChangeRole = async (targetUser: User, newRole: string) => {
    setActionLoading(targetUser._id);
    try {
      await adminService.updateUserRole(targetUser._id, newRole);
      success(`User @${targetUser.username} role changed to ${newRole}`);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === targetUser._id ? { ...u, role: newRole as User["role"] } : u
        )
      );
    } catch (err: any) {
      error(err.response?.data?.message || "Failed to change role");
    } finally {
      setActionLoading(null);
      setActionMenuOpen(null);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format relative time
  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return "Never";

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  const totalPages = Math.ceil(totalCount / limit);
  const hasFilters = searchQuery || roleFilter || statusFilter;

  // Stats
  const stats = {
    total: totalCount,
    developers: users.filter((u) => u.role === "DEVELOPER").length,
    recruiters: users.filter((u) => u.role === "RECRUITER").length,
    banned: users.filter((u) => u.status === "BANNED").length,
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
        <title>User Management - Admin | DevMatch</title>
        <meta name="description" content="Manage platform users" />
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              User Management
            </h1>
            <p className="text-gray-600">View and manage all platform users</p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            {[
              {
                label: "Total Users",
                value: stats.total,
                icon: Users,
                color: "blue",
              },
              {
                label: "Developers",
                value: stats.developers,
                icon: UserCog,
                color: "green",
              },
              {
                label: "Recruiters",
                value: stats.recruiters,
                icon: UserCheck,
                color: "purple",
              },
              {
                label: "Banned",
                value: stats.banned,
                icon: UserX,
                color: "red",
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
                        : "bg-red-100 text-red-600"
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
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by username or email..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </form>

              {/* Role Filter */}
              <div className="relative">
                <Filter
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <select
                  value={roleFilter}
                  onChange={(e) => handleRoleFilter(e.target.value)}
                  className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                >
                  <option value="">All Roles</option>
                  <option value="DEVELOPER">Developers</option>
                  <option value="RECRUITER">Recruiters</option>
                  <option value="ADMIN">Admins</option>
                </select>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="BANNED">Banned</option>
              </select>

              {/* Reset & Refresh */}
              <div className="flex gap-2">
                {hasFilters && (
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
                    lastFetchKey.current = "";
                    router.replace(router.asPath);
                  }}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600">
              {loading
                ? "Loading..."
                : `${totalCount} user${totalCount !== 1 ? "s" : ""} found`}
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* Users Table */}
          {!loading && users.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((targetUser, index) => {
                      const roleConfig = ROLE_CONFIG[targetUser.role];
                      const statusConfig = STATUS_CONFIG[targetUser.status];
                      const StatusIcon = statusConfig.icon;

                      return (
                        <motion.tr
                          key={targetUser._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 * index }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {targetUser.avatar ? (
                                <img
                                  src={targetUser.avatar}
                                  alt={targetUser.username}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                  {targetUser.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <Link
                                  href={`/profile/${targetUser.username}`}
                                  className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                                >
                                  @{targetUser.username}
                                </Link>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                  <Mail size={12} />
                                  {targetUser.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${roleConfig.color}`}
                            >
                              {roleConfig.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
                            >
                              <StatusIcon size={12} />
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Calendar size={14} />
                              {formatDate(targetUser.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Clock size={14} />
                              {formatRelativeTime(targetUser.lastLoginAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setActionMenuOpen(
                                    actionMenuOpen === targetUser._id
                                      ? null
                                      : targetUser._id
                                  )
                                }
                                disabled={actionLoading === targetUser._id}
                                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
                              >
                                {actionLoading === targetUser._id ? (
                                  <LoadingSpinner size="sm" />
                                ) : (
                                  <MoreVertical
                                    size={18}
                                    className="text-gray-500"
                                  />
                                )}
                              </button>

                              <AnimatePresence>
                                {actionMenuOpen === targetUser._id && (
                                  <motion.div
                                    initial={{
                                      opacity: 0,
                                      scale: 0.95,
                                      y: -10,
                                    }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20"
                                  >
                                    <Link
                                      href={`/profile/${targetUser.username}`}
                                      className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-gray-50 text-gray-700"
                                    >
                                      <Eye size={16} />
                                      View Profile
                                    </Link>

                                    <div className="border-t border-gray-100 my-1" />

                                    <div className="px-4 py-1.5 text-xs text-gray-400 uppercase font-semibold">
                                      Change Role
                                    </div>
                                    {["DEVELOPER", "RECRUITER", "ADMIN"].map(
                                      (role) => (
                                        <button
                                          key={role}
                                          onClick={() =>
                                            handleChangeRole(targetUser, role)
                                          }
                                          disabled={targetUser.role === role}
                                          className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                                        >
                                          <UserCog size={14} />
                                          {role}
                                          {targetUser.role === role && (
                                            <CheckCircle
                                              size={14}
                                              className="ml-auto text-green-500"
                                            />
                                          )}
                                        </button>
                                      )
                                    )}

                                    <div className="border-t border-gray-100 my-1" />

                                    {targetUser.status === "ACTIVE" ? (
                                      <button
                                        onClick={() => {
                                          setShowBanModal(targetUser);
                                          setActionMenuOpen(null);
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-red-50 text-red-600"
                                      >
                                        <Ban size={16} />
                                        Ban User
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() =>
                                          handleUnbanUser(targetUser)
                                        }
                                        className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-green-50 text-green-600"
                                      >
                                        <CheckCircle size={16} />
                                        Unban User
                                      </button>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && users.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-white rounded-xl border border-gray-200"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No users found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search or filters
              </p>
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </motion.div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-2 mt-6"
            >
              <button
                onClick={() =>
                  updateFilters({ page: (currentPage - 1).toString() })
                }
                disabled={currentPage <= 1}
                className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() =>
                        updateFilters({ page: pageNum.toString() })
                      }
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() =>
                  updateFilters({ page: (currentPage + 1).toString() })
                }
                disabled={currentPage >= totalPages}
                className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Ban Modal */}
      <AnimatePresence>
        {showBanModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowBanModal(null)}
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
                    Ban User
                  </h3>
                  <p className="text-sm text-gray-500">
                    This will restrict their access
                  </p>
                </div>
              </div>

              <p className="text-gray-600 mb-4">
                Are you sure you want to ban{" "}
                <strong>@{showBanModal.username}</strong>? They will no longer
                be able to access their account.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Reason (optional)
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  rows={3}
                  placeholder="Enter reason for banning..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBanModal(null);
                    setBanReason("");
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBanUser}
                  disabled={actionLoading === showBanModal._id}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {actionLoading === showBanModal._id ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Ban size={18} />
                  )}
                  Ban User
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close action menu */}
      {actionMenuOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setActionMenuOpen(null)}
        />
      )}
    </>
  );
}
