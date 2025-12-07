/**
 * @file src/pages/admin/AdminDashboard.tsx
 * @description Admin dashboard home with overview stats
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { adminService } from "../../services/adminService";
import LoadingSpinner from "@/components/common/Loading";
import {
  Users,
  Briefcase,
  Code,
  FileText,
  TrendingUp,
  AlertTriangle,
  Shield,
  Settings,
  ChevronRight,
  UserCheck,
  UserX,
  Activity,
} from "lucide-react";

interface DashboardStats {
  users: {
    total: number;
    developers: number;
    recruiters: number;
    admins: number;
    newThisWeek: number;
    banned: number;
  };
  jobs: {
    total: number;
    active: number;
    inactive: number;
    newThisWeek: number;
  };
  applications: {
    total: number;
    pending: number;
    thisWeek: number;
  };
  skills: {
    total: number;
    active: number;
    inactive: number;
  };
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, usersRes, activityRes] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getRecentUsers(5),
          adminService.getRecentActivity(10),
        ]);

        setStats(statsRes.data);
        setRecentUsers(usersRes.data?.users || []);
        setRecentActivity(activityRes.data?.activities || []);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Overview of platform statistics and management
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link
          href="/admin/users"
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Users className="text-blue-600" size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-900">Manage Users</p>
            <p className="text-sm text-gray-500">View & edit users</p>
          </div>
        </Link>

        <Link
          href="/admin/skills"
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Code className="text-green-600" size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-900">Manage Skills</p>
            <p className="text-sm text-gray-500">Add & edit skills</p>
          </div>
        </Link>

        <Link
          href="/admin/jobs"
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Briefcase className="text-purple-600" size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-900">Manage Jobs</p>
            <p className="text-sm text-gray-500">Review job posts</p>
          </div>
        </Link>

        <Link
          href="/admin/reports"
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="text-orange-600" size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-900">Reports</p>
            <p className="text-sm text-gray-500">View flagged content</p>
          </div>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Users Stats */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Users</h3>
            <Users className="text-blue-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {stats?.users?.total?.toLocaleString() || 0}
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Developers</span>
              <span>{stats?.users?.developers || 0}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Recruiters</span>
              <span>{stats?.users?.recruiters || 0}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Admins</span>
              <span>{stats?.users?.admins || 0}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="text-green-500" size={14} />
              <span className="text-green-600">
                +{stats?.users?.newThisWeek || 0} this week
              </span>
            </div>
          </div>
        </div>

        {/* Jobs Stats */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Jobs</h3>
            <Briefcase className="text-purple-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {stats?.jobs?.total?.toLocaleString() || 0}
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Active</span>
              <span className="text-green-600">{stats?.jobs?.active || 0}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Inactive</span>
              <span className="text-gray-400">{stats?.jobs?.inactive || 0}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="text-green-500" size={14} />
              <span className="text-green-600">
                +{stats?.jobs?.newThisWeek || 0} this week
              </span>
            </div>
          </div>
        </div>

        {/* Applications Stats */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Applications</h3>
            <FileText className="text-orange-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {stats?.applications?.total?.toLocaleString() || 0}
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Pending Review</span>
              <span className="text-yellow-600">
                {stats?.applications?.pending || 0}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="text-green-500" size={14} />
              <span className="text-green-600">
                +{stats?.applications?.thisWeek || 0} this week
              </span>
            </div>
          </div>
        </div>

        {/* Skills Stats */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Skills</h3>
            <Code className="text-green-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {stats?.skills?.total || 0}
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Active</span>
              <span className="text-green-600">{stats?.skills?.active || 0}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Inactive</span>
              <span className="text-gray-400">{stats?.skills?.inactive || 0}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link
              href="/admin/skills"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Manage Skills
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Users</h3>
            <Link
              href="/admin/users"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentUsers.map((user) => (
              <div key={user._id} className="p-4 flex items-center gap-3">
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
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    @{user.username}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                </div>
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
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
            <Activity className="text-gray-400" size={18} />
          </div>
          <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
            {recentActivity.map((activity, index) => (
              <div key={index} className="p-4 flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === "USER_REGISTERED"
                      ? "bg-green-100 text-green-600"
                      : activity.type === "JOB_POSTED"
                      ? "bg-purple-100 text-purple-600"
                      : activity.type === "APPLICATION"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {activity.type === "USER_REGISTERED" && (
                    <UserCheck size={14} />
                  )}
                  {activity.type === "JOB_POSTED" && <Briefcase size={14} />}
                  {activity.type === "APPLICATION" && <FileText size={14} />}
                  {activity.type === "USER_BANNED" && <UserX size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
