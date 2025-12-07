/**
 * @file src/pages/admin/AdminUsers.tsx
 * @description Admin user management page
 * - View all users
 * - Search and filter
 * - Ban/unban users
 * - Change user roles
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { adminService } from "../../services/adminService";
import { useToast } from "@/contexts/ToastContext";
import LoadingSpinner from "@/components/common/Loading";
import {
  Search,
  Filter,
  Users,
  Shield,
  Ban,
  CheckCircle,
  MoreVertical,
  Mail,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  UserCog,
  Eye,
  Trash2,
  AlertTriangle,
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

const AdminUsers = () => {
  const { success, error } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showBanModal, setShowBanModal] = useState<User | null>(null);
  const [banReason, setBanReason] = useState("");

  // Filters from URL
  const currentPage = parseInt(searchParams?.get("page") || "1", 10);
  const searchQuery = searchParams?.get("q") || "";
  const roleFilter = searchParams?.get("role") || "";
  const statusFilter = searchParams?.get("status") || "";

  const limit = 20;

  // Fetch users
  const fetchUsers = useCallback(async () => {
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
      setUsers(response.data?.users || []);
      setTotalCount(response.data?.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Update URL params
  const updateFilters = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams?.toString() || "");

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });

    if (!updates.hasOwnProperty("page")) {
      newParams.set("page", "1");
    }

    const queryString = newParams.toString();
    const newPath = queryString ? `?${queryString}` : "/admin/users";
    router.push(newPath);
  };

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem("search") as HTMLInputElement;
    updateFilters({ q: input.value || null });
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
  const handleUnbanUser = async (user: User) => {
    setActionLoading(user._id);
    try {
      await adminService.unbanUser(user._id);
      success(`User @${user.username} has been unbanned`);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === user._id ? { ...u, status: "ACTIVE" as const } : u
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
  const handleChangeRole = async (user: User, newRole: string) => {
    setActionLoading(user._id);
    try {
      await adminService.updateUserRole(user._id, newRole);
      success(`User @${user.username} role changed to ${newRole}`);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === user._id ? { ...u, role: newRole as User["role"] } : u
        )
      );
    } catch (err: any) {
      error(err.response?.data?.message || "Failed to change role");
    } finally {
      setActionLoading(null);
      setActionMenuOpen(null);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          User Management
        </h1>
        <p className="text-gray-600">View and manage all platform users</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
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
                name="search"
                defaultValue={searchQuery}
                placeholder="Search by username or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </form>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => updateFilters({ role: e.target.value || null })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Roles</option>
            <option value="DEVELOPER">Developers</option>
            <option value="RECRUITER">Recruiters</option>
            <option value="ADMIN">Admins</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => updateFilters({ status: e.target.value || null })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="BANNED">Banned</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-600">
          {totalCount} user{totalCount !== 1 ? "s" : ""} found
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
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/profile/${user.username}`}
                            className="font-medium text-gray-900 hover:text-blue-600"
                          >
                            @{user.username}
                          </Link>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === "DEVELOPER"
                            ? "bg-blue-100 text-blue-800"
                            : user.role === "RECRUITER"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.status === "ACTIVE" ? (
                          <CheckCircle size={12} />
                        ) : (
                          <Ban size={12} />
                        )}
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActionMenuOpen(
                              actionMenuOpen === user._id ? null : user._id
                            )
                          }
                          disabled={actionLoading === user._id}
                          className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                        >
                          {actionLoading === user._id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <MoreVertical size={18} />
                          )}
                        </button>

                        {actionMenuOpen === user._id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            <Link
                              href={`/profile/${user.username}`}
                              className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50"
                            >
                              <Eye size={14} />
                              View Profile
                            </Link>

                            <hr className="my-1" />

                            <div className="px-4 py-1 text-xs text-gray-500 uppercase">
                              Change Role
                            </div>
                            {["DEVELOPER", "RECRUITER", "ADMIN"].map((role) => (
                              <button
                                key={role}
                                onClick={() => handleChangeRole(user, role)}
                                disabled={user.role === role}
                                className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 disabled:opacity-50"
                              >
                                <UserCog size={14} />
                                {role}
                                {user.role === role && (
                                  <CheckCircle
                                    size={12}
                                    className="ml-auto text-green-500"
                                  />
                                )}
                              </button>
                            ))}

                            <hr className="my-1" />

                            {user.status === "ACTIVE" ? (
                              <button
                                onClick={() => {
                                  setShowBanModal(user);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 text-red-600"
                              >
                                <Ban size={14} />
                                Ban User
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUnbanUser(user)}
                                className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 text-green-600"
                              >
                                <CheckCircle size={14} />
                                Unban User
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
        </div>
      )}

      {/* Empty State */}
      {!loading && users.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Users className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No users found
          </h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() =>
              updateFilters({ page: (currentPage - 1).toString() })
            }
            disabled={currentPage <= 1}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
          </button>

          <span className="px-4 py-2 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() =>
              updateFilters({ page: (currentPage + 1).toString() })
            }
            disabled={currentPage >= totalPages}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-red-600" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Ban User</h3>
            </div>

            <p className="text-gray-600 mb-4">
              Are you sure you want to ban{" "}
              <strong>@{showBanModal.username}</strong>? They will no longer be
              able to access their account.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (optional)
              </label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={3}
                placeholder="Enter reason for banning..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBanModal(null);
                  setBanReason("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBanUser}
                disabled={actionLoading === showBanModal._id}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === showBanModal._id ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Ban size={18} />
                )}
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
