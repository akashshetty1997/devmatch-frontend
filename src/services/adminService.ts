/**
 * @file src/services/adminService.ts
 * @description API service for admin functionality
 */

import api from "./api";

export const adminService = {
  // ==================== DASHBOARD ====================

  // Get dashboard statistics
  getDashboardStats: () => {
    return api.get("/admin/dashboard/stats");
  },

  // Get recent users
  getRecentUsers: (limit: number = 5) => {
    return api.get("/admin/dashboard/recent-users", { params: { limit } });
  },

  // Get recent activity
  getRecentActivity: (limit: number = 10) => {
    return api.get("/admin/dashboard/activity", { params: { limit } });
  },

  // ==================== USER MANAGEMENT ====================

  // Get all users with filters
  getUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) => {
    return api.get("/admin/users", { params });
  },

  // Get single user details
  getUser: (userId: string) => {
    return api.get(`/admin/users/${userId}`);
  },

  // Update user role
  updateUserRole: (userId: string, role: string) => {
    return api.patch(`/admin/users/${userId}/role`, { role });
  },

  // Ban user
  banUser: (userId: string, reason?: string) => {
    return api.patch(`/admin/users/${userId}/ban`, { reason });
  },

  // Unban user
  unbanUser: (userId: string) => {
    return api.patch(`/admin/users/${userId}/unban`);
  },

  // Delete user (permanent)
  deleteUser: (userId: string) => {
    return api.delete(`/admin/users/${userId}`);
  },

  // ==================== SKILL MANAGEMENT ====================

  // Get all skills (including inactive)
  getSkills: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    isActive?: boolean;
  }) => {
    return api.get("/admin/skills", { params });
  },

  // Create new skill
  createSkill: (data: { name: string; category: string; icon?: string }) => {
    return api.post("/admin/skills", data);
  },

  // Update skill
  updateSkill: (
    skillId: string,
    data: {
      name?: string;
      category?: string;
      icon?: string;
      isActive?: boolean;
    }
  ) => {
    return api.put(`/admin/skills/${skillId}`, data);
  },

  // Deactivate skill (soft delete)
  deactivateSkill: (skillId: string) => {
    return api.patch(`/admin/skills/${skillId}/deactivate`);
  },

  // Activate skill
  activateSkill: (skillId: string) => {
    return api.patch(`/admin/skills/${skillId}/activate`);
  },

  // Delete skill (permanent)
  deleteSkill: (skillId: string) => {
    return api.delete(`/admin/skills/${skillId}`);
  },

  // ==================== JOB MANAGEMENT ====================

  // Get all jobs
  getJobs: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    featured?: boolean;
  }) => {
    return api.get("/admin/jobs", { params });
  },

  // Feature/unfeature job
  toggleJobFeatured: (jobId: string, featured: boolean) => {
    return api.patch(`/admin/jobs/${jobId}/featured`, { featured });
  },

  // Deactivate job
  deactivateJob: (jobId: string) => {
    return api.patch(`/admin/jobs/${jobId}/deactivate`);
  },

  // Delete job
  deleteJob: (jobId: string) => {
    return api.delete(`/admin/jobs/${jobId}`);
  },

  // ==================== REPORTS ====================

  // Get reported content
  getReports: (params?: {
    page?: number;
    limit?: number;
    type?: "POST" | "COMMENT" | "USER" | "JOB";
    status?: "PENDING" | "REVIEWED" | "RESOLVED";
  }) => {
    return api.get("/admin/reports", { params });
  },

  // Resolve report
  resolveReport: (
    reportId: string,
    action: "DISMISS" | "WARN" | "REMOVE" | "BAN"
  ) => {
    return api.patch(`/admin/reports/${reportId}/resolve`, { action });
  },

  // ==================== ANALYTICS ====================

  // Get platform analytics
  getAnalytics: (params?: {
    startDate?: string;
    endDate?: string;
    metric?: string;
  }) => {
    return api.get("/admin/analytics", { params });
  },
};
